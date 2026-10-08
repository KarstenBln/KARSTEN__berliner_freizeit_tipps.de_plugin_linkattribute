# BFT Advanced Link Attributes — Architektur, Tests, Einschränkungen

Version 1.0.0 · Stand 08.10.2026
Entwickelt und geprüft gegen WordPress 7.1.2, PHP 8.3.20, TinyMCE 4.9.11, ohne Gutenberg-Plugin.

---

## 1. Technische Bestandsaufnahme

Grundlage der Architekturentscheidung sind drei Befunde aus dem ausgelieferten
WordPress-Code — nicht aus der Dokumentation, sondern aus den Dateien, die auf
dem System tatsächlich laufen.

### 1.1 `rel` ist bereits ein Attribut des Link-Formats

`wp-includes/js/dist/format-library.js`, Attributabbildung des Formats
`core/link`:

```js
attributes: {
  url: "href",  type: "data-type",  id: "data-id",
  _id: "id",    target: "target",   rel: "rel",     ← bereits abgebildet
  class: "class"
}
```

Für `rel` muss also nichts erfunden werden. Es lässt sich über die
dokumentierte Formatschnittstelle lesen und schreiben.

### 1.2 Nicht abgebildete Attribute überleben den Rundlauf

`title` steht nicht in dieser Liste. Die entscheidende Frage des Auftrags
(Abschnitt 9.1) lautete daher: Bleibt ein `title` erhalten, wenn WordPress das
HTML einliest und wieder ausgibt?

`wp-includes/js/dist/rich-text.js` beantwortet das:

| Zeile | Was dort geschieht |
|---|---|
| 805–830 | Beim Einlesen landen nicht abgebildete Attribute in `format.unregisteredAttributes` |
| 471 | Beim Schreiben: `elementAttributes = { ...unregisteredAttributes, ...elementAttributes }` |
| 245–247 | Beim Vergleich zweier Formate werden sie mitberücksichtigt |

Ein `title` am `<a>` übersteht den Rundlauf also von selbst. Das ist kein
Kunstgriff, sondern dokumentiertes Verhalten der Bibliothek — und es ist in
`tests/rundlauf.test.js` gegen genau diese Bibliothek nachgemessen.

### 1.3 `applyFormat` ersetzt, statt zu verschachteln

Die größte Gefahr des Auftrags waren verschachtelte `<a>`-Elemente. Der Blick
in `applyFormat` (`rich-text.js` ab Zeile 298) zeigt zwei Zweige:

* **Bereich** (Zeile 329–331): Vorhandene Formate desselben Typs werden
  **herausgefiltert**, bevor das neue eingesetzt wird.
* **Zusammengeklappt** (Zeile 301–324): Das Format-Objekt wird an genau seiner
  Position im Formatstapel ersetzt, und die Ersetzung dehnt sich über den
  gesamten zusammenhängenden Link aus.

Wir nutzen den zweiten Zweig. Er erhält die Verschachtelung mit anderen
Formaten (fett, kursiv) exakt, während der erste das Format neu einsortieren
würde.

---

## 2. Architekturentscheidung

| Variante | Bewertung |
|---|---|
| **A** — vorhandenen Linkdialog erweitern | Der Core bietet **keinen** dokumentierten Einhängepunkt für Zusatzfelder im Linkdialog. Eine Erweiterung ginge nur über Interna — nach Auftrag 7.2 ausgeschlossen. |
| **B** — eigene Toolbar-Aktion mit eigenem Format | Stabil in der Oberfläche, aber ein zweites Format mit `tagName: 'a'` auf demselben Bereich erzeugt genau die verschachtelten Links, die vermieden werden sollen. |
| **C** — RichText-Modul + getrenntes Classic-Modul | **Gewählt.** |

### Die Verfeinerung, die den Unterschied macht

Variante C wurde gewählt, aber nicht in ihrer naheliegenden Form. Die
Oberfläche ist eine eigene Toolbar-Schaltfläche mit Popover (wie B). Die Daten
landen jedoch **nicht in einem eigenen Format**, sondern im vorhandenen
`core/link`-Format:

```
Format am Cursor auslesen
   → attributes.rel ändern
   → unregisteredAttributes.title ändern
   → über den Linkbereich zurückschreiben
```

`registerFormatType` dient ausschließlich dazu, die Schaltfläche in die
kontextbezogene Werkzeugleiste zu bekommen. Das registrierte Format wird **nie
angewendet** und erzeugt daher nie Markup.

**Folge:** Verschachtelte `<a>`-Elemente und konkurrierende Linkformate sind
strukturell ausgeschlossen, nicht bloß vermieden — es wird nie ein zweites
Linkformat angewendet.

### Warum der Link auf Zeichenebene gesucht wird

`rich-text` legt pro Zeichen eine Liste der aktiven Formate ab. Ein
zusammenhängender Link teilt sich dabei **dasselbe Format-Objekt**. Daran
erkennt `src/gutenberg/link-bereich.js`, wo ein Link anfängt und aufhört — und
daran unterscheidet es zwei benachbarte Links selbst dann, wenn sie dieselbe
Adresse haben (nachgemessen in `tests/rundlauf.test.js`).

Umfasst eine Auswahl mehrere verschiedene Links, meldet die Funktion
`{ mehrdeutig: true }`, und die Schaltfläche bleibt abgeschaltet statt
stillschweigend mehrere Links zu ändern (Auftrag 6.2).

### Keine instabilen Schnittstellen

Im gesamten Code wird **keine einzige** mit `__experimental` gekennzeichnete
WordPress-API verwendet. Eine erste Fassung des Popovers nutzte
`__experimentalVStack` und `__experimentalHStack` für das Layout; beide wurden
durch zwei Container mit Inline-Abstand ersetzt. Das Layout ist dieselbe
Sache wert wie eine Abhängigkeit, die mit der nächsten WordPress-Fassung
verschwinden kann — nämlich nichts.

Verwendet werden ausschließlich: `registerFormatType`, `applyFormat`,
`getFormatType`, `useAnchor` (alle `@wordpress/rich-text`),
`RichTextToolbarButton` (`@wordpress/block-editor`), `Button`,
`CheckboxControl`, `Popover`, `TextControl` (`@wordpress/components`),
`useState`, `useEffect` (`@wordpress/element`) und `__` (`@wordpress/i18n`).
Jeder dieser Namen wurde im ausgelieferten Core als echter Export
nachgewiesen.

### Trennung der Module

| Bundle | Größe | Abhängigkeiten |
|---|---|---|
| `build/gutenberg.js` | 4,08 KiB | react-jsx-runtime, wp-block-editor, wp-components, wp-element, wp-i18n, wp-rich-text |
| `build/classic.js` | 1,65 KiB | wp-i18n |

Der Classic-Editor lädt kein React, der Block-Editor kein TinyMCE. Geteilt wird
einzig die reine Token-Logik, die in beide Bundles hineinkompiliert wird. Fällt
ein Modul aus, läuft das andere weiter (Auftrag 10.3).

---

## 3. Tatsächlich durchgeführte Tests

### 3.1 Automatisiert — 46 Tests, alle bestanden

`npm test`

**`tests/rel-tokens.test.js` (22 Tests)** — die Token-Verarbeitung aus
Auftrag 4: zerlegen, zusammensetzen, Doppelungen, Reihenfolge, Entfernen des
leeren Attributs, Mehrfachanwendung ohne Veränderung.

**`tests/rundlauf.test.js` (24 Tests)** — gegen das **echte**
`@wordpress/rich-text` (7.57.0), mit `core/link` in der Attributabbildung von
WordPress 7.1.2:

