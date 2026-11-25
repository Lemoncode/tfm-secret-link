---
Status: completed
Topic: Front — theme del proyecto (variables CSS) y maquetación navegable del flujo de pasos, sin backend ni librerías de terceros
Date: 2026-11-25
---

# PRD: Front — theme y flujo de pasos navegable

Parent: #3 — the cut, and each part's decisions.

**Date**: 2026-11-25
**Mode**: co-creation (validación del handoff)
**Status**: completed

## Problem Statement

El front (`apps/front`, Vite + TypeScript, cero dependencias de ejecución) solo muestra hoy
un indicador de `/api/health`. Hay que darle el theme del proyecto y maquetar, navegable paso
a paso, el flujo completo de emisor y receptor, partiendo del handoff de Claude Design
(`/Users/brauliodiez/handoff/handoff`, fuera del repo: `design-system/`, `screens/`,
`docs/01-flujos.md`, `docs/02-pantallas.md`, `docs/05-implementacion.md`, `docs/07-pendientes.md`).
Sin backend ni criptografía: los eventos del servidor se simulan. Sin librerías de terceros en
el cliente (ni React ni Tailwind), por seguridad (spec §4.1, §9.3).

Al revisar el handoff, el requester corrigió el paso de verificación (PD1): el handoff, fiel a
la especificación §6.4, hace confirmar a los dos participantes.

## User Stories

1. Como emisor, quiero ver el código de verificación, escuchar cómo me lo dicta el receptor por teléfono o videollamada y confirmarlo, para enviar el secreto solo si coincide.
2. Como receptor, quiero ver el código para dictárselo al emisor y ver que espero su confirmación, sin un botón Continuar que no me corresponde.
3. Como usuario, quiero que la app se vea en claro u oscuro según mi sistema, o forzarlo, y que se recuerde.
4. Como desarrollador o revisor, quiero recorrer cada pantalla (camino feliz y errores) con una barra de demo, sin backend.
5. Como desarrollador del backend, quiero que la sesión hable con una interfaz de transporte sustituible por el WebSocket real sin tocar las pantallas.
6. Como responsable de seguridad, quiero que el cliente no cargue código de terceros y sea compatible con la CSP estricta del handoff (Trusted Types).

## Technical Decisions

- **PD1 — Verificación asimétrica**: el receptor ve el código y lo dicta al emisor por un canal independiente (teléfono, videollamada). Solo el emisor confirma («El código coincide» + Continuar). El receptor no tiene botón Continuar: ve un indicador de espera hasta que el emisor confirma, y conserva la opción de cancelar («Los códigos no coinciden» / salir). Consecuencia: la pantalla E07 («esperando confirmación del otro») desaparece para el emisor, que pasa de E06 a E08; R02 pasa a ser «dicta el código y espera». El emisor también ve el código y conserva «Los códigos no coinciden».
  - Looked: spec §6.4, puntos 2–4 («Cada usuario pulsa El código coincide»; «el servidor solo habilita la transferencia cuando los dos han confirmado») y `screens/R02-verificar.html` del handoff (checkbox `codigo-coincide` + botón `continuar` → R03). Esta decisión **modifica §6.4**: ver PD11.
  - Seguridad: si alguien se interpone, el emisor oye un código distinto del que ve y no envía nada; el secreto solo sale tras su confirmación.
- **PD2 — Tema claro y oscuro con selector** de tres estados: Claro / Oscuro / Sistema. «Sistema» = sin `data-theme` en `<html>` (sigue `prefers-color-scheme`).
  - Looked: el `design-system/tokens.css` del handoff define `:root,[data-theme="light"]`, `[data-theme="dark"]` y `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`: las dos paletas ya existen.
