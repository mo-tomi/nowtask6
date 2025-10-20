# PowerShell script to compile all code files (improved version)

$outputFile = "ALLCODE.txt"
$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$assetsPath = "android-app\app\src\main\assets"

# Delete old file if exists
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

# Create header
$header = @"
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

"@

[System.IO.File]::WriteAllText($outputFile, $header, [System.Text.Encoding]::UTF8)

# Process HTML files
Write-Host "Processing HTML files..."
Get-ChildItem -Path $assetsPath -Filter "*.html" -Recurse | ForEach-Object {
    $content = "`n### $($_.Name)`n`n``````html`n"
    $content += Get-Content $_.FullName -Raw -Encoding UTF8
    $content += "`n```````n"
    [System.IO.File]::AppendAllText($outputFile, $content, [System.Text.Encoding]::UTF8)
}

# CSS Header
$cssHeader = "`n---`n`n## CSS`n"
[System.IO.File]::AppendAllText($outputFile, $cssHeader, [System.Text.Encoding]::UTF8)

# Process main CSS files
Write-Host "Processing main CSS files..."
@("style.css", "animations.css") | ForEach-Object {
    $file = Join-Path $assetsPath $_
    if (Test-Path $file) {
        $content = "`n### $_`n`n``````css`n"
        $content += Get-Content $file -Raw -Encoding UTF8
        $content += "`n```````n"
        [System.IO.File]::AppendAllText($outputFile, $content, [System.Text.Encoding]::UTF8)
        Write-Host "  - $_"
    }
}

# Process modular CSS files in css folder
Write-Host "Processing modular CSS files..."
$cssFolder = Join-Path $assetsPath "css"
if (Test-Path $cssFolder) {
    Get-ChildItem -Path $cssFolder -Filter "*.css" | ForEach-Object {
        $content = "`n### css\$($_.Name)`n`n``````css`n"
        $content += Get-Content $_.FullName -Raw -Encoding UTF8
        $content += "`n```````n"
        [System.IO.File]::AppendAllText($outputFile, $content, [System.Text.Encoding]::UTF8)
        Write-Host "  - css\$($_.Name)"
    }
}

# Process style-*.css files
Write-Host "Processing style-*.css files..."
Get-ChildItem -Path $assetsPath -Filter "style-*.css" | ForEach-Object {
    $content = "`n### $($_.Name)`n`n``````css`n"
    $content += Get-Content $_.FullName -Raw -Encoding UTF8
    $content += "`n```````n"
    [System.IO.File]::AppendAllText($outputFile, $content, [System.Text.Encoding]::UTF8)
    Write-Host "  - $($_.Name)"
}

# JavaScript Header
$jsHeader = "`n---`n`n## JavaScript`n"
[System.IO.File]::AppendAllText($outputFile, $jsHeader, [System.Text.Encoding]::UTF8)

# Process JS files
Write-Host "Processing JavaScript files..."
$jsFiles = Get-ChildItem -Path $assetsPath -Filter "*.js" -Recurse | Sort-Object FullName
$totalJs = $jsFiles.Count
$current = 0

foreach ($file in $jsFiles) {
    $current++
    $relativePath = $file.FullName.Replace("$assetsPath\", "")
    Write-Host "  [$current/$totalJs] $relativePath"

    try {
        $content = "`n### $relativePath`n`n``````javascript`n"
        $fileContent = Get-Content $file.FullName -Raw -Encoding UTF8
        $content += $fileContent
        $content += "`n```````n"
        [System.IO.File]::AppendAllText($outputFile, $content, [System.Text.Encoding]::UTF8)
    } catch {
        Write-Host "    ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nCompilation complete!" -ForegroundColor Green
$fileSize = (Get-Item $outputFile).Length / 1MB
$lines = (Get-Content $outputFile).Count
Write-Host "Output file: $outputFile"
Write-Host "File size: $([math]::Round($fileSize, 2)) MB"
Write-Host "Total lines: $lines"
Write-Host "`nSummary:" -ForegroundColor Yellow
Write-Host "  - HTML files: 1"
Write-Host "  - CSS files: $((@("style.css", "animations.css").Count) + (Get-ChildItem -Path (Join-Path $assetsPath "css") -Filter "*.css" -ErrorAction SilentlyContinue).Count + (Get-ChildItem -Path $assetsPath -Filter "style-*.css").Count)"
Write-Host "  - JavaScript files: $totalJs"
