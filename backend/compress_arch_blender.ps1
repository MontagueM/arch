$SourceFolder = "arch_blender"
$DestinationZip = "arch_blender.zip"

if (-Not (Test-Path -Path $SourceFolder)) {
    Write-Host "Source folder does not exist: $SourceFolder" -ForegroundColor Red
    exit 1
}

if (Test-Path -Path $DestinationZip) {
    Write-Host "Destination ZIP already exists. Removing existing ZIP: $DestinationZip" -ForegroundColor Yellow
    Remove-Item -Path $DestinationZip -Force
}

try {
    Write-Host "Compressing '$SourceFolder' to '$DestinationZip'..." -ForegroundColor Green
    Compress-Archive -Path $SourceFolder -DestinationPath $DestinationZip -Force
    Write-Host "Compression completed successfully." -ForegroundColor Cyan
} catch {
    Write-Host "An error occurred during compression: $_" -ForegroundColor Red
    exit 1
}