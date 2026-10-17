# Laboratorio 5 – Seguridad Informática 2026

Universidad Nacional, Sede Regional Chorotega – Campus Nicoya.

Proyecto **UNA Chat**: corrección de la vulnerabilidad de inyección de scripts (XSS),
soporte para URLs de imágenes y videos en el chat, y pruebas unitarias, de integración
y end-to-end (Playwright).

## Estructura

- `antes/` – código original (vulnerable) de UNA Chat, usado para la evidencia 1.
- `despues/` – UNA Chat corregido:
  - `libs/unalib.js` – `validarMensaje`: escapa HTML (nombre y texto), valida el color y
    convierte solo URLs http(s) de imágenes (`jpg`, `jpeg`, `png`, `gif`, `bmp`, `webp`) y
    videos (`mp4`, `webm`, `ogg`, YouTube) en `<img>`, `<video>` o `<iframe>`.
  - `server.js` – backend Express + Socket.IO que valida cada mensaje con una-lib.
  - `index.html` – frontend del chat.
  - `tests/unit/` – pruebas unitarias (Jest).
  - `tests/integration/` – pruebas de integración backend + una-lib (Jest, Supertest, socket.io-client).
  - `tests/e2e/` – pruebas end-to-end (Playwright).
- `evidencias/` – capturas de pantalla para la entrega.

## Ejecución

En Windows PowerShell, si `npm` está bloqueado por la política de ejecución, use `npm.cmd`.

```bash
cd despues
npm install
npx playwright install chromium
npm start                    # chat en http://localhost:3000
```

## Pruebas

```bash
npm test                     # unitarias
npm run test:integration     # integración (npx jest tests/integration --runInBand --env=node)
npm run test:e2e             # end-to-end (npx playwright test --project=chromium --headed)
npx playwright show-report   # reporte de Playwright
```

Las pruebas end-to-end usan `http://localhost:3000`: reutilizan el servidor si ya está
corriendo con `npm start`, o lo inician automáticamente.
