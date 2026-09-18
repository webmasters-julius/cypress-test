const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // No seteamos baseUrl porque cada test visita su URL completa
    // (son distintos subdominios: info.julius2grow.com, etc.)
    setupNodeEvents(on, config) {
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: false,
    defaultCommandTimeout: 10000,
    viewportWidth: 1280,
    viewportHeight: 900,
  },
});