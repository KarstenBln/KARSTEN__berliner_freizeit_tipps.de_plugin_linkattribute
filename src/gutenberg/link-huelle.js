/**
 * Die vorhandene Linkbearbeitung umhuellen.
 *
 * Das Format `core/link` bleibt, wer es ist — samt seiner Oberflaeche. Wir
 * melden es nur neu an und schieben eine duenne Schicht vor sein `onChange`,
 * die verlorene Attribute zurueckholt (siehe attribute-retten.js). Die
 * Bedienung, das Aussehen und saemtliche Felder bleiben unveraendert; wer
 * `core/link` ersetzt hat — Rank Math etwa —, behaelt seine Fassung.
 *
 * Warum neu anmelden und nicht filtern: Fuer Formate gibt es keinen Filter.
 * Ab- und wieder anmelden ist der einzige Weg, an das `edit` heranzukommen.
 * Die Einstellungen holen wir dafuer aus dem oeffentlichen Store
 * (`select( store ).getFormatType`), nicht aus einer internen Funktion.
 *
 * Warum ein Abonnement und kein einmaliger Aufruf: Wer zuletzt anmeldet,
 * gewinnt. Rank Math meldet `core/link` in `wp.domReady` neu an — je nach
 * Reihenfolge der Skripte vor oder nach uns. Das Abonnement bemerkt jede
 * spaetere Anmeldung und legt die Huelle erneut an.
 */

import { registerFormatType, unregisterFormatType, store as richTextStore } from '@wordpress/rich-text';
import { select, subscribe } from '@wordpress/data';
import { createElement } from '@wordpress/element';

import { attributeRetten } from './attribute-retten';

const LINK = 'core/link';

/**
 * Kennzeichen an der Huelle.
 *
 * Wird das Bundle zweimal geladen — zwei Installationen, ein vergessener
 * zweiter Aufruf —, gaebe es zwei verschiedene `Huelle`-Funktionen. Ohne
 * gemeinsames Kennzeichen wuerde jede die jeweils andere fuer eine fremde
 * Oberflaeche halten und sie umhuellen, immer wieder: `RangeError: Maximum
 * call stack size exceeded`. Das Kennzeichen erkennt jede Instanz an jeder
 * anderen.
 */
const KENNZEICHEN = 'bftLinkHuelle';

/**
 * Das umhuellte `edit` der jeweils aktuellen Anmeldung.
 *
 * @type {Function|null}
 */
let original = null;

/**
 * Die Huelle selbst.
 *
 * Sie reicht alle Eigenschaften unveraendert durch und ersetzt allein
 * `onChange`.
 *
 * @param {Object} eigenschaften Die Eigenschaften der Formatbearbeitung.
 * @return {Object|null} Das Ergebnis der urspruenglichen Bearbeitung.
 */
function Huelle( eigenschaften ) {
	const Original = original;

	if ( 'function' !== typeof Original ) {
		return null;
	}

	const vorher = eigenschaften.value;

	return createElement( Original, {
		...eigenschaften,
		onChange: ( nachher ) => eigenschaften.onChange( attributeRetten( vorher, nachher ) ),
	} );
}

Huelle[ KENNZEICHEN ] = true;

/**
 * Legt die Huelle an, falls sie fehlt.
 */
function pruefen() {
	let typ;

	try {
		typ = select( richTextStore ).getFormatType( LINK );
	} catch ( fehler ) {
		return;
	}

	if ( ! typ || 'function' !== typeof typ.edit || true === typ.edit[ KENNZEICHEN ] ) {
		return;
	}

	original = typ.edit;

	// `name` steckt in den Einstellungen aus dem Store, `registerFormatType`
	// setzt ihn selbst — er muss hier heraus.
	const { name, ...einstellungen } = typ;

	try {
		unregisterFormatType( LINK );
		registerFormatType( LINK, { ...einstellungen, edit: Huelle } );
	} catch ( fehler ) {
		// Schlaegt es fehl, bleibt die Linkbearbeitung so, wie sie war. Ein
		// verlorener Titel ist aergerlich, ein kaputter Editor waere schlimmer.
		// eslint-disable-next-line no-console
		console.warn( 'BFT Advanced Link Attributes:', fehler );
	}
}

/**
 * Startet die Ueberwachung.
 */
export function huelleAnlegen() {
	if ( 'function' !== typeof subscribe || 'function' !== typeof select ) {
		return;
	}

	pruefen();
	subscribe( pruefen, richTextStore );
}
