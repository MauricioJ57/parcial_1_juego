---
id: upgrade-01-cono-vision
titulo: "Upgrade 01: Cono de visión"
tipo: upgrade-spec
audiencia: estudiante
acceso: publico
version: 1
---

# Spec — Upgrade 01: Cono de visión

- Intención de diseño: claridad de alcance y amenaza.
- Requisito: cono de visión visible y reactivo.

## Problema

El cono dibujado en `GameScene.drawPerception()` pinta siempre el sector completo de radio 220 y FOV 90° aunque `evaluateVision` haya determinado que la línea de visión está bloqueada por una pared. Además, el color sólo distingue "visible" frente al resto, y ningún elemento visual señala el instante en que se produce la transición de visibilidad.

## Objetivo

Que el cono dibujado represente la visibilidad real del guardia (recortado por paredes) y comunique de forma inmediata los cambios de percepción mediante color por razón y destello.

## Alcance

1. **Recorte por oclusión (dominio puro):** nueva función en `src/domain/perception/` que, con la misma entrada de `evaluateVision` (mapa, tileSize, observer, facing, range, FOV), devuelva la geometría visible del cono: lista de vértices del sector recortado por las paredes. Sin importar Phaser ni DOM. `evaluateVision` y sus razones no cambian.
2. **Color por razón (presentación):** color de relleno distinto por `VisionReason` (`visible`, `outside-cone`, `out-of-range`, `occluded`, `invalid-facing`) en `GameScene.drawPerception()`.
3. **Destello reactivo:** destello breve al producirse la transición `visible → no visible` y `no visible → visible`, detectado en la escena comparando el frame actual con el anterior. El dominio no interviene en la detección.
4. **Pruebas de dominio** en `tests/perception/` para la función de recorte.
5. **Constantes sin cambio:** `VISION_RANGE = 220` y `FIELD_OF_VIEW = Math.PI / 2` permanecen en `src/game/scenes/GameScene.ts` con los mismos valores.

## Fuera de alcance

- Cambiar rango, ángulo o balance del cono.
- Modificar `evaluateVision`, `VisionReason`, la memoria de percepción ni `perceptionSimulation`.
- Sonido, navegación, HUD de navegación, máquina de estados.
- Recursos externos, imágenes, audio, dependencias nuevas.
- Animaciones de sprite o partículas.

## Restricciones

- `src/domain/` sin Phaser/DOM; `src/game/` sólo presenta.
- TypeScript estricto; sin efectos laterales al importar dominio.
- Dibujo 100 % por código con los `Graphics` existentes (`perceptionGraphics`).
- `npm run validate` debe quedar en verde antes de cerrar.
- Editar sólo archivos de este upgrade; no instalar dependencias.

## Caso normal

Jugador dentro del cono y sin pared de por medio → el cono recortado alcanza al jugador, el color indica `visible` (verde) y al entrar/salir de visión se produce un destello perceptible.

## Casos límite

- Jugador detrás de una pared dentro del cono → el cono dibujado termina en la pared (`reason: "occluded"`).
- Jugador fuera de rango o fuera del ángulo → el recorte conserva el sector/rango real; color distinto por razón.
- Cono que toca una esquina de celda → criterio conservador de oclusión, coherente con `lineIsOccluded`.
- Facing cero o configuración inválida → sin geometría que dibujar; sin destello.
- Reinicio (`R`) o primer frame → sin destello falso por transición inicial.
- Objetivo en el límite exacto del ángulo → sigue siendo visible (consistente con `tests/perception/perception.test.ts`).

## Criterios de aceptación

1. `npm run validate` pasa (typecheck, tests, build).
2. La nueva función de recorte vive en dominio con tests en Node que cubren al menos: sector abierto, recorte por pared, esquina conservadora y caso sin oclusión.
3. Lo dibujado coincide con lo evaluado: si `evaluateVision` dice `occluded`, el cono pintado no cruza la pared.
4. Cada `VisionReason` tiene color propio y es distinguible en pantalla.
5. El destello ocurre exactamente en las transiciones visible↔no visible (no en cada frame ni en el arranque).
6. Sin cambios en `VISION_RANGE`/`FIELD_OF_VIEW`; las pruebas existentes siguen pasando sin edición.

## Evidencia prevista

- Salida real de `npm run validate` (comandos y resultado).
- Diff resumido por archivo.
- Matriz criterio → evidencia.
- Secuencia manual de verificación en la escena y decisión humana de aceptación registrada en `evidencia.md`.
