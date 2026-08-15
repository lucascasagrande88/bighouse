#!/usr/bin/env bash
# Genera los dos zips para subir a Netlify (arrastrar y soltar).
# Cada zip = index.html (con la lista forzada) + precios.json de respaldo.
set -e
cd "$(dirname "$0")"
mkdir -p deploy-zips _tmp_min _tmp_may
sed 's/const TIER_FORZADO = null;/const TIER_FORZADO = "min";/' index.html > _tmp_min/index.html
sed 's/const TIER_FORZADO = null;/const TIER_FORZADO = "may";/' index.html > _tmp_may/index.html
cp precios.json _tmp_min/ ; cp precios.json _tmp_may/
( cd _tmp_min && zip -q -r ../deploy-zips/grupodelsur-minorista.zip index.html precios.json )
( cd _tmp_may && zip -q -r ../deploy-zips/grupodelsur-mayorista.zip index.html precios.json )
rm -rf _tmp_min _tmp_may
echo "Listo: deploy-zips/grupodelsur-minorista.zip y deploy-zips/grupodelsur-mayorista.zip"
