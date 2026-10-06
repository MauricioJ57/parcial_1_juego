---
id: upgrade-01-cono-vision-evidencia
titulo: "Evidencia — Upgrade 01: Cono de visión"
tipo: upgrade-evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Evidencia — Upgrade 01: Cono de visión

## Versión inicial / final

- Versión inicial: `70588cd` (Initial commit), árbol limpio.
- Versión final: cambios sin commit en árbol de trabajo (no se creó ningún commit: requiere autorización humana).
- Comandos ejecutados en Windows PowerShell con `npm.cmd` (la ejecución de `npm.ps1` está bloqueada por política de ejecución del sistema).

## Comandos y resultados

| Orden | Comando | Resultado |
|---:|---|---|
| 1 | `npm.cmd run validate` | **Pasa** (salida completa abajo) |
| 2 | `git status --short` | 1 modificado + 3 nuevos (ver Diff) |
| 3 | `git diff --stat` | `src/game/scenes/GameScene.ts`: +54 / −16 |

Salida real de `npm run validate` (typecheck + tests + build):

```text
> piapc-guardia-sigilo@0.1.0 validate
> npm run typecheck && npm run test:run && npm run build

> piapc-guardia-sigilo@0.1.0 typecheck
> tsc --noEmit

> piapc-guardia-sigilo@0.1.0 test:run
> vitest run

 RUN  v4.1.10 C:/Users/USER/Desktop/mis trabajos/parcial_1_juego

 Test Files  7 passed (7)
      Tests  45 passed (45)
   Start at  14:49:44
   Duration  621ms

> piapc-guardia-sigilo@0.1.0 build
> tsc --noEmit && vite build
vite v6.4.3 building for production...
✓ 21 modules transformed.
dist/index.html                 1.23 kB │ gzip:   0.59 kB
dist/assets/index-BdusbQAW.css  1.53 kB │ gzip:   0.80 kB
dist/assets/index-CDEB4rkg.js   1,499.97 kB │ gzip: 346.02 kB
✓ built in 5.87s
```

Nota: el aviso de tamaño de chunk (`>500 kB`) es preexistente de Phaser y no forma parte de este upgrade.

## Build / ejecución

- Compilación de producción: OK (`vite build`, sin errores de tipos).
- Ejecución interactiva en navegador (`npm run dev`): **pendiente de verificación humana** — la evidencia automatizada no sustituye la revisión visual (plantilla `docs/plantillas/evidencia-pruebas.md`).

## Registro breve de la intervención

| Orden | Entrada relevante | Acción | Resultado observable |
|---:|---|---|---|
| 1 | Spec aprobada (recorte + color por razón + destello) | Lectura de `specs/01-producto.md`, `docs/arquitectura.md`, `docs/permisos-recomendados.md`, percepción y escena | Restricciones y símbolos identificados |
| 2 | Spec y plan del upgrade | Creación de `docs/upgrades/01-cono-vision/{spec,plan}.md` | Documentos creados |
| 3 | Recorte por oclusión | Nuevo `src/domain/perception/visionCone.ts` (`computeVisionCone`) | Polígono del cono en dominio puro |
| 4 | Coherencia con `evaluateVision` | Nuevo `tests/perception/visionCone.test.ts` (6 casos) | 45 tests en verde |
| 5 | Color por razón y destello | `GameScene.ts`: `VISION_FILL_COLORS`, detección de transición, `drawPerception(vision, time)` | Dibujo con polígono + traza de destello |
| 6 | Validación | `npm.cmd run validate` | typecheck + 45 tests + build OK |

## Diff

```text
 M src/game/scenes/GameScene.ts
?? docs/upgrades/
?? src/domain/perception/visionCone.ts
?? tests/perception/visionCone.test.ts

 src/game/scenes/GameScene.ts | 70 ++++++++++++++++++++++++++++++++++++++++++---
 1 file changed, 54 insertions(+), 16 deletions(-)
```

Resumen por archivo:

| Archivo | Cambio |
|---|---|
| `src/domain/perception/visionCone.ts` | Nuevo: `computeVisionCone()` valida la configuración (mismos mensajes que `evaluateVision`), devuelve `[]` si facing nulo, rango 0 u observador en celda bloqueada; muestrea rayos pares (16–240) dentro del FOV y recorta cada rayo con DDA de celdas y criterio conservador en esquinas análogo a `lineIsOccluded`. Sin imports de Phaser/DOM. |
| `tests/perception/visionCone.test.ts` | Nuevo: 6 tests — sector abierto completo, recorte en pared, coherencia con `evaluateVision` (`occluded` ⇒ rayo cortado antes del objetivo), esquina conservadora (misma geometría que `perception.test.ts:39`), geometría vacía, configuración inválida. |
| `src/game/scenes/GameScene.ts` | Modificado: `VISION_FILL_COLORS` por `VisionReason` (5 colores); campos `lastVisionVisible`/`visionFlashUntilMs` reiniciados en `create()`; transición visible↔no visible activa destello de 350 ms; `drawPerception(vision, time)` dibuja el polígono de `computeVisionCone` en vez del `arc()` completo. |
| `docs/upgrades/01-cono-vision/` | Nuevos: `spec.md`, `plan.md`, `evidencia.md`. |

Sin cambios: `perception.ts`, `memory.ts`, `perceptionSimulation.ts`, `labLevel.ts`, pruebas existentes, `package.json`.

## Matriz criterio → evidencia

| Criterio | Evidencia | Estado |
|---|---|---|
| 1. `npm run validate` pasa | Salida real: typecheck OK, 45/45 tests, build OK | Cumple |
| 2. Recorte en dominio con tests (abierto, pared, esquina, sin oclusión) | `visionCone.ts` en `src/domain/`; 6 tests en `tests/perception/visionCone.test.ts` | Cumple |
| 3. `occluded` ⇒ el cono no cruza la pared | Tests "stops the cone at a wall", "does not cross a wall that make evaluateVision report occluded" y "conservative corner rule" (ningún vértice supera la cara de la pared; esquina ≈ 7.07 sin entrar en la celda bloqueada) | Cumple (automatizado) |
| 4. Color propio por `VisionReason` | `VISION_FILL_COLORS` en `GameScene.ts:44-50` (5 colores distintos) | Cumple (código); verificación visual pendiente |
| 5. Destello exacto en transiciones visible↔no visible | Detección en `updatePerception` sólo al cambiar el booleano, `lastVisionVisible = null` en `create()` impide destello al arranque/reinicio | Cumple (código); verificación visual pendiente |
| 6. `VISION_RANGE`/`FIELD_OF_VIEW` sin cambios; pruebas existentes sin edición | Valores 220 y `Math.PI/2` intactos en `GameScene.ts:26-27`; `git diff` no toca `tests/` existentes ni `perception.ts` | Cumple |

## Decisión humana

- [ ] Aceptación visual en escena (`npm run dev`): recorte detrás de paredes, 5 colores distinguibles, destello al entrar/salir de visión, sin destello al recargar con `R`.
- [ ] Aprobación de este registro de evidencia.
- [ ] Autorización para commit (ningún commit creado).

Responsable: _____________  Fecha: _____________
