// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Custom command to login
 * @example cy.login('admin@test.com', 'password123')
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

/**
 * Custom command to switch language
 * @example cy.switchLanguage('ar')
 */
Cypress.Commands.add('switchLanguage', (lang) => {
  cy.get('[data-testid="language-switcher"]').click();
  cy.get(`[data-testid="lang-${lang}"]`).click();
});

/**
 * Custom command to check if element is visible
 * with proper waiting
 * @example cy.isVisible('[data-testid="button"]')
 */
Cypress.Commands.add('isVisible', (selector) => {
  cy.get(selector).should('be.visible');
});

/**
 * Custom command to check if element does not exist
 * @example cy.doesNotExist('[data-testid="button"]')
 */
Cypress.Commands.add('doesNotExist', (selector) => {
  cy.get(selector).should('not.exist');
});
