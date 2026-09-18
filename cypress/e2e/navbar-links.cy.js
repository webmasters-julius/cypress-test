/**
 * navbar-links.cy.js
 *
 * Valida, para cada URL configurada en `pagesToTest`:
 *   1) Que el logo del navbar apunte a la home correcta.
 *   2) Que cada link del navbar exista, tenga el href correcto,
 *      y que al hacer click lleve realmente a la sección (anchor) esperada.
 *   3) Que cada botón/CTA de "Schedule a call" / "Contact us" etc.
 *      apunte al anchor del formulario y que, al hacer click, ese
 *      formulario esté presente y visible en el DOM.
 *
 * Cómo agregar más URLs:
 *   Simplemente sumá un nuevo objeto dentro de `pagesToTest` con la
 *   misma forma (url, logoHref, navLinks, ctaButtons). No hace falta
 *   tocar el resto del archivo.
 */

// ---------------------------------------------------------------------------
// DEBUG: pausa visual (en ms) después de cada click, para poder ver a ojo
// que efectivamente navegó/scrolleó a la sección correcta antes de que el
// test siga con el siguiente assert. Subilo si lo querés ver más lento.
//
// Se puede sobreescribir sin tocar este archivo, pasando --env al correr
// Cypress (así lo hacemos en CI para que corra rápido y sin pausas):
//   npx cypress run --env DEBUG_PAUSE_MS=0
// ---------------------------------------------------------------------------
const DEBUG_PAUSE_MS =
  Cypress.env('DEBUG_PAUSE_MS') !== undefined
    ? Number(Cypress.env('DEBUG_PAUSE_MS'))
    : 1500;

// ---------------------------------------------------------------------------
// CONFIGURACIÓN: agregá aquí cada landing page a testear
// ---------------------------------------------------------------------------
const pagesToTest = [
  {
    name: 'Nearshore Marketing Solutions',
    url: 'https://info.julius2grow.com/nearshore-marketing-solutions',
    logo: {
      href: 'https://www.julius2grow.com/home/',
    },
    navLinks: [
      { text: 'How it works', hash: '#how-it-works' },
      { text: 'Why JULIUS', hash: '#why-julius' },
      { text: 'Services', hash: '#hs_cos_wrapper_dnd_area-dnd_partial-5-module-2' },
      { text: 'FAQ', hash: '#faq' },
    ],
    ctaButtons: [
      { text: 'Schedule A Call', hash: '#hs_form_target_dnd_area-dnd_partial-8-module-4' },
      { text: 'Contact Us', hash: '#hs_form_target_dnd_area-dnd_partial-8-module-4' },
      { text: 'SCHEDULE A CALL', hash: '#hs_form_target_dnd_area-dnd_partial-8-module-4' },
      { text: 'Schedule a 30-Min Call', hash: '#hs_form_target_dnd_area-dnd_partial-8-module-4' },
    ],
    // Selector que identifica "hay un formulario real" dentro del anchor de destino.
    // HubSpot suele renderizar el form como <form> nativo o dentro de un <iframe>.
    formSelector: 'form, iframe',
  },

  // 👉 Sumá acá el resto de las URLs con la misma estructura cuando las tengas.
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Devuelve (como cadena de Cypress) el/los <a> visibles que contienen el
 * texto indicado. Se filtra por :visible porque muchas landings de HubSpot
 * duplican el navbar (versión desktop + versión mobile oculta con CSS).
 */
function getVisibleLinkByText(text) {
  return cy
    .contains('a', text, { matchCase: false })
    .parents('body')
    .find('a')
    .contains(text)
    .filter(':visible')
    .should('have.length.at.least', 1)
    .first();
}

/**
 * Verifica que un link tenga el href esperado (contiene el hash/anchor)
 * y que, al hacer click, la URL termine con ese hash y el elemento
 * destino exista y esté presente en el DOM.
 */
function assertLinkNavigatesToSection(text, expectedHash) {
  it(`el link "${text}" del navbar apunta y navega a "${expectedHash}"`, () => {
    getVisibleLinkByText(text)
      .should('have.attr', 'href')
      .and('include', expectedHash);

    getVisibleLinkByText(text).click({ force: true });

    // Pausa visual para poder ver, a ojo, adónde te llevó el click.
    if (DEBUG_PAUSE_MS > 0) cy.wait(DEBUG_PAUSE_MS);

    cy.location('hash', { timeout: 10000 }).should('eq', expectedHash);

    cy.get(expectedHash, { timeout: 10000 })
      .should('exist')
      .scrollIntoView()
      .should('be.visible');

    // Otra pausa una vez confirmado el scroll, para que se vea bien asentado.
    if (DEBUG_PAUSE_MS > 0) cy.wait(DEBUG_PAUSE_MS);
  });
}

/**
 * Verifica que un botón/CTA apunte al anchor del formulario y que,
 * al hacer click, el formulario efectivamente esté presente (y visible)
 * dentro de esa sección.
 */
function assertButtonNavigatesToForm(text, expectedHash, formSelector) {
  it(`el botón "${text}" lleva al formulario en "${expectedHash}"`, () => {
    getVisibleLinkByText(text)
      .should('have.attr', 'href')
      .and('include', expectedHash);

    getVisibleLinkByText(text).click({ force: true });

    // Pausa visual para poder ver, a ojo, adónde te llevó el click.
    if (DEBUG_PAUSE_MS > 0) cy.wait(DEBUG_PAUSE_MS);

    cy.location('hash', { timeout: 10000 }).should('eq', expectedHash);

    cy.get(expectedHash, { timeout: 10000 })
      .should('exist')
      .scrollIntoView();

    // Confirma que dentro de la sección de destino hay un formulario real
    // (form nativo o iframe embebido, típico de HubSpot forms).
    cy.get(expectedHash)
      .find(formSelector, { timeout: 15000 })
      .should('exist')
      .and('be.visible');

    // Pausa extra con el formulario ya visible en pantalla.
    if (DEBUG_PAUSE_MS > 0) cy.wait(DEBUG_PAUSE_MS);
  });
}

// ---------------------------------------------------------------------------
// SUITE
// ---------------------------------------------------------------------------

pagesToTest.forEach((page) => {
  describe(`Navbar y CTAs — ${page.name} (${page.url})`, () => {
    beforeEach(() => {
      cy.viewport(1280, 900); // fuerza layout desktop (nav visible, no hamburger)
      cy.visit(page.url);
    });

    it('el logo del navbar apunta a la home correcta', () => {
      cy.get('a')
        .filter(':visible')
        .filter((_, el) => el.querySelector('img, svg') !== null)
        .first()
        .should('have.attr', 'href')
        .and('include', page.logo.href);
    });

    describe('Links del navbar', () => {
      page.navLinks.forEach(({ text, hash }) => {
        assertLinkNavigatesToSection(text, hash);
      });
    });

    describe('Botones / CTAs hacia el formulario', () => {
      page.ctaButtons.forEach(({ text, hash }) => {
        assertButtonNavigatesToForm(text, hash, page.formSelector);
      });
    });
  });
});