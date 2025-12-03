# Script thay the cac handler files voi version refactored
# Run with: .\replace-handlers-fixed.ps1

Write-Host "Starting handler replacement process..." -ForegroundColor Cyan

$baseDir = "d:\GoogleDrive_le.tung_personal\workspace\workspace_ems\cefinea\CEFINEA\assets\js\app-sample-details\handlers"

# Backup old files first
Write-Host "`nCreating backups..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "$baseDir\backup_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$filesToReplace = @(
    "filter.handlers.js",
    "bulk-actions.handlers.js",
    "column-settings.handlers.js"
)

foreach ($file in $filesToReplace) {
    $sourcePath = Join-Path $baseDir $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath (Join-Path $backupDir $file)
        Write-Host "  Backed up: $file" -ForegroundColor Green
    }
}

# Replace with refactored versions
Write-Host "`nReplacing with refactored versions..." -ForegroundColor Yellow

foreach ($file in $filesToReplace) {
    $refactoredPath = Join-Path $baseDir "$($file.Replace('.js', '.refactored.js'))"
    $targetPath = Join-Path $baseDir $file
    
    if (Test-Path $refactoredPath) {
        Copy-Item $refactoredPath $targetPath -Force
        Write-Host "  Replaced: $file" -ForegroundColor Green
        
        # Remove refactored file
        Remove-Item $refactoredPath
    } else {
        Write-Host "  WARNING: Refactored file not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nHandler replacement completed!" -ForegroundColor Green
Write-Host "Backups stored in: $backupDir" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes in replaced files"
Write-Host "  2. Update app-sample-details-modular.js imports"
Write-Host "  3. Run integration tests"
