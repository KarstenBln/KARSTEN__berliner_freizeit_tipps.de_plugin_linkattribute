/**
 * Pruefungen am gebauten Classic-Bundle.
 *
 * Bewusst gegen build/classic.js und nicht gegen die Quelle: Der Fehler, der
 * dieses Modul im Browser unbenutzbar machte, entstand erst im Bundle
 * (webpack liess die Arrow Function stehen, TinyMCE ruft sie mit `new` auf).
 * Ein Test gegen die Quelle haette ihn nicht gesehen.
 */

const { readFileSync } = require( 'fs' );
const { join } = require( 'path' );

const BUNDLE = readFileSync( join( __dirname, '..', 'build', 'classic.js' ), 'utf8' );

/**
 * Laedt das Bundle mit einem nachgebauten TinyMCE und gibt zurueck, was es
 * angemeldet hat.
 */
function bundleLaden() {
	const angemeldet = {};

	// Je nach Testumgebung gibt es schon ein `window` (jsdom). Dann wird es
	// ergaenzt, nicht ersetzt — sonst liest das Bundle weiter das echte.
	if ( ! global.window ) {
		global.window = {};
	}

	global.window.wp = { i18n: { __: ( text ) => text } };
	global.window.tinymce = {
		PluginManager: {
			add( id, fabrik ) {
				angemeldet.id = id;
				angemeldet.fabrik = fabrik;
			},
		},
	};

	// eslint-disable-next-line no-new-func
	new Function( BUNDLE )();

	return angemeldet;
}

/**
 * Ein Link, der sich wie ein DOM-Element verhaelt, soweit das Modul es braucht.
 */
function linkAttrappe( attribute = {} ) {
	const werte = { ...attribute };

	return {
		werte,
		getAttribute: ( name ) => ( name in werte ? werte[ name ] : null ),
	};
}

/**
 * Ein Editor, der mitschreibt, was das Modul tut.
 */
function editorAttrappe( link ) {
	const protokoll = { gesetzt: [], transaktionen: 0, nodeChanged: 0, dialoge: [] };
	let schaltflaeche = null;
	const lauscher = {};

	const editor = {
		protokoll,
		selection: { getNode: () => ( link ? 'knoten' : null ) },
		dom: {
			getParent: () => link,
			setAttrib( element, name, wert ) {
				protokoll.gesetzt.push( [ name, wert ] );

				if ( null === wert ) {
					delete element.werte[ name ];
				} else {
					element.werte[ name ] = wert;
				}
			},
		},
		undoManager: {
			transact( rueckruf ) {
				protokoll.transaktionen++;
				rueckruf();
			},
		},
		windowManager: {
			open( einstellungen ) {
				protokoll.dialoge.push( einstellungen );
			},
		},
		nodeChanged() {
			protokoll.nodeChanged++;
		},
		addButton( name, einstellungen ) {
			schaltflaeche = { name, einstellungen };
		},
		on( ereignis, rueckruf ) {
			lauscher[ ereignis ] = rueckruf;
		},
		getSchaltflaeche: () => schaltflaeche,
		getLauscher: ( ereignis ) => lauscher[ ereignis ],
	};

	return editor;
}

