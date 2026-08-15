<#
.SYNOPSIS
Intelligence Report Pre-warmer for Demo Day (PowerShell)

.DESCRIPTION
Hits the live Next.js API endpoints sequentially to generate and cache 
intelligence reports for India and Singapore in the actual server's memory.
Run this before the demo while the Next.js server is running.
#>

$ApiBaseUrl = "http://localhost:3000/api/intelligence"
$Countries = @("india", "singapore")
$DelaySeconds = 30

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "          Intelligence Report Pre-warmer                  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Server : $ApiBaseUrl"
Write-Host "Countries     : $($Countries -join ', ')"
Write-Host "Delay between : ${DelaySeconds}s"
Write-Host "----------------------------------------------------------"

$Results = @()

foreach ($Country in $Countries) {
    Write-Host ""
    Write-Host "[Warming] $Country..." -ForegroundColor Yellow
    
    $StartTime = Get-Date

    try {
        $Url = "$ApiBaseUrl`?countryId=$Country"
        # We set a long timeout since the generation can take 60-90s due to sequential calls
        $Response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 300
        
        $Duration = (Get-Date) - $StartTime
        $DurationSecs = [math]::Round($Duration.TotalSeconds, 1)
        
        Write-Host "SUCCESS: $Country warmed in ${DurationSecs}s" -ForegroundColor Green
        $Results += [PSCustomObject]@{ Country = $Country; Status = "OK"; Duration = $DurationSecs }
    }
    catch {
        $Duration = (Get-Date) - $StartTime
        $DurationSecs = [math]::Round($Duration.TotalSeconds, 1)
        $ErrorMsg = $_.Exception.Message
        
        Write-Host "FAILED: $Country failed: $ErrorMsg" -ForegroundColor Red
        $Results += [PSCustomObject]@{ Country = $Country; Status = "Failed"; Duration = $DurationSecs; Error = $ErrorMsg }
    }

    if ($Country -ne $Countries[-1]) {
        Write-Host "Waiting ${DelaySeconds}s before next country (rate-limit cooldown)..." -ForegroundColor DarkGray
        Start-Sleep -Seconds $DelaySeconds
    }
}

Write-Host ""
Write-Host "----------------------------------------------------------"
Write-Host "Pre-warm summary:"
$AllOk = $true

foreach ($Result in $Results) {
    if ($Result.Status -eq "OK") {
        Write-Host "  SUCCESS $($Result.Country): $($Result.Duration)s" -ForegroundColor Green
    } else {
        Write-Host "  FAILED $($Result.Country): $($Result.Error)" -ForegroundColor Red
        $AllOk = $false
    }
}

if ($AllOk) {
    Write-Host ""
    Write-Host "All countries warmed successfully." -ForegroundColor Green
    Write-Host "Demo requests will be served from cache instantly." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some countries failed to warm. Check server logs." -ForegroundColor Yellow
}
Write-Host "----------------------------------------------------------"
Write-Host ""
