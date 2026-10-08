/**
 * Block-Editor-Modul: Linkattribute im RichText bearbeiten.
 *
 * Warum dieser Weg (Begruendung zu Auftrag 7.1):
 *
 * Der Core bildet `rel` bereits als regulaeres Attribut des Formats
 * `core/link` ab (wp-includes/js/dist/format-library.js, Attributliste des
 * Link-Formats). `title` ist dort nicht abgebildet — aber `@wordpress/rich-text`
 * sammelt nicht abgebildete Attribute beim Einlesen in
 * `format.unregisteredAttributes` und schreibt sie beim Serialisieren
 * unveraendert zurueck. Ein `title` am `<a>` uebersteht den Rundlauf also ohne
 * jeden Kunstgriff.
 *
 * Deshalb legen wir **kein eigenes Linkformat** an, sondern aendern das
 * vorhandene `core/link`-Format an Ort und Stelle. Damit ist ausgeschlossen,
 * dass zwei konkurrierende Linkformate auf demselben Bereich liegen oder
 * verschachtelte `<a>`-Elemente entstehen (Auftrag 7.1, Abnahmekriterium 9) —
 * nicht durch Vorsicht, sondern weil nie ein zweites Linkformat angewendet
 * wird.
 *
 * `registerFormatType` dient hier ausschliesslich dazu, eine Schaltflaeche in
 * die kontextbezogene Werkzeugleiste zu bekommen. Das registrierte Format wird
 * nie angewendet und erzeugt daher auch nie Markup.
 */

import { registerFormatType, getFormatType, useAnchor } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
// Bewusst nur Komponenten ohne __experimental-Praefix: Diese Namen sind
// Bestandteil der oeffentlichen Schnittstelle und verschwinden nicht mit der
// naechsten WordPress-Fassung (Auftrag 2 und 7.2). Das bisschen Layout
// erledigen zwei Container mit Inline-Abstand — dafuer braucht es keine
// instabile API und kein zusaetzliches Stylesheet.
import { Button, CheckboxControl, Popover, TextControl } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { hatRelToken } from '../shared/rel-tokens';
import { attributeAnwenden } from './attribute-anwenden';
import { linkAmCursor } from './link-bereich';

const NAME = 'bft/link-attributes';

/**
 * Inhalt des Popovers. Eigener Zustand, damit ein Abbruch wirklich nichts
 * aendert (Auftrag 6: eindeutige Speichern-Aktion).
 */
function Einstellungen( { format, onSpeichern, onAbbrechen } ) {
	const rel = format.attributes?.rel;
	const vorhandenerTitel = format.unregisteredAttributes?.title ?? format.attributes?.title ?? '';

	const [ sponsored, setSponsored ] = useState( () => hatRelToken( rel, 'sponsored' ) );
	const [ nofollow, setNofollow ] = useState( () => hatRelToken( rel, 'nofollow' ) );
	const [ titel, setTitel ] = useState( vorhandenerTitel );

	// Wechselt der Cursor in einen anderen Link, waehrend das Popover offen
	// ist, muessen die Felder den neuen Link zeigen.
	useEffect( () => {
		setSponsored( hatRelToken( rel, 'sponsored' ) );
		setNofollow( hatRelToken( rel, 'nofollow' ) );
		setTitel( vorhandenerTitel );
	}, [ rel, vorhandenerTitel ] );

	return (
		<form
			className="bft-link-attributes__form"
			onSubmit={ ( ereignis ) => {
				ereignis.preventDefault();
				onSpeichern( { sponsored, nofollow, titel } );
			} }
		>
			<div style={ { display: 'grid', gap: '12px', minWidth: '260px', padding: '8px' } }>
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ __( 'Sponsored (Werbe-/Affiliate-Link)', 'bft-advanced-link-attributes' ) }
					checked={ sponsored }
					onChange={ setSponsored }
				/>
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ __( 'Nofollow', 'bft-advanced-link-attributes' ) }
					checked={ nofollow }
					onChange={ setNofollow }
				/>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Link-Titel (optional)', 'bft-advanced-link-attributes' ) }
					help={ __(
						'Erscheint als Kurzinfo, wenn der Mauszeiger auf dem Link steht.',
						'bft-advanced-link-attributes'
					) }
					value={ titel }
					onChange={ setTitel }
				/>
				<div style={ { display: 'flex', justifyContent: 'flex-end', gap: '8px' } }>
					<Button variant="tertiary" onClick={ onAbbrechen }>
						{ __( 'Abbrechen', 'bft-advanced-link-attributes' ) }
					</Button>
					<Button variant="primary" type="submit">
						{ __( 'Übernehmen', 'bft-advanced-link-attributes' ) }
					</Button>
				</div>
			</div>
		</form>
	);
}

