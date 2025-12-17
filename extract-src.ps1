# extract-src.ps1
# Root of your Next.js project = folder where this script is saved
$projectRoot = $PSScriptRoot

# Folders you want to include (relative to project root)
$foldersToScan = @("app", "src", "components", "lib")

# File extensions to include
$extensions = @(".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".json")

# Output file
$outputFile = Join-Path $projectRoot "frontendSource.txt"

# Build full paths for each folder that actually exists
$pathsToScan = $foldersToScan |
  ForEach-Object {
    $fullPath = Join-Path $projectRoot $_
    if (Test-Path $fullPath) { $fullPath }
  }

Get-ChildItem -Path $pathsToScan -Recurse -File |
  Where-Object { $extensions -contains $_.Extension } |
  ForEach-Object {
    # Path relative to project root
    $relativePath = $_.FullName.Replace($projectRoot, "").TrimStart("\", "/")

    Write-Output "`n// ===== FILE: $relativePath =====`n"

    # IMPORTANT: use -LiteralPath so folders like [id] are not treated as wildcards
    Get-Content -LiteralPath $_.FullName
  } | Out-File -FilePath $outputFile -Encoding utf8

Write-Host "Done. Dump created at: $outputFile"
