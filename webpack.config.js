/**
 * Zwei getrennte Bundles: eines fuer den Block-Editor, eines fuer TinyMCE.
 *
 * Die Trennung ist Absicht (Auftrag 10.3 und 12): Der Block-Editor laedt kein
 * TinyMCE-Bundle, und der Classic-Editor kein React. Die Standardkonfiguration
 * von @wordpress/scripts wird nur um die Einstiegspunkte ergaenzt — alles
 * andere, insbesondere die Behandlung der WordPress-Pakete als externe
 * Abhaengigkeiten und das Erzeugen der .asset.php-Dateien, bleibt unveraendert.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		gutenberg: path.resolve( __dirname, 'src/gutenberg/index.js' ),
		classic: path.resolve( __dirname, 'src/classic/index.js' ),
	},
};
