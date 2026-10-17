// @ts-check
// Pruebas end-to-end: navegador -> frontend (index.html) -> backend Socket.IO -> una-lib -> navegador.
const { test, expect } = require('@playwright/test');

// medios de prueba publicos y estables
const IMAGEN = 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Example.jpg';
const VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const SCRIPT = "<script>alert('Inyección de script');</script>";

// escribe el nombre y el mensaje en el formulario del chat y lo envia
async function enviarMensaje(page, mensaje) {
  await page.getByRole('textbox', { name: 'Username' }).fill('Playwright');
  await page.getByRole('textbox', { name: 'Escriba un mensaje' }).fill(mensaje);
  await page.getByRole('button', { name: 'Send' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Chat Socket.IO UNA');
});

test('muestra una URL de imagen y la imagen termina de cargar', async ({ page }) => {
  await enviarMensaje(page, IMAGEN);

  const mensaje = page.getByRole('listitem').filter({ hasText: 'Playwright' }).last();
  const imagen = mensaje.getByRole('img', { name: 'imagen' });

  await expect(imagen).toBeVisible();
  await expect(imagen).toHaveAttribute('src', IMAGEN);
  // la imagen termino de cargar y tiene contenido real
  await expect
    .poll(() => imagen.evaluate((img) => img.complete && img.naturalWidth > 0), { timeout: 15000 })
    .toBe(true);
});

test('muestra una URL de video con reproductor y carga el contenido', async ({ page }) => {
  await enviarMensaje(page, VIDEO);

  const mensaje = page.getByRole('listitem').filter({ hasText: 'Playwright' }).last();
  const video = mensaje.locator('video');

  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute('src', VIDEO);
  await expect(video).toHaveAttribute('controls', '');
  // el navegador ya cargo los metadatos del video (duracion conocida)
  await expect
    .poll(() => video.evaluate((v) => v.readyState >= 1 && v.duration > 0), { timeout: 15000 })
    .toBe(true);
});

test('bloquea el script del paso 2: no hay alert y se muestra como texto', async ({ page }) => {
  // registrar el listener antes del envio: si aparece un dialogo la prueba falla
  const dialogos = [];
  page.on('dialog', async (dialog) => {
    dialogos.push(dialog.message());
    await dialog.dismiss();
  });

  await enviarMensaje(page, SCRIPT);

  const mensaje = page.getByRole('listitem').filter({ hasText: SCRIPT });
  // el script llega saneado: se ve como texto literal en el chat
  await expect(mensaje).toBeVisible();
  await expect(mensaje).toContainText(SCRIPT);
  // no se inserto ninguna etiqueta <script> en la lista de mensajes
  await expect(page.locator('#messages script')).toHaveCount(0);

  // dar tiempo a que un posible alert se dispare
  await page.waitForTimeout(1000);
  expect(dialogos, 'no debe aparecer ningun alert').toEqual([]);
});
