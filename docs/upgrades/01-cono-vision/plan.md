---
id: upgrade-01-cono-vision-plan
titulo: "Plan — Upgrade 01: Cono de visión"
tipo: upgrade-plan
audiencia: estudiante
acceso: publico
version: 1
---

# Plan — Upgrade 01: Cono de visión

## Incrementos pequeños

1. **Dominio del recorte.** Crear `src/domain/perception/visionCone.ts` con `computeVisionCone(input)`: valida la configuración igual que `evaluateVision`, lanza `[]` si el facing es nulo o el observador está en celda bloqueada, y devuelve un polígono `[observador, ...puntos]` muestreando rayos dentro del FOV y recortando cada rayo contra las paredes con un recorrido DDA de celdas (criterio conservador en esquinas, análogo a `lineIsOccluded`). Sin imports de Phaser/DOM.
2. **Pruebas de dominio.** Agregar `tests/perception/visionCone.test.ts` con: sector abierto (todos los vértices a `range`), recorte por pared (ningún vértice cruza la pared), esquina conservadora (coherencia con `evaluateVision` en el caso `occluded`), observador en celda bloqueada → `[]`, facing nulo → `[]`, configuración inválida → lanza `"Vision configuration"`, objetivo visible cubierto por el cono, y límite exacto del ángulo.
3. **Presentación.** En `GameScene`: mapa `REASON_FILL_COLORS` por `VisionReason`, detección de transición visible↔no visible en `updatePerception()` guardando `previousVisionVisible` y `visionFlashUntilMs`, y `drawPerception(vision, time)` dibujando el polígono de `computeVisionCone` con el color de la razón más una traza de destello mientras `time < visionFlashUntilMs`. Reiniciar los campos en `create()` para no producir destello falso al reiniciar.
4. **Validación completa.** Ejecutar `npm run validate` y registrar la salida en `evidencia.md`.

## Archivos previstos

| Archivo | Acción |
|---|---|
| `src/domain/perception/visionCone.ts` | crear |
| `tests/perception/visionCone.test.ts` | crear |
| `src/game/scenes/GameScene.ts` | modificar (`drawPerception`, `updatePerception`, `create`, constantes de color) |
| `docs/upgrades/01-cono-vision/spec.md` | crear |
| `docs/upgrades/01-cono-vision/plan.md` | crear |
| `docs/upgrades/01-cono-vision/evidencia.md` | crear |

No se modifican: `perception.ts`, `memory.ts`, `perceptionSimulation.ts`, `labLevel.ts`, pruebas existentes, `package.json`.

## Validación

- `npm run typecheck` → sin errores.
- `npm run test:run` → suites nuevas y existentes en verde.
- `npm run build` → compilación de producción sin errores de tipos.
- `npm run validate` → los tres anteriores encadenados, sin interacción.
- Verificación manual en `npm run dev`: jugador detrás de pared (cono cortado, color ocluido), fuera de rango, fuera de ángulo, y destello en cada transición visible↔no visible; sin destello al recargar/reiniciar.

## Riesgos

- **Discrepancia lo evaluado vs. lo dibujado:** mitigado muestreando el mismo criterio de oclusión conservador y con el test de coherencia pared/`evaluateVision`.
- **Coste por cuadro:** ~45 rayos × recorrido DDA corto; despreciable, pero se acota el número máximo de rayos.
- **Destello falso al arrancar:** `previousVisionVisible` inicia en `null` y se reinicia en `create()`.
- **Endpoints sobre la cara de la pared:** los vértices pueden caer exactamente en el borde de la celda bloqueada; los tests usan tolerancia.

## Condiciones para detenerse

- La spec admite interpretaciones con efectos distintos sobre la geometría o el destello.
- Una validación falla por una causa no comprendida.
- El cambio requeriría tocar `evaluateVision`, memoria, navegación o instalar dependencias.
- Aparecen cambios concurrentes que interfieran con la tarea.
