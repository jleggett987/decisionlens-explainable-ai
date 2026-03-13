# PowerShell script to copy all deployable JS/data files to docs/ for GitHub Pages

$ErrorActionPreference = 'Stop'

# Define source and destination mappings
$files = @(
    @{src = 'src/app/app.js'; dest = 'docs/js/app.js'},
    @{src = 'src/engine/ai-service.js'; dest = 'docs/js/ai-service.js'},
    @{src = 'src/engine/data-processor.js'; dest = 'docs/js/data-processor.js'},
    @{src = 'src/engine/explanation-generator.js'; dest = 'docs/js/explanation-generator.js'},
    @{src = 'src/engine/scoring-engine.js'; dest = 'docs/js/scoring-engine.js'},
    @{src = 'src/ui/render.js'; dest = 'docs/js/render.js'},
    @{src = 'src/config.js'; dest = 'docs/js/config.js'},
    @{src = 'src/data/scenarios.js'; dest = 'docs/data/scenarios.js'}
)

foreach ($f in $files) {
    $src = Join-Path $PSScriptRoot $f.src
    $dest = Join-Path $PSScriptRoot $f.dest
    $destDir = Split-Path $dest -Parent
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
    Copy-Item $src $dest -Force
    Write-Host "Copied $src -> $dest"
}

Write-Host "All deploy files copied to docs/. Ready for GitHub Pages!"