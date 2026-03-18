$ErrorActionPreference = "Stop"

$reactRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$repoRoot = Resolve-Path (Join-Path $reactRoot "..")
$playwrightMcpDir = Join-Path $repoRoot ".playwright-mcp"
$reactScreenshotDir = Join-Path $reactRoot "playwright-screenshots"

function Keep-LatestByPattern {
    param(
        [Parameter(Mandatory = $true)] [string] $Directory,
        [Parameter(Mandatory = $true)] [string] $Filter
    )

    if (-not (Test-Path $Directory)) {
        return
    }

    $items = Get-ChildItem -Path $Directory -File -Filter $Filter | Sort-Object LastWriteTime -Descending
    if ($items.Count -le 1) {
        return
    }

    $items | Select-Object -Skip 1 | Remove-Item -Force
}

function Keep-LatestSubdirectory {
    param([Parameter(Mandatory = $true)] [string] $Directory)

    if (-not (Test-Path $Directory)) {
        return
    }

    $dirs = Get-ChildItem -Path $Directory -Directory | Sort-Object LastWriteTime -Descending
    if ($dirs.Count -le 1) {
        return
    }

    $dirs | Select-Object -Skip 1 | Remove-Item -Recurse -Force
}

Keep-LatestByPattern -Directory $playwrightMcpDir -Filter "page-*.png"
Keep-LatestByPattern -Directory $playwrightMcpDir -Filter "console-*.log"
Keep-LatestSubdirectory -Directory $reactScreenshotDir

Write-Host "Cleanup complete. Retained latest Playwright artifacts only."
