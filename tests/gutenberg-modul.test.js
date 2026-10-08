/**
 * Pruefungen am gebauten Block-Editor-Bundle.
 *
 * Gegen build/gutenberg.js und nicht gegen die Quelle: Der Fehler, der jeden
 * Absatz im Editor mit "In diesem Block ist ein Fehler aufgetreten" lahmlegte,
 * war ein Aufruf von `getFormatType` — eine Funktion, die
 * @wordpress/rich-text gar nicht exportiert. In der Quelle sah das harmlos
 * aus; erst beim Ausfuehren des Bundles mit den echten WordPress-Paketen
 * zeigt es sich.
 *
 * @wordpress/components und @wordpress/block-editor liegen nicht als Paket
 * vor (webpack behandelt sie als externe Globals). Sie werden hier
 * nachgebaut — so weit, dass sich die Oberflaeche tatsaechlich bedienen
 * laesst.
 */

const { readFileSync } = require( 'fs' );
const { join } = require( 'path' );
const React = require( 'react' );
const ReactDOM = require( 'react-dom/client' );
const richText = require( '@wordpress/rich-text' );
const i18n = require( '@wordpress/i18n' );
const element = require( '@wordpress/element' );
const data = require( '@wordpress/data' );

const BUNDLE = readFileSync( join( __dirname, '..', 'build', 'gutenberg.js' ), 'utf8' );

global.IS_REACT_ACT_ENVIRONMENT = true;

