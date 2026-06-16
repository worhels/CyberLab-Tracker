[CmdletBinding()]
param(
    [string]$Repository = "worhels/CyberLab-Tracker"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI was not found. Install gh, authenticate with 'gh auth login', then rerun this script."
}

gh auth status | Out-Null

$description = "Full-stack local-first academic workload tracker with FastAPI, PostgreSQL, React, Docker, CI, and security hardening roadmap."
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
    "react-three-fiber"
)

gh repo edit $Repository --description $description
foreach ($topic in $topics) {
    gh repo edit $Repository --add-topic $topic
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
    gh label create $label.Name --repo $Repository --color $label.Color --description $label.Description --force
}

$issues = @(
    @{ Title = "[Security] Harden JWT validation"; Labels = "area: security,type: chore,priority: high" },
    @{ Title = "[Security] Add login/register rate limiting tests"; Labels = "area: security,type: test,priority: medium" },
    @{ Title = "[Security] Audit IDOR protection for subjects and tasks"; Labels = "area: security,area: backend,type: test,priority: high" },
    @{ Title = "[Security] Document Docker secret rotation"; Labels = "area: security,area: docs,type: docs,priority: low" },
    @{ Title = "[Backend] Add auth integration tests"; Labels = "area: backend,type: test,priority: high" },
    @{ Title = "[Backend] Add task ownership tests"; Labels = "area: backend,type: test,priority: high" },
    @{ Title = "[Backend] Standardize API error responses"; Labels = "area: backend,type: refactor,priority: medium" },
    @{ Title = "[Backend] Add export endpoint for JSON/CSV"; Labels = "area: backend,type: feature,priority: low" },
    @{ Title = "[Frontend] Add loading, empty, and error states"; Labels = "area: frontend,area: ui,type: feature,priority: high" },
    @{ Title = "[Frontend] Redesign Tasks page cards"; Labels = "area: frontend,area: ui,type: feature,priority: medium" },
    @{ Title = "[Frontend] Redesign Subjects page cards"; Labels = "area: frontend,area: ui,type: feature,priority: medium" },
    @{ Title = "[Frontend] Add quick filters for tasks"; Labels = "area: frontend,type: feature,priority: medium" },
    @{ Title = "[Frontend] Add deadline severity badges"; Labels = "area: frontend,area: ui,type: feature,priority: medium" },
    @{ Title = "[Docs] Add screenshots to README"; Labels = "area: docs,type: docs,priority: medium" },
    @{ Title = "[Docs] Add architecture diagram asset"; Labels = "area: docs,type: docs,priority: low" },
    @{ Title = "[Docs] Expand API examples"; Labels = "area: docs,type: docs,priority: low" }
)

foreach ($issue in $issues) {
    gh issue create --repo $Repository --title $issue.Title --body "Tracked from the engineering backlog." --label $issue.Labels
}

Write-Host "Repository metadata, labels, and backlog issues are configured."
