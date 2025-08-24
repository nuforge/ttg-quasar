# Add Java to PATH permanently for Firebase emulators

# Check if Java is already in PATH
$javaPath = "C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot\bin"

# Get current PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")

# Add Java to PATH if not already there
if ($currentPath -notlike "*$javaPath*") {
    $newPath = "$currentPath;$javaPath"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
    Write-Host "✅ Java added to PATH permanently"
    Write-Host "⚠️  Please restart your terminal/VS Code for the changes to take effect"
} else {
    Write-Host "✅ Java is already in PATH"
}

# Test Java installation
try {
    & java -version
    Write-Host "`n✅ Java is working correctly"
} catch {
    Write-Host "`n❌ Java not found - you may need to restart your terminal"
}
