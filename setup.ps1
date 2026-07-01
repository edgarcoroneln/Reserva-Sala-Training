# setup.ps1 — Inicializador de proyecto desde project-dev-template
# Uso: .\setup.ps1
# Requiere: git, PowerShell 7+

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     project-dev-template — Setup         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 1. Recopilar datos del proyecto ──────────────────────────────────────────
$PROJECT_NAME    = Read-Host "Nombre del proyecto (ej: my-app)"
$DESCRIPTION     = Read-Host "Descripción corta (ej: API REST para gestión de tareas)"
$DEVELOPER_NAME  = Read-Host "Tu nombre completo"
$DEVELOPER_EMAIL = Read-Host "Tu email (para git config)"
$REPO_URL        = Read-Host "URL del repo en GitHub (ej: https://github.com/user/my-app)"

Write-Host ""
Write-Host "Tipo de proyecto:" -ForegroundColor Yellow
Write-Host "  1) Web App (React/Vue/Next.js + Backend)"
Write-Host "  2) API / Backend puro (Node.js / Python / Go)"
Write-Host "  3) Mobile (React Native / Flutter)"
Write-Host "  4) Script / Automatización (Python / PowerShell)"
Write-Host "  5) Fullstack Monorepo"
$TYPE_INPUT = Read-Host "Elige (1-5)"

$PROJECT_TYPE = switch ($TYPE_INPUT) {
    "1" { "web-app" }
    "2" { "api" }
    "3" { "mobile" }
    "4" { "script" }
    "5" { "monorepo" }
    default { "web-app" }
}

Write-Host ""
Write-Host "Stack principal:" -ForegroundColor Yellow
Write-Host "  1) React + Node.js + Firebase"
Write-Host "  2) Next.js + PostgreSQL"
Write-Host "  3) Python (FastAPI / Flask)"
Write-Host "  4) React Native + Expo"
Write-Host "  5) Otro (lo defines tú)"
$STACK_INPUT = Read-Host "Elige (1-5)"

$STACK = switch ($STACK_INPUT) {
    "1" { "React (Vite) + Node.js + Firebase" }
    "2" { "Next.js + PostgreSQL" }
    "3" { "Python (FastAPI/Flask)" }
    "4" { "React Native + Expo" }
    "5" { Read-Host "Describe tu stack" }
    default { "Por definir" }
}

# ── 2. Reemplazar placeholders en todos los archivos ─────────────────────────
Write-Host ""
Write-Host "Personalizando archivos..." -ForegroundColor Green

$files = Get-ChildItem -Recurse -File | Where-Object {
    $_.Extension -in @(".md", ".json", ".yml", ".yaml", ".ps1", ".sh", ".txt") -and
    $_.FullName -notlike "*\.git\*"
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($null -eq $content) { continue }
    $content = $content `
        -replace '\{\{PROJECT_NAME\}\}',   $PROJECT_NAME `
        -replace '\{\{DESCRIPTION\}\}',    $DESCRIPTION `
        -replace '\{\{DEVELOPER_NAME\}\}', $DEVELOPER_NAME `
        -replace '\{\{REPO_URL\}\}',       $REPO_URL `
        -replace '\{\{PROJECT_TYPE\}\}',   $PROJECT_TYPE `
        -replace '\{\{STACK\}\}',          $STACK `
        -replace '\{\{DATE\}\}',           (Get-Date -Format "yyyy-MM-dd")
    Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
}

Write-Host "  ✔ Placeholders reemplazados" -ForegroundColor Green

# ── 3. Renombrar rama y configurar git ───────────────────────────────────────
Write-Host "Configurando git..." -ForegroundColor Green

git init
git config user.name  $DEVELOPER_NAME
git config user.email $DEVELOPER_EMAIL
git branch -M main

Write-Host "  ✔ Git inicializado en rama 'main'" -ForegroundColor Green

# ── 4. Crear .env.example según el tipo de proyecto ──────────────────────────
Write-Host "Creando .env.example..." -ForegroundColor Green

$envContent = switch ($PROJECT_TYPE) {
    "web-app" {
@"
# === Frontend ===
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=

# === Backend ===
PORT=3001
NODE_ENV=development
DATABASE_URL=
JWT_SECRET=
"@
    }
    "api" {
@"
PORT=3001
NODE_ENV=development
DATABASE_URL=
JWT_SECRET=
API_KEY=
"@
    }
    "mobile" {
@"
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_FIREBASE_API_KEY=
"@
    }
    "script" {
@"
INPUT_PATH=./data/input
OUTPUT_PATH=./data/output
API_KEY=
LOG_LEVEL=INFO
"@
    }
    default {
@"
API_URL=http://localhost:3001
NODE_ENV=development
"@
    }
}

Set-Content ".env.example" -Value $envContent -Encoding UTF8
Write-Host "  ✔ .env.example creado" -ForegroundColor Green

# ── 5. Primer commit ─────────────────────────────────────────────────────────
git add .
git commit -m "chore: init $PROJECT_NAME from project-dev-template"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✔ Proyecto '$PROJECT_NAME' listo       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Crear repo en GitHub: $REPO_URL"
Write-Host "  2. git remote add origin $REPO_URL"
Write-Host "  3. git push -u origin main"
Write-Host "  4. Abrir Obsidian → Open folder as vault → seleccionar _Vault/"
Write-Host "  5. Instalar plugin 'Obsidian Kanban' en Obsidian (Community plugins)"
Write-Host ""
