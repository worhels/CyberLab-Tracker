[CmdletBinding()]
param(
    [switch]$ResetDb,
    [switch]$NoSeed,
    [switch]$SkipInstall,
    [switch]$BackendOnly,
    [switch]$NoOllama,
    [switch]$OpenBrowser,
    [switch]$KeepServices
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $RootDir "frontend"
$RootEnvPath = Join-Path $RootDir ".env"
$RootEnvExamplePath = Join-Path $RootDir ".env.example"
$FrontendEnvPath = Join-Path $FrontendDir ".env"
$FrontendEnvExamplePath = Join-Path $FrontendDir ".env.example"
$RuntimeDir = Join-Path $RootDir ".dev"
$LogDir = Join-Path $RuntimeDir "logs"
$DockerLogPath = Join-Path $LogDir "docker.log"
$FrontendLogPath = Join-Path $LogDir "frontend.log"
$FrontendErrorLogPath = Join-Path $LogDir "frontend-error.log"
$OllamaLogPath = Join-Path $LogDir "ollama.log"
$OllamaErrorLogPath = Join-Path $LogDir "ollama-error.log"
$DependencyMarkerPath = Join-Path $RuntimeDir "frontend-lock.sha256"
$CleanStopMarkerPath = Join-Path $RuntimeDir "clean-stop"
$FrontendUrl = "http://127.0.0.1:5173"
$BackendHealthUrl = "http://127.0.0.1:8000/health"
$OllamaTagsUrl = "http://127.0.0.1:11434/api/tags"

$script:FrontendProcess = $null
$script:OllamaProcess = $null
$script:StackStarted = $false
$script:StartupCompleted = $false
$script:StartupFailed = $false

function Write-Stage {
    param(
        [string]$Message,
        [ValidateSet("wait", "ok", "warn")]
        [string]$State = "wait"
    )

    $marker = switch ($State) {
        "ok" { "[ OK ]" }
        "warn" { "[WARN]" }
        default { "[ .. ]" }
    }
    $color = switch ($State) {
        "ok" { "Green" }
        "warn" { "Yellow" }
        default { "Cyan" }
    }

    Write-Host $marker -NoNewline -ForegroundColor $color
    Write-Host " $Message"
}

function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  +--------+" -ForegroundColor Magenta
    Write-Host "  |  C / L |  " -NoNewline -ForegroundColor Magenta
    Write-Host "CyberLab Tracker" -ForegroundColor Cyan
    Write-Host "  +--------+  Full-stack development launcher" -ForegroundColor DarkGray
    Write-Host "              --------------------------------" -ForegroundColor DarkGray
    Write-Host ""
}

function Assert-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Command '$Name' was not found. Install it and run the launcher again."
    }
}

function Invoke-NativeLogged {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [string[]]$Arguments = @(),

        [Parameter(Mandatory = $true)]
        [string]$LogPath,

        [switch]$Append
    )

    if (-not $Append) {
        Set-Content -LiteralPath $LogPath -Value "" -Encoding utf8
    }

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $FilePath @Arguments *>> $LogPath
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0) {
        throw "Command '$FilePath' failed with exit code $exitCode. See $LogPath"
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
    $lines = @(Get-Content -LiteralPath $Path)
    $found = $false

    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -match "^\s*$escapedKey\s*=") {
            $lines[$index] = $line
            $found = $true
        }
    }

    if (-not $found) {
        $lines += $line
    }

    Set-Content -LiteralPath $Path -Value $lines -Encoding utf8
}

