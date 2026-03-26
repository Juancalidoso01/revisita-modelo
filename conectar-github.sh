#!/usr/bin/env bash
# Ejecutar en Terminal.app (macOS): Aplicaciones → Utilidades → Terminal
# Si la terminal integrada de Cursor da error de permisos, usa Terminal.app.
set -euo pipefail
cd "$(dirname "$0")"
REPO_URL="https://github.com/Juancalidoso01/revisita-modelo.git"

echo "→ Carpeta: $(pwd)"

if [[ ! -d .git ]]; then
  echo "→ Inicializando repositorio..."
  git init -b main
fi

if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git config user.name "Juancalidoso01" 2>/dev/null || true
git config user.email "juancalidoso01@users.noreply.github.com" 2>/dev/null || true

git add -A
git status
if git diff --cached --quiet && git diff --quiet; then
  echo "→ No hay cambios nuevos para commitear."
else
  git commit -m "Initial commit: revisión HTML Telered" || true
fi
git branch -M main
echo "→ Subiendo a GitHub..."
git push -u origin main
echo "→ Listo: https://github.com/Juancalidoso01/revisita-modelo"
