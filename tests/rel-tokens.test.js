/**
 * Tests der rel-Token-Verarbeitung.
 *
 * Deckt die Faelle aus Auftrag 4 und die Pruefpunkte 1 bis 12 aus 16.1 ab,
 * soweit sie ohne Editor pruefbar sind.
 */

import {
	relTokensLesen,
	relTokensSchreiben,
	hatRelToken,
	relTokenSchalten,
	relTokensSchalten,
} from '../src/shared/rel-tokens';

describe( 'relTokensLesen', () => {
	it( 'zerlegt an Leerzeichen', () => {
		expect( relTokensLesen( 'noopener noreferrer' ) ).toEqual( [ 'noopener', 'noreferrer' ] );
	} );

	it( 'vertraegt mehrfache Trenner und Zeilenumbrueche', () => {
		expect( relTokensLesen( '  noopener \n\t noreferrer  ' ) ).toEqual( [
			'noopener',
			'noreferrer',
		] );
	} );

	it( 'entfernt Doppelungen und behaelt das erste Vorkommen', () => {
		expect( relTokensLesen( 'ugc noopener ugc' ) ).toEqual( [ 'ugc', 'noopener' ] );
	} );

	it( 'gibt bei fehlendem Wert eine leere Liste zurueck', () => {
		expect( relTokensLesen( undefined ) ).toEqual( [] );
		expect( relTokensLesen( null ) ).toEqual( [] );
		expect( relTokensLesen( '' ) ).toEqual( [] );
		expect( relTokensLesen( '   ' ) ).toEqual( [] );
	} );
} );

describe( 'relTokensSchreiben', () => {
	it( 'fuegt mit einfachem Leerzeichen zusammen', () => {
		expect( relTokensSchreiben( [ 'a', 'b' ] ) ).toBe( 'a b' );
	} );

	it( 'gibt undefined zurueck, wenn nichts uebrig ist', () => {
		expect( relTokensSchreiben( [] ) ).toBeUndefined();
	} );
} );

describe( 'hatRelToken', () => {
	it( 'findet ein vorhandenes Token', () => {
		expect( hatRelToken( 'noopener sponsored', 'sponsored' ) ).toBe( true );
	} );

	it( 'meldet ein fehlendes Token', () => {
		expect( hatRelToken( 'noopener', 'sponsored' ) ).toBe( false );
	} );

	it( 'trifft nicht auf Teilzeichenketten zu', () => {
		expect( hatRelToken( 'nofollowme', 'nofollow' ) ).toBe( false );
		expect( hatRelToken( 'unsponsored', 'sponsored' ) ).toBe( false );
	} );
} );

describe( 'relTokenSchalten', () => {
	it( 'haengt ein neues Token hinten an', () => {
		expect( relTokenSchalten( 'noopener', 'sponsored', true ) ).toBe( 'noopener sponsored' );
	} );

	it( 'legt das Attribut an, wenn es noch keines gab', () => {
		expect( relTokenSchalten( undefined, 'nofollow', true ) ).toBe( 'nofollow' );
	} );

	it( 'entfernt ein Token und laesst den Rest in Ruhe', () => {
		// Beispiel aus dem Auftrag, Abschnitt 4.
		expect( relTokenSchalten( 'noopener noreferrer sponsored', 'sponsored', false ) ).toBe(
			'noopener noreferrer'
		);
	} );

	it( 'entfernt das Attribut, wenn nichts uebrig bleibt', () => {
		expect( relTokenSchalten( 'sponsored', 'sponsored', false ) ).toBeUndefined();
	} );

	it( 'fuegt nichts doppelt hinzu', () => {
		expect( relTokenSchalten( 'sponsored', 'sponsored', true ) ).toBe( 'sponsored' );
	} );

	it( 'bleibt unveraendert, wenn ein fehlendes Token entfernt werden soll', () => {
		expect( relTokenSchalten( 'noopener', 'sponsored', false ) ).toBe( 'noopener' );
	} );

	it( 'ist mehrfach anwendbar, ohne sich zu veraendern', () => {
		const einmal = relTokenSchalten( 'ugc', 'sponsored', true );
		const zweimal = relTokenSchalten( einmal, 'sponsored', true );

		expect( zweimal ).toBe( einmal );
	} );
} );

describe( 'relTokensSchalten', () => {
	it( 'setzt beide Tokens in einem Durchgang', () => {
		// Beispiel aus dem Auftrag, Abschnitt 4.
		expect( relTokensSchalten( 'ugc noopener', { sponsored: true, nofollow: true } ) ).toBe(
			'ugc noopener sponsored nofollow'
		);
	} );

	it( 'behaelt noopener noreferrer bei', () => {
		expect(
			relTokensSchalten( 'noopener noreferrer', { sponsored: true, nofollow: false } )
		).toBe( 'noopener noreferrer sponsored' );
	} );

	it( 'entfernt beide und laesst fremde Tokens stehen', () => {
		expect(
			relTokensSchalten( 'sponsored ugc nofollow', { sponsored: false, nofollow: false } )
		).toBe( 'ugc' );
	} );

	it( 'entfernt das Attribut, wenn danach nichts mehr da ist', () => {
		expect(
			relTokensSchalten( 'sponsored nofollow', { sponsored: false, nofollow: false } )
		).toBeUndefined();
	} );

	it( 'behaelt die Reihenfolge der vorhandenen Tokens', () => {
		expect(
			relTokensSchalten( 'zuerst danach', { sponsored: true, nofollow: true } )
		).toBe( 'zuerst danach sponsored nofollow' );
	} );

	it( 'liefert bei wiederholtem Speichern dasselbe Ergebnis', () => {
		const schalter = { sponsored: true, nofollow: false };
		const erst = relTokensSchalten( 'noopener', schalter );
		const nochmal = relTokensSchalten( erst, schalter );

		expect( nochmal ).toBe( erst );
	} );
} );
