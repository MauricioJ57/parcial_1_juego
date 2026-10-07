---
id: upgrade-03-patrulla-pausas-mirada
titulo: "Upgrade 03: Patrulla con pausas y mirada direccional"
tipo: upgrade-spec
audiencia: estudiante
acceso: publico
version: 1
---

# Spec — Upgrade 03: Patrulla con pausas y mirada direccional

- Intención de diseño: que la pelota enemiga se mueva continuamente por el mapa y que, por momentos, se detenga y mire hacia distintos lados antes de volver a patrullar.
- Requisito inicial: anticipación visual y ritmo del recorrido.

## Problema

La pelota enemiga (`guard`) sólo se desplaza cuando la persona hace clic en una celda: no tiene recorrido propio ni ritmo. Sin un patrón de patrulla no hay anticipación visual de hacia dónde irá ni pausas que muestren su atención, lo que reduce la legibilidad del guardia como agente.

## Objetivo

Dotar al guardia de una patrulla autónoma y reproducible entre puntos fijos del mapa, con pausas y miradas direccionales, manteniendo visibles la ruta A* y el HUD, sin modificar dominio, aplicación ni pruebas.

## Alcance

1. **Puntos de patrulla:** constante `PATROL_POINTS` (6 celdas transitables repartidas por el mapa) definida en `GameScene`.
2. **Selección del siguiente punto:** PRNG propio (`nextRandom`, mulberry32) con semilla fija `PATROL_SEED`; se elige un índice distinto del actual; misma secuencia en cada ejecución y tras `R`.
3. **Tramo de patrulla:** ruta A* (`calculateRoute(..., "astar")`) desde la celda del guardia al punto elegido; avance con `advanceAlongPath` a `GUARD_SPEED`.
4. **Pausa:** al completar el tramo, el guardia se detiene 1.4 s (`PATROL_PAUSE_DURATION_MS`).
5. **Mirada direccional:** durante la pausa se muestran 2 direcciones cardinales distintas elegidas por el PRNG, 0.7 s cada una (`PATROL_LOOK_DURATION_MS`), aplicadas a `guardFacing` (el cono las refleja).
6. **Reanudación:** al terminar la pausa se elige el siguiente punto y se recalcula la ruta.
7. **Clic reemplazado:** el guardia ya no se mueve con clic; la ruta A* y el marcador de destino muestran el objetivo de patrulla y el HUD sigue informando.
8. **Reinicio:** semilla, estado de patrulla, miradas y ruta se restauran en `create()`.
9. **Algoritmo fijo:** la patrulla usa A*; se retira el toggle BFS/A* (tecla Espacio).

## Fuera de alcance

- Máquina de estados H4, persecución, investigación autónoma o reacción de la patrulla a la percepción; los estados del Upgrade 02 se mantienen **independientes**.
- Cambios en `src/domain/`, `src/application/`, `memory`, `perception`, `perceptionSimulation`, `labLevel`, mapa o pruebas existentes.
- Pruebas automatizadas nuevas: la evidencia de comportamiento es manual (`npm run dev`).
- Arte, audio, física o colisión entre jugador y guardia; animaciones de producción.

## Restricciones

- La lógica de patrulla vive en `GameScene`; se reutiliza la navegación de dominio sin modificarla.
- Determinismo: PRNG sin dependencias, semilla fija, re-sembrado en `create()` (RF-09, reproducibilidad).
- Rutas siempre transitables (invariante del producto); A* nunca produce celdas bloqueadas.
- TypeScript estricto; `npm run validate` en verde; sin dependencias nuevas.

## Caso normal

El guardia va de un punto a otro siguiendo la ruta A*; al llegar se detiene 1.4 s, mira dos lados (0.7 s cada uno) y reanuda hacia el siguiente punto, repitiendo indefinidamente la misma secuencia en cada partida.

## Casos límite

- **Punto inaccesible (`unreachable`):** la ruta queda vacía, el avance se considera completo y el guardia pausa; al reanudar se elige otro punto. No hay bucle infinito de búsqueda.
- **Guardia ya en el punto objetivo:** avance completado de inmediato → pausa.
- **Las dos miradas son distintas entre sí** (segunda se desplaza si alcanza a la primera).
- **Reinicio `R`:** misma secuencia desde el inicio (semilla reseteada); sin movimiento ni mirada falsos en el primer cuadro.
- **Fronteras del mapa:** A* sólo produce celdas transitables; el guardia permanece dentro del mapa.
- **Jugador sobre el guardia:** no hay colisión; se documenta como exclusión.

## Criterios de aceptación

1. `npm run validate` pasa (typecheck, pruebas existentes y build).
2. El guardia patrulla solo, sin clic, entre los puntos de forma continua.
3. Cada parada dura ~1.4 s con exactamente 2 direcciones de mirada distintas.
4. La secuencia de puntos y miradas es idéntica en cada ejecución y tras `R`.
5. La ruta A*/marcador y el HUD siguen operativos; el clic ya no mueve al guardia.
6. Sin cambios en `src/domain/`, `src/application/` ni pruebas; sin dependencias nuevas.
7. Los estados del Upgrade 02 no se alteran.

## Evidencia prevista

- Salida real de `npm run validate` (comandos y resultado).
- Diff resumido por archivo.
- Secuencia determinista esperada derivada de `PATROL_SEED` (objetivos y miradas de las primeras paradas).
- Secuencia manual de verificación en la escena (`npm run dev`): patrulla → parada con 2 miradas → reanudación; `R` reinicia igual; clic sin efecto; ruta y HUD visibles.
- Matriz criterio → evidencia y decisión humana de aceptación registrada en `evidencia.md`.