/**
 * Die Schaltflaeche in der Werkzeugleiste plus das Popover.
 */
function Bearbeiten( { value, onChange, contentRef } ) {
	const [ offen, setOffen ] = useState( false );

	const bereich = linkAmCursor( value );

	// Das Popover haengt sich an denselben Anker wie die Linkbearbeitung des
	// Cores — also an das <a>-Element selbst, nicht an die Werkzeugleiste.
	const anker = useAnchor( {
		editableContentElement: contentRef?.current,
		settings: getFormatType( 'core/link' ),
	} );

	// Ohne Link an der Cursorposition hat die Schaltflaeche keinen Bezug.
	if ( ! bereich ) {
		return null;
	}

	const mehrdeutig = true === bereich.mehrdeutig;

	// Wandert der Cursor aus dem Link heraus, schliesst sich das Popover.
	if ( offen && mehrdeutig ) {
		setOffen( false );
	}

	return (
		<>
			<RichTextToolbarButton
				icon="admin-links"
				title={ __( 'Linkattribute', 'bft-advanced-link-attributes' ) }
				onClick={ () => setOffen( ( zustand ) => ! zustand ) }
				isActive={ offen }
				disabled={ mehrdeutig }
				describedBy={
					mehrdeutig
						? __(
								'Die Auswahl umfasst mehrere Links. Bitte den Cursor in einen einzelnen Link setzen.',
								'bft-advanced-link-attributes'
						  )
						: undefined
				}
			/>
			{ offen && ! mehrdeutig && (
				<Popover
					anchor={ anker }
					placement="bottom-start"
					onClose={ () => setOffen( false ) }
					focusOnMount="firstElement"
					className="bft-link-attributes__popover"
				>
					<Einstellungen
						format={ bereich.format }
						onAbbrechen={ () => setOffen( false ) }
						onSpeichern={ ( eingaben ) => {
							onChange( attributeAnwenden( { value, bereich, ...eingaben } ) );
							setOffen( false );
						} }
					/>
				</Popover>
			) }
		</>
	);
}

/**
 * Registrierung.
 *
 * `tagName` und `className` sind Pflichtangaben der API. Da das Format nie
 * angewendet wird, entsteht damit auch nie ein Element. Der Klassenname ist
 * bewusst eindeutig, damit er sich nicht mit fremdem Markup ueberschneidet.
 *
 * Schlaegt die Registrierung fehl — etwa weil eine kuenftige WordPress-Version
 * die Schnittstelle aendert — bleibt der Editor unberuehrt (Auftrag 17).
 */
function registrieren() {
	if ( 'function' !== typeof registerFormatType ) {
		return;
	}

	try {
		registerFormatType( NAME, {
			title: __( 'Linkattribute', 'bft-advanced-link-attributes' ),
			tagName: 'span',
			className: 'bft-link-attributes-platzhalter',
			edit: Bearbeiten,
		} );
	} catch ( fehler ) {
		// Bewusst still: Eine fehlgeschlagene Registrierung darf den Editor
		// nicht unbrauchbar machen.
		// eslint-disable-next-line no-console
		console.warn( 'BFT Advanced Link Attributes:', fehler );
	}
}

registrieren();
