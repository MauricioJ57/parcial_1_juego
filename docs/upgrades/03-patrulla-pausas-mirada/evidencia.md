---
id: upgrade-03-patrulla-pausas-mirada-evidencia
titulo: "Evidencia — Upgrade 03: Patrulla con pausas y mirada direccional"
tipo: upgrade-evidencia
audiencia: estudiante
acceso: publico
version: 1
---

# Evidencia — Upgrade 03: Patrulla con pausas y mirada direccional

## Versión inicial / final

- Versión inicial: `f10b31b` ("se implemento el segundo spec"), árbol limpio.
- Versión final: cambios sin commit en árbol de trabajo (no se creó ningún commit: requiere autorización humana).
- Comandos ejecutados en Windows PowerShell con `npm.cmd` (la ejecución de `npm.ps1` está bloqueada por política de ejecución del sistema).

## Comandos y resultados

| Orden | Comando | Resultado |
|---:|---|---|
| 1 | `npm.cmd run validate` | **Pasa** (salida completa abajo) |
| 2 | `git status --short` | 1 modificado (ver Diff) |
| 3 | `git diff --stat` | `src/game/scenes/GameScene.ts`: +114 / −25 |

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
   Start at  23:49:46
   Duration  449ms

> piapc-guardia-sigilo@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.3 building for production...
✓ 21 modules transformed.
dist/index.html                 1.23 kB │ gzip:   0.59 kB
dist/assets/index-BdusbQAW.css  1.53 kB │ gzip:   0.80 kB
dist/assets/index-Bc86ZrRZ.js  1,501.77 kB │ gzip: 346.58 kB
✓ built in 6.50s
```

Nota: el aviso de tamaño de chunk (`>500 kB`) es preexistente de Phaser y no forma parte de este upgrade.

## Build / ejecución

- Compilación de producción: OK (`vite build`, sin errores de tipos).
- Ejecución interactiva en navegador (`npm run dev`): **pendiente de verificación humana** — la evidencia automatizada no sustituye la revisión visual (plantilla `docs/plantillas/evidencia-pruebas.md`). Este upgrade es de comportamiento y su evidencia es manual por decisión confirmada.

## Registro breve de la intervención

| Orden | Entrada relevante | Acción | Resultado observable |
|---:|---|---|---|
| 1 | Spec revisada (puntos+PRNG, solo `GameScene`, pausa 1.4 s/2 miradas, A* fijo, sin tests) | Lectura de `GameScene.ts`, navegación de dominio y `labLevel.ts` | Restricciones y símbolos identificados |
| 2 | Spec y plan del upgrade | Creación de `docs/upgrades/03-patrulla-pausas-mirada/{spec,plan}.md` | Documentos creados |
| 3 | Datos y PRNG | `PATROL_POINTS`, `CARDINAL_DIRECTIONS`, `PATROL_SEED`, `nextRandom()` | Patrulla determinista sin dependencias |
| 4 | Máquina de patrulla | `PatrolPhase`, `updatePatrol`, `beginPatrolPause`, `updatePatrolLook`, `finishPatrolPause` | Recorrido + pausa + 2 miradas |
| 5 | Retiro de control manual | Se quitan `handlePointerDown` y la tecla Espacio; `renderNavigation` usa A* fijo | El clic ya no mueve al guardia |
| 6 | Validación | `npm.cmd run validate` | typecheck + 45 tests + build OK |

## Diff

```text
 M src/game/scenes/GameScene.ts

 src/game/scenes/GameScene.ts | 139 +++++++++++++++++++++++++++++++++++--------
 1 file changed, 114 insertions(+), 25 deletions(-)
