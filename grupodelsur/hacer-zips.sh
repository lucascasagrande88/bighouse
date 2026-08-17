#!/usr/bin/env bash
# Genera los dos zips para subir a Netlify (arrastrar y soltar en Deploys).
# Cada zip trae la web + la funcion de backend (Guardar) + precios de respaldo.
set -e
cd "$(dirname "$0")"
rm -rf deploy-zips _z_min _z_may
mkdir -p deploy-zips

build () {
  local tier="$1" nombre="$2" dir="_z_$tier"
  mkdir -p "$dir/public" "$dir/netlify/functions"
  sed "s/const TIER_FORZADO = null;/const TIER_FORZADO = \"$tier\";/" index.html > "$dir/public/index.html"
  cp precios.json "$dir/public/precios.json"
  cp netlify/functions/*.mjs "$dir/netlify/functions/"
  cat > "$dir/netlify.toml" <<TOML
[build]
  publish = "public"
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
TOML
  ( cd "$dir" && zip -q -r "../deploy-zips/grupodelsur-$nombre.zip" netlify.toml public netlify )
  rm -rf "$dir"
}

build min minorista
build may mayorista
echo "Listo: deploy-zips/grupodelsur-minorista.zip y deploy-zips/grupodelsur-mayorista.zip"
