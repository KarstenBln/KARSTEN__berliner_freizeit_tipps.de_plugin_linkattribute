/**
 * Rundlauf-Tests gegen das echte @wordpress/rich-text.
 *
 * Das ist der wichtigste Test des Plugins. Er beantwortet die Kernfrage aus
 * Auftrag 9.1 nicht durch Behauptung, sondern durch Messung: Bleiben die
 * zusaetzlichen Attribute erhalten, wenn WordPress das HTML einliest, das
 * Format aendert und wieder ausgibt?
 *
 * Dafuer wird `core/link` mit genau der Attributabbildung registriert, die
 * WordPress 7.1.2 verwendet (wp-includes/js/dist/format-library.js). Damit
 * verhaelt sich die Bibliothek hier wie im Editor.
 */

import { create, toHTMLString, registerFormatType, unregisterFormatType } from '@wordpress/rich-text';

import { linkAmCursor } from '../src/gutenberg/link-bereich';
import { attributeAnwenden } from '../src/gutenberg/attribute-anwenden';

beforeAll( () => {
	registerFormatType( 'core/link', {
		title: 'Link',
		tagName: 'a',
		className: null,
		attributes: {
			url: 'href',
			type: 'data-type',
			id: 'data-id',
			_id: 'id',
			target: 'target',
			rel: 'rel',
			class: 'class',
		},
		edit: () => null,
	} );
} );

afterAll( () => {
	unregisterFormatType( 'core/link' );
} );

/**
 * Baut einen rich-text-Wert aus HTML und setzt den Cursor.
 *
 * @param {string} html  Ausgangs-HTML.
 * @param {number} start Cursorposition.
 * @param {number} [end] Ende der Auswahl, sonst zusammengeklappt.
 * @return {Object} rich-text-Wert.
 */
function wert( html, start, end = start ) {
	return { ...create( { html } ), start, end };
}

/**
 * Wendet Einstellungen auf den Link am Cursor an und gibt das HTML zurueck.
 *
 * @param {string} html      Ausgangs-HTML.
 * @param {number} cursor    Cursorposition.
 * @param {Object} eingaben  { sponsored, nofollow, titel }
 * @return {string} Ergebnis-HTML.
 */
function anwenden( html, cursor, eingaben ) {
	const value = wert( html, cursor );
	const bereich = linkAmCursor( value );

	expect( bereich ).not.toBeNull();
	expect( bereich.mehrdeutig ).toBeUndefined();

	return toHTMLString( {
		value: attributeAnwenden( { value, bereich, ...eingaben } ),
	} );
}

describe( 'Attribute setzen', () => {
	it( 'setzt sponsored', () => {
		const html = anwenden( '<a href="https://example.com/">Tickets</a>', 2, {
			sponsored: true,
			nofollow: false,
			titel: '',
		} );

		expect( html ).toContain( 'rel="sponsored"' );
		expect( html ).toContain( 'href="https://example.com/"' );
	} );

	it( 'setzt sponsored und nofollow gemeinsam', () => {
		const html = anwenden( '<a href="https://example.com/">Tickets</a>', 2, {
			sponsored: true,
			nofollow: true,
			titel: '',
		} );

		expect( html ).toContain( 'rel="sponsored nofollow"' );
	} );

	it( 'setzt einen Titel', () => {
		const html = anwenden( '<a href="https://example.com/">Tickets</a>', 2, {
			sponsored: false,
			nofollow: false,
			titel: 'Tickets buchen',
		} );

		expect( html ).toContain( 'title="Tickets buchen"' );
	} );

	it( 'erzeugt kein leeres title-Attribut', () => {
		const html = anwenden( '<a href="https://example.com/">Tickets</a>', 2, {
			sponsored: false,
			nofollow: false,
			titel: '   ',
		} );

		expect( html ).not.toContain( 'title=' );
	} );

	it( 'entfernt einen vorhandenen Titel wieder', () => {
		const html = anwenden( '<a href="https://example.com/" title="alt">Tickets</a>', 2, {
			sponsored: false,
			nofollow: false,
			titel: '',
		} );

		expect( html ).not.toContain( 'title=' );
		expect( html ).toContain( 'href="https://example.com/"' );
	} );
} );

describe( 'Vorhandene Attribute', () => {
	it( 'laesst noopener noreferrer stehen', () => {
		const html = anwenden(
			'<a href="https://example.com/" rel="noopener noreferrer" target="_blank">Tickets</a>',
			2,
			{ sponsored: true, nofollow: false, titel: '' }
		);

		expect( html ).toContain( 'rel="noopener noreferrer sponsored"' );
		expect( html ).toContain( 'target="_blank"' );
	} );

	it( 'entfernt nur sponsored und laesst den Rest in Ruhe', () => {
		const html = anwenden(
			'<a href="https://example.com/" rel="noopener noreferrer sponsored">Tickets</a>',
			2,
			{ sponsored: false, nofollow: false, titel: '' }
		);

		expect( html ).toContain( 'rel="noopener noreferrer"' );
	} );

	it( 'entfernt das rel-Attribut vollstaendig, wenn nichts bleibt', () => {
		const html = anwenden( '<a href="https://example.com/" rel="sponsored">Tickets</a>', 2, {
			sponsored: false,
			nofollow: false,
			titel: '',
		} );

		expect( html ).not.toContain( 'rel=' );
	} );

	it( 'ruehrt eine Affiliate-Adresse mit Parametern nicht an', () => {
		const adresse = 'https://partner.example.com/?aff=12345&amp;cmp=sommer';
		const html = anwenden( `<a href="${ adresse }">Tickets</a>`, 2, {
			sponsored: true,
			nofollow: true,
			titel: '',
		} );

		expect( html ).toContain( 'aff=12345' );
		expect( html ).toContain( 'cmp=sommer' );
	} );

	it( 'behaelt class, id und data-Attribute', () => {
		const html = anwenden(
			'<a href="https://example.com/" class="btn" id="t1" data-rolle="kauf">Tickets</a>',
			2,
			{ sponsored: true, nofollow: false, titel: '' }
		);

		expect( html ).toContain( 'class="btn"' );
		expect( html ).toContain( 'id="t1"' );
		expect( html ).toContain( 'data-rolle="kauf"' );
	} );
} );

describe( 'Mehrere Links in einem Absatz', () => {
	const zwei =
		'<a href="https://a.example/">erster</a> Text <a href="https://b.example/">zweiter</a>';

	it( 'trifft nur den Link am Cursor', () => {
		const html = anwenden( zwei, 2, { sponsored: true, nofollow: false, titel: '' } );

		expect( html ).toContain( '<a href="https://a.example/" rel="sponsored">erster</a>' );
		expect( html ).toContain( '<a href="https://b.example/">zweiter</a>' );
	} );

	it( 'trifft auch den zweiten Link richtig', () => {
		const html = anwenden( zwei, 15, { sponsored: false, nofollow: true, titel: '' } );

		expect( html ).toContain( '<a href="https://a.example/">erster</a>' );
		expect( html ).toContain( '<a href="https://b.example/" rel="nofollow">zweiter</a>' );
	} );

	it( 'meldet eine Auswahl ueber mehrere Links als mehrdeutig', () => {
		const bereich = linkAmCursor( wert( zwei, 2, 20 ) );

		expect( bereich ).toEqual( { mehrdeutig: true } );
	} );

	it( 'unterscheidet zwei benachbarte Links mit derselben Adresse', () => {
		const gleich =
			'<a href="https://a.example/">eins</a> <a href="https://a.example/">zwei</a>';
		const html = anwenden( gleich, 1, { sponsored: true, nofollow: false, titel: '' } );

		expect( html ).toContain( '<a href="https://a.example/" rel="sponsored">eins</a>' );
		expect( html ).toContain( '<a href="https://a.example/">zwei</a>' );
	} );
} );