// Dieselbe Attributabbildung wie WordPress 7.1.2
// (wp-includes/js/dist/format-library.js). Ohne registriertes core/link
// erkennt rich-text ein <a> nicht als Linkformat.
beforeEach( () => {
	richText.registerFormatType( 'core/link', {
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

// Jeder Testfall laedt das Bundle neu; dabei meldet es Formate an und legt
// seine Huelle um `core/link`. Darum wird die Registrierung zwischen den
// Faellen vollstaendig geleert.
afterEach( () => {
	for ( const typ of data.select( richText.store ).getFormatTypes() ) {
		richText.unregisterFormatType( typ.name );
	}
} );

/** Werkzeugleisten-Schaltflaeche: merkt sich onClick und die Sperre. */
function werkzeugSchaltflaeche( props ) {
	return React.createElement( 'button', {
		type: 'button',
		'data-rolle': 'werkzeug',
		disabled: !! props.disabled,
		onClick: props.onClick,
	} );
}

function kontrollkaestchen( props ) {
	return React.createElement( 'input', {
		type: 'checkbox',
		'data-feld': props.label,
		checked: !! props.checked,
		onChange: ( e ) => props.onChange( e.target.checked ),
	} );
}

function textfeld( props ) {
	return React.createElement( 'input', {
		type: 'text',
		'data-feld': 'titel',
		value: props.value,
		onChange: ( e ) => props.onChange( e.target.value ),
	} );
}

function schaltflaeche( props ) {
	return React.createElement(
		'button',
		{ type: props.type || 'button', 'data-rolle': props.variant, onClick: props.onClick },
		props.children
	);
}

/**
 * Laedt das Bundle mit nachgebauter Umgebung.
 *
 * @return {Object} Die Einstellungen, mit denen sich das Format registriert hat.
 */
function bundleLaden() {
	window.ReactJSXRuntime = require( 'react/jsx-runtime' );
	window.wp = {
		element,
		i18n,
		data,
		richText,
		components: {
			Popover: ( props ) => React.createElement( 'div', { 'data-rolle': 'popover' }, props.children ),
			Button: schaltflaeche,
			CheckboxControl: kontrollkaestchen,
			TextControl: textfeld,
		},
		blockEditor: { RichTextToolbarButton: werkzeugSchaltflaeche },
	};

	// eslint-disable-next-line no-new-func
	new Function( BUNDLE )();

	return data.select( richText.store ).getFormatType( 'bft/link-attributes' );
}

/**
 * Baut einen rich-text-Wert aus HTML und setzt den Cursor.
 *
 * @param {string} html  Das Ausgangs-HTML.
 * @param {number} start Cursorposition.
 * @param {number} end   Ende der Auswahl.
 * @return {Object} rich-text-Wert.
 */
function wertMitCursor( html, start, end = start ) {
	const wert = richText.create( { html } );

	wert.start = start;
	wert.end = end;

	return wert;
}

/**
 * Rendert die edit-Komponente und gibt Zugriff auf das Ergebnis.
 *
 * @param {Object}   wert     rich-text-Wert.
 * @param {Function} onChange Wird vom Modul aufgerufen.
 * @return {Object} Hilfsmittel fuer den Test.
 */
function rendern( wert, onChange = () => {} ) {
	const Edit = bundleLaden().edit;

	const halter = document.createElement( 'div' );
	document.body.appendChild( halter );

	const inhalt = document.createElement( 'div' );
	inhalt.contentEditable = 'true';
	document.body.appendChild( inhalt );

	const fehler = [];

	class Grenze extends React.Component {
		constructor( eigenschaften ) {
			super( eigenschaften );
			this.state = { kaputt: false };
		}
		static getDerivedStateFromError() {
			return { kaputt: true };
		}
		componentDidCatch( e ) {
			fehler.push( e );
		}
		render() {
			return this.state.kaputt ? 'KAPUTT' : this.props.children;
		}
	}

	const wurzel = ReactDOM.createRoot( halter );

	React.act( () => {
		wurzel.render(
			React.createElement(
				Grenze,
				null,
				React.createElement( Edit, {
					value: wert,
					onChange,
					contentRef: { current: inhalt },
				} )
			)
		);
	} );

	return {
		fehler,
		halter,
		werkzeug: () => halter.querySelector( '[data-rolle="werkzeug"]' ),
		popover: () => halter.querySelector( '[data-rolle="popover"]' ),
		feld: ( name ) => halter.querySelector( `[data-feld="${ name }"]` ),
		knopf: ( rolle ) => halter.querySelector( `[data-rolle="${ rolle }"]` ),
		tun: ( rueckruf ) => React.act( rueckruf ),
	};
}

const LINK_HTML = 'Ein <a href="https://beispiel.test/?aff=12345&amp;cmp=sommer">Link</a> im Satz.';

describe( 'Block-Editor-Bundle', () => {
	it( 'registriert ein Format, das nie Markup erzeugt', () => {
		const einstellungen = bundleLaden();

		expect( einstellungen ).toBeTruthy();
		expect( einstellungen.tagName ).toBe( 'span' );
		expect( typeof einstellungen.edit ).toBe( 'function' );
	} );

	it( 'rendert im Link ohne Fehler — Regression zu getFormatType', () => {
		const { fehler, werkzeug } = rendern( wertMitCursor( LINK_HTML, 6 ) );

		expect( fehler ).toHaveLength( 0 );
		expect( werkzeug() ).not.toBeNull();
	} );

	it( 'zeigt ausserhalb eines Links keine Schaltflaeche', () => {
		const { fehler, werkzeug } = rendern( wertMitCursor( LINK_HTML, 1 ) );

		expect( fehler ).toHaveLength( 0 );
		expect( werkzeug() ).toBeNull();
	} );

	it( 'sperrt die Schaltflaeche, wenn die Auswahl zwei Links umfasst', () => {
		const html = '<a href="https://a.test">eins</a> und <a href="https://b.test">zwei</a>';
		const { fehler, werkzeug } = rendern( wertMitCursor( html, 0, 13 ) );

		expect( fehler ).toHaveLength( 0 );
		expect( werkzeug().disabled ).toBe( true );
	} );

	it( 'oeffnet das Popover erst auf Klick', () => {
		const h = rendern( wertMitCursor( LINK_HTML, 6 ) );

		expect( h.popover() ).toBeNull();

		h.tun( () => h.werkzeug().click() );

		expect( h.popover() ).not.toBeNull();
		expect( h.fehler ).toHaveLength( 0 );
	} );

	it( 'schreibt rel und title in den Link und laesst die Adresse in Ruhe', () => {
		let neuerWert = null;
		const h = rendern( wertMitCursor( LINK_HTML, 6 ), ( w ) => {
			neuerWert = w;
		} );

		h.tun( () => h.werkzeug().click() );
		h.tun( () => h.feld( 'Sponsored (Werbe-/Affiliate-Link)' ).click() );
		h.tun( () => {
			const feld = h.feld( 'titel' );

			Object.getOwnPropertyDescriptor(
				window.HTMLInputElement.prototype,
				'value'
			).set.call( feld, 'Kurzinfo' );
			feld.dispatchEvent( new window.Event( 'input', { bubbles: true } ) );
		} );
		h.tun( () => h.knopf( 'primary' ).click() );

		expect( h.fehler ).toHaveLength( 0 );
		expect( neuerWert ).not.toBeNull();

		const html = richText.toHTMLString( { value: neuerWert } );

		expect( html ).toContain( 'rel="sponsored"' );
		expect( html ).toContain( 'title="Kurzinfo"' );
		expect( html ).toContain( 'href="https://beispiel.test/?aff=12345&amp;cmp=sommer"' );
		expect( html.match( /<a /g ) ).toHaveLength( 1 );
	} );

	it( 'aendert nichts, wenn abgebrochen wird', () => {
		let gerufen = false;
		const h = rendern( wertMitCursor( LINK_HTML, 6 ), () => {
			gerufen = true;
		} );

		h.tun( () => h.werkzeug().click() );
		h.tun( () => h.feld( 'Nofollow' ).click() );
		h.tun( () => h.knopf( 'tertiary' ).click() );

		expect( gerufen ).toBe( false );
		expect( h.popover() ).toBeNull();
		expect( h.fehler ).toHaveLength( 0 );
	} );
} );