| Bereich | Geprüft |
|---|---|
| Attribute setzen | sponsored, nofollow, beide gemeinsam, title setzen/ändern/entfernen, kein leeres `title=""` |
| Vorhandene Attribute | `noopener noreferrer` bleibt, nur `sponsored` wird entfernt, `rel` verschwindet wenn leer, `class`/`id`/`data-*` bleiben |
| Affiliate-Adressen | Tracking-Parameter bleiben unangetastet |
| Mehrere Links je Absatz | nur der Link am Cursor wird geändert; zwei benachbarte Links mit **gleicher Adresse** werden unterschieden; Auswahl über mehrere Links wird als mehrdeutig gemeldet |
| Verschachtelung | nach viermaligem Speichern genau ein `<a>`; wiederholtes Speichern verändert nichts |
| Andere Formate | Fettschrift im Link bleibt; Text außerhalb bleibt |
| Sicherheit | Anführungszeichen und spitze Klammern im Titel werden kodiert |
| **Ohne aktives Plugin** | `title` und `rel` überstehen den Rundlauf durch WordPress allein — auch nach drei Durchläufen |

Der letzte Block benutzt bewusst **keinen Code dieses Plugins**. Er belegt die
Zusage aus Auftrag 9.2, die laut Auftrag nur gegeben werden darf, wenn sie
gemessen wurde.

### 3.2 Integration gegen die laufende WordPress-Installation

Ein Skript lädt WordPress und prüft die PHP-Seite. Alle Punkte bestanden:

```
Plugin ist aktiv · Klassen geladen
Block-Modul angemeldet, hängt an wp-rich-text und wp-block-editor, lädt in der Fußzeile
TinyMCE-Plugin angemeldet, zeigt auf build/classic.js
Schaltfläche in der Leiste, direkt hinter "unlink", wird nicht doppelt eingefügt
```

Und getrennt davon, auf einer Frontend-Anfrage:

```
kein eigenes Skript im Frontend · kein eigenes Stylesheet im Frontend
keine Hooks in der Seitenausgabe (wp_head, wp_footer, the_content, template_redirect, init)
keine geplanten Aufgaben · keine eigenen Optionen angelegt
```

### 3.3 Code-Prüfung

* **PHP:** `phpcs --standard=WordPress` über alle 4 PHP-Dateien — **0 Verstöße**.
* **PHP-Syntax:** `php -l` auf allen Dateien — fehlerfrei.
* **Build:** `npm run build` ohne Warnungen; kein React mitgebündelt, alle
  WordPress-Pakete als externe Abhängigkeiten.

---

## 4. Nicht durchgeführte Tests — ausdrücklich offen

Der Auftrag verlangt, nicht ausgeführte Tests zu benennen. Folgende Punkte aus
Abschnitt 16 sind **nicht** geprüft:

**Editor-Integrationstests im Browser** (Punkte 13–23, 33–40). Dafür wäre eine
Playwright-Umgebung mit angemeldetem Redakteur nötig; die lokale Instanz hat
sie nicht. Betroffen sind insbesondere:

* Bedienung des Popovers, Fokusverwaltung, Tastaturbedienung
* Rückgängig/Wiederholen
* Kopieren und Einfügen von Text mit Links
* Block duplizieren
* Wechsel zwischen visueller Ansicht und Code-Ansicht
* Das Classic-/TinyMCE-Modul (Punkte 33–40) ist seit 1.0.2 gegen das gebaute
  Bundle mit nachgebautem TinyMCE geprüft (`tests/classic-modul.test.js`,
  zehn Fälle). Der Dialog selbst — Aussehen, Fokus, Tastaturbedienung — ist
  weiterhin **nicht im Browser erprobt**

**Nachtrag 1.0.2:** Die Annahme, der Code folge „der dokumentierten
TinyMCE-4-Schnittstelle", war falsch. TinyMCE instanziiert externe Plugins mit
`new`; die übergebene Arrow Function liess sich nicht konstruieren, und das
Modul brach bei jedem Editorstart mit „Failed to initialize plugin" ab. Der
Fehler entstand erst im Bundle — webpack liess die Arrow Function stehen.
Deshalb prüft der neue Test das Bundle, nicht die Quelle.

**Plugin-Lebenszyklus** (Punkte 41–48) außer der Aktivierung: Deaktivieren,
Aktualisieren und Deinstallieren sind nicht durchgespielt. Da das Plugin weder
Optionen noch Tabellen noch Hooks im Frontend anlegt, ist dabei nichts zu
erwarten — geprüft ist es trotzdem nicht.

**Mehrere WordPress-Versionen** (Punkt 52). Geprüft ist ausschließlich 7.1.2.

