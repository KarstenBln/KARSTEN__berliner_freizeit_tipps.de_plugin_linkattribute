<?php
/**
 * Registrierung der beiden Editor-Module.
 *
 * @package BFT\AdvancedLinkAttributes
 */

declare( strict_types = 1 );

namespace BFT\AdvancedLinkAttributes;

defined( 'ABSPATH' ) || exit;

/**
 * Lädt das Block-Editor-Modul und das Classic-Modul — getrennt voneinander
 * und jeweils nur dort, wo sie gebraucht werden (Auftrag 12).
 *
 * Im Frontend wird nichts geladen. Die Attribute stehen im gespeicherten HTML;
 * zum Anzeigen braucht es weder JavaScript noch CSS.
 */
final class Assets {

	/**
	 * Handle des Block-Editor-Moduls.
	 */
	private const HANDLE_BLOCK = 'bft-advanced-link-attributes';

	/**
	 * Name, unter dem TinyMCE das Classic-Modul kennt. Muss mit dem Namen in
	 * src/classic/index.js übereinstimmen.
	 */
	private const TINYMCE_PLUGIN = 'bftlinkattrs';

	/**
	 * Trägerhandle für die Übersetzungen des Classic-Moduls.
	 */
	private const HANDLE_CLASSIC_I18N = 'bft-advanced-link-attributes-classic-i18n';

	/**
	 * Hängt beide Module ein.
	 */
	public function start(): void {
		add_action( 'enqueue_block_editor_assets', array( $this, 'block_editor_modul' ) );

		// Classic-/Freeform-Block: Die beiden Filter sind der vom Kern
		// vorgesehene Weg, ein eigenes TinyMCE-Plugin zu registrieren. Sie
		// greifen für die Editoren, die WordPress selbst aufbaut — dazu
		// gehört der Classic-Block. Fremde TinyMCE-Instanzen werden nicht
		// angefasst (Auftrag 8).
		add_filter( 'mce_external_plugins', array( $this, 'tinymce_plugin' ) );
		add_filter( 'mce_buttons', array( $this, 'tinymce_schaltflaeche' ) );
		// Nicht an 'admin_enqueue_scripts': der laeuft auf jeder
		// Backend-Seite, auch auf dem Dashboard und in den Listen, wo gar
		// kein Editor vorkommt. 'wp_enqueue_editor' feuert der Kern genau
		// dann, wenn er einen Editor aufbaut (class-wp-editor.php,
		// enqueue_scripts) — und sagt im Parameter, ob TinyMCE dabei ist.
		add_action( 'wp_enqueue_editor', array( $this, 'tinymce_abhaengigkeiten' ) );
	}

	/**
	 * Pfad und URL einer gebauten Datei, samt ihrer Abhängigkeiten.
	 *
	 * Fehlt der Build — etwa weil jemand das Repository ohne Bauschritt
	 * installiert hat — wird nichts registriert, statt eine 404-Datei
	 * einzubinden (Auftrag 17).
	 *
	 * @param string $name Name des Bundles ohne Endung.
	 * @return array{url:string,version:string,deps:array}|null
	 */
	private function bundle( string $name ): ?array {
		$js    = VERZ . "/build/{$name}.js";
		$asset = VERZ . "/build/{$name}.asset.php";

		if ( ! file_exists( $js ) || ! file_exists( $asset ) ) {
			return null;
		}

		$daten = include $asset;

		if ( ! is_array( $daten ) ) {
			return null;
		}

		return array(
			'url'     => plugins_url( "build/{$name}.js", DATEI ),
			'version' => isset( $daten['version'] ) ? (string) $daten['version'] : VERSION,
			'deps'    => isset( $daten['dependencies'] ) ? (array) $daten['dependencies'] : array(),
		);
	}

