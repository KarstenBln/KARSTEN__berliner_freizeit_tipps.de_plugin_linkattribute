# Änderungen

Dieses Plugin folgt [semantischer Versionierung](https://semver.org/lang/de/).

## 1.0.2 — 08.10.2026

### Behoben

* **Das Classic-Modul startete nie.** TinyMCE instanziiert externe Plugins mit
  `new` (`tinymce.min.js`: `var i = new r(t, o, t.$)` in der
  Plugin-Initialisierung, abgefangen in `pluginInitError`). Uebergeben wurde
  eine Arrow Function — die hat keinen `[[Construct]]`-Slot, der Aufruf wirft,
  und TinyMCE meldete im Editor „Failed to initialize plugin: bftlinkattrs".
  Jetzt eine gewoehnliche Funktion.

### Hinzugefuegt

* `tests/classic-modul.test.js`: zehn Pruefungen **gegen das gebaute Bundle**
  mit nachgebautem TinyMCE — Anmeldung unter dem erwarteten Namen, Aufruf mit
  `new`, Sperren und Freigeben der Schaltflaeche, Vorbelegung des Dialogs,
  Schreiben und Entfernen von `rel` und `title`, ein Rueckgaengig-Schritt.
  Gegen die alte Fassung des Bundles fallen neun davon durch.

## 1.0.1 — 08.10.2026

### Geändert

* **Das Classic-Modul haengt jetzt an `wp_enqueue_editor` statt an
  `admin_enqueue_scripts`.** Der alte Haken lief auf jeder Backend-Seite —
  Dashboard, Listen, Einstellungen —, obwohl dort kein Editor vorkommt. Den
  neuen feuert der Kern genau dann, wenn er einen Editor aufbaut
  (`class-wp-editor.php`, `enqueue_scripts()`), und uebergibt im Parameter, ob
  TinyMCE dabei ist; ohne TinyMCE laedt das Plugin nichts.
* **`load_plugin_textdomain()` nur noch im Backend.** Im Frontend hat das
  Plugin keine Oberflaeche; der Aufruf suchte dort auf jeder Seite nach
  Sprachdateien.

### Behoben

* **Gateway Timeout im Backend.** `tinymce_abhaengigkeiten()` rief
  `wp_set_script_translations( 'wp-i18n', … )` auf. Diese Funktion hängt
  `wp-i18n` an die Abhängigkeitsliste des übergebenen Handles
  (`wp-includes/class-wp-scripts.php`, `set_translations()`) — auf `wp-i18n`
  selbst angewendet hing das Skript damit von sich selbst ab, und
  `WP_Dependencies::all_deps()` lief endlos. Betroffen war **jede**
  wp-admin-Seite, weil der Aufruf an `admin_enqueue_scripts` hing. Die
  Übersetzungen laufen jetzt über einen eigenen, leeren Trägerhandle.

## 1.0.0 — 08.10.2026

Erste Fassung.

### Funktionen

- Schaltfläche **Linkattribute** in der kontextbezogenen RichText-Werkzeugleiste,
  sichtbar sobald der Cursor in einem Link steht.
- Popover mit `sponsored`, `nofollow` und Link-Titel. Vorhandene Werte werden
  eingelesen; übernommen wird nur über die Schaltfläche „Übernehmen", ein
  Abbruch ändert nichts.
- Eigenes, unabhängiges Modul für den Classic-/Freeform-Block (TinyMCE 4).
- Vorhandene `rel`-Tokens bleiben in ihrer Reihenfolge erhalten; nichts wird
  doppelt; ein leer gewordenes `rel` wird entfernt.
- Eine Auswahl über mehrere Links schaltet die Schaltfläche ab, statt
  stillschweigend mehrere Links zu ändern.

### Technische Grundlage

- Die Attribute werden in das vorhandene `core/link`-Format geschrieben, nicht
  in ein eigenes. Verschachtelte `<a>`-Elemente sind dadurch strukturell
  ausgeschlossen.
- `rel` über die reguläre Attributabbildung des Formats, `title` über
  `unregisteredAttributes` — beides dokumentiertes Verhalten von
  `@wordpress/rich-text`.
- Kein Frontend-Code, keine Optionen, keine Tabellen, keine Hintergrundprozesse.

### Geprüft gegen

- WordPress 7.1.2, PHP 8.3.20, TinyMCE 4.9.11, ohne Gutenberg-Plugin
- `@wordpress/rich-text` 7.57.0 in den Rundlauf-Tests

### Bekannte Einschränkungen

Siehe `DOKUMENTATION.md`, Abschnitte 4 und 5. Kurz: Der Button-Block wird nicht
unterstützt (der Core bietet dort bereits ein Feld „Link rel"), Editor-Tests im
Browser stehen aus, und `npm run lint:js` scheitert derzeit an der
ESLint-Werkzeugkette von `@wordpress/scripts`.
