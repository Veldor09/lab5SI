// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// URL real del frontend de UNA Chat (lo sirve el mismo backend con "npm start")
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: './tests/e2e',
  // el chat reenvia cada mensaje a todos los clientes: las pruebas corren una a la vez
  // para que los mensajes de una prueba no aparezcan en otra
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // si el servidor ya esta corriendo (npm start) se reutiliza; si no, Playwright lo inicia
  webServer: {
    command: 'npm start',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