	/**
	 * Block-Editor-Modul laden.
	 */
	public function block_editor_modul(): void {
		$bundle = $this->bundle( 'gutenberg' );

		if ( null === $bundle ) {
			return;
		}

		wp_enqueue_script(
			self::HANDLE_BLOCK,
			$bundle['url'],
			$bundle['deps'],
			$bundle['version'],
			true
		);

		wp_set_script_translations(
			self::HANDLE_BLOCK,
			'bft-advanced-link-attributes',
			VERZ . '/languages'
		);
	}

	/**
	 * Das TinyMCE-Plugin anmelden.
	 *
	 * @param array $plugins Bisherige Plugins.
	 * @return array Ergänzte Liste.
	 */
	public function tinymce_plugin( $plugins ) {
		if ( ! is_array( $plugins ) ) {
			return $plugins;
		}

		$bundle = $this->bundle( 'classic' );

		if ( null === $bundle ) {
			return $plugins;
		}

		$plugins[ self::TINYMCE_PLUGIN ] = $bundle['url'];

		return $plugins;
	}

	/**
	 * Die Schaltfläche in die erste Werkzeugleiste aufnehmen.
	 *
	 * @param array $buttons Bisherige Schaltflächen.
	 * @return array Ergänzte Liste.
	 */
	public function tinymce_schaltflaeche( $buttons ) {
		if ( ! is_array( $buttons ) || in_array( self::TINYMCE_PLUGIN, $buttons, true ) ) {
			return $buttons;
		}

		if ( null === $this->bundle( 'classic' ) ) {
			return $buttons;
		}

		// Direkt hinter die Link-Schaltflächen des Kerns, damit die Funktion
		// dort sitzt, wo Redakteure ohnehin mit Links arbeiten.
		$stelle = array_search( 'unlink', $buttons, true );

		if ( false === $stelle ) {
			$buttons[] = self::TINYMCE_PLUGIN;

			return $buttons;
		}

		array_splice( $buttons, (int) $stelle + 1, 0, self::TINYMCE_PLUGIN );

		return $buttons;
	}

	/**
	 * Abhängigkeiten des Classic-Moduls bereitstellen.
	 *
	 * TinyMCE lädt externe Plugins an der Skriptverwaltung von WordPress
	 * vorbei. Das gebaute Bundle greift zur Laufzeit auf wp.i18n zu — das muss
	 * also unabhängig davon geladen sein.
	 *
	 * @param array $zu_laden Vom Kern uebergeben: welche Editoren geladen werden.
	 *
	 * Für die Übersetzungen wird ein eigener, leerer Handle angemeldet.
	 * `wp_set_script_translations()` hängt `wp-i18n` an die Abhängigkeiten des
	 * übergebenen Handles (class-wp-scripts.php, set_translations). Auf
	 * `wp-i18n` selbst angewendet hieße das: wp-i18n hängt von sich selbst ab —
	 * und `WP_Dependencies::all_deps()` läuft endlos.
	 */
	public function tinymce_abhaengigkeiten( $zu_laden = array() ): void {
		// Ohne TinyMCE gibt es keine Werkzeugleiste, in der die Schaltflaeche
		// sitzen koennte — dann auch nichts zu laden.
		if ( is_array( $zu_laden ) && isset( $zu_laden['tinymce'] ) && ! $zu_laden['tinymce'] ) {
			return;
		}

		$bundle = $this->bundle( 'classic' );

		if ( null === $bundle ) {
			return;
		}

		foreach ( $bundle['deps'] as $abhaengigkeit ) {
			wp_enqueue_script( (string) $abhaengigkeit );
		}

		// Trägerhandle ohne eigene Datei: Er existiert nur, damit WordPress
		// die Übersetzungsdatei der Domain ausgibt, bevor TinyMCE das Bundle
		// nachlädt.
		wp_register_script( self::HANDLE_CLASSIC_I18N, false, array( 'wp-i18n' ), VERSION, true );
		wp_enqueue_script( self::HANDLE_CLASSIC_I18N );

		wp_set_script_translations(
			self::HANDLE_CLASSIC_I18N,
			'bft-advanced-link-attributes',
			VERZ . '/languages'
		);
	}
}
