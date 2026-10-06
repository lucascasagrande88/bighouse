#!/bin/bash
# Genera la papelería de imprenta de las 3 marcas en marca/<Marca>/papeleria/
set -e
cd "$(dirname "$0")"
python3 stationery.py
for brand in Nahuel-Ponce Sol-Galiana Psicoanalisis-en-Barcelona; do
  out=../$brand/papeleria
  mkdir -p $out/previas
  node render.mjs out/${brand}_Tarjeta.html $out/${brand}_Tarjeta-85x55mm_sangrado-3mm.pdf $out/previas 3
  node render.mjs out/${brand}_Triptico.html $out/${brand}_Triptico-A4_sangrado-3mm.pdf $out/previas 2
  node render.mjs out/${brand}_Stickers.html $out/${brand}_Stickers-50mm_sangrado-3mm.pdf $out/previas 4
done
