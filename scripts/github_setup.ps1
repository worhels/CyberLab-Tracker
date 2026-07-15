[CmdletBinding()]
param(
    [string]$Repository = "worhels/CyberLab-Tracker"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI was not found. Install gh, authenticate with 'gh auth login', then rerun this script."
}

function Invoke-Gh {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & gh @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "GitHub CLI command failed: gh $($Arguments -join ' ')"
    }
}

Invoke-Gh @("auth", "status") | Out-Null

$description = "Local-first study workload control center with FastAPI, React, PostgreSQL, Crisis Mode, Calendar, and optional local AI."
$topics = @(
    "fastapi",
    "react",
    "typescript",
    "postgresql",
    "docker",
    "sqlalchemy",
    "alembic",
    "jwt-authentication",
    "security-hardening",
    "devsecops",
    "github-actions",
    "portfolio-project",
    "threejs",
    "react-three-fiber",
    "calendar",
    "vitest"
)

Invoke-Gh @("repo", "edit", $Repository, "--description", $description)
foreach ($topic in $topics) {
    Invoke-Gh @("repo", "edit", $Repository, "--add-topic", $topic)
}

$labels = @(
    @{ Name = "type: feature"; Color = "1d76db"; Description = "Feature work" },
    @{ Name = "type: bug"; Color = "d73a4a"; Description = "Bug fix" },
    @{ Name = "type: chore"; Color = "cfd3d7"; Description = "Maintenance work" },
    @{ Name = "type: docs"; Color = "0075ca"; Description = "Documentation work" },
    @{ Name = "type: refactor"; Color = "5319e7"; Description = "Refactor without behavior change" },
    @{ Name = "type: test"; Color = "0e8a16"; Description = "Test work" },
    @{ Name = "area: backend"; Color = "5319e7"; Description = "Backend area" },
    @{ Name = "area: frontend"; Color = "fbca04"; Description = "Frontend area" },
    @{ Name = "area: security"; Color = "b60205"; Description = "Security hardening" },
    @{ Name = "area: ci"; Color = "006b75"; Description = "CI and automation" },
    @{ Name = "area: docs"; Color = "0075ca"; Description = "Docs area" },
    @{ Name = "area: ui"; Color = "f9d0c4"; Description = "UI and visual design" },
    @{ Name = "area: database"; Color = "0052cc"; Description = "Database and migrations" },
    @{ Name = "priority: high"; Color = "b60205"; Description = "High priority" },
    @{ Name = "priority: medium"; Color = "fbca04"; Description = "Medium priority" },
    @{ Name = "priority: low"; Color = "0e8a16"; Description = "Low priority" },
    @{ Name = "status: blocked"; Color = "000000"; Description = "Blocked work" },
    @{ Name = "status: ready"; Color = "0e8a16"; Description = "Ready to start" },
    @{ Name = "status: in-progress"; Color = "1d76db"; Description = "In progress" }
)

foreach ($label in $labels) {
    Invoke-Gh @(
        "label", "create", $label.Name,
        "--repo", $Repository,
        "--color", $label.Color,
        "--description", $label.Description,
        "--force"
    )
}

Write-Host "Repository description, topics, and labels are configured."
