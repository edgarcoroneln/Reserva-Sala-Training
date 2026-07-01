# CLAUDE.md — {{PROJECT_NAME}}

## Project Context
- **Project:** {{PROJECT_NAME}} — {{DESCRIPTION}}
- **Stack:** {{STACK}}
- **Repo:** {{REPO_URL}}
- **Developer:** {{DEVELOPER_NAME}}
- **Type:** {{PROJECT_TYPE}} (web-app | api | mobile | script)

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