function Read-EnvFile {
    param([string]$Path)

    $values = @{}
    foreach ($line in Get-Content -LiteralPath $Path) {
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

function Ensure-EnvironmentFiles {
    if (-not (Test-Path -LiteralPath $RootEnvPath)) {
        Copy-Item -LiteralPath $RootEnvExamplePath -Destination $RootEnvPath
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

    if (-not (Test-Path -LiteralPath $FrontendEnvPath)) {
        Copy-Item -LiteralPath $FrontendEnvExamplePath -Destination $FrontendEnvPath
    }
}

function Test-DockerReady {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $status = & docker desktop status 2>$null | Out-String
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    return $exitCode -eq 0 -and $status -match "(?i)running"
}

function Start-DockerEngine {
    if (Test-DockerReady) {
        return
    }

    $dockerDesktopPath = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path -LiteralPath $dockerDesktopPath)) {
        throw "Docker engine is not running and Docker Desktop was not found."
    }

    Write-Stage "Starting Docker Desktop"
    Start-Process -FilePath $dockerDesktopPath -WindowStyle Hidden | Out-Null

    $deadline = [DateTime]::UtcNow.AddMinutes(2)
    while ([DateTime]::UtcNow -lt $deadline) {
        if (Test-DockerReady) {
            return
        }
        Start-Sleep -Seconds 2
    }

    throw "Docker Desktop did not become ready within 2 minutes."
}

function Test-HttpEndpoint {
    param(
        [string]$Uri,
        [int]$TimeoutSeconds = 2
    )

    try {
        Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec $TimeoutSeconds | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-FrontendEndpoint {
    try {
        $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 2
        return $response.StatusCode -eq 200 -and $response.Content -match "<title>CyberLab Tracker</title>"
    }
    catch {
        return $false
    }
}

function Wait-ForEndpoint {
    param(
        [string]$Uri,
        [int]$TimeoutSeconds,
        [System.Diagnostics.Process]$Process
    )

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    while ([DateTime]::UtcNow -lt $deadline) {
        if ($Process -and $Process.HasExited) {
            return $false
        }
        if (Test-HttpEndpoint -Uri $Uri) {
            return $true
        }
        Start-Sleep -Milliseconds 750
    }

    return $false
}

function Get-OllamaModels {
    try {
        $response = Invoke-RestMethod -Uri $OllamaTagsUrl -TimeoutSec 3
        return @($response.models | ForEach-Object { $_.name })
    }
    catch {
        return @()
    }
}

function Start-Ollama {
    param([hashtable]$EnvValues)

    if ($NoOllama) {
        Write-Stage "Ollama skipped (-NoOllama)" "warn"
        return
    }

    $ollamaCommand = Get-Command "ollama" -ErrorAction SilentlyContinue
    if (-not $ollamaCommand) {
        throw "Ollama was not found. Install it or run with -NoOllama."
    }

    if (-not (Test-HttpEndpoint -Uri $OllamaTagsUrl)) {
        Write-Stage "Starting Ollama"
        Set-Content -LiteralPath $OllamaLogPath -Value "" -Encoding utf8
        Set-Content -LiteralPath $OllamaErrorLogPath -Value "" -Encoding utf8
        $script:OllamaProcess = Start-Process `
            -FilePath $ollamaCommand.Source `
            -ArgumentList @("serve") `
            -WindowStyle Hidden `
            -RedirectStandardOutput $OllamaLogPath `
            -RedirectStandardError $OllamaErrorLogPath `
            -PassThru

        if (-not (Wait-ForEndpoint -Uri $OllamaTagsUrl -TimeoutSeconds 30 -Process $script:OllamaProcess)) {
            throw "Ollama did not become ready. See $OllamaErrorLogPath"
        }
    }

    $chatModel = if ($EnvValues["OLLAMA_MODEL"]) { $EnvValues["OLLAMA_MODEL"] } else { "qwen3-coder:30b" }
    $artifactModel = if ($EnvValues["OLLAMA_ARTIFACT_MODEL"]) { $EnvValues["OLLAMA_ARTIFACT_MODEL"] } else { $chatModel }
    $requiredModels = @($chatModel, $artifactModel) | Select-Object -Unique
    $installedModels = Get-OllamaModels
    $missingModels = @($requiredModels | Where-Object { $installedModels -notcontains $_ })

    if ($missingModels.Count -gt 0) {
        throw "Missing Ollama model(s): $($missingModels -join ', '). Install explicitly with: ollama pull <model>"
    }

    Write-Stage "Ollama ready ($($requiredModels -join ', '))" "ok"
}

function Ensure-FrontendDependencies {
    if ($SkipInstall) {
        Write-Stage "Frontend dependency check skipped" "warn"
        return
    }

    $lockPath = Join-Path $FrontendDir "package-lock.json"
    $nodeModulesPath = Join-Path $FrontendDir "node_modules"
    $lockHash = (Get-FileHash -LiteralPath $lockPath -Algorithm SHA256).Hash
    $installedHash = if (Test-Path -LiteralPath $DependencyMarkerPath) {
        (Get-Content -LiteralPath $DependencyMarkerPath -Raw).Trim()
    }
    else {
        ""
    }

    if ((Test-Path -LiteralPath $nodeModulesPath) -and $installedHash -eq $lockHash) {
        Write-Stage "Frontend dependencies are current" "ok"
        return
    }

    Write-Stage "Installing frontend dependencies"
    $npmLogPath = Join-Path $LogDir "npm-install.log"
    Push-Location $FrontendDir
    try {
        Invoke-NativeLogged -FilePath "npm.cmd" -Arguments @("ci", "--no-audit", "--no-fund") -LogPath $npmLogPath
    }
    finally {
        Pop-Location
    }

    Set-Content -LiteralPath $DependencyMarkerPath -Value $lockHash -Encoding ascii
    Write-Stage "Frontend dependencies installed" "ok"
}

function Invoke-BackendMigrations {
    param([hashtable]$EnvValues)

    $migrationLogPath = Join-Path $LogDir "migrations.log"
    Set-Content -LiteralPath $migrationLogPath -Value "" -Encoding utf8

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $migrationOutput = & docker compose exec -T backend alembic upgrade head 2>&1
        $migrationExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    $migrationOutput | Add-Content -LiteralPath $migrationLogPath

    if ($migrationExitCode -eq 0) {
        return
    }

    $message = $migrationOutput | Out-String
    if ($message -notmatch "password authentication failed") {
        throw "Database migration failed. See $migrationLogPath"
    }

    Write-Stage "Synchronizing the existing PostgreSQL volume" "warn"
    $dbUser = if ($EnvValues["POSTGRES_USER"]) { $EnvValues["POSTGRES_USER"] } else { "cyberlab" }
    $dbName = if ($EnvValues["POSTGRES_DB"]) { $EnvValues["POSTGRES_DB"] } else { "cyberlab_tracker" }
    $dbPassword = $EnvValues["POSTGRES_PASSWORD"].Replace("'", "''")
    Invoke-NativeLogged `
        -FilePath "docker" `
        -Arguments @(
            "compose", "exec", "-T", "postgres", "psql", "-U", $dbUser, "-d", $dbName,
            "-c", "ALTER USER $dbUser WITH PASSWORD '$dbPassword';"
        ) `
        -LogPath $migrationLogPath `
        -Append
    Invoke-NativeLogged `
        -FilePath "docker" `
        -Arguments @("compose", "exec", "-T", "backend", "alembic", "upgrade", "head") `
        -LogPath $migrationLogPath `
        -Append
}

function Test-DatabaseReady {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $health = & docker inspect --format "{{.State.Health.Status}}" cyberlab_tracker_db 2>$null
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    return $exitCode -eq 0 -and "$health".Trim() -eq "healthy"
}

function Start-Frontend {
    if (Test-FrontendEndpoint) {
        Write-Stage "Existing CyberLab web app detected" "ok"
        return
    }

    Set-Content -LiteralPath $FrontendLogPath -Value "" -Encoding utf8
    Set-Content -LiteralPath $FrontendErrorLogPath -Value "" -Encoding utf8
    $npmCommand = Get-Command "npm.cmd" -ErrorAction Stop
    $script:FrontendProcess = Start-Process `
        -FilePath $npmCommand.Source `
        -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--strictPort") `
        -WorkingDirectory $FrontendDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $FrontendLogPath `
        -RedirectStandardError $FrontendErrorLogPath `
        -PassThru

    if (-not (Wait-ForEndpoint -Uri $FrontendUrl -TimeoutSeconds 45 -Process $script:FrontendProcess)) {
        throw "Frontend did not become ready. See $FrontendErrorLogPath"
    }
}

function Stop-ProcessTree {
    param([System.Diagnostics.Process]$Process)

    if (-not $Process) {
        return
    }

    $processIds = @($Process.Id)
    do {
        $children = @(
            Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
                Where-Object { $processIds -contains [int]$_.ParentProcessId } |
                Select-Object -ExpandProperty ProcessId
        )
        $newChildren = @($children | Where-Object { $processIds -notcontains [int]$_ })
        $processIds += $newChildren
    } while ($newChildren.Count -gt 0)

    [array]::Reverse($processIds)
    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

function Save-DockerServiceLogs {
    if (-not $script:StackStarted) {
        return
    }

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & docker compose logs --no-color --tail 200 *>> $DockerLogPath
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

function Stop-DevelopmentStack {
    Write-Host ""
    Write-Stage "Stopping development stack"

    Stop-ProcessTree $script:FrontendProcess

    if ($script:StackStarted -and -not $KeepServices) {
        $shutdownLogPath = Join-Path $LogDir "shutdown.log"
        try {
            Invoke-NativeLogged -FilePath "docker" -Arguments @("compose", "down") -LogPath $shutdownLogPath
        }
        catch {
            Write-Stage "Docker services need manual cleanup" "warn"
        }
    }

    Stop-ProcessTree $script:OllamaProcess
    Write-Stage "Stack stopped" "ok"
}

function Write-ReadyDashboard {
    Write-Header
    Write-Host "  STATUS" -ForegroundColor DarkGray
    Write-Host ""
    Write-Stage "Web app     $FrontendUrl" "ok"
    Write-Stage "API         $BackendHealthUrl" "ok"
    Write-Stage "PostgreSQL  healthy" "ok"
    if ($NoOllama) {
        Write-Stage "Ollama      disabled" "warn"
    }
    else {
        Write-Stage "Ollama      ready" "ok"
    }
    Write-Host ""
    Write-Host "  Demo:  demo@cyberlab.dev / password123" -ForegroundColor DarkGray
    Write-Host "  Logs:  $LogDir" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Press Ctrl+C to stop the stack." -ForegroundColor Cyan
    if ($KeepServices) {
        Write-Host "  Docker services will remain active (-KeepServices)." -ForegroundColor DarkGray
    }
}

Set-Location $RootDir
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Remove-Item -LiteralPath $CleanStopMarkerPath -Force -ErrorAction SilentlyContinue
Write-Header

try {
    Assert-Command "docker"
    Assert-Command "npm"

    Write-Stage "Preparing local configuration"
    Ensure-EnvironmentFiles
    $envValues = Import-EnvFile $RootEnvPath
    Write-Stage "Local configuration ready" "ok"

    Start-DockerEngine
    Write-Stage "Docker Desktop ready" "ok"

    Start-Ollama $envValues

    if ($ResetDb) {
        Write-Stage "Resetting the local database volume" "warn"
        Invoke-NativeLogged -FilePath "docker" -Arguments @("compose", "down", "-v") -LogPath $DockerLogPath
    }

    Write-Stage "Building and starting API services"
    Invoke-NativeLogged `
        -FilePath "docker" `
        -Arguments @("compose", "--progress", "quiet", "up", "--build", "-d", "--remove-orphans") `
        -LogPath $DockerLogPath
    $script:StackStarted = $true

    if (-not (Wait-ForEndpoint -Uri $BackendHealthUrl -TimeoutSeconds 90)) {
        throw "Backend did not become ready. See $DockerLogPath"
    }
    if (-not (Test-DatabaseReady)) {
        throw "PostgreSQL did not report a healthy state. See $DockerLogPath"
    }
    Write-Stage "API and PostgreSQL ready" "ok"

    Write-Stage "Applying database migrations"
    Invoke-BackendMigrations $envValues
    Write-Stage "Database schema ready" "ok"

    if (-not $NoSeed) {
        $seedLogPath = Join-Path $LogDir "seed.log"
        Write-Stage "Synchronizing demo data"
        Invoke-NativeLogged `
            -FilePath "docker" `
            -Arguments @("compose", "exec", "-T", "backend", "python", "-m", "scripts.seed_demo") `
            -LogPath $seedLogPath
        Write-Stage "Demo data ready" "ok"
    }

    if ($BackendOnly) {
        Write-Host ""
        Write-Stage "Backend stack is running at $BackendHealthUrl" "ok"
        $script:StartupCompleted = $true
        return
    }

    if (Test-FrontendEndpoint) {
        Write-Stage "Existing web app detected; dependencies left untouched" "ok"
    }
    else {
        Ensure-FrontendDependencies
    }
    Write-Stage "Starting web app"
    Start-Frontend
    Write-Stage "Web app ready" "ok"

    if ($OpenBrowser) {
        Start-Process $FrontendUrl | Out-Null
    }

    $script:StartupCompleted = $true
    Write-ReadyDashboard

    while ($true) {
        Start-Sleep -Seconds 3
        if ($script:FrontendProcess -and $script:FrontendProcess.HasExited) {
            throw "Frontend stopped unexpectedly. See $FrontendErrorLogPath"
        }
        if (-not (Test-FrontendEndpoint)) {
            throw "Frontend health check failed. See $FrontendErrorLogPath"
        }
        if (-not (Test-HttpEndpoint -Uri $BackendHealthUrl)) {
            throw "Backend health check failed. See $DockerLogPath"
        }
    }
}
catch {
    $script:StartupFailed = $true
    Save-DockerServiceLogs
    Write-Host ""
    Write-Stage $_.Exception.Message "warn"
    Write-Host "  Logs: $LogDir" -ForegroundColor DarkGray
    throw
}
finally {
    if ((-not $BackendOnly -or $script:StartupFailed) -and
        ($script:StackStarted -or $script:FrontendProcess -or $script:OllamaProcess)) {
        Stop-DevelopmentStack
    }
    elseif (-not $script:StartupCompleted) {
        Stop-ProcessTree $script:OllamaProcess
    }

    if ($script:StartupCompleted -and -not $script:StartupFailed) {
        Set-Content -LiteralPath $CleanStopMarkerPath -Value "ok" -Encoding ascii
    }
}
