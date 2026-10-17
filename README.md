# Laboratorio 5 – Seguridad Informática 2026

Universidad Nacional, Sede Regional Chorotega – Campus Nicoya.

Proyecto **UNA Chat**: corrección de vulnerabilidades de inyección de scripts (XSS),
soporte para URLs de imágenes y videos en el chat, y pruebas unitarias, de integración
y end-to-end (Playwright).

## Estructura

- `antes/` – código original (vulnerable) del proyecto UNA Chat, para la evidencia 1.
- `despues/` – UNA Chat corregido: validación anti-XSS en una-lib e imágenes/videos por URL.
- `evidencias/` – capturas de pantalla (JPG) para la entrega.

## Ejecución

```bash
cd despues
npm install
npm start          # chat en http://localhost:3000
npm test           # pruebas unitarias (Jest)
```