**JavaScript-Linting.** `npm run lint:js` lässt sich derzeit nicht ausführen:
Die ESLint-Kette von `@wordpress/scripts` 30.24.0 bricht mit
`ts-api-utils: Cannot read properties of undefined (reading 'Intrinsic')` ab —
eine Unverträglichkeit zwischen `@typescript-eslint` und der installierten
TypeScript-Fassung. Das betrifft die Werkzeugkette, nicht den Code; Build und
Tests laufen. Behebung steht aus.

---

## 5. Bekannte Einschränkungen

### 5.1 Button-Block wird nicht unterstützt

`core/button` speichert seinen Link **nicht** als RichText-Format, sondern als
Block-Attribute (`wp-includes/blocks/button/block.json`):

```
url        → href     rel    → rel
linkTarget → target   title  → title
```

Eine RichText-Formatschaltfläche kann dort nicht greifen. Eine Sonderlösung
wäre ein eigener Weg mit eigener Oberfläche — der Auftrag rät davon
ausdrücklich ab (Abschnitt 5, Priorität 3).

**Und sie wäre überflüssig:** Der Core bietet für den Button-Block bereits ein
Feld „Link rel" in den Blockeinstellungen. `rel` lässt sich dort also schon
heute setzen.

### 5.2 Reichweite der TinyMCE-Registrierung

Das Classic-Modul wird über `mce_external_plugins` und `mce_buttons`
angemeldet — den vom Core vorgesehenen Weg. Diese Filter greifen für alle
Editoren, die WordPress selbst aufbaut, also auch für `wp_editor()`-Instanzen
außerhalb des Classic-Blocks.

Einen Filter, der nur den Classic-Block trifft, gibt es nicht. Die Vorgabe
„keine globale Manipulation aller TinyMCE-Instanzen" ist insofern erfüllt, als
**kein fremder Code angefasst und keine Instanz nachträglich verändert** wird;
die Registrierung selbst ist aber nicht feiner steuerbar.

### 5.3 Überschneidung mit „Title and Nofollow For Links"

Das Plugin „Title and Nofollow For Links" 1.13 ist auf der Zielseite
installiert und arbeitet laut eigener Beschreibung nur im Classic-Editor. Es
setzt dort ebenfalls Titel und Nofollow (ohne Sponsored).

Zwei Schaltflächen nebeneinander, die am selben Link drehen, laden zu Fehlern
ein. **Empfehlung: nach der Umstellung deaktivieren.** Bereits gesetzte
Attribute bleiben davon unberührt — sie stehen im HTML.

### 5.4 Kein automatisches Update

Der `Update URI`-Header zeigt auf das private Repository und verhindert damit,
dass WordPress das Plugin mit einem gleichnamigen aus dem offiziellen
Verzeichnis überschreibt. Ein eigener Update-Server ist für 1.0 nicht gebaut
(Auftrag 11.2). Aktualisierungen laufen vorerst über das ZIP-Archiv oder
MainWP.

---

## 6. Dateien

```
bft-advanced-link-attributes.php   Kopfdaten, Konstanten, Start an plugins_loaded
includes/class-plugin.php          Übersetzungen, hängt die Module ein
includes/class-assets.php          Registrierung beider Module, getrennt
src/shared/rel-tokens.js           Token-Verarbeitung, ohne WordPress-Bezug
src/gutenberg/link-bereich.js      Link am Cursor finden, Mehrdeutigkeit erkennen
src/gutenberg/attribute-anwenden.js Format bauen und zurückschreiben
src/gutenberg/index.js             Schaltfläche, Popover, Registrierung
src/classic/index.js               TinyMCE-Modul
uninstall.php                      Bewusst leer — es gibt nichts aufzuräumen
```

## 7. Bauen und paketieren

```bash
npm install
npm test          # 46 Tests
npm run build     # build/gutenberg.js + build/classic.js
npm run paket     # installierbares ZIP
```

Das ZIP enthält nur PHP, den fertigen Build und die Sprachdateien — es lässt
sich ohne Node.js direkt über die Plugin-Verwaltung installieren.
