[CmdletBinding()]
param(
    [switch]$SkipBackendStart,
    [switch]$SkipFrontend,
    [switch]$SkipCode,
    [switch]$DbOnly,
    [switch]$Seed,
    [switch]$NoSeed
)

$script = Join-Path $PSScriptRoot "scripts\workbench.ps1"
& $script @PSBoundParameters
