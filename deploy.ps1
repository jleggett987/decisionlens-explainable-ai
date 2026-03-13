# PowerShell script: Build, copy to docs/, commit, and push for GitHub Pages

$ErrorActionPreference = 'Stop'

# 1. Copy all deployable files to docs/
Write-Host "Copying files to docs/..."
& "$PSScriptRoot/copy-to-docs.ps1"

# 2. Git add, commit, and push
Write-Host "Staging and committing all changes..."
git add .
$commitMsg = Read-Host 'Enter commit message for deployment'
git commit -m $commitMsg
Write-Host "Pushing to main..."
git push

Write-Host "Deploy complete! Your site will update on GitHub Pages shortly."