[CmdletBinding()]
param(
    [switch]$ResetDb,
    [switch]$NoSeed,
    [switch]$SkipInstall,
    [switch]$BackendOnly
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $RootDir "frontend"
$RootEnvPath = Join-Path $RootDir ".env"
$RootEnvExamplePath = Join-Path $RootDir ".env.example"
$FrontendEnvPath = Join-Path $FrontendDir ".env"
$FrontendEnvExamplePath = Join-Path $FrontendDir ".env.example"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Command '$Name' was not found. Install it and run this script again."
    }
}

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [string[]]$Arguments = @()
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
}

function New-LocalSecret {
    param([int]$Bytes = 32)
    $buffer = New-Object byte[] $Bytes
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($buffer)
    }
    finally {
        $generator.Dispose()
    }
    return -join ($buffer | ForEach-Object { $_.ToString("x2") })
}

function Set-EnvFileValue {
    param(
        [string]$Path,
        [string]$Key,
        [string]$Value
    )

    $escapedKey = [regex]::Escape($Key)
    $line = "$Key=$Value"
    $lines = @(Get-Content $Path)
    $found = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*$escapedKey\s*=") {
            $lines[$i] = $line
            $found = $true
        }
    }

    if (-not $found) {
        $lines += $line
    }

    Set-Content -Path $Path -Value $lines -Encoding utf8
}

function Read-EnvFile {
    param([string]$Path)
    $values = @{}
    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) {
            continue
        }

        $key, $value = $trimmed.Split("=", 2)
        $values[$key.Trim()] = $value.Trim().Trim('"').Trim("'")
    }
    return $values
}

function Import-EnvFile {
    param([string]$Path)
    $values = Read-EnvFile $Path
    foreach ($key in $values.Keys) {
        [Environment]::SetEnvironmentVariable($key, $values[$key], "Process")
    }
    return $values
}

function Ensure-RootEnv {
    if (-not (Test-Path $RootEnvPath)) {
        Write-Step "Creating .env"
        Copy-Item $RootEnvExamplePath $RootEnvPath
    }

    $values = Read-EnvFile $RootEnvPath
    if (-not $values.ContainsKey("POSTGRES_PASSWORD") -or
        [string]::IsNullOrWhiteSpace($values["POSTGRES_PASSWORD"]) -or
        $values["POSTGRES_PASSWORD"] -eq "replace-with-a-strong-password") {
        Set-EnvFileValue $RootEnvPath "POSTGRES_PASSWORD" ("local-" + (New-LocalSecret 18))
    }

    $values = Read-EnvFile $RootEnvPath
    if (-not $values.ContainsKey("JWT_SECRET_KEY") -or
        [string]::IsNullOrWhiteSpace($values["JWT_SECRET_KEY"]) -or
        $values["JWT_SECRET_KEY"] -eq "replace-with-a-long-random-secret") {
        Set-EnvFileValue $RootEnvPath "JWT_SECRET_KEY" (New-LocalSecret 48)
    }
}

function Ensure-FrontendEnv {
    if (-not (Test-Path $FrontendEnvPath)) {
        Write-Step "Creating frontend/.env"
        Copy-Item $FrontendEnvExamplePath $FrontendEnvPath
    }
}

function Invoke-BackendMigrations {
    param([hashtable]$EnvValues)

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $migrationOutput = & docker compose exec -T backend alembic upgrade head 2>&1
        $migrationExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($migrationExitCode -eq 0) {
        if ($migrationOutput) {
            $migrationOutput | ForEach-Object { Write-Host $_ }
        }
        return
    }

    $message = $migrationOutput | Out-String
    if ($message -notmatch "password authentication failed") {
        if ($migrationOutput) {
            $migrationOutput | ForEach-Object { Write-Host $_ }
        }
        throw "Alembic migration failed with exit code ${migrationExitCode}."
    }

    Write-Step "Synchronizing PostgreSQL password for existing Docker volume"
    Write-Host "Detected an existing database volume with a different password."
    $dbUser = if ($EnvValues["POSTGRES_USER"]) { $EnvValues["POSTGRES_USER"] } else { "cyberlab" }
    $dbName = if ($EnvValues["POSTGRES_DB"]) { $EnvValues["POSTGRES_DB"] } else { "cyberlab_tracker" }
    $dbPassword = $EnvValues["POSTGRES_PASSWORD"].Replace("'", "''")
    Invoke-Native -FilePath "docker" -Arguments @("compose", "exec", "-T", "postgres", "psql", "-U", $dbUser, "-d", $dbName, "-c", "ALTER USER $dbUser WITH PASSWORD '$dbPassword';")

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $retryOutput = & docker compose exec -T backend alembic upgrade head 2>&1
        $retryExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($retryExitCode -ne 0) {
        if ($retryOutput) {
            $retryOutput | ForEach-Object { Write-Host $_ }
        }
        throw "Alembic migration failed after PostgreSQL password synchronization."
    }

    if ($retryOutput) {
        $retryOutput | ForEach-Object { Write-Host $_ }
    }
}

Set-Location $RootDir

Assert-Command "docker"
Assert-Command "npm"

Ensure-RootEnv
Ensure-FrontendEnv
$envValues = Import-EnvFile $RootEnvPath

if ($ResetDb) {
    Write-Step "Resetting Docker database volume"
    Invoke-Native -FilePath "docker" -Arguments @("compose", "down", "-v")
}

Write-Step "Starting backend and PostgreSQL"
Invoke-Native -FilePath "docker" -Arguments @("compose", "up", "--build", "-d")

Write-Step "Applying database migrations"
Invoke-BackendMigrations $envValues

if (-not $NoSeed) {
    Write-Step "Seeding demo account"
    Invoke-Native -FilePath "docker" -Arguments @("compose", "exec", "-T", "backend", "python", "-m", "scripts.seed_demo")
}

if ($BackendOnly) {
    Write-Step "Backend is ready"
    Write-Host "API:      http://localhost:8000/health"
    Write-Host "Demo:     demo@cyberlab.dev / password123"
    return
}

if (-not $SkipInstall) {
    Write-Step "Installing frontend dependencies"
    Push-Location $FrontendDir
    Invoke-Native -FilePath "npm" -Arguments @("install")
    Pop-Location
}

Write-Step "Starting frontend"
Write-Host "App:      http://localhost:5173"
Write-Host "API:      http://localhost:8000/health"
Write-Host "Demo:     demo@cyberlab.dev / password123"
Write-Host ""

Push-Location $FrontendDir
Invoke-Native -FilePath "npm" -Arguments @("run", "dev", "--", "--host", "127.0.0.1")
Pop-Location
