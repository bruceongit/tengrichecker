$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }

    # Only the public build enters the deployment directory.
    $stagingDirectory = Join-Path $projectRoot ('.deploy/tengrichecker-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    New-Item -ItemType Directory -Path $stagingDirectory -Force | Out-Null
    Copy-Item -Path (Join-Path $projectRoot 'dist/*') -Destination $stagingDirectory -Recurse
    $config = @{
        framework = $null
        buildCommand = ''
        installCommand = ''
        outputDirectory = '.'
        cleanUrls = $true
        trailingSlash = $false
    }
    [System.IO.File]::WriteAllText((Join-Path $stagingDirectory 'vercel.json'), ($config | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding $false))

    vercel link --yes --project tengrichecker --scope grand-arena --cwd $stagingDirectory
    if ($LASTEXITCODE -ne 0) { throw 'Vercel project linking failed.' }
    vercel deploy --prod --yes --scope grand-arena --cwd $stagingDirectory
    if ($LASTEXITCODE -ne 0) { throw 'Deployment failed.' }
} finally {
    Pop-Location
}
