/**
 * Integrationspruefung der Huelle — gegen das gebaute Bundle.
 *
 * Nachgestellt wird die Lage auf der Zielseite: Rank Math meldet `core/link`
 * ab und mit einer eigenen Oberflaeche wieder an. Danach muss die Huelle
 * sitzen, und eine Aenderung durch diese fremde Oberflaeche darf den Titel
 * nicht mehr verlieren.
 */

const { readFileSync } = require( 'fs' );
const { join } = require( 'path' );
const React = require( 'react' );
const ReactDOM = require( 'react-dom/client' );
const richText = require( '@wordpress/rich-text' );
const data = require( '@wordpress/data' );
const i18n = require( '@wordpress/i18n' );
const element = require( '@wordpress/element' );

const BUNDLE = readFileSync( join( __dirname, '..', 'build', 'gutenberg.js' ), 'utf8' );

global.IS_REACT_ACT_ENVIRONMENT = true;

const LINK_ATTRIBUTE = {
	url: 'href',
	type: 'data-type',
	id: 'data-id',
	_id: 'id',
	target: 'target',
	rel: 'rel',
	class: 'class',
};

/** Die zuletzt gerenderte fremde Oberflaeche, damit der Test sie ausloesen kann. */
let fremdeOberflaeche = null;

/**
 * Eine fremde Linkbearbeitung, die sich verhaelt wie die von Rank Math:
 * Sie baut ihr Format neu auf und kennt nur ihre eigenen Felder.
 *
 * @param {Object} eigenschaften Eigenschaften der Formatbearbeitung.
 * @return {null} Nichts Sichtbares.
 */
function FremdesEdit( eigenschaften ) {
	fremdeOberflaeche = ( attribute, start, end ) => {
		eigenschaften.onChange(
			richText.applyFormat(
				eigenschaften.value,
				{ type: 'core/link', attributes: attribute },
				start,
				end
			)
		);
	};

	return null;
}

/**
 * Meldet `core/link` an — wahlweise mit der fremden Oberflaeche.
 *
 * @param {Function} edit Die Bearbeitungskomponente.
 */
function linkAnmelden( edit ) {
	richText.registerFormatType( 'core/link', {
		title: 'Link',
		tagName: 'a',
		className: null,
		attributes: LINK_ATTRIBUTE,
		edit,
	} );
}

/**
 * Laedt das gebaute Bundle mit echtem rich-text und echtem data.
 */
function bundleLaden() {
	window.ReactJSXRuntime = require( 'react/jsx-runtime' );
	window.wp = {
		element,
		i18n,
		data,
		richText,
		components: {
			Popover: ( p ) => React.createElement( 'div', null, p.children ),
			Button: ( p ) => React.createElement( 'button', { onClick: p.onClick }, p.children ),
			CheckboxControl: () => null,
			TextControl: () => null,
		},
		blockEditor: { RichTextToolbarButton: () => null },
	};

	// eslint-disable-next-line no-new-func
	new Function( BUNDLE )();
}

/**
 * Der aktuell angemeldete Typ.
 *
 * @return {Object} Die Einstellungen.
 */
function linkTyp() {
	return data.select( richText.store ).getFormatType( 'core/link' );
}

afterEach( () => {
	for ( const typ of data.select( richText.store ).getFormatTypes() ) {
		richText.unregisterFormatType( typ.name );
	}

	fremdeOberflaeche = null;
} );

describe( 'Huelle um die Linkbearbeitung', () => {
	it( 'legt sich um eine Linkbearbeitung, die vor dem Plugin da war', () => {
		linkAnmelden( FremdesEdit );
		bundleLaden();

		expect( linkTyp().edit ).not.toBe( FremdesEdit );
		expect( linkTyp().attributes ).toEqual( LINK_ATTRIBUTE );
		expect( linkTyp().tagName ).toBe( 'a' );
	} );

	it( 'legt sich auch um eine Bearbeitung, die erst nach dem Plugin anmeldet', () => {
		bundleLaden();
		linkAnmelden( FremdesEdit );

		// So macht es Rank Math: abmelden und mit eigener Fassung ersetzen.
		expect( linkTyp().edit ).not.toBe( FremdesEdit );
	} );

	it( 'rettet den Titel, wenn die fremde Oberflaeche ihn wegwirft', () => {
		linkAnmelden( FremdesEdit );
		bundleLaden();

		const Edit = linkTyp().edit;
		const wert = richText.create( {
			html: 'Ein <a href="https://b.test" title="Kurzinfo">Link</a> hier.',
		} );
		let ergebnis = null;

		const halter = document.createElement( 'div' );
		document.body.appendChild( halter );

		React.act( () => {
			ReactDOM.createRoot( halter ).render(
				React.createElement( Edit, {
					value: wert,
					onChange: ( w ) => {
						ergebnis = w;
					},
					isActive: true,
					activeAttributes: {},
					contentRef: { current: halter },
				} )
			);
		} );

		expect( typeof fremdeOberflaeche ).toBe( 'function' );

		React.act( () => {
			fremdeOberflaeche( { url: 'https://b.test', rel: 'nofollow' }, 4, 8 );
		} );

		const html = richText.toHTMLString( { value: ergebnis } );

		expect( html ).toContain( 'title="Kurzinfo"' );
		expect( html ).toContain( 'rel="nofollow"' );
		expect( html.match( /<a /g ) ).toHaveLength( 1 );
	} );

	it( 'kommt ohne angemeldete Linkbearbeitung klar', () => {
		expect( () => bundleLaden() ).not.toThrow();
		expect( linkTyp() ).toBeUndefined();
	} );
} );