describe( 'Keine verschachtelten Links', () => {
	it( 'erzeugt nach mehrfachem Speichern genau ein a-Element', () => {
		let html = '<a href="https://example.com/">Tickets</a>';

		for ( let i = 0; i < 4; i++ ) {
			html = anwenden( html, 2, { sponsored: true, nofollow: true, titel: 'Buchen' } );
		}

		expect( html.match( /<a /g ) ).toHaveLength( 1 );
		expect( html.match( /<\/a>/g ) ).toHaveLength( 1 );
		expect( html ).toContain( 'rel="sponsored nofollow"' );
		expect( html ).toContain( 'title="Buchen"' );
	} );

	it( 'bleibt beim wiederholten Speichern unveraendert', () => {
		const einmal = anwenden( '<a href="https://example.com/">T</a>', 0, {
			sponsored: true,
			nofollow: false,
			titel: 'Hinweis',
		} );
		const zweimal = anwenden( einmal, 0, {
			sponsored: true,
			nofollow: false,
			titel: 'Hinweis',
		} );

		expect( zweimal ).toBe( einmal );
	} );
} );

describe( 'Zusammenspiel mit anderen Formaten', () => {
	it( 'laesst Fettschrift innerhalb des Links unberuehrt', () => {
		const html = anwenden( '<a href="https://example.com/">Ti<strong>ck</strong>ets</a>', 1, {
			sponsored: true,
			nofollow: false,
			titel: '',
		} );

		expect( html ).toContain( '<strong>ck</strong>' );
		expect( html.match( /<a /g ) ).toHaveLength( 1 );
	} );

	it( 'laesst Text ausserhalb des Links unberuehrt', () => {
		const html = anwenden( 'davor <a href="https://example.com/">Link</a> danach', 8, {
			sponsored: true,
			nofollow: false,
			titel: '',
		} );

		expect( html ).toContain( 'davor ' );
		expect( html ).toContain( ' danach' );
	} );
} );

describe( 'Sicherheit', () => {
	it( 'kodiert Anfuehrungszeichen im Titel', () => {
		const html = anwenden( '<a href="https://example.com/">T</a>', 0, {
			sponsored: false,
			nofollow: false,
			titel: 'Er sagte "hallo"',
		} );

		expect( html ).not.toContain( 'title="Er sagte "hallo""' );
		expect( html ).toContain( '&quot;' );
	} );

	it( 'kodiert spitze Klammern im Titel', () => {
		const html = anwenden( '<a href="https://example.com/">T</a>', 0, {
			sponsored: false,
			nofollow: false,
			titel: '<script>alert(1)</script>',
		} );

		expect( html ).not.toContain( '<script>' );
		expect( html.match( /<a /g ) ).toHaveLength( 1 );
	} );
} );

describe( 'Bearbeiten ohne aktives Plugin (Auftrag 9.2)', () => {
	/**
	 * Diese Tests benutzen bewusst KEINEN Code aus diesem Plugin. Sie bilden
	 * nach, was WordPress allein tut, wenn jemand einen Beitrag mit bereits
	 * gesetzten Attributen oeffnet und erneut speichert.
	 *
	 * Der Auftrag verlangt ausdruecklich, dass dazu nur etwas zugesagt wird,
	 * was auch gemessen wurde.
	 */
	const rundlauf = ( html ) => toHTMLString( { value: create( { html } ) } );

	it( 'behaelt ein title-Attribut', () => {
		const html = '<a href="https://example.com/" title="Hinweis">T</a>';

		expect( rundlauf( html ) ).toContain( 'title="Hinweis"' );
	} );

	it( 'behaelt rel="sponsored nofollow"', () => {
		const html = '<a href="https://example.com/" rel="sponsored nofollow">T</a>';

		expect( rundlauf( html ) ).toContain( 'rel="sponsored nofollow"' );
	} );

	it( 'behaelt title und rel gemeinsam, samt target', () => {
		const html =
			'<a href="https://example.com/" rel="sponsored nofollow noopener" target="_blank" title="Buchen">T</a>';
		const ergebnis = rundlauf( html );

		expect( ergebnis ).toContain( 'rel="sponsored nofollow noopener"' );
		expect( ergebnis ).toContain( 'target="_blank"' );
		expect( ergebnis ).toContain( 'title="Buchen"' );
	} );

	it( 'bleibt auch nach mehreren Durchlaeufen stabil', () => {
		let html = '<a href="https://example.com/" rel="sponsored" title="Buchen">T</a>';

		for ( let i = 0; i < 3; i++ ) {
			html = rundlauf( html );
		}

		expect( html ).toContain( 'rel="sponsored"' );
		expect( html ).toContain( 'title="Buchen"' );
		expect( html.match( /<a /g ) ).toHaveLength( 1 );
	} );
} );