```

Resumen por archivo:

| Archivo | Cambio |
|---|---|
| `src/game/scenes/GameScene.ts` | Modificado: constantes de patrulla (`PATROL_POINTS` con 6 celdas, `CARDINAL_DIRECTIONS`, `PATROL_PAUSE_DURATION_MS = 1400`, `PATROL_LOOK_DURATION_MS = 700`, `PATROL_SEED = 0x9e3779b9`) y tipo `PatrolPhase`; PRNG determinista `nextRandom()` (mulberry32) re-sembrado en `create()`; `selectNextPatrolTarget` y `pickLookDirections`; `updatePatrol`/`beginPatrolPause`/`updatePatrolLook`/`finishPatrolPause`; se retira `handlePointerDown` y la tecla Espacio; `renderNavigation` usa A* fijo. Sin cambios en dominio ni aplicación. |
| `docs/upgrades/03-patrulla-pausas-mirada/` | Nuevos: `spec.md`, `plan.md`, `evidencia.md`. |

Sin cambios: `src/domain/**`, `src/application/**`, `perceptionSimulation.ts`, `labLevel.ts`, pruebas existentes, `package.json`, `index.html`.

## Comprobación de transitividad (lectura, sin dependencias nuevas)

BFS sobre `LAB_MAP` desde `GUARD_START` (`{27,17}`) hacia cada `PATROL_POINTS`:

```text
2,2    walkable reachable
27,2   walkable reachable
27,17  walkable reachable
2,17   walkable reachable
13,7   walkable reachable
13,13  walkable reachable
```

## Secuencia determinista esperada (derivada de `PATROL_SEED`)

Con `PATROL_SEED = 0x9e3779b9` y el orden de llamadas fijo (1 llamada en `create`; 2 por miradas + 1 por objetivo en cada parada), la secuencia esperada es:

| Tramo | Objetivo | Mirada 1 | Mirada 2 |
|---:|---|---|---|
| 1 | `{27,2}` | `{0,-1}` (arriba) | `{-1,0}` (izquierda) |
| 2 | `{13,13}` | `{0,-1}` (arriba) | `{1,0}` (derecha) |
| 3 | `{2,2}` | `{1,0}` (derecha) | `{0,1}` (abajo) |
| 4 | `{2,17}` | `{0,1}` (abajo) | `{0,-1}` (arriba) |
| 5 | `{13,13}` | — | — |

Esta tabla es reproducible con la misma semilla y debe repetirse idéntica tras `R`.

## Matriz criterio → evidencia

| Criterio | Evidencia | Estado |
|---|---|---|
| 1. `npm run validate` pasa | Salida real: typecheck OK, 45/45 tests, build OK | Cumple |
| 2. Patrulla sola, sin clic | `updatePatrol` reemplaza a `updateGuardMovement`; `handlePointerDown` y `listener` retirados | Cumple (código); verificación visual pendiente |
| 3. Parada ~1.4 s con 2 miradas distintas | `PATROL_PAUSE_DURATION_MS = 1400`; `pickLookDirections` garantiza índices distintos (`secondIndex` desplaza si colisiona) | Cumple (código); verificación visual pendiente |
| 4. Secuencia idéntica entre ejecuciones y tras `R` | `randomState = PATROL_SEED` en `create()`; secuencia determinista documentada arriba | Cumple |
| 5. Ruta A*/marcador y HUD operativos; clic sin efecto | `renderNavigation` sigue dibujando ruta, `targetMarker` y `navigationSummary`; sin listener de puntero | Cumple (código); verificación visual pendiente |
| 6. Sin cambios en dominio/aplicación/pruebas ni dependencias | `git status`: sólo `GameScene.ts`; `package.json` intacto | Cumple |
| 7. Estados del Upgrade 02 sin alterar | `updateGuardAnimation` y sus constantes no se modificaron | Cumple |

## Decisión humana

- [ ] Aceptación visual en escena (`npm run dev`): patrulla continua entre puntos; parada con 2 miradas; secuencia idéntica tras `R`; clic sin efecto; ruta y HUD visibles.
- [ ] Aprobación de este registro de evidencia.
- [ ] Autorización para commit (ningún commit creado).

Responsable: _____________  Fecha: _____________
