---
id: upgrade-02-animaciones-estado-evidencia
titulo: "Evidencia — Upgrade 02: Animaciones por estado y transición"
tipo: upgrade-evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Evidencia — Upgrade 02: Animaciones por estado y transición

## Versión inicial / final

- Versión inicial: `38adfa6` ("implementacion de upgrade 1"), árbol limpio.
- Versión final: cambios sin commit en árbol de trabajo (no se creó ningún commit: requiere autorización humana).
- Comandos ejecutados en Windows PowerShell con `npm.cmd` (la ejecución de `npm.ps1` está bloqueada por política de ejecución del sistema).

## Comandos y resultados

| Orden | Comando | Resultado |
|---:|---|---|
| 1 | `npm.cmd run validate` | **Pasa** (salida completa abajo) |
| 2 | `git status --short` | 1 modificado + 1 nuevo (ver Diff) |
| 3 | `git diff --stat` | `src/game/scenes/GameScene.ts`: +57 / −3 |

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
   Start at  23:22:20
   Duration  592ms

> piapc-guardia-sigilo@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.3 building for production...
✓ 21 modules transformed.
dist/index.html                 1.23 kB │ gzip:   0.59 kB
dist/assets/index-BdusbQAW.css  1.53 kB │ gzip:   0.80 kB
dist/assets/index-DY65mrdd.js  1,500.78 kB │ gzip: 346.30 kB
✓ built in 5.67s
```

Nota: el aviso de tamaño de chunk (`>500 kB`) es preexistente de Phaser y no forma parte de este upgrade.

## Build / ejecución

- Compilación de producción: OK (`vite build`, sin errores de tipos).
- Ejecución interactiva en navegador (`npm run dev`): **pendiente de verificación humana** — la evidencia automatizada no sustituye la revisión visual (plantilla `docs/plantillas/evidencia-pruebas.md`). Este upgrade es de presentación y su evidencia de animación es manual por decisión confirmada.

## Registro breve de la intervención

| Orden | Entrada relevante | Acción | Resultado observable |
|---:|---|---|---|
| 1 | Spec con estados Sorpresa + Alerta + Búsqueda, lógica en `GameScene`, sin tests nuevos | Lectura de `specs/01-producto.md`, `docs/arquitectura.md`, `GameScene.ts`, percepción y pruebas | Restricciones y símbolos identificados |
| 2 | Spec y plan del upgrade | Creación de `docs/upgrades/02-animaciones-estado/{spec,plan}.md` | Documentos creados |
| 3 | Constantes de animación y tipo de estado | `GameScene.ts`: `GUARD_*`, `SURPRISE_*`, `ALERT_*`, `GuardVisualState` | Constantes y tipo de presentación definidos |
| 4 | Detección de transición a visión | `updatePerception()`: `surpriseStartedAtMs` sólo en no-visible → visible | Disparo de sorpresa sin afectar el destello |
| 5 | Animación de estado | `updateGuardAnimation()`: crecimiento/retorno, latido ámbar, tinte rojo, reposo base | Pelota con escala y color por estado |
| 6 | Validación | `npm.cmd run validate` | typecheck + 45 tests + build OK |

## Diff

```text
 M src/game/scenes/GameScene.ts
?? docs/upgrades/02-animaciones-estado/

 src/game/scenes/GameScene.ts | 60 +++++++++++++++++++++++++++++++++++++++++---
 1 file changed, 57 insertions(+), 3 deletions(-)
```

Resumen por archivo:

| Archivo | Cambio |
|---|---|
| `src/game/scenes/GameScene.ts` | Modificado: constantes de animación y tipo `GuardVisualState`; campos `surpriseStartedAtMs` y `guardVisualState` reiniciados en `create()`; el color base del `guard` usa `GUARD_BASE_COLOR`; `updatePerception` dispara la sorpresa sólo en la transición no-visible → visible y limpia el disparo al perder visión; nuevo `updateGuardAnimation(time, soundHeard, visionVisible)` con crecimiento/retorno `sin(π·p)` en ~1.5 s, latido ámbar en alerta, tinte rojo en búsqueda y reposo base. Sin cambios en dominio ni aplicación. |
| `docs/upgrades/02-animaciones-estado/` | Nuevos: `spec.md`, `plan.md`, `evidencia.md`. |

Sin cambios: `src/domain/**`, `src/application/**`, `perceptionSimulation.ts`, `labLevel.ts`, pruebas existentes, `package.json`, `index.html`.

## Matriz criterio → evidencia

| Criterio | Evidencia | Estado |
|---|---|---|
| 1. `npm run validate` pasa | Salida real: typecheck OK, 45/45 tests, build OK | Cumple |
| 2. Visión produce crecimiento/retorno (~1.5 s); no se repite con visión continua | `updateGuardAnimation` con `SURPRISE_DURATION_MS = 1500` y `sin(π·p)`; disparo sólo en `lastVisionVisible === false` | Cumple (código); verificación visual pendiente |
| 3. Sonido sin visión: latido + tinte ámbar | Rama `!visionVisible && soundHeard`: `GUARD_ALERT_COLOR = 0xe5b454` y `ALERT_PULSE_PERIOD_MS = 300` | Cumple (código); verificación visual pendiente |
| 4. Memoria sin visión: tinte rojo; vuelve al base | Rama `!visionVisible && memory.lastKnownPosition !== null`: `GUARD_SEARCH_COLOR = 0xe16969`; reposo `GUARD_BASE_COLOR` | Cumple (código); verificación visual pendiente |
| 5. Reinicio y primer cuadro sin animación falsa | `lastVisionVisible` y `surpriseStartedAtMs` inician en `null` y se reinician en `create()`; disparo exige `lastVisionVisible === false` | Cumple |
| 6. Destello del cono del Upgrade 01 sigue operativo | `visionFlashUntilMs` y su traza en `drawPerception` intactos; única variable nueva es `visionVisible` | Cumple |
| 7. Sin cambios en dominio/aplicación/pruebas ni dependencias nuevas | `git diff --stat`: sólo `GameScene.ts`; `git status`: `src/domain`/`src/application`/`tests` sin cambios; `package.json` intacto | Cumple |

## Decisión humana

- [ ] Aceptación visual en escena (`npm run dev`): crecimiento y retorno en ~1.5 s sin repetición con visión continua; latido ámbar al oír sonido; tinte rojo en búsqueda; sin animación al recargar con `R`.
- [ ] Aprobación de este registro de evidencia.
- [ ] Autorización para commit (ningún commit creado).

Responsable: _____________  Fecha: _____________
