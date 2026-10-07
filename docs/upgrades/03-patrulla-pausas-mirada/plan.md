---
id: upgrade-03-patrulla-pausas-mirada-plan
titulo: "Plan — Upgrade 03: Patrulla con pausas y mirada direccional"
tipo: upgrade-plan
audiencia: estudiante
acceso: publico
version: 1
---

# Plan — Upgrade 03: Patrulla con pausas y mirada direccional

## Incrementos pequeños

1. **Datos y constantes de patrulla.** En `GameScene.ts`, definir `PATROL_POINTS` (6 celdas transitables), `CARDINAL_DIRECTIONS`, `PATROL_PAUSE_DURATION_MS`, `PATROL_LOOK_DURATION_MS` y `PATROL_SEED`.
2. **PRNG determinista.** Método `nextRandom()` (mulberry32) con estado `randomState` re-sembrado en `create()`, sin dependencias.
3. **Selección de objetivo.** `selectNextPatrolTarget(currentIndex)` excluye el punto actual y usa `nextRandom()`.
4. **Máquina de patrulla mínima.** Tipo `PatrolPhase` (`traveling` | `pausing`) y campos de pausa/mirada; `updatePatrol(time, delta)` reemplaza a `updateGuardMovement`.
5. **Pausa y mirada.** `beginPatrolPause`, `updatePatrolLook`, `finishPatrolPause`, `pickLookDirections`, `applyLookDirection`; 2 direcciones cardinales distintas, 0.7 s cada una.
6. **Retiro del control manual.** Quitar `handlePointerDown` y la tecla Espacio; `renderNavigation` usa A* fijo.
7. **Validación completa.** Ejecutar `npm run validate` y registrar la salida y la secuencia determinista en `evidencia.md`.

## Archivos previstos

| Archivo | Acción |
|---|---|
| `src/game/scenes/GameScene.ts` | modificar (constantes, PRNG, patrulla, retiro de clic/toggle, `renderNavigation`) |
| `docs/upgrades/03-patrulla-pausas-mirada/spec.md` | crear |
| `docs/upgrades/03-patrulla-pausas-mirada/plan.md` | crear |
| `docs/upgrades/03-patrulla-pausas-mirada/evidencia.md` | crear |

No se modifican: `src/domain/**`, `src/application/**`, pruebas existentes, `package.json`, `index.html`.

## Validación

- `npm run typecheck` → sin errores.
- `npm run test:run` → 45 pruebas existentes en verde (sin pruebas nuevas).
- `npm run build` → compilación de producción sin errores de tipos.
- `npm run validate` → los tres anteriores encadenados, sin interacción.
- Comprobación de transitividad (lectura, sin instalar nada): los 6 `PATROL_POINTS` son transitables y alcanzables desde `GUARD_START` por BFS sobre `LAB_MAP`.
- Verificación manual en `npm run dev`:
  1. El guardia inicia hacia `{27,2}` y patrulla solo.
  2. Al llegar, se detiene ~1.4 s y mira 2 direcciones distintas.
  3. Reanuda hacia el siguiente punto; el HUD y la ruta A* se actualizan.
  4. El clic ya no mueve al guardia.
  5. `R` reinicia la misma secuencia; sin animación ni movimiento falsos al arrancar.

## Riesgos

- **Punto inaccesible:** mitigado porque la ruta vacía se considera completa y se elige otro punto en la siguiente pausa; los 6 puntos fueron verificados alcanzables.
- **Reproducibilidad:** el orden de llamadas a `nextRandom()` (1 en `create`; 2 por miradas + 1 por objetivo en cada parada) es fijo; semilla reseteada en `create()`.
- **Corte de pausa por salto de tiempo:** el índice de mirada se calcula por tiempo transcurrido desde el inicio de la pausa, no por acumulación de cuadros.
- **Conflicto con el control manual:** se retira el clic y el toggle BFS/A* para evitar reglas mezcladas.
- **Interacción con el Upgrade 02:** la animación de estado sólo usa `guardFacing`, sonido y visión; no se toca su lógica.

## Condiciones para detenerse

- La spec admite interpretaciones con efectos distintos sobre puntos, ritmo o miradas.
- Una validación falla por una causa no comprendida.
- El cambio requiriese tocar dominio, aplicación, memoria o instalar dependencias.
- Aparecen cambios concurrentes que interfieran con la tarea.
