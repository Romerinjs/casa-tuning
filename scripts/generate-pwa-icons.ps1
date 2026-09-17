Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Width,
        [int]$Height,
        [bool]$Maskable = $false,
        [string]$BgColor = "#0A0A0C"
    )
    $src = [System.Drawing.Image]::FromFile($InputPath)
    $dest = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($Maskable) {
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($BgColor))
        $g.FillRectangle($brush, 0, 0, $Width, $Height)
        $padding = [int]($Width * 0.12)
        $innerW = $Width - ($padding * 2)
        $innerH = $Height - ($padding * 2)
        $g.DrawImage($src, $padding, $padding, $innerW, $innerH)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.DrawImage($src, 0, 0, $Width, $Height)
    }

    $dest.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
    Write-Output "Generated $OutputPath ($Width x $Height, Maskable: $Maskable)"
}

$baseDir = Get-Location
$logoPath = Join-Path $baseDir "public\logo-ct.png"

Resize-Image -InputPath $logoPath -OutputPath (Join-Path $baseDir "public\icon-192x192.png") -Width 192 -Height 192
Resize-Image -InputPath $logoPath -OutputPath (Join-Path $baseDir "public\icon-512x512.png") -Width 512 -Height 512
Resize-Image -InputPath $logoPath -OutputPath (Join-Path $baseDir "public\icon-maskable-192x192.png") -Width 192 -Height 192 -Maskable $true
Resize-Image -InputPath $logoPath -OutputPath (Join-Path $baseDir "public\icon-maskable-512x512.png") -Width 512 -Height 512 -Maskable $true
Resize-Image -InputPath $logoPath -OutputPath (Join-Path $baseDir "public\apple-touch-icon.png") -Width 180 -Height 180
