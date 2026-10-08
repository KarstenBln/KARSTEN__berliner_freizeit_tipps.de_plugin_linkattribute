/**
 * Testkonfiguration.
 *
 * Erweitert die Voreinstellung von @wordpress/scripts um eine einzige
 * Zuordnung: Mehrere Pakete bringen eigene Kopien von @wordpress/private-apis
 * mit. Werden zwei davon gleichzeitig geladen, bricht der Start mit
 * "Cannot unlock an object that was not locked before" ab, weil ein Objekt in
 * der einen Kopie gesperrt und in der anderen entsperrt wird.
 *
 * Die Zuordnung zwingt alle Importe auf dieselbe Kopie. Das betrifft
 * ausschliesslich die Tests — der ausgelieferte Build nutzt die
 * WordPress-Pakete ohnehin als externe Abhaengigkeiten und buendelt keine
 * davon mit.
 */
const voreinstellung = require( '@wordpress/scripts/config/jest-unit.config.js' );

module.exports = {
	...voreinstellung,
	moduleNameMapper: {
		...( voreinstellung.moduleNameMapper || {} ),
		'^@wordpress/private-apis$':
			'<rootDir>/node_modules/@wordpress/rich-text/node_modules/@wordpress/private-apis',
	},
};
