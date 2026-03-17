<#
.SYNOPSIS
    Script para obtener el Refresh Token de Dropbox
    
.DESCRIPTION
    Este script interactivo te guía paso a paso para obtener un 
    Refresh Token de larga duración para la API de Dropbox.
    
.NOTES
    Autor: Desarrollador Fullstack
    Version: 1.0
    Requiere: PowerShell 5.1 o superior
#>

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DROPBOX REFRESH TOKEN GENERATOR" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Solicitar credenciales
Write-Host "[PASO 1] Ingresa tus credenciales de Dropbox App" -ForegroundColor Yellow
Write-Host ""

$APP_KEY = Read-Host "App Key"
$APP_SECRET = Read-Host "App Secret"

if ([string]::IsNullOrWhiteSpace($APP_KEY) -or [string]::IsNullOrWhiteSpace($APP_SECRET)) {
    Write-Host ""
    Write-Host "Error: Las credenciales no pueden estar vacias." -ForegroundColor Red
    exit 1
}

# Paso 2: Generar URL de autorización
Write-Host ""
Write-Host "[PASO 2] Abre esta URL en tu navegador:" -ForegroundColor Yellow
Write-Host ""

$authUrl = "https://www.dropbox.com/oauth2/authorize?client_id=$APP_KEY&token_access_type=offline&response_type=code"
Write-Host $authUrl -ForegroundColor Green
Write-Host ""

# Intentar abrir el navegador automáticamente
$openBrowser = Read-Host "Deseas abrir el navegador automaticamente? (s/n)"
if ($openBrowser -eq "s" -or $openBrowser -eq "S") {
    Start-Process $authUrl
    Write-Host "Navegador abierto." -ForegroundColor Gray
}

Write-Host ""
Write-Host "1. Inicia sesion en Dropbox" -ForegroundColor Gray
Write-Host "2. Haz clic en 'Allow' para autorizar la app" -ForegroundColor Gray
Write-Host "3. Copia el codigo de autorizacion que aparece" -ForegroundColor Gray
Write-Host ""

# Paso 3: Solicitar el código de autorización
Write-Host "[PASO 3] Ingresa el codigo de autorizacion:" -ForegroundColor Yellow
$AUTH_CODE = Read-Host "Authorization Code"

if ([string]::IsNullOrWhiteSpace($AUTH_CODE)) {
    Write-Host ""
    Write-Host "Error: El codigo de autorizacion no puede estar vacio." -ForegroundColor Red
    exit 1
}

# Paso 4: Intercambiar el código por tokens
Write-Host ""
Write-Host "[PASO 4] Obteniendo Refresh Token..." -ForegroundColor Yellow
Write-Host ""

try {
    $body = @{
        code = $AUTH_CODE
        grant_type = "authorization_code"
        client_id = $APP_KEY
        client_secret = $APP_SECRET
    }

    $response = Invoke-RestMethod -Uri "https://api.dropboxapi.com/oauth2/token" -Method POST -Body $body -ErrorAction Stop
    
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  TOKENS OBTENIDOS EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "REFRESH TOKEN (permanente - GUARDAR ESTE):" -ForegroundColor Yellow
    Write-Host $response.refresh_token -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Access Token (temporal - 4 horas):" -ForegroundColor Gray
    Write-Host $response.access_token.Substring(0, 50) + "..." -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Scopes autorizados:" -ForegroundColor Gray
    Write-Host $response.scope -ForegroundColor Gray
    Write-Host ""
    
    # Guardar en archivo (opcional)
    $saveToFile = Read-Host "Deseas guardar los tokens en un archivo? (s/n)"
    if ($saveToFile -eq "s" -or $saveToFile -eq "S") {
        $outputFile = "dropbox-tokens.txt"
        @"
========================================
DROPBOX TOKENS - $(Get-Date)
========================================

APP_KEY: $APP_KEY
APP_SECRET: $APP_SECRET

REFRESH_TOKEN (permanente):
$($response.refresh_token)

ACCESS_TOKEN (temporal - 4 horas):
$($response.access_token)

SCOPES:
$($response.scope)

========================================
IMPORTANTE: Guarda este archivo en un 
lugar seguro y NO lo subas a Git.
========================================
"@ | Out-File -FilePath $outputFile -Encoding UTF8
        
        Write-Host ""
        Write-Host "Tokens guardados en: $outputFile" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "  SIGUIENTE PASO" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Copia el REFRESH_TOKEN y pegalo en tu archivo" -ForegroundColor Yellow
    Write-Host "dropbox-config.js en la linea correspondiente:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "REFRESH_TOKEN: '$($response.refresh_token)'" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "  ERROR AL OBTENER TOKENS" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host ""
    
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    
    if ($errorDetails) {
        Write-Host "Error: $($errorDetails.error)" -ForegroundColor Red
        Write-Host "Descripcion: $($errorDetails.error_description)" -ForegroundColor Red
    } else {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "- El codigo de autorizacion ya fue usado o expiro" -ForegroundColor Gray
    Write-Host "- Las credenciales (App Key/Secret) son incorrectas" -ForegroundColor Gray
    Write-Host "- Los scopes no estan configurados en la app" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Intenta generar un nuevo codigo de autorizacion." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Presiona Enter para cerrar..."
Read-Host
