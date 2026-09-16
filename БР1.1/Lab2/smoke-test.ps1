param(
    [string]$BaseUrl = "http://localhost:8080/api/v1"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [string]$Token = $null
    )

    $headers = @{ Accept = "application/json" }
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    $params = @{
        Method = $Method
        Uri = $Uri
        Headers = $headers
        UseBasicParsing = $true
    }
    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = $Body | ConvertTo-Json -Depth 8
    }
    Invoke-RestMethod @params
}

function Get-HttpStatus {
    param(
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [string]$Token = $null
    )

    $client = New-Object System.Net.Http.HttpClient
    try {
        $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::new($Method), $Uri)
        $request.Headers.Accept.Add((New-Object System.Net.Http.Headers.MediaTypeWithQualityHeaderValue('application/json')))
        if ($Token) { $request.Headers.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue('Bearer', $Token) }
        if ($null -ne $Body) {
            $json = $Body | ConvertTo-Json -Depth 8
            $request.Content = New-Object System.Net.Http.StringContent($json, [System.Text.Encoding]::UTF8, 'application/json')
        }
        return [int]$client.SendAsync($request).GetAwaiter().GetResult().StatusCode
    } finally {
        if ($request) { $request.Dispose() }
        $client.Dispose()
    }
}

function Assert-Equal {
    param([string]$Name, [object]$Actual, [object]$Expected)
    if ($Actual -ne $Expected) {
        throw "$Name`: expected $Expected, got $Actual"
    }
    Write-Host "PASS $Name = $Actual"
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$landlordEmail = "lab2.landlord.$stamp@example.com"
$tenantEmail = "lab2.tenant.$stamp@example.com"

$landlord = Invoke-Api POST "$BaseUrl/auth/register" @{
    email = $landlordEmail; password = "landlord123"; full_name = "Smoke Landlord"
    phone = "+79991110001"; role = "landlord"
}
$landlordLogin = Invoke-Api POST "$BaseUrl/auth/login" @{
    email = $landlordEmail; password = "landlord123"
}
$landlordToken = $landlordLogin.access_token

$property = Invoke-Api POST "$BaseUrl/properties" @{
    title = "Smoke apartment"; description = "Lab2 smoke property"; property_type = "apartment"
    price_per_month = 50000; security_deposit = 50000; city = "Saint Petersburg"
    address = "Smoke street, $stamp"; rooms_count = 2; area_sqm = 55
} $landlordToken

$tenant = Invoke-Api POST "$BaseUrl/auth/register" @{
    email = $tenantEmail; password = "tenant123"; full_name = "Smoke Tenant"
    phone = "+79991110002"; role = "tenant"
}
$tenantLogin = Invoke-Api POST "$BaseUrl/auth/login" @{
    email = $tenantEmail; password = "tenant123"
}
$tenantToken = $tenantLogin.access_token

$message = Invoke-Api POST "$BaseUrl/messages" @{
    receiver_id = $landlord.user_id; property_id = $property.property_id
    message_text = "Smoke message"
} $tenantToken
$booking = Invoke-Api POST "$BaseUrl/bookings" @{
    property_id = $property.property_id; start_date = "2026-12-01"
    end_date = "2026-12-10"; message = "Smoke booking"
} $tenantToken
$confirmed = Invoke-Api PATCH "$BaseUrl/bookings/$($booking.booking_id)/status" @{ status = "confirmed" } $landlordToken
$contracts = Invoke-Api GET "$BaseUrl/contracts" $null $tenantToken
$dialog = Invoke-Api GET "$BaseUrl/messages/dialogs/$($landlord.user_id)/$($property.property_id)" $null $tenantToken

Assert-Equal "booking status" $confirmed.status "confirmed"
Assert-Equal "contracts count" $contracts.Count 1
Assert-Equal "dialog count" $dialog.Count 1

Assert-Equal "missing token" (Get-HttpStatus GET "$BaseUrl/bookings") 401
Assert-Equal "tenant cannot create property" (Get-HttpStatus POST "$BaseUrl/properties" @{
    title = "Forbidden"; description = "x"; property_type = "room"; price_per_month = 1000
    city = "SPB"; address = "x"; rooms_count = 1; area_sqm = 10
} $tenantToken) 403
Assert-Equal "overlapping dates" (Get-HttpStatus POST "$BaseUrl/bookings" @{
    property_id = $property.property_id; start_date = "2026-12-05"
    end_date = "2026-12-08"; message = "Overlap"
} $tenantToken) 409
Assert-Equal "invalid dates" (Get-HttpStatus POST "$BaseUrl/bookings" @{
    property_id = $property.property_id; start_date = "2026-11-10"
    end_date = "2026-11-01"; message = "Invalid dates"
} $tenantToken) 400

Write-Host "Smoke test passed through $BaseUrl"