- **PD3 — La elección de tema se guarda en `localStorage`**, solo el valor `light`/`dark` (ausente = sistema). Si el almacenamiento falla (modo privado, bloqueado), se sigue al sistema sin error. Ningún otro dato va a almacenamiento del navegador — because no es un dato de sesión ni un secreto; la prohibición de la spec §3.1 y del handoff (`05-implementacion.md` §3) cubre claves, contenido y enlace.
- **PD5 — Transporte simulado + barra de demo**: la sesión depende de una interfaz de transporte; ahora la implementa un simulador en memoria, sustituible después por el WebSocket real sin tocar pantallas. Una barra de demo, solo en desarrollo y **excluida del build de producción**, dispara los eventos del servidor (entra el receptor, el emisor confirma, llega el secreto, caduca, cada error…) y elige el rol (emisor/receptor) — because el handoff (`01-flujos.md`, «el servidor manda») define las transiciones como eventos de servidor y sus botones «Simular» son solo de prototipo. La tabla de eventos de `01-flujos.md` es la referencia de nombres, ajustada por PD1 (sin `room.verified` esperando a los dos).
- **PD7 — Interacciones locales reales**: cuenta atrás funcionando con `expiresAt` simulado (estado crítico en el último minuto y caducada → X01), casilla que desbloquea Continuar, pestañas Pegar/Archivo, lectura de archivo (`file.size` antes de leer) y contador de bytes, ocultar/mostrar, copiar, descargar (Blob + `revokeObjectURL` inmediato), diálogo de finalizar con `showModal()`. Código de verificación y secreto recibido: datos de ejemplo. Sin criptografía ni backend. Las reglas de privacidad del handoff (`05-implementacion.md` §3: atributos de los campos secretos, nada en `document.title`, `wipe` al salir) se aplican ya.
- **PD11 — Se actualiza la especificación**: §3.5 y §6.4 de `doc/00-definicion-transferencia-segura-secretos .md` pasan a describir la verificación de PD1 (lee el receptor, confirma el emisor; el envío se habilita con la confirmación del emisor). Solo el `.md`; el PDF queda como histórico.
- **PD12 — Tests de DOM con happy-dom**, como devDependency de `apps/front` (no llega al navegador). Lo que happy-dom no implementa bien (`<dialog>.showModal()`) se comprueba a mano en el navegador.
  - Looked: `apps/front/vite.config.ts` → `test.environment: "node"`; `apps/front/package.json` sin entorno DOM.
- **PD13 — Se quita el indicador de salud de la interfaz**: `/` pasa a ser E01; `health.ts` y su test salen del front. El endpoint `/api/health` del back se mantiene.
  - Looked: `apps/front/index.html` y `src/main.ts` → hoy solo pintan el estado de `/api/health`.
- **PD14 — Tamaño máximo del contenido: 64 KB**, en una única constante configurable, usada por el contador de bytes, la validación de archivo (X09) y los textos `[TAMAÑO MÁXIMO]` del handoff — because un `.env` típico ocupa pocos KB y 64 KB cubre certificados con margen y limita el abuso de memoria. Provisional hasta que se fije con el backend (spec §11, §13.5).

## Cross-cutting decisions

- **PD4 — Multipágina + web components**: tres HTML reales como entradas de Vite (`/`, `/como-funciona`, `/s/`). Dentro de `/s/` un custom element de sesión monta el paso actual (un custom element por pantalla) según una máquina de estados; la URL no cambia entre pasos — because son las rutas propuestas por el handoff (`02-pantallas.md`, `07-pendientes.md` #8) y los pasos de sesión los dispara el servidor, no la URL. Recargar no recupera la sesión (spec §6.6.5).
- **PD6 — Alcance de pantallas: todas** — emisor (E01–E11 salvo E07), receptor (R01–R05) y errores/estados límite (X01–X11).
- **PD8 — Design system del handoff**: `tokens.css` y `components.css` se copian tal cual a `apps/front` como fuente del theme; iconos y logos a assets. Las utilidades de `secretlink.mjs` (countdown, wipe, byteCounter, verificationGate, hydrateIcons…) se portan a módulos TypeScript con tests. Nada de `prototype/` se copia — because el README del handoff marca `design-system/*` como «código de producción» y `prototype/*` como no.
- **PD9 — Web components en light DOM** (sin Shadow DOM), para heredar `components.css` y los tokens globales sin duplicar estilos.
- **PD10 — Marcado en `<template>`** dentro de cada página HTML, copiado de las maquetas del handoff; los componentes lo clonan (`template.content.cloneNode`) y rellenan con `textContent`. Sin `innerHTML` con cadenas — because la CSP del handoff (`05-implementacion.md` §2) incluye `require-trusted-types-for 'script'`.

## Out of Scope

- Backend, WebSocket real, Redis/Mongo, criptografía (ECDH, HKDF, AES-GCM, cálculo del código).
- Cabeceras HTTP y CSP en el servidor (el front solo debe ser compatible con ellas).
- Idiomas distintos del español.
- Versión invertida del logo para fondo oscuro (`07-pendientes.md` #6).

## Assumptions

- El handoff permanece disponible en `/Users/brauliodiez/handoff/handoff` mientras dure la tarea; los ficheros que se usen se copian al repo.
- Los nombres de eventos de `01-flujos.md` son una propuesta; el formato real de mensajes WebSocket (spec §13.2) se fijará con el backend.

## Next Steps

Planner → `write-plan` (`tasks.md`) → `plan-to-issue`.
