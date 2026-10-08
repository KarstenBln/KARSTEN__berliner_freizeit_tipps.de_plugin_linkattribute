/**
 * Verarbeitung des rel-Attributs.
 *
 * Das rel-Attribut ist eine durch Leerzeichen getrennte Liste von Tokens. Diese
 * Datei ist die einzige Stelle, an der daran gerechnet wird — sie wird sowohl
 * vom Block-Editor-Modul als auch vom Classic-Modul benutzt, damit beide sich
 * garantiert gleich verhalten.
 *
 * Die Funktionen sind bewusst frei von WordPress-Abhaengigkeiten: reine
 * Zeichenketten rein, reine Zeichenketten raus. Dadurch sind sie ohne Editor
 * testbar.
 *
 * Leitlinie aus dem Auftrag (Abschnitt 4): fremde Tokens bleiben unveraendert,
 * die Reihenfolge bleibt erhalten, nichts wird doppelt, und bleibt am Ende
 * nichts uebrig, verschwindet das Attribut ganz.
 */

/**
 * Zerlegt ein rel-Attribut in seine Tokens.
 *
 * Mehrfache Leerzeichen, Zeilenumbrueche und Tabulatoren gelten als ein
 * Trenner. Doppelte Tokens werden beim Einlesen entfernt — das erste Vorkommen
 * bestimmt die Position.
 *
 * @param {string|undefined|null} rel Wert des rel-Attributs.
 * @return {string[]} Tokens in ihrer urspruenglichen Reihenfolge.
 */
export function relTokensLesen( rel ) {
	if ( typeof rel !== 'string' ) {
		return [];
	}

	const gesehen = new Set();
	const tokens = [];

	for ( const token of rel.split( /\s+/ ) ) {
		if ( '' === token || gesehen.has( token ) ) {
			continue;
		}
		gesehen.add( token );
		tokens.push( token );
	}

	return tokens;
}

/**
 * Setzt die Tokens wieder zu einem Attributwert zusammen.
 *
 * Gibt `undefined` zurueck, wenn keine Tokens uebrig sind. Das ist das Signal
 * an die aufrufende Stelle, das Attribut zu entfernen statt rel="" zu
 * schreiben.
 *
 * @param {string[]} tokens Tokens.
 * @return {string|undefined} Attributwert oder undefined.
 */
export function relTokensSchreiben( tokens ) {
	const wert = tokens.join( ' ' ).trim();

	return '' === wert ? undefined : wert;
}

/**
 * Prueft, ob ein Token gesetzt ist.
 *
 * @param {string|undefined|null} rel   Wert des rel-Attributs.
 * @param {string}                token Gesuchtes Token.
 * @return {boolean} true, wenn vorhanden.
 */
export function hatRelToken( rel, token ) {
	return relTokensLesen( rel ).includes( token );
}

/**
 * Schaltet ein einzelnes Token an oder aus.
 *
 * Beim Hinzufuegen wird hinten angehaengt, damit die vorhandene Reihenfolge
 * unberuehrt bleibt. Beim Entfernen bleibt der Rest in seiner Reihenfolge
 * stehen.
 *
 * @param {string|undefined|null} rel   Bisheriger Wert des rel-Attributs.
 * @param {string}                token Zu schaltendes Token.
 * @param {boolean}               an    true setzt, false entfernt.
 * @return {string|undefined} Neuer Wert, oder undefined wenn das Attribut weg soll.
 */
export function relTokenSchalten( rel, token, an ) {
	const tokens = relTokensLesen( rel );
	const stelle = tokens.indexOf( token );

	if ( an && -1 === stelle ) {
		tokens.push( token );
	} else if ( ! an && -1 !== stelle ) {
		tokens.splice( stelle, 1 );
	}

	return relTokensSchreiben( tokens );
}

/**
 * Schaltet mehrere Tokens in einem Durchgang.
 *
 * Gedacht fuer das Speichern aus dem Popover, wo Sponsored und Nofollow
 * gemeinsam uebernommen werden. Ein Durchgang vermeidet Zwischenzustaende.
 *
 * @param {string|undefined|null}      rel      Bisheriger Wert.
 * @param {Object<string, boolean>}    schalter Token-Name => gewuenschter Zustand.
 * @return {string|undefined} Neuer Wert, oder undefined wenn das Attribut weg soll.
 */
export function relTokensSchalten( rel, schalter ) {
	let wert = rel;

	for ( const [ token, an ] of Object.entries( schalter ) ) {
		wert = relTokenSchalten( wert, token, an );
	}

	return wert;
}
