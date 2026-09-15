import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "https://www.aurarestaurant.tech",
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
