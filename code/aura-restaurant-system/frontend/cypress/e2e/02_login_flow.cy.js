/**
 * E2E Test 2: Staff Login Flow
 * The login page is shown when unauthenticated users hit /kitchen or /admin.
 * Input IDs: #login-username, #login-password, #login-submit
 * Error: red div with text-red-400 class
 */

describe('Staff Login Flow', () => {

  it('shows the login page with username and password inputs', () => {
    cy.visit('/kitchen');
    // Login page renders instead of the dashboard when not authenticated
    cy.get('#login-username', { timeout: 10000 }).should('be.visible');
    cy.get('#login-password').should('be.visible');
    cy.get('#login-submit').should('be.visible');
  });

  it('shows an error with wrong credentials', () => {
    cy.visit('/kitchen');
    cy.get('#login-username', { timeout: 8000 }).type('wrong_user_xyz');
    cy.get('#login-password').type('wrongpassword123');
    cy.get('#login-submit').click();
    // Error message div appears with red text
    cy.get('.text-red-400', { timeout: 8000 }).should('be.visible');
  });

  it('logs in successfully with admin credentials', () => {
    cy.visit('/admin');
    cy.get('#login-username', { timeout: 8000 }).type('testuser_integration');
    cy.get('#login-password').type('password123');
    cy.get('#login-submit').click();
    // After login should redirect away from login to a dashboard
    cy.url({ timeout: 10000 }).should('match', /\/(admin|kitchen|robot)/);
  });

});
