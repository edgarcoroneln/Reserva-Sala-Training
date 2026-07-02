# CLAUDE.md — Reserva Sala de Entrenamiento 2C-1

## Project Context
- **Project:** Reserva Sala de Entrenamiento 2C-1 — App web que reemplaza el Microsoft Form para reservar la sala de entrenamientos 2C-1 de DISW (2 Patios, CDMX), con validación de disponibilidad, costo de renta y reportes a finanzas.
- **Stack:** Frontend HTML + JavaScript · Backend Node.js + Express · BD SQLite → PostgreSQL · Integración Microsoft 365 (Graph: correo institucional + calendario Outlook de la sala)
- **Repo:** https://github.com/edgarcoroneln/reserva-sala-training
- **Developer:** Edgar Coronel (edgar.coronel@gmail.com)
- **Type:** web-app

## AI Governance Rules

### Before any change
- Read `_Vault/00_Start_Here/Current_Build_Target.md` — what are we building right now
- Check the latest DevLog entry for context on recent decisions
- Never commit real secrets, API keys, or credentials

### Ownership (solo developer)
- You own all files — no coordination needed
- Still follow the Definition of Done in `_Vault/05_Engineering/Definition_of_Done.md`
- Every significant AI session must produce a DevLog entry before push

### Conventions
- Feature branches: `feat/description`, bug fixes: `fix/description`, docs: `docs/description`
- Commits: `type(scope): description` (feat, fix, docs, refactor, test, chore)
- All planning and documentation lives in `_Vault/`
- Never write code directly in the Vault — only docs and plans

### Setup Commands
```bash
# Adapt these to your actual stack:

# Install dependencies
npm install          # Node.js
pip install -r requirements.txt   # Python

# Run dev server
npm run dev

# Run tests
npm test
pytest -v

# Lint
npm run lint
```

### Build & Deploy
```bash
# Build
npm run build

# Deploy via CI/CD (push to main triggers GitHub Actions)
git push origin main
```
