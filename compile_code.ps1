# PowerShell script to compile all code files

$outputFile = "ALLCODE.txt"
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$assetsPath = "android-app\app\src\main\assets"

# Write header
@"
# nowtask Android App - Complete Source Code

**Generated Date**: $date
**Format**: Markdown
**Purpose**: Complete codebase documentation

---

## Table of Contents

1. [HTML](#html)
2. [CSS](#css)
3. [JavaScript](#javascript)

---

## HTML

"@ | Out-File -FilePath $outputFile -Encoding UTF8

# Process HTML files
Write-Host "Processing HTML files..."
Get-ChildItem -Path $assetsPath -Filter "*.html" -Recurse | ForEach-Object {
    Add-Content -Path $outputFile -Value "`n### $($_.Name)`n`n``````html"
    Get-Content $_.FullName | Add-Content -Path $outputFile
    Add-Content -Path $outputFile -Value "```````n"
}

# CSS Header
Add-Content -Path $outputFile -Value "`n---`n`n## CSS`n"

# Process main CSS files
Write-Host "Processing main CSS files..."
@("style.css", "animations.css") | ForEach-Object {
    $file = Join-Path $assetsPath $_
    if (Test-Path $file) {
        Add-Content -Path $outputFile -Value "`n### $_`n`n``````css"
        Get-Content $file | Add-Content -Path $outputFile
        Add-Content -Path $outputFile -Value "```````n"
    }
}

# Process modular CSS files
Write-Host "Processing modular CSS files..."
Get-ChildItem -Path (Join-Path $assetsPath "css") -Filter "*.css" -ErrorAction SilentlyContinue | ForEach-Object {
    Add-Content -Path $outputFile -Value "`n### css\$($_.Name)`n`n``````css"
    Get-Content $_.FullName | Add-Content -Path $outputFile
    Add-Content -Path $outputFile -Value "```````n"
}

# Process style-*.css files
Get-ChildItem -Path $assetsPath -Filter "style-*.css" | ForEach-Object {
    Add-Content -Path $outputFile -Value "`n### $($_.Name)`n`n``````css"
    Get-Content $_.FullName | Add-Content -Path $outputFile
    Add-Content -Path $outputFile -Value "```````n"
}

# JavaScript Header
Add-Content -Path $outputFile -Value "`n---`n`n## JavaScript`n"

# Process JS files
Write-Host "Processing JavaScript files..."
Get-ChildItem -Path $assetsPath -Filter "*.js" -Recurse | Sort-Object FullName | ForEach-Object {
    $relativePath = $_.FullName.Replace("$assetsPath\", "")
    Add-Content -Path $outputFile -Value "`n### $relativePath`n`n``````javascript"
    Get-Content $_.FullName | Add-Content -Path $outputFile
    Add-Content -Path $outputFile -Value "```````n"
}

Write-Host "Compilation complete! Output file: $outputFile"
$fileSize = (Get-Item $outputFile).Length / 1MB
Write-Host "File size: $([math]::Round($fileSize, 2)) MB"
