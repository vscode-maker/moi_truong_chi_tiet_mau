# Script tự động thay thế các handler files với version refactored
# Run with: .\replace-handlers.ps1

Write-Host "🔄 Starting handler replacement process..." -ForegroundColor Cyan

$baseDir = "d:\GoogleDrive_le.tung_personal\workspace\workspace_ems\cefinea\CEFINEA\assets\js\app-sample-details\handlers"

# Backup old files first
Write-Host "`n📦 Creating backups..." -ForegroundColor Yellow
$backupDir = "$baseDir\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
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
        Write-Host "  ✅ Backed up: $file" -ForegroundColor Green
    }
}

# Replace with refactored versions
Write-Host "`n🔧 Replacing with refactored versions..." -ForegroundColor Yellow

foreach ($file in $filesToReplace) {
    $refactoredPath = Join-Path $baseDir "$($file.Replace('.js', '.refactored.js'))"
    $targetPath = Join-Path $baseDir $file
    
    if (Test-Path $refactoredPath) {
        Copy-Item $refactoredPath $targetPath -Force
        Write-Host "  ✅ Replaced: $file" -ForegroundColor Green
        
        # Remove refactored file
        Remove-Item $refactoredPath
    } else {
        Write-Host "  ⚠️  Refactored file not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✅ Handler replacement completed!" -ForegroundColor Green
Write-Host "📂 Backups stored in: $backupDir" -ForegroundColor Cyan
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes in replaced files"
Write-Host "  2. Update app-sample-details-modular.js imports"
Write-Host "  3. Run integration tests"
