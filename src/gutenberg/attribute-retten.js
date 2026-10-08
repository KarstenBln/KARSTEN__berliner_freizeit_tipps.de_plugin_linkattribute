/**
 * Attribute retten, die die Link-Oberflaeche wegwirft.
 *
 * Warum das noetig ist — gemessen, nicht vermutet:
 *
 * Die Linkbearbeitung baut ihr Format bei jeder Aenderung **neu auf**, allein
 * aus ihren eigenen Feldern. Im Kern (`wp-includes/js/dist/format-library.js`,
 * `createLinkFormat`) entsteht ein frisches Objekt mit `url` und je nach
 * Kaestchen `type`, `id`, `target`, `rel`, `class`. Rank Math macht es in
 * seiner Ersatzfassung genauso. Das Ergebnis geht mit `applyFormat` ueber den
 * ganzen Link — und `applyFormat` **ersetzt**. Alles, was die Oberflaeche
 * nicht kennt, ist danach weg:
 *
 *   vorher:  <a title="Kurzinfo" href="…" rel="sponsored nofollow">Link</a>
 *   nachher: <a href="…" rel="nofollow">Link</a>
 *
 * Diese Datei vergleicht den Wert vor und nach einer solchen Aenderung und
 * traegt die verlorenen, nicht abgebildeten Attribute wieder ein.
 *
 * Bewusst **nicht** gerettet wird `rel`. Welche Tokens dort stehen sollen,
 * entscheidet die Oberflaeche, die der Redakteur gerade bedient: nimmt jemand
 * in Rank Math das Haekchen „sponsored" heraus, waere ein Zurueckschreiben
 * genau falsch. Unterscheiden koennten wir die beiden Faelle nicht — also
 * fassen wir `rel` nicht an.
 */

const LINK = 'core/link';

/**
 * Liefert das Link-Format an einer Zeichenposition.
 *
 * @param {Array}  formats Formatspalten.
 * @param {number} index   Zeichenposition.
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
 * Zerlegt einen Wert in zusammenhaengende Linkabschnitte.
 *
 * Ein zusammenhaengender Link teilt sich dasselbe Format-Objekt; der Wechsel
 * der Objektreferenz markiert die Grenze. So werden auch zwei direkt
 * benachbarte Links mit derselben Adresse auseinandergehalten.
 *
 * @param {Array} formats Formatspalten.
 * @return {Array<{format:Object,start:number,end:number}>} Die Abschnitte.
 */
function abschnitte( formats ) {
	const gefunden = [];
	let laufend = null;

	for ( let i = 0; i < formats.length; i++ ) {
		const format = linkAn( formats, i );

		if ( format !== ( laufend && laufend.format ) ) {
			laufend = format ? { format, start: i, end: i + 1 } : null;

			if ( laufend ) {
				gefunden.push( laufend );
			}
		} else if ( laufend ) {
			laufend.end = i + 1;
		}
	}

	return gefunden;
}

/**
 * Sammelt die Link-Formate, die im alten Wert denselben Bereich belegen.
 *
 * @param {Array}  formats Formatspalten des alten Werts.
 * @param {number} start   Anfang.
 * @param {number} end     Ende.
 * @return {Array<Object>} Die gefundenen Formate, ohne Dubletten.
 */
function alteFormateIm( formats, start, end ) {
	const gefunden = [];

	for ( let i = Math.max( 0, start ); i < Math.min( end, formats.length ); i++ ) {
		const format = linkAn( formats, i );

		if ( format && ! gefunden.includes( format ) ) {
			gefunden.push( format );
		}
	}

	return gefunden;
}

/**
 * Welche nicht abgebildeten Attribute fehlen im neuen Format?
 *
 * @param {Object} alt Altes Format.
 * @param {Object} neu Neues Format.
 * @return {Object|null} Die zusammengefuehrten Attribute oder null.
 */
function fehlende( alt, neu ) {
	const bestand = alt.unregisteredAttributes;

	if ( ! bestand || 0 === Object.keys( bestand ).length ) {
		return null;
	}

	const vorhanden = neu.unregisteredAttributes || {};
	const eigene = neu.attributes || {};
	const zusammen = { ...vorhanden };
	let geaendert = false;

	for ( const [ name, wert ] of Object.entries( bestand ) ) {
		if ( name in vorhanden || name in eigene ) {
			continue;
		}

		zusammen[ name ] = wert;
		geaendert = true;
	}

	return geaendert ? zusammen : null;
}

/**
 * Traegt verlorene Attribute wieder in den neuen Wert ein.
 *
 * Gerettet wird nur dort, wo die Zuordnung eindeutig ist: Beruehrt ein
 * Linkabschnitt im neuen Wert genau **einen** Link des alten Werts, gilt er
 * als derselbe Link. Beruehrt er mehrere oder keinen, bleibt er unangetastet —
 * lieber ein verlorener Titel als ein falsch zugeordneter.
 *
 * @param {Object} alt Wert vor der Aenderung.
 * @param {Object} neu Wert nach der Aenderung.
 * @return {Object} Der neue Wert, gegebenenfalls ergaenzt.
 */
export function attributeRetten( alt, neu ) {
	if ( ! alt || ! neu || ! Array.isArray( alt.formats ) || ! Array.isArray( neu.formats ) ) {
		return neu;
	}

	const ersetzungen = new Map();

	for ( const abschnitt of abschnitte( neu.formats ) ) {
		const kandidaten = alteFormateIm( alt.formats, abschnitt.start, abschnitt.end );

		if ( 1 !== kandidaten.length ) {
			continue;
		}

		const zusammen = fehlende( kandidaten[ 0 ], abschnitt.format );

		if ( zusammen ) {
			ersetzungen.set( abschnitt.format, {
				...abschnitt.format,
				unregisteredAttributes: zusammen,
			} );
		}
	}

	if ( 0 === ersetzungen.size ) {
		return neu;
	}

	return {
		...neu,
		formats: neu.formats.map( ( liste ) => {
			if ( ! Array.isArray( liste ) ) {
				return liste;
			}

			if ( ! liste.some( ( format ) => ersetzungen.has( format ) ) ) {
				return liste;
			}

			return liste.map( ( format ) => ersetzungen.get( format ) || format );
		} ),
	};
}
