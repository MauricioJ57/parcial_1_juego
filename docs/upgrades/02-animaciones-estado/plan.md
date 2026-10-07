---
id: upgrade-02-animaciones-estado-plan
titulo: "Plan — Upgrade 02: Animaciones por estado y transición"
tipo: upgrade-plan
audiencia: estudiante
acceso: publico
version: 1
---

# Plan — Upgrade 02: Animaciones por estado y transición

## Incrementos pequeños

1. **Constantes y tipo de estado.** En `GameScene.ts`, definir constantes de animación (`GUARD_BASE_SCALE`, `SURPRISE_SCALE_AMPLITUDE`, `SURPRISE_DURATION_MS`, `ALERT_PULSE_AMPLITUDE`, `ALERT_PULSE_PERIOD_MS`, `GUARD_BASE_COLOR`, `GUARD_ALERT_COLOR`, `GUARD_SEARCH_COLOR`) y el tipo de presentación `GuardVisualState`.
2. **Campos de transición.** Añadir `surpriseStartedAtMs` y `guardVisualState`, reiniciados en `create()`, junto a los ya existentes `lastVisionVisible` y `visionFlashUntilMs`.
3. **Detección de sorpresa.** En `updatePerception()`, disparar `surpriseStartedAtMs` sólo en la transición no-visible → visible y limpiarlo al perder visión; conservar la lógica de destello del cono.
4. **Animación de estado.** Nuevo método `updateGuardAnimation(time, soundHeard, visionVisible)`: sorpresa con crecimiento y retorno `sin(π·p)` en ~1.5 s; alerta con latido + tinte ámbar; búsqueda con tinte rojo; reposo en escala/color base. Aplicar `setScale` y `setFillStyle` sobre el `Arc` `guard`.
5. **Validación completa.** Ejecutar `npm run validate` y registrar la salida en `evidencia.md`.

## Archivos previstos

| Archivo | Acción |
|---|---|
| `src/game/scenes/GameScene.ts` | modificar (constantes, tipo, campos, `create`, `updatePerception`, `updateGuardAnimation`) |
| `docs/upgrades/02-animaciones-estado/spec.md` | crear |
| `docs/upgrades/02-animaciones-estado/plan.md` | crear |
| `docs/upgrades/02-animaciones-estado/evidencia.md` | crear |

No se modifican: `src/domain/**`, `src/application/**`, pruebas existentes, `package.json`, `index.html`.

## Validación

- `npm run typecheck` → sin errores.
- `npm run test:run` → suites existentes en verde (sin pruebas nuevas).
- `npm run build` → compilación de producción sin errores de tipos.
- `npm run validate` → los tres anteriores encadenados, sin interacción.
- Verificación manual en `npm run dev`:
  1. Reposo: pelota azul y tamaño base.
  2. Situarse en el cono: crecimiento y retorno en ~1.5 s; con visión continua no se repite.
  3. Salir de visión tras haber sido visto: pasa a búsqueda (rojo) mientras exista memoria.
  4. Presionar `Q` sin visión: latido ámbar durante el sonido; al expirar vuelve a reposo o búsqueda.
  5. Presionar `R`: vuelve a reposo sin animación falsa.

## Riesgos

- **Ambigüedad "estado" sin H4:** mitigado derivando el estado sólo de la percepción ya calculada y documentándolo como presentación.
- **Efecto de sorpresa colgado al perder visión:** `surpriseStartedAtMs` se limpia cuando `visionVisible` es falso.
- **Animación falsa al arrancar/reiniciar:** `lastVisionVisible` y `surpriseStartedAtMs` inician en `null` y se reinician en `create()`.
- **Latido dependiente del reloj del sistema:** se usa el `time` de Phaser; un salto de tiempo sólo altera la fase del latido, no la lógica.
- **Confusión sorpresa/destello:** ambos usan la misma transición pero son efectos distintos y coexistentes; documentado en la spec.

## Condiciones para detenerse

- La spec admite interpretaciones con efectos distintos sobre tamaño, color o duración.
- Una validación falla por una causa no comprendida.
- El cambio requeriría tocar dominio, aplicación, memoria o instalar dependencias.
- Aparecen cambios concurrentes que interfieran con la tarea.
