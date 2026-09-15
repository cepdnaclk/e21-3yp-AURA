/**
 * E2E Test 3: Waiter Call Button
 * The RobotUI page (/) has "Call Waiter" button (yellow, bg-yellow-500).
 * After clicking, a toast: "Waiter Called!" appears with text
 * "Staff member will assist you shortly".
 * This runs on the robot kiosk UI (no login needed).
 */

describe('Waiter Call Flow', () => {

  beforeEach(() => {
    // RobotUI runs on / and /robot — no login required
    cy.visit('/robot');
  });

  it('shows the Call Waiter button on the robot UI', () => {
    // Wait for the page to fully load with menu data
    cy.contains('Call Waiter', { timeout: 15000 }).should('be.visible');
  });

  it('clicking Call Waiter sends the request and shows a success toast', () => {
    cy.contains('Call Waiter', { timeout: 15000 }).click({ force: true });
    // Toast: "Waiter Called!" appears in fixed position
    cy.contains('Waiter Called!', { timeout: 10000 }).should('be.visible');
    // Sub-text also shows
    cy.contains('Staff member will assist you shortly', { timeout: 5000 }).should('be.visible');
  });

});
