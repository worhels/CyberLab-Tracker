[CmdletBinding()]
param(
    [switch]$Desktop
)

$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot
$launcherPath = Join-Path $rootDir "Launch CyberLab.cmd"
$iconPath = Join-Path $PSScriptRoot "assets\cyberlab-launcher.ico"
$destinationDir = if ($Desktop) {
    [Environment]::GetFolderPath("Desktop")
}
else {
    $rootDir
}
$shortcutPath = Join-Path $destinationDir "Launch CyberLab.lnk"

if (-not (Test-Path -LiteralPath $launcherPath)) {
    throw "Launcher was not found: $launcherPath"
}
if (-not (Test-Path -LiteralPath $iconPath)) {
    throw "Launcher icon was not found: $iconPath"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcherPath
$shortcut.WorkingDirectory = $rootDir
$shortcut.IconLocation = "$iconPath,0"
$shortcut.Description = "Start the full CyberLab Tracker development stack"
$shortcut.WindowStyle = 1
$shortcut.Save()

Write-Host "CyberLab shortcut created:" -ForegroundColor Green
Write-Host $shortcutPath
