[CmdletBinding()]
param(
    [switch]$SkipBackendStart,
    [switch]$SkipFrontend,
    [switch]$SkipCode,
    [switch]$DbOnly,
    [switch]$Seed,
    [switch]$NoSeed
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $RootDir "frontend"
$VsCodeDir = Join-Path $RootDir ".vscode"
$DbSchemaPath = Join-Path $VsCodeDir "db-schema-live.sql"
$DbTablesPath = Join-Path $VsCodeDir "db-tables-live.txt"

function Add-PathIfExists {
    param([string]$Path)
    if ((Test-Path $Path) -and (($env:Path -split ";") -notcontains $Path)) {
        $env:Path = "$Path;$env:Path"
    }
}

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Command '$Name' was not found in PATH."
    }
}

function Read-EnvFile {
    param([string]$Path)
    $values = @{}
    if (-not (Test-Path $Path)) {
        return $values
    }

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

function Get-ProjectDatabaseConfig {
    $envValues = Read-EnvFile (Join-Path $RootDir ".env")
    return @{
        User = if ($envValues["POSTGRES_USER"]) { $envValues["POSTGRES_USER"] } else { "cyberlab" }
        Name = if ($envValues["POSTGRES_DB"]) { $envValues["POSTGRES_DB"] } else { "cyberlab_tracker" }
    }
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-ProjectDevBackend {
    $devScript = Join-Path $PSScriptRoot "dev.ps1"
    $args = @("-ExecutionPolicy", "Bypass", "-File", $devScript, "-BackendOnly")
    if ($NoSeed -or -not $Seed) {
        $args += "-NoSeed"
    }

    & powershell.exe @args
    if ($LASTEXITCODE -ne 0) {
        throw "Backend startup failed."
    }
}

function Write-DatabaseSnapshot {
    Assert-Command "docker"
    $db = Get-ProjectDatabaseConfig

    Write-Step "Database tables"
    $tables = & docker compose exec -T postgres psql -U $db.User -d $db.Name -c "\dt" 2>&1
    $tables | Tee-Object -FilePath $DbTablesPath

    Add-Content -Path $DbTablesPath -Value ""
    Add-Content -Path $DbTablesPath -Value "users"
    & docker compose exec -T postgres psql -U $db.User -d $db.Name -c "\d+ users" 2>&1 | Tee-Object -FilePath $DbTablesPath -Append
    Add-Content -Path $DbTablesPath -Value ""
    Add-Content -Path $DbTablesPath -Value "subjects"
    & docker compose exec -T postgres psql -U $db.User -d $db.Name -c "\d+ subjects" 2>&1 | Tee-Object -FilePath $DbTablesPath -Append
    Add-Content -Path $DbTablesPath -Value ""
    Add-Content -Path $DbTablesPath -Value "tasks"
    & docker compose exec -T postgres psql -U $db.User -d $db.Name -c "\d+ tasks" 2>&1 | Tee-Object -FilePath $DbTablesPath -Append

    Write-Step "Writing SQL schema dump"
    & docker compose exec -T postgres pg_dump -U $db.User -d $db.Name --schema-only --no-owner --no-privileges |
        Set-Content -Path $DbSchemaPath -Encoding utf8

    Write-Host "Schema: $DbSchemaPath"
    Write-Host "Tables: $DbTablesPath"
}

function Open-CyberLabFiles {
    Assert-Command "code"

    $files = @(
        ".vscode\cyberlab-workbench.md",
        ".vscode\db-schema-live.sql",
        ".vscode\db-tables-live.txt",
        "ROADMAP.md",
        "README.md",
        "docs\DEVELOPMENT.md",
        "docs\ARCHITECTURE.md",
        "docs\API_OVERVIEW.md",
        "docker-compose.yml",
        "scripts\dev.ps1",
        "scripts\workbench.ps1",
        "backend\alembic\versions\0001_initial.py",
        "backend\alembic\versions\0002_add_study_tracker_fields.py",
        "backend\app\main.py",
        "backend\app\core\config.py",
        "backend\app\core\security.py",
        "backend\app\models\user.py",
        "backend\app\models\subject.py",
        "backend\app\models\task.py",
        "backend\app\schemas\dashboard.py",
        "backend\app\schemas\subject.py",
        "backend\app\schemas\task.py",
        "backend\app\api\v1\endpoints\auth.py",
        "backend\app\api\v1\endpoints\dashboard.py",
        "backend\app\api\v1\endpoints\subjects.py",
        "backend\app\api\v1\endpoints\tasks.py",
        "frontend\src\App.tsx",
        "frontend\src\layouts\AppLayout.tsx",
        "frontend\src\pages\DashboardPage.tsx",
        "frontend\src\pages\SubjectsPage.tsx",
        "frontend\src\pages\TasksPage.tsx",
        "frontend\src\pages\CrisisPage.tsx",
        "frontend\src\components\CrisisFieldCanvas.tsx",
        "frontend\src\components\CrisisVolumeCube.tsx",
        "frontend\src\components\visuals\WorkloadSphereCanvas.tsx",
        "frontend\src\components\visuals\workloadMath.ts",
        "frontend\src\api\dashboard.ts",
        "frontend\src\api\subjects.ts",
        "frontend\src\api\tasks.ts",
        "frontend\src\types\index.ts",
        "frontend\src\index.css"
    )

    Write-Step "Opening CyberLab workbench in VS Code"
    $codeArgs = @("-r", $RootDir)
    foreach ($file in $files) {
        $path = Join-Path $RootDir $file
        if (Test-Path $path) {
            $codeArgs += $path
        }
    }

    & code @codeArgs
}

function Test-FrontendReady {
    try {
        Invoke-WebRequest -Uri "http://127.0.0.1:5173" -UseBasicParsing -TimeoutSec 2 | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Start-FrontendTerminal {
    if (Test-FrontendReady) {
        Write-Host "Frontend already responds at http://localhost:5173"
        return
    }

    Assert-Command "npm"
    $nodeBin = Join-Path $env:ProgramFiles "nodejs"
    $command = @"
`$env:Path = '$nodeBin;' + `$env:Path
Set-Location '$FrontendDir'
npm run dev -- --host 127.0.0.1
"@

    Write-Step "Starting frontend dev server in a new terminal"
    Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $command)
}

$dockerBin = Join-Path $env:ProgramFiles "Docker\Docker\resources\bin"
$nodeBin = Join-Path $env:ProgramFiles "nodejs"
$pythonRoot = Join-Path $env:LOCALAPPDATA "Programs\Python\Python312"
$pythonScripts = Join-Path $pythonRoot "Scripts"

Add-PathIfExists $dockerBin
Add-PathIfExists $nodeBin
Add-PathIfExists $pythonRoot
Add-PathIfExists $pythonScripts

Set-Location $RootDir
New-Item -ItemType Directory -Force -Path $VsCodeDir | Out-Null

if (-not $SkipBackendStart) {
    Write-Step "Starting backend and PostgreSQL"
    Invoke-ProjectDevBackend
}

try {
    Write-DatabaseSnapshot
}
catch {
    Write-Warning "Could not read database schema yet: $($_.Exception.Message)"
}

if (-not $SkipCode) {
    Open-CyberLabFiles
}

if (-not $SkipFrontend -and -not $DbOnly) {
    Start-FrontendTerminal
}

Write-Step "Ready"
Write-Host "Project:  $RootDir"
Write-Host "App:      http://localhost:5173"
Write-Host "API:      http://localhost:8000/health"
Write-Host "Demo:     demo@cyberlab.dev / password123"
