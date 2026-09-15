/**
 * E2E Test 1: Menu Browsing
 * Tests the AURA Landing Page menu section (hash-scroll navigation).
 * The "Menu" nav link scrolls to section id="menu" on /landing#menu.
 */

describe('Menu Browsing', () => {

  it('loads the home page (landing page) successfully', () => {
    cy.visit('/landing');
    cy.get('.aura-landing', { timeout: 10000 }).should('be.visible');
  });

  it('Menu nav link scrolls to the menu section', () => {
    cy.visit('/landing');
    // Click the "Live Menu" nav link
    cy.contains('Live Menu', { timeout: 8000 }).click({ force: true });
    // The URL should become /landing#menu
    cy.url().should('include', '#menu');
    // The menu section should be in the DOM
    cy.get('#menu', { timeout: 8000 }).should('exist');
  });

  it('menu section shows a dish name from the real database', () => {
    cy.visit('/landing');
    // Wait for the menu section to load DB data
    cy.get('#menu', { timeout: 10000 }).scrollIntoView();
    // The carousel dish name is rendered in a large heading inside #menu
    cy.get('#menu').within(() => {
      cy.get('h1, h2, h3, h4')
        .first()
        .invoke('text')
        .should('not.be.empty');
    });
  });

  it('clicking the "Cuisine" nav link scrolls to food gallery', () => {
    cy.visit('/landing');
    cy.contains('Cuisine', { timeout: 8000 }).click({ force: true });
    cy.url().should('include', '#culinary-art');
    cy.get('#culinary-art', { timeout: 8000 }).should('exist');
  });

});
