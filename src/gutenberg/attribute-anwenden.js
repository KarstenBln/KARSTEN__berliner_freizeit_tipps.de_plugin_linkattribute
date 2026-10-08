/**
 * Das geaenderte Link-Format zurueckschreiben.
 *
 * Bewusst getrennt von der Oberflaeche: Diese Datei haengt nur an
 * @wordpress/rich-text und ist dadurch ohne Editor und ohne React testbar.
 */

import { applyFormat } from '@wordpress/rich-text';

import { relTokensSchalten } from '../shared/rel-tokens';

/**
 * Baut das geaenderte Link-Format und schreibt es zurueck.
 *
 * Der Aufruf von `applyFormat` erfolgt mit zusammengeklapptem Bereich
 * (`start, start`). Der Core behandelt diesen Fall gesondert: Er ersetzt das
 * Format-Objekt an genau seiner Position im Formatstapel und dehnt die
 * Ersetzung ueber den gesamten zusammenhaengenden Link aus. Dadurch bleibt die
 * Verschachtelung mit anderen Formaten (fett, kursiv) unveraendert — anders als
 * beim Anwenden ueber einen Bereich, wo das Format neu einsortiert wuerde.
 *
 * Der `title` wandert nach `unregisteredAttributes`, weil das Link-Format des
 * Cores ihn nicht abbildet. rich-text schreibt solche Attribute beim
 * Serialisieren unveraendert zurueck — siehe die Begruendung in index.js.
 *
 * @param {Object}  parameter           Parameter.
 * @param {Object}  parameter.value     rich-text-Wert.
 * @param {Object}  parameter.bereich   Ergebnis von linkAmCursor().
 * @param {boolean} parameter.sponsored Gewuenschter Zustand.
 * @param {boolean} parameter.nofollow  Gewuenschter Zustand.
 * @param {string}  parameter.titel     Gewuenschter title-Wert.
 * @return {Object} Neuer rich-text-Wert.
 */
export function attributeAnwenden( { value, bereich, sponsored, nofollow, titel } ) {
	const { format, start } = bereich;

	const attribute = { ...( format.attributes || {} ) };
	const rel = relTokensSchalten( attribute.rel, { sponsored, nofollow } );

	if ( undefined === rel ) {
		delete attribute.rel;
	} else {
		attribute.rel = rel;
	}

	const sonstige = { ...( format.unregisteredAttributes || {} ) };
	const titelWert = ( titel || '' ).trim();

	if ( '' === titelWert ) {
		delete sonstige.title;
	} else {
		sonstige.title = titelWert;
	}

	const neu = { ...format, attributes: attribute };

	if ( Object.keys( sonstige ).length > 0 ) {
		neu.unregisteredAttributes = sonstige;
	} else {
		delete neu.unregisteredAttributes;
	}

	return applyFormat( value, neu, start, start );
}
