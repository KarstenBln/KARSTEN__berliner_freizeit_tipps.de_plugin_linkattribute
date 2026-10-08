/**
 * Pruefungen fuer das Zurueckholen verlorener Attribute.
 *
 * Nachgestellt wird dabei genau das, was die Linkbearbeitung tut: ein frisch
 * gebautes Format mit `applyFormat` ueber den Link legen. Die Vorlage dafuer
 * steht in wp-includes/js/dist/format-library.js (`createLinkFormat`) und in
 * der Ersatzfassung von Rank Math — beide bauen ihr Format allein aus den
 * eigenen Feldern.
 */

import { create, toHTMLString, applyFormat, registerFormatType, unregisterFormatType } from '@wordpress/rich-text';

import { attributeRetten } from '../src/gutenberg/attribute-retten';

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

afterAll( () => unregisterFormatType( 'core/link' ) );

/**
 * Baut einen Wert aus HTML.
 *
 * @param {string} html HTML.
 * @return {Object} rich-text-Wert.
 */
function wert( html ) {
	return create( { html } );
}

/**
 * Macht das, was die Linkbearbeitung macht.
 *
 * @param {Object} value      Ausgangswert.
 * @param {Object} attributes Die Felder, die die Oberflaeche kennt.
 * @param {number} start      Anfang des Links.
 * @param {number} end        Ende des Links.
 * @return {Object} Der neue Wert.
 */
function oberflaecheAendert( value, attributes, start, end ) {
	return applyFormat( value, { type: 'core/link', attributes }, start, end );
}

describe( 'attributeRetten', () => {
	it( 'holt den Titel zurueck, den die Oberflaeche weggeworfen hat', () => {
		const alt = wert( 'Ein <a href="https://b.test" title="Kurzinfo">Link</a> hier.' );
		const neu = oberflaecheAendert( alt, { url: 'https://b.test', rel: 'nofollow' }, 4, 8 );

		expect( toHTMLString( { value: neu } ) ).not.toContain( 'title=' );

		const gerettet = attributeRetten( alt, neu );
		const html = toHTMLString( { value: gerettet } );

		expect( html ).toContain( 'title="Kurzinfo"' );
		expect( html ).toContain( 'rel="nofollow"' );
		expect( html.match( /<a /g ) ).toHaveLength( 1 );
	} );

	it( 'laesst rel in Ruhe — darueber entscheidet die Oberflaeche', () => {
		const alt = wert( 'Ein <a href="https://b.test" rel="sponsored" title="X">Link</a> hier.' );
		const neu = oberflaecheAendert( alt, { url: 'https://b.test' }, 4, 8 );
		const html = toHTMLString( { value: attributeRetten( alt, neu ) } );

		expect( html ).toContain( 'title="X"' );
		expect( html ).not.toContain( 'rel=' );
	} );

	it( 'erfindet keinen Titel, wo nie einer war', () => {
		const alt = wert( 'Ein <a href="https://b.test">Link</a> hier.' );
		const neu = oberflaecheAendert( alt, { url: 'https://c.test' }, 4, 8 );

		expect( attributeRetten( alt, neu ) ).toBe( neu );
	} );

	it( 'ueberschreibt keinen Titel, den die Oberflaeche selbst gesetzt hat', () => {
		const alt = wert( 'Ein <a href="https://b.test" title="alt">Link</a> hier.' );
		const neu = oberflaecheAendert( alt, { url: 'https://b.test' }, 4, 8 );
		const mitEigenem = {
			...neu,
			formats: neu.formats.map( ( liste ) =>
				Array.isArray( liste )
					? liste.map( ( f ) =>
							'core/link' === f.type
								? { ...f, unregisteredAttributes: { title: 'neu' } }
								: f
					  )
					: liste
			),
		};

		// Die Formate liegen nun als getrennte Objekte vor; der Abschnitt
		// bleibt trotzdem derselbe Link, weil map() dieselbe Referenz je
		// Zeichen erzeugt — deshalb hier ueber das Ergebnis pruefen.
		const html = toHTMLString( { value: attributeRetten( alt, mitEigenem ) } );

		expect( html ).toContain( 'title="neu"' );
		expect( html ).not.toContain( 'title="alt"' );
	} );

	it( 'rettet nach dem Entfernen des Links nichts', () => {
		const alt = wert( 'Ein <a href="https://b.test" title="X">Link</a> hier.' );
		const neu = { ...alt, formats: alt.formats.map( () => undefined ) };
		const html = toHTMLString( { value: attributeRetten( alt, neu ) } );

		expect( html ).not.toContain( '<a ' );
	} );

	it( 'trifft bei zwei Links nur den richtigen', () => {
		const alt = wert(
			'<a href="https://a.test" title="erster">eins</a> und <a href="https://b.test" title="zweiter">zwei</a>'
		);
		const neu = oberflaecheAendert( alt, { url: 'https://a.test' }, 0, 4 );
		const html = toHTMLString( { value: attributeRetten( alt, neu ) } );

		expect( html ).toContain( 'title="erster"' );
		expect( html ).toContain( 'title="zweiter"' );
	} );

	it( 'bleibt untaetig, wenn die Zuordnung nicht eindeutig ist', () => {
		const alt = wert(
			'<a href="https://a.test" title="erster">eins</a><a href="https://b.test" title="zweiter">zwei</a>'
		);
		// Die Oberflaeche legt einen Link ueber beide alten Links.
		const neu = oberflaecheAendert( alt, { url: 'https://c.test' }, 0, 8 );
		const html = toHTMLString( { value: attributeRetten( alt, neu ) } );

		expect( html ).not.toContain( 'title=' );
	} );

	it( 'kommt mit fehlenden oder kaputten Werten klar', () => {
		expect( attributeRetten( null, null ) ).toBeNull();
		expect( attributeRetten( undefined, { formats: [] } ) ).toEqual( { formats: [] } );
		expect( attributeRetten( { formats: [] }, 'kein Wert' ) ).toBe( 'kein Wert' );
	} );
} );
