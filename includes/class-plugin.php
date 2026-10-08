<?php
/**
 * Einstiegspunkt des Plugins.
 *
 * @package BFT\AdvancedLinkAttributes
 */

declare( strict_types = 1 );

namespace BFT\AdvancedLinkAttributes;

defined( 'ABSPATH' ) || exit;

/**
 * Hängt die beiden Module ein.
 *
 * Das Plugin hat bewusst keine Einstellungsseite, keine Optionen, keine
 * eigenen Tabellen und keine Frontend-Ausgabe. Es gibt daher auch nichts zu
 * installieren oder zu deinstallieren — gespeicherte Linkattribute stehen im
 * HTML der Beiträge und bleiben dort, auch wenn das Plugin verschwindet
 * (Auftrag 9.2 und 9.3).
 */
final class Plugin {

	/**
	 * Registriert alles, was das Plugin tut.
	 */
	public function start(): void {
		// Nur im Backend: Die Oberflaeche des Plugins gibt es ausschliesslich
		// dort. Im Frontend wuerde der Aufruf auf jeder Seite nach
		// Sprachdateien suchen, die niemand braucht.
		if ( is_admin() ) {
			$this->uebersetzungen_laden();
		}

		( new Assets() )->start();
	}

	/**
	 * Übersetzungen laden.
	 *
	 * Seit WordPress 4.6 lädt der Kern Übersetzungen aus dem
	 * Sprachverzeichnis selbst. Für Übersetzungen, die mit dem Plugin
	 * ausgeliefert werden, ist der Aufruf weiterhin nötig.
	 */
	private function uebersetzungen_laden(): void {
		load_plugin_textdomain(
			'bft-advanced-link-attributes',
			false,
			dirname( plugin_basename( DATEI ) ) . '/languages'
		);
	}
}
