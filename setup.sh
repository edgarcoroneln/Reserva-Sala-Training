#!/usr/bin/env bash
# setup.sh — Inicializador de proyecto desde project-dev-template
# Uso: bash setup.sh
# Compatible: macOS, Linux, Git Bash (Windows)

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     project-dev-template — Setup         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Recopilar datos del proyecto ──────────────────────────────────────────
read -rp "Nombre del proyecto (ej: my-app): " PROJECT_NAME
read -rp "Descripción corta: " DESCRIPTION
read -rp "Tu nombre completo: " DEVELOPER_NAME
read -rp "Tu email (para git config): " DEVELOPER_EMAIL
read -rp "URL del repo en GitHub: " REPO_URL

echo ""
echo "Tipo de proyecto:"
echo "  1) Web App (React/Vue/Next.js + Backend)"
echo "  2) API / Backend puro"
echo "  3) Mobile (React Native / Flutter)"
echo "  4) Script / Automatización"
echo "  5) Fullstack Monorepo"
read -rp "Elige (1-5): " TYPE_INPUT

case $TYPE_INPUT in
    1) PROJECT_TYPE="web-app" ;;
    2) PROJECT_TYPE="api" ;;
    3) PROJECT_TYPE="mobile" ;;
    4) PROJECT_TYPE="script" ;;
    5) PROJECT_TYPE="monorepo" ;;
    *) PROJECT_TYPE="web-app" ;;
esac

echo ""
echo "Stack principal:"
echo "  1) React + Node.js + Firebase"
echo "  2) Next.js + PostgreSQL"
echo "  3) Python (FastAPI / Flask)"
echo "  4) React Native + Expo"
echo "  5) Otro"
read -rp "Elige (1-5): " STACK_INPUT

case $STACK_INPUT in
    1) STACK="React (Vite) + Node.js + Firebase" ;;
    2) STACK="Next.js + PostgreSQL" ;;
    3) STACK="Python (FastAPI/Flask)" ;;
    4) STACK="React Native + Expo" ;;
    5) read -rp "Describe tu stack: " STACK ;;
    *) STACK="Por definir" ;;
esac

DATE=$(date +%Y-%m-%d)

# ── 2. Reemplazar placeholders ────────────────────────────────────────────────
echo ""
echo "Personalizando archivos..."

find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sh" -o -name "*.ps1" \) \
    ! -path "./.git/*" | while read -r file; do
    sed -i.bak \
        -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
        -e "s|{{DESCRIPTION}}|$DESCRIPTION|g" \
        -e "s|{{DEVELOPER_NAME}}|$DEVELOPER_NAME|g" \
        -e "s|{{REPO_URL}}|$REPO_URL|g" \
        -e "s|{{PROJECT_TYPE}}|$PROJECT_TYPE|g" \
        -e "s|{{STACK}}|$STACK|g" \
        -e "s|{{DATE}}|$DATE|g" \
        "$file"
    rm -f "${file}.bak"
done

echo "  ✔ Placeholders reemplazados"

# ── 3. Configurar git ─────────────────────────────────────────────────────────
echo "Configurando git..."

git init
git config user.name  "$DEVELOPER_NAME"
git config user.email "$DEVELOPER_EMAIL"
git branch -M main

echo "  ✔ Git inicializado en rama 'main'"

# ── 4. Crear .env.example ─────────────────────────────────────────────────────
echo "Creando .env.example..."

case $PROJECT_TYPE in
    "web-app")
cat > .env.example << 'EOF'
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
EOF
    ;;
    "api")
cat > .env.example << 'EOF'
PORT=3001
NODE_ENV=development
DATABASE_URL=
JWT_SECRET=
API_KEY=
EOF
    ;;
    "mobile")
cat > .env.example << 'EOF'
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_FIREBASE_API_KEY=
EOF
    ;;
    "script")
cat > .env.example << 'EOF'
INPUT_PATH=./data/input
OUTPUT_PATH=./data/output
API_KEY=
LOG_LEVEL=INFO
EOF
    ;;
esac

echo "  ✔ .env.example creado"

# ── 5. Primer commit ──────────────────────────────────────────────────────────
git add .
git commit -m "chore: init $PROJECT_NAME from project-dev-template"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✔ Proyecto '$PROJECT_NAME' listo!      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Próximos pasos:"
echo "  1. Crear repo en GitHub: $REPO_URL"
echo "  2. git remote add origin $REPO_URL"
echo "  3. git push -u origin main"
echo "  4. Abrir Obsidian → Open folder as vault → seleccionar _Vault/"
echo "  5. Instalar plugin 'Obsidian Kanban' en Obsidian (Community plugins)"
echo ""
