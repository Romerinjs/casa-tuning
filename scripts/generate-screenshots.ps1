Add-Type -AssemblyName System.Drawing

$screenshotsDir = Join-Path (Get-Location) "public\screenshots"
if (!(Test-Path $screenshotsDir)) {
    New-Item -ItemType Directory -Path $screenshotsDir -Force | Out-Null
}

$logoPath = Join-Path (Get-Location) "public\logo-ct.png"
$logo = [System.Drawing.Image]::FromFile($logoPath)

function Generate-DesktopScreenshot {
    param([string]$path)
    $w = 1280
    $h = 720
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#0A0A0C"))
    $g.FillRectangle($bgBrush, 0, 0, $w, $h)

    # Sidebar
    $sidebarBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#111113"))
    $g.FillRectangle($sidebarBrush, 0, 0, 260, $h)

    # Sidebar logo
    $g.DrawImage($logo, 30, 30, 50, 50)
    $fontTitle = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Bold)
    $fontSubtitle = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Regular)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#FFFFFF"))
    $subtextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#9898A6"))
    $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#C9A84C"))

    $g.DrawString("Casa Tuning", $fontTitle, $textBrush, 90, 35)
    $g.DrawString("Portal Operativo", $fontSubtitle, $subtextBrush, 90, 60)

    # Sidebar menu items
    $menuFont = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Regular)
    $items = @("Dashboard", "Recepcion Vehicular", "Ordenes de Servicio", "Clientes", "Vehiculos", "Administracion")
    $y = 120
    foreach ($item in $items) {
        if ($item -eq "Dashboard") {
            $activeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#1C1C22"))
            $g.FillRectangle($activeBrush, 15, $y - 5, 230, 40)
            $g.DrawString($item, $menuFont, $accentBrush, 35, $y + 5)
        } else {
            $g.DrawString($item, $menuFont, $subtextBrush, 35, $y + 5)
        }
        $y += 50
    }

    # Header in main content
    $headerFont = New-Object System.Drawing.Font("Arial", 22, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("Panel de Control Operativo", $headerFont, $textBrush, 290, 35)

    # Cards in dashboard
    $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#141418"))
    $cardPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#22222A"), 1)

    $cardW = 300
    $cardH = 140
    $cards = @(
        @{ Title = "Ordenes Activas"; Value = "24"; Color = "#C9A84C" },
        @{ Title = "Recepciones Hoy"; Value = "8"; Color = "#4CAF50" },
        @{ Title = "Por Entregar"; Value = "5"; Color = "#2196F3" }
    )

    $cx = 290
    foreach ($c in $cards) {
        $g.FillRectangle($cardBrush, $cx, 100, $cardW, $cardH)
        $g.DrawRectangle($cardPen, $cx, 100, $cardW, $cardH)

        $cTitleFont = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Regular)
        $cValFont = New-Object System.Drawing.Font("Arial", 28, [System.Drawing.FontStyle]::Bold)
        $valBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($c.Color))

        $g.DrawString($c.Title, $cTitleFont, $subtextBrush, $cx + 20, 120)
        $g.DrawString($c.Value, $cValFont, $valBrush, $cx + 20, 150)
        $cx += 320
    }

    # Main table preview card
    $g.FillRectangle($cardBrush, 290, 270, 940, 410)
    $g.DrawRectangle($cardPen, 290, 270, 940, 410)
    $tableTitleFont = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("Ordenes Recientes de Taller", $tableTitleFont, $textBrush, 310, 290)

    # Table rows
    $rowY = 340
    $rowFont = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Regular)
    $headers = "Placa        Vehiculo                  Cliente               Estado               Fecha"
    $g.DrawString($headers, $rowFont, $subtextBrush, 310, $rowY)
    $rowY += 30

    $sampleOrders = @(
        "CT-1024      Mazda 3 Grand Touring     Carlos Rodriguez      En Proceso           17/09/2026",
        "CT-1023      Toyota Fortuner 4x4       Andrea Restrepo       Diagnostico          17/09/2026",
        "CT-1022      BMW M340i                 Felipe Gomez          Listo para Entrega   16/09/2026",
        "CT-1021      Audi A4 S-Line            Alejandro Mora        Aprobado             16/09/2026"
    )

    foreach ($so in $sampleOrders) {
        $g.DrawString($so, $rowFont, $textBrush, 310, $rowY)
        $rowY += 35
    }

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated Desktop Screenshot: $path (1280x720)"
}

