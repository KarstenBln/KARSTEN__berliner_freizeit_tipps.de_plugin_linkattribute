# Änderungen

Dieses Plugin folgt [semantischer Versionierung](https://semver.org/lang/de/).

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
