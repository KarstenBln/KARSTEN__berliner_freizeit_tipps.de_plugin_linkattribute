/**
 * Classic-/Freeform-Modul (TinyMCE).
 *
 * Bewusst unabhaengig vom Block-Editor-Modul (Auftrag 10.3): keine gemeinsame
 * Laufzeit, kein React, keine Editor-Komponenten. Geteilt wird einzig die
 * reine Token-Logik aus ../shared/rel-tokens. Faellt dieses Modul aus, laeuft
 * die RichText-Integration unveraendert weiter — und umgekehrt.
 *
 * WordPress 7.1.2 liefert TinyMCE 4.9.11 aus. Verwendet wird daher die
 * dokumentierte Schnittstelle dieser Reihe: `PluginManager.add`,
 * `editor.addButton` und `editor.windowManager.open`. Es wird kein fremder
 * Code veraendert und keine fremde Editorinstanz angefasst — das Plugin wird
 * von PHP gezielt fuer den Inhaltseditor registriert.
 */

import { __ } from '@wordpress/i18n';

import { relTokensSchalten, hatRelToken } from '../shared/rel-tokens';

const PLUGIN = 'bftlinkattrs';

/**
 * Sucht das <a>-Element, in dem der Cursor steht.
 *
 * @param {Object} editor TinyMCE-Editor.
 * @return {HTMLElement|null} Das Linkelement oder null.
 */
function linkAmCursor( editor ) {
	const knoten = editor.selection.getNode();

	return editor.dom.getParent( knoten, 'a[href]' );
}

/**
 * Setzt ein Attribut oder entfernt es, wenn der Wert leer ist.
 *
 * TinyMCE entfernt ein Attribut, wenn man null uebergibt. Das ist genau das
 * gewuenschte Verhalten: kein zurueckbleibendes rel="" oder title=""
 * (Auftrag 3.3 und 4).
 *
 * @param {Object}      editor  TinyMCE-Editor.
 * @param {HTMLElement} element Zielelement.
 * @param {string}      name    Attributname.
 * @param {string|undefined} wert Neuer Wert.
 */
function attributSetzen( editor, element, name, wert ) {
	editor.dom.setAttrib( element, name, wert && '' !== wert ? wert : null );
}

/**
 * Oeffnet den Dialog fuer den uebergebenen Link.
 *
 * @param {Object}      editor TinyMCE-Editor.
 * @param {HTMLElement} link   Das Linkelement.
 */
function dialogOeffnen( editor, link ) {
	const rel = link.getAttribute( 'rel' ) || '';
	const titel = link.getAttribute( 'title' ) || '';

	editor.windowManager.open( {
		title: __( 'Linkattribute', 'bft-advanced-link-attributes' ),
		body: [
			{
				type: 'checkbox',
				name: 'sponsored',
				label: __( 'Sponsored (Werbe-/Affiliate-Link)', 'bft-advanced-link-attributes' ),
				checked: hatRelToken( rel, 'sponsored' ),
			},
			{
				type: 'checkbox',
				name: 'nofollow',
				label: __( 'Nofollow', 'bft-advanced-link-attributes' ),
				checked: hatRelToken( rel, 'nofollow' ),
			},
			{
				type: 'textbox',
				name: 'titel',
				label: __( 'Link-Titel (optional)', 'bft-advanced-link-attributes' ),
				value: titel,
			},
		],
		onsubmit( ereignis ) {
			const daten = ereignis.data;

			// Der Zustand vor der Aenderung kommt als eigener Schritt in die
			// Rueckgaengig-Liste, damit sich die Aenderung einzeln zuruecknehmen
			// laesst.
			editor.undoManager.transact( () => {
				attributSetzen(
					editor,
					link,
					'rel',
					relTokensSchalten( link.getAttribute( 'rel' ), {
						sponsored: !! daten.sponsored,
						nofollow: !! daten.nofollow,
					} )
				);

				attributSetzen( editor, link, 'title', ( daten.titel || '' ).trim() );
			} );

			editor.nodeChanged();
		},
	} );
}

/**
 * Registriert das TinyMCE-Plugin.
 *
 * Laeuft nichts von TinyMCE, passiert nichts — ein fehlendes `tinymce` ist
 * kein Fehlerfall, sondern der Normalzustand auf Seiten ohne Classic-Editor.
 */
function registrieren() {
	const tinymce = window.tinymce;

	if ( ! tinymce || ! tinymce.PluginManager ) {
		return;
	}

	// Bewusst eine gewoehnliche Funktion und keine Arrow Function: TinyMCE
	// instanziiert externe Plugins mit `new`
	// (tinymce.min.js: `var i = new r(t, o, t.$)` in der Plugin-Initialisierung).
	// Eine Arrow Function hat keinen [[Construct]]-Slot — der Aufruf wirft, und
	// TinyMCE meldet "Failed to initialize plugin".
	tinymce.PluginManager.add( PLUGIN, function ( editor ) {
		editor.addButton( PLUGIN, {
			title: __( 'Linkattribute', 'bft-advanced-link-attributes' ),
			// Kein Kettensymbol — das traegt in dieser Leiste schon "Link
			// einfuegen/aendern". Siehe die Begruendung in gutenberg/index.js.
			icon: 'dashicon dashicons-tag',
			disabled: true,

			onclick() {
				const link = linkAmCursor( editor );

				if ( link ) {
					dialogOeffnen( editor, link );
				}
			},

			onPostRender() {
				const schaltflaeche = this;

				// Die Schaltflaeche ist nur bedienbar, wenn der Cursor
				// tatsaechlich in einem Link steht (Auftrag 6.2).
				editor.on( 'NodeChange', () => {
					schaltflaeche.disabled( ! linkAmCursor( editor ) );
				} );
			},
		} );
	} );
}

registrieren();
