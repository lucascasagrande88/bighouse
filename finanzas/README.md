# Finanzas · agosto–septiembre 2026

`finanzas-ago-sep-2026.pptx` — presentación de 10 slides para manejar las finanzas.
`gen.js` — generador (pptxgenjs). Para regenerar: `npm install pptxgenjs && node gen.js finanzas-ago-sep-2026.pptx`

## Base de cálculo

Dos fuentes de ingreso, un solo costo que se repite todos los meses.

**Clientes recurrentes (7)** — ARS 1.700.000 brutos por mes

| Cliente | Cobra | Mariela | Queda |
|---|---:|---:|---:|
| Cementera | 500.000 | -50.000 | 450.000 |
| Macellaio Carnes | 300.000 | -50.000 | 250.000 |
| Muñoz | 200.000 | -50.000 | 150.000 |
| Flipar | 200.000 | -50.000 | 150.000 |
| RIFI Burger | 200.000 | -50.000 | 150.000 |
| RIFI comida árabe | 200.000 | -50.000 | 150.000 |
| Polcher social media | 100.000 | -50.000 | 50.000 |
| **Total** | **1.700.000** | **-350.000** | **1.350.000** |

**Animación Lucas Casagrande** — por proyecto, 1.600.000 en agosto y 1.600.000 en septiembre.

**Mariela** — ARS 50.000 por cada cliente recurrente. Es el único costo mensual.

## Resultado

| | Entra | Sale | Queda |
|---|---:|---:|---:|
| Agosto | 4.000.000 | -3.350.000 | **650.000** |
| Septiembre | 3.700.000 | -350.000 | **3.350.000** |
| Octubre base (solo recurrentes) | 1.700.000 | -350.000 | **1.350.000** |

## Supuestos aplicados

1. **Fiat MP** cobra 300.000 en agosto y no vuelve. Mariela cobra su parte de Fiat MP dentro de
   los 400.000 de agosto (8 × 50.000) y nada más después: desde septiembre son 350.000 (7 × 50.000).
2. **Financista (1.600.000), multa (350.000) y tarjeta de tu vieja (1.000.000)** se tratan como
   gastos puntuales de agosto, no como estructura mensual.
3. **La tarjeta de 1.000.000** no se repite en septiembre. Si se repitiera, el saldo de septiembre
   baja a 2.350.000.
4. **Santander / Landia (400.000)** se toma como ingreso puntual de septiembre. Si queda como
   recurrente, suma 350.000 netos por mes.
5. No hay gastos personales cargados en el plan: solo costos del negocio.