describe( 'Classic-Bundle', () => {
	it( 'meldet sich unter dem Namen an, den PHP an TinyMCE uebergibt', () => {
		expect( bundleLaden().id ).toBe( 'bftlinkattrs' );
	} );

	it( 'laesst sich mit new instanziieren — so ruft TinyMCE externe Plugins auf', () => {
		const { fabrik } = bundleLaden();
		const editor = editorAttrappe( null );

		// Regression: eine Arrow Function hat keinen [[Construct]]-Slot und
		// TinyMCE meldete "Failed to initialize plugin: bftlinkattrs".
		expect( () => new fabrik( editor, 'http://beispiel.test', null ) ).not.toThrow();
	} );

	it( 'meldet die Schaltflaeche an und haelt sie zunaechst gesperrt', () => {
		const { fabrik } = bundleLaden();
		const editor = editorAttrappe( null );

		new fabrik( editor, '', null );

		const taste = editor.getSchaltflaeche();

		expect( taste.name ).toBe( 'bftlinkattrs' );
		expect( taste.einstellungen.disabled ).toBe( true );
		expect( typeof taste.einstellungen.onclick ).toBe( 'function' );
	} );

	it( 'gibt die Schaltflaeche frei, sobald der Cursor in einem Link steht', () => {
		const { fabrik } = bundleLaden();
		const link = linkAttrappe( { href: 'https://beispiel.test' } );
		const editor = editorAttrappe( link );

		new fabrik( editor, '', null );

		const zustaende = [];
		const taste = editor.getSchaltflaeche();

		taste.einstellungen.onPostRender.call( { disabled: ( wert ) => zustaende.push( wert ) } );
		editor.getLauscher( 'NodeChange' )();

		expect( zustaende ).toEqual( [ false ] );
	} );

	it( 'sperrt die Schaltflaeche ohne Link', () => {
		const { fabrik } = bundleLaden();
		const editor = editorAttrappe( null );

		new fabrik( editor, '', null );

		const zustaende = [];
		const taste = editor.getSchaltflaeche();

		taste.einstellungen.onPostRender.call( { disabled: ( wert ) => zustaende.push( wert ) } );
		editor.getLauscher( 'NodeChange' )();

		expect( zustaende ).toEqual( [ true ] );
	} );

	it( 'oeffnet keinen Dialog, wenn kein Link da ist', () => {
		const { fabrik } = bundleLaden();
		const editor = editorAttrappe( null );

		new fabrik( editor, '', null );
		editor.getSchaltflaeche().einstellungen.onclick();

		expect( editor.protokoll.dialoge ).toHaveLength( 0 );
	} );

	it( 'belegt den Dialog mit dem Bestand des Links vor', () => {
		const { fabrik } = bundleLaden();
		const link = linkAttrappe( { rel: 'noopener sponsored', title: 'Kurzinfo' } );
		const editor = editorAttrappe( link );

		new fabrik( editor, '', null );
		editor.getSchaltflaeche().einstellungen.onclick();

		const felder = editor.protokoll.dialoge[ 0 ].body;

		expect( felder.find( ( f ) => 'sponsored' === f.name ).checked ).toBe( true );
		expect( felder.find( ( f ) => 'nofollow' === f.name ).checked ).toBe( false );
		expect( felder.find( ( f ) => 'titel' === f.name ).value ).toBe( 'Kurzinfo' );
	} );

	it( 'schreibt rel und title und laesst fremde Tokens stehen', () => {
		const { fabrik } = bundleLaden();
		const link = linkAttrappe( { rel: 'noopener noreferrer' } );
		const editor = editorAttrappe( link );

		new fabrik( editor, '', null );
		editor.getSchaltflaeche().einstellungen.onclick();
		editor.protokoll.dialoge[ 0 ].onsubmit( {
			data: { sponsored: true, nofollow: true, titel: '  Aussicht  ' },
		} );

		expect( link.werte.rel ).toBe( 'noopener noreferrer sponsored nofollow' );
		expect( link.werte.title ).toBe( 'Aussicht' );
		expect( editor.protokoll.transaktionen ).toBe( 1 );
		expect( editor.protokoll.nodeChanged ).toBe( 1 );
	} );

	it( 'entfernt die Attribute, statt sie leer zu hinterlassen', () => {
		const { fabrik } = bundleLaden();
		const link = linkAttrappe( { rel: 'sponsored', title: 'weg damit' } );
		const editor = editorAttrappe( link );

		new fabrik( editor, '', null );
		editor.getSchaltflaeche().einstellungen.onclick();
		editor.protokoll.dialoge[ 0 ].onsubmit( {
			data: { sponsored: false, nofollow: false, titel: '   ' },
		} );

		expect( editor.protokoll.gesetzt ).toEqual( [
			[ 'rel', null ],
			[ 'title', null ],
		] );
		expect( link.werte.rel ).toBeUndefined();
		expect( link.werte.title ).toBeUndefined();
	} );

	it( 'fasst eine Aenderung in genau einen Rueckgaengig-Schritt', () => {
		const { fabrik } = bundleLaden();
		const link = linkAttrappe( {} );
		const editor = editorAttrappe( link );

		new fabrik( editor, '', null );
		editor.getSchaltflaeche().einstellungen.onclick();
		editor.protokoll.dialoge[ 0 ].onsubmit( { data: { sponsored: true, titel: '' } } );

		expect( editor.protokoll.transaktionen ).toBe( 1 );
	} );
} );
