---
id: upgrade-02-animaciones-estado
titulo: "Upgrade 02: Animaciones por estado y transición"
tipo: upgrade-spec
audiencia: estudiante
acceso: publico
version: 1
---

# Spec — Upgrade 02: Animaciones por estado y transición

- Intención de diseño: que la pelota enemiga refleje de forma inmediata su estado de percepción, con una animación de sorpresa al detectar visualmente al jugador.
- Requisito inicial: representación coherente de la conducta.

## Problema

La pelota enemiga (`guard`, un `Phaser.GameObjects.Arc` de radio 11) se dibuja siempre con la misma forma, tamaño y color. La percepción ya revela lo que ocurre —ver al jugador, oírlo o conservarlo en memoria— pero la escena no lo representa sobre el propio enemigo: sólo cambia el color del cono y de la telemetría. No existe una animación que comunique el instante en que el enemigo detecta al jugador ni el estado de alerta o búsqueda.

## Intención de diseño

Que al entrar el jugador en el campo de visión de la pelota, el enemigo realice una animación de sorpresa (hacerse más grande por unos segundos) y que la pelota adopte representaciones distinguibles cuando oye un sonido o cuando busca una posición de memoria.

## Objetivo

Añadir animaciones de estado generadas por código en `GameScene`, derivadas de la percepción ya calculada (`frame.vision.visible`, `frame.soundHeard`, `frame.state.memory.lastKnownPosition`), sin alterar el dominio ni la lógica de conducta.

## Alcance

1. **Estado base (reposo):** escala 1.0 y color base `0x6b8afd`.
2. **Sorpresa (visión):** al pasar de no-ver a ver, la pelota crece hasta ~1.6x y vuelve suavemente en ~1.5 s. Sólo se dispara en la transición y se re-dispara al volver a entrar.
3. **Alerta (sonido):** mientras se oye un sonido y no hay visión, la pelota late en escala y toma tinte ámbar `0xe5b454`.
4. **Búsqueda (memoria sin visión):** mientras haya `memory.lastKnownPosition` y no haya visión ni sonido, la pelota toma tinte rojo `0xe16969`.
5. **Prioridad de estado:** visión > sonido > memoria > reposo, coherente con `perceptionSimulation`, que prioriza visión ante eventos simultáneos.
6. **Coexistencia:** se mantiene el destello del cono del Upgrade 01; ambos efectos son independientes.
7. **Reinicio:** los campos de animación se reinician en `create()` para no producir efectos falsos con `R` ni en el primer cuadro.

## Fuera de alcance

- Máquina de estados H4 (Patrullar, Investigar, Perseguir, Buscar, Regresar) y conducta autónoma.
- Modificar `evaluateVision`, `computeVisionCone`, `memory`, `perceptionSimulation`, `labLevel` o pruebas existentes.
- Telemetría nueva o cambios en el HUD.
- Arte, sprites, atlas, audio, partículas o dependencias nuevas.
- Pruebas automatizadas nuevas: este upgrade es de presentación y su evidencia de animación es manual (`npm run dev`).

## Restricciones

- La lógica de animación vive exclusivamente en `GameScene` (decisión confirmada); `src/domain/` y `src/application/` permanecen intactos.
- Presentación no decide comportamiento; sólo traduce percepción ya calculada a escala y color.
- TypeScript estricto; dibujo 100 % por código con el `Arc` existente.
- `npm run validate` debe quedar en verde antes de cerrar.
- Editar sólo archivos de este upgrade; no instalar dependencias.

## Caso normal

El jugador entra en el cono: la pelota crece hasta ~1.6x y vuelve en ~1.5 s; el cono colorea `visible` y destella. Al oír un sonido sin ver, la pelota late con tinte ámbar; si luego hay memoria sin percepción, toma tinte rojo.

## Casos límite

- Visión continua: la sorpresa no se repite ni late indefinidamente; al terminar el efecto la pelota vuelve a la escala base.
- Sonido y visión simultáneos: gana visión (sin alerta).
- Expira el sonido: vuelve a reposo o búsqueda; la memoria se conserva.
- Pérdida de visión con memoria: pasa a búsqueda; al perder la memoria vuelve a reposo.
- `invalid-facing`, `out-of-range`, `outside-cone` u `occluded`: no hay visión, por lo que no hay sorpresa.
- Primer cuadro y reinicio (`R`): `lastVisionVisible` inicia en `null` y `surpriseStartedAtMs` en `null`; sin animación falsa.
- El efecto de sorpresa se interrumpe si se pierde visión: `surpriseStartedAtMs` se limpia y la animación no queda colgada.

## Criterios de aceptación

1. `npm run validate` pasa (typecheck, pruebas existentes y build).
2. Entrar en visión produce crecimiento y retorno (~1.5 s); no se repite con visión continua.
3. Oír un sonido sin visión produce un latido con tinte ámbar distinguible y temporal.
4. Memoria sin visión produce tinte rojo; al perder memoria o reiniciar vuelve al color base.
5. Reinicio `R` y primer cuadro no disparan animaciones.
6. El destello del cono del Upgrade 01 sigue operativo.
7. Sin cambios en `src/domain/`, `src/application/` ni pruebas existentes; sin dependencias nuevas.

## Evidencia prevista

- Salida real de `npm run validate` (comandos y resultado).
- Diff resumido por archivo.
- Secuencia manual de verificación en la escena (`npm run dev`): reposo → sorpresa → búsqueda; `Q` → alerta; `R` → sin animación falsa.
- Matriz criterio → evidencia y decisión humana de aceptación registrada en `evidencia.md`.
