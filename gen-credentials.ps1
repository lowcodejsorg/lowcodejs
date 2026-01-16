$ErrorActionPreference = "Stop"
$envFile = ".env"

# --- Cria RSA 2048 ---
$rsa = New-Object System.Security.Cryptography.RSACryptoServiceProvider 2048

# --- Exporta chave privada (PKCS#1) ---
$privateDer = $rsa.ExportCspBlob($true)

# --- Exporta chave publica ---
$publicDer = $rsa.ExportCspBlob($false)

# --- Converte DER para PEM ---
function Convert-ToPem($bytes, $header, $footer) {
    $b64 = [Convert]::ToBase64String($bytes)
    $lines = ($b64 -split "(.{64})" | Where-Object { $_ -ne "" })
    return "$header`n" + ($lines -join "`n") + "`n$footer"
}

$privatePem = Convert-ToPem $privateDer "-----BEGIN RSA PRIVATE KEY-----" "-----END RSA PRIVATE KEY-----"
$publicPem  = Convert-ToPem $publicDer  "-----BEGIN RSA PUBLIC KEY-----"  "-----END RSA PUBLIC KEY-----"

# --- Base64 do PEM (igual ao bash) ---
$jwtPrivateKey = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($privatePem))
$jwtPublicKey  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($publicPem))

# --- COOKIE_SECRET (32 bytes hex) ---
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$cookieSecret = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""

# --- Cria .env se nao existir ---
if (!(Test-Path $envFile)) {
    New-Item -ItemType File -Path $envFile | Out-Null
}

# --- Remove chaves antigas ---
$filtered = Get-Content $envFile | Where-Object {
    $_ -notmatch '^JWT_PRIVATE_KEY=' -and
    $_ -notmatch '^JWT_PUBLIC_KEY=' -and
    $_ -notmatch '^COOKIE_SECRET='
}

$filtered | Set-Content $envFile -Encoding UTF8

# --- Escreve novas ---
Add-Content $envFile "JWT_PRIVATE_KEY=$jwtPrivateKey"
Add-Content $envFile "JWT_PUBLIC_KEY=$jwtPublicKey"
Add-Content $envFile "COOKIE_SECRET=$cookieSecret"

Write-Host "OK - .env atualizado"
