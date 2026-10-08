/**
 * Den Link unter dem Cursor finden.
 *
 * Ein Absatz kann mehrere Links enthalten (Auftrag 5.1). Jede Aenderung darf
 * nur den einen Link treffen, in dem der Cursor steht — die Nachbarn bleiben
 * unberuehrt. Dafuer muss der genaue Zeichenbereich dieses Links bekannt sein.
 *
 * Wie rich-text Formate ablegt: `value.formats` ist ein Array mit einem Eintrag
 * je Zeichen; jeder Eintrag ist eine Liste der an dieser Stelle aktiven
 * Formate. Ein zusammenhaengender Link teilt sich dabei **dasselbe
 * Format-Objekt** — die Eintraege zeigen auf die identische Referenz. Genau
 * daran erkennen wir, wo der Link anfaengt und aufhoert, und genau daran
 * unterscheiden wir zwei benachbarte Links voneinander, selbst wenn sie
 * dieselbe Adresse haben.
 */

const LINK = 'core/link';

/**
 * Liefert das Link-Format an einer Zeichenposition, falls vorhanden.
 *
 * @param {Array} formats value.formats
 * @param {number} index  Zeichenposition.
 * @return {Object|undefined} Das Format-Objekt oder undefined.
 */
function linkAn( formats, index ) {
	const liste = formats[ index ];

	if ( ! Array.isArray( liste ) ) {
		return undefined;
	}

	return liste.find( ( format ) => format && LINK === format.type );
}

/**
 * Ermittelt den Link am Cursor samt seinem Zeichenbereich.
 *
 * Rueckgabe:
 * - `null`                      kein Link an dieser Stelle
 * - `{ mehrdeutig: true }`      die Auswahl umfasst mehrere verschiedene Links
 * - `{ format, start, end }`    genau ein Link, mit seinem Bereich
 *
 * Der mehrdeutige Fall wird von der Oberflaeche abgefangen (Auftrag 6.2): Die
 * Schaltfleche bleibt dann abgeschaltet, statt stillschweigend mehrere Links
 * auf einmal zu veraendern.
 *
 * @param {Object} value rich-text-Wert.
 * @return {Object|null} Siehe oben.
 */
export function linkAmCursor( value ) {
	if ( ! value || ! Array.isArray( value.formats ) ) {
		return null;
	}

	const { formats, start, end } = value;

	if ( 'number' !== typeof start || 'number' !== typeof end ) {
		return null;
	}

	// Eine Auswahl ueber mehrere Zeichen: Alle beruehrten Links einsammeln.
	if ( end > start ) {
		const gefunden = [];

		for ( let i = start; i < end; i++ ) {
			const format = linkAn( formats, i );

			if ( format && ! gefunden.includes( format ) ) {
				gefunden.push( format );
			}
		}

		if ( 0 === gefunden.length ) {
			return null;
		}

		if ( gefunden.length > 1 ) {
			return { mehrdeutig: true };
		}

		return bereichUm( formats, gefunden[ 0 ], start );
	}

	// Zusammengeklappter Cursor: Er steht zwischen zwei Zeichen. Als "im Link"
	// gilt er, wenn das Zeichen davor UND das Zeichen danach zum selben Link
	// gehoeren — sonst steht er genau an der Kante und die Zuordnung waere
	// geraten.
	const davor = start > 0 ? linkAn( formats, start - 1 ) : undefined;
	const danach = linkAn( formats, start );

	if ( davor && davor === danach ) {
		return bereichUm( formats, davor, start );
	}

	// An der Kante: Wir nehmen den Link, der tatsaechlich vorhanden ist. Steht
	// der Cursor direkt hinter einem Link, ist das der Link davor.
	const kante = davor || danach;

	if ( ! kante ) {
		return null;
	}

	return bereichUm( formats, kante, davor ? start - 1 : start );
}

/**
 * Dehnt einen Treffer nach links und rechts aus, solange dasselbe
 * Format-Objekt anliegt.
 *
 * @param {Array}  formats value.formats
 * @param {Object} format  Das gesuchte Format-Objekt.
 * @param {number} anker   Eine Position, an der das Format sicher anliegt.
 * @return {Object} { format, start, end }
 */
function bereichUm( formats, format, anker ) {
	let start = anker;
	let end = anker + 1;

	while ( start > 0 && linkAn( formats, start - 1 ) === format ) {
		start--;
	}

	while ( end < formats.length && linkAn( formats, end ) === format ) {
		end++;
	}

	return { format, start, end };
}
