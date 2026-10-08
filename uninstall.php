<?php
/**
 * Deinstallation.
 *
 * Es gibt absichtlich nichts aufzuräumen. Das Plugin legt keine Optionen,
 * keine Post-Meta-Felder, keine Tabellen und keine geplanten Aufgaben an.
 * Die gesetzten Linkattribute stehen im HTML der Beiträge — sie gehören dem
 * Inhalt, nicht dem Plugin, und bleiben deshalb unangetastet (Auftrag 9.2
 * und 9.3).
 *
 * Die Datei existiert trotzdem: Sie dokumentiert diese Entscheidung an der
 * Stelle, an der ein Entwickler sie sucht.
 *
 * @package BFT\AdvancedLinkAttributes
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;
