<?php
/**
 * Plugin Name:       BFT Advanced Link Attributes
 * Plugin URI:        https://github.com/KarstenBln/KARSTEN__berliner_freizeit_tipps.de_plugin_linkattribute
 * Description:       Ergänzt die Linkbearbeitung im Block- und im Classic-Editor um sponsored, nofollow und einen Link-Titel. Ohne Ersatzblöcke, ohne Frontend-Code.
 * Version:           1.0.4
 * Requires at least: 6.5
 * Tested up to:      7.1
 * Requires PHP:      7.4
 * Author:            Karsten Wachholz
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       bft-advanced-link-attributes
 * Domain Path:       /languages
 * Update URI:        https://github.com/KarstenBln/KARSTEN__berliner_freizeit_tipps.de_plugin_linkattribute
 *
 * @package BFT\AdvancedLinkAttributes
 */

declare( strict_types = 1 );

namespace BFT\AdvancedLinkAttributes;

defined( 'ABSPATH' ) || exit;

/**
 * Der Update URI verhindert, dass WordPress dieses Plugin mit einem
 * gleichnamigen aus dem offiziellen Verzeichnis überschreibt (Auftrag 11.2).
 * Sobald ein Host dort nicht wordpress.org ist, lässt der Kern die Aktualisierung
 * in Ruhe. Ein eigener Update-Server ist für 1.0 nicht vorgesehen, die Angabe
 * hält den Weg dorthin aber offen.
 */
const VERSION = '1.0.4';
const DATEI   = __FILE__;
const VERZ    = __DIR__;

require_once __DIR__ . '/includes/class-plugin.php';
require_once __DIR__ . '/includes/class-assets.php';

/**
 * Startet das Plugin.
 *
 * Bewusst an 'plugins_loaded' und nicht früher: Vorher stehen weder
 * Übersetzungen noch die Prüffunktionen des Kerns zuverlässig bereit.
 */
add_action(
	'plugins_loaded',
	static function (): void {
		( new Plugin() )->start();
	}
);