function Generate-MobileScreenshot {
    param([string]$path)
    $w = 750
    $h = 1334
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#0A0A0C"))
    $g.FillRectangle($bgBrush, 0, 0, $w, $h)

    # App Bar
    $barBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#111113"))
    $g.FillRectangle($barBrush, 0, 0, $w, 140)

    # Logo and App Title
    $g.DrawImage($logo, 30, 45, 60, 60)
    $fontTitle = New-Object System.Drawing.Font("Arial", 22, [System.Drawing.FontStyle]::Bold)
    $fontSubtitle = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Regular)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#FFFFFF"))
    $subtextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#9898A6"))
    $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#C9A84C"))

    $g.DrawString("Casa Tuning", $fontTitle, $textBrush, 110, 50)
    $g.DrawString("Control y Recepcion", $fontSubtitle, $subtextBrush, 110, 85)

    # Mobile Cards
    $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#141418"))
    $cardPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#22222A"), 2)

    # Section 1: Nueva Recepcion CTA
    $g.FillRectangle($cardBrush, 30, 170, 690, 180)
    $g.DrawRectangle($cardPen, 30, 170, 690, 180)
    $ctaTitleFont = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Bold)
    $ctaDescFont = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Regular)
    $g.DrawString("Nueva Recepcion Vehicular", $ctaTitleFont, $accentBrush, 60, 200)
    $g.DrawString("Ingresar vehiculo, fotos 360 e inventario", $ctaDescFont, $subtextBrush, 60, 240)

    $btnBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#C9A84C"))
    $btnTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#0A0A0C"))
    $btnFont = New-Object System.Drawing.Font("Arial", 14, [System.Drawing.FontStyle]::Bold)
    $g.FillRectangle($btnBrush, 60, 280, 240, 50)
    $g.DrawString("+ Iniciar Ingreso", $btnFont, $btnTextBrush, 90, 295)

    # Section 2: Resumen Operativo
    $sectionFont = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("Resumen del Taller", $sectionFont, $textBrush, 35, 385)

    $metrics = @(
        @{ Label = "Ordenes Activas"; Count = "24" },
        @{ Label = "Para Entrega Hoy"; Count = "5" },
        @{ Label = "Pendiente Aprobacion"; Count = "3" }
    )

    $my = 430
    foreach ($m in $metrics) {
        $g.FillRectangle($cardBrush, 30, $my, 690, 100)
        $g.DrawRectangle($cardPen, 30, $my, 690, 100)

        $mLabelFont = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Regular)
        $mCountFont = New-Object System.Drawing.Font("Arial", 24, [System.Drawing.FontStyle]::Bold)

        $g.DrawString($m.Label, $mLabelFont, $textBrush, 60, $my + 35)
        $g.DrawString($m.Count, $mCountFont, $accentBrush, 630, $my + 30)
        $my += 120
    }

    # Bottom Tab Navigation
    $g.FillRectangle($barBrush, 0, 1220, $w, 114)
    $tabFont = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Regular)
    $g.DrawString("Inicio", $tabFont, $accentBrush, 80, 1260)
    $g.DrawString("Recepcion", $tabFont, $subtextBrush, 240, 1260)
    $g.DrawString("Ordenes", $tabFont, $subtextBrush, 430, 1260)
    $g.DrawString("Clientes", $tabFont, $subtextBrush, 600, 1260)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated Mobile Screenshot: $path (750x1334)"
}

Generate-DesktopScreenshot (Join-Path $screenshotsDir "desktop.png")
Generate-MobileScreenshot (Join-Path $screenshotsDir "mobile.png")
$logo.Dispose()
