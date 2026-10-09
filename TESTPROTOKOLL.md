# Testprotokoll — Browsertests im Editor

Diese Liste schließt die in DOKUMENTATION.md Abschnitt 4 offengelassenen Punkte
(16.13–16.23, 16.33–16.40, 16.41–16.48). Jeder Fall nennt Vorbereitung,
Handlung und das erwartete Ergebnis. Haken erst setzen, wenn das Ergebnis
tatsächlich gesehen wurde; Abweichungen in der Spalte „Beobachtung" notieren.

**Testumgebung:** https://berliner-freizeit-tipps-redesign.test/wp-admin/
**Stand:** Plugin 1.0.0, WordPress 7.1.2
**Hinweis:** „Title and Nofollow For Links" vorher **deaktivieren**, sonst
prüfst du zwei Plugins gleichzeitig.

Zum Nachsehen des Markups: Blockmenü (⋮) → **Als HTML bearbeiten**, oder
Optionen (⋮ oben rechts) → **Code-Editor** (Strg/Cmd + Umschalt + Alt + M).

---

## A. Block-Editor (Punkte 13–23)

Vorbereitung für A: neuer Beitrag, ein Absatz mit dem Satz
`Ein Besuch im Fernsehturm lohnt sich immer.` Das Wort „Fernsehturm"
markieren, mit Strg/Cmd + K auf `https://example.com/?aff=12345&cmp=sommer`
verlinken.

| # | Fall | Handlung | Erwartet | Beobachtung |
|---|---|---|---|---|
| A1 | Schaltfläche erscheint | Cursor in den Link setzen | Das Kettensymbol **Linkattribute** steht direkt in der Werkzeugleiste, neben der Link-Schaltfläche | seit 1.1.1 erneut zu prüfen |
| A2 | Schaltfläche fehlt ohne Link | Cursor in unverlinkten Text setzen | Keine Schaltfläche **Linkattribute** | |
| A3 | Popover öffnen | Auf **Linkattribute** klicken | Popover öffnet **am Link**, nicht an der Werkzeugleiste; Felder: Sponsored, Nofollow, Link-Titel | **erledigt 08.10.** |
| A4 | Rechte Seitenleiste unberührt | Blockeinstellungen rechts öffnen | **Kein** Abschnitt des Plugins dort (Auftrag: ausdrücklich nicht die Seitenleiste) | |
| A5 | Fokus beim Öffnen | Popover öffnen, nichts anklicken, Leertaste | Fokus steht auf dem ersten Bedienelement (Sponsored), Leertaste schaltet es — Fokus landet nicht im Fließtext | |
| A6 | Tastaturbedienung | Mit Tab durch alle Felder bis **Übernehmen**, mit Umschalt+Tab zurück | Fokus bleibt im Popover, jedes Feld ist erreichbar und sichtbar umrandet | |
| A7 | Abbrechen ändert nichts | Sponsored anhaken, Titel „Test" eintippen, **Abbrechen** | Popover schließt, HTML des Links **unverändert** (kein rel, kein title) | |
| A8 | Escape ändert nichts | Erneut öffnen, Haken setzen, Esc drücken | Wie A7: nichts geändert | |
| A9 | Klick daneben | Erneut öffnen, Haken setzen, in den Text daneben klicken | Popover schließt, nichts geändert | |
| A10 | Sponsored setzen | Sponsored anhaken, **Übernehmen**, HTML ansehen | `rel="sponsored"`, Adresse mit `?aff=12345&cmp=sommer` **unverändert** | |
| A11 | Nofollow dazu | Popover erneut öffnen (Sponsored ist angehakt), Nofollow anhaken, Übernehmen | `rel="sponsored nofollow"` — ein Attribut, beide Tokens, kein Duplikat | |
| A12 | Titel setzen | Titel `Aussichtsplattform am Alexanderplatz` eintragen, Übernehmen | `title="Aussichtsplattform am Alexanderplatz"` am `<a>` | |
| A13 | Vorhandene Werte werden gezeigt | Popover schließen, Cursor anderswohin, zurück in den Link, Popover öffnen | Beide Haken gesetzt, Titel steht im Feld | |
| A14 | Leerer Titel entfernt das Attribut | Titelfeld leeren, Übernehmen | **Kein** `title` mehr am `<a>` — nicht `title=""` | |
| A15 | Beide Haken weg entfernt rel | Sponsored und Nofollow abwählen, Übernehmen | **Kein** `rel` mehr — nicht `rel=""` | |
| A16 | Fremde rel-Werte bleiben | In der Code-Ansicht `rel="noopener noreferrer ugc"` eintragen, zurück in die visuelle Ansicht, Sponsored anhaken, Übernehmen | `rel="noopener noreferrer ugc sponsored"` — Reihenfolge der alten Tokens unverändert | |
| A17 | Kein verschachteltes `<a>` | Nach A10–A16 (also mehreren Speichervorgängen) das HTML ansehen | Genau **ein** `<a>`-Element, kein `<a>` in einem `<a>`, kein `<span class="bft-link-attributes-platzhalter">` | |
| A18 | Zwei Links im Absatz | Zweites Wort verlinken, dann im ersten Link Nofollow setzen | Nur der Link am Cursor ändert sich, der zweite bleibt unverändert | |
| A19 | Auswahl über zwei Links | Text markieren, der beide Links umfasst | Schaltfläche **Linkattribute** ist ausgegraut/nicht bedienbar | |
| A20 | Rückgängig | Übernehmen, dann Strg/Cmd + Z | Die Attributänderung wird in **einem** Schritt zurückgenommen, der Text bleibt stehen | |
| A21 | Wiederholen | Strg/Cmd + Umschalt + Z | Attribute sind wieder da | |
| A22 | Speichern und neu laden | Beitrag speichern, Seite neu laden, HTML ansehen | `rel` und `title` stehen weiterhin da — keine Blockvalidierungswarnung („Dieser Block enthält unerwarteten Inhalt") | |
| A23 | Frontend | Beitrag im Frontend ansehen, Quelltext prüfen | `rel` und `title` sind ausgeliefert; Maus auf dem Link zeigt die Kurzinfo | |
| A24 | Kopieren und Einfügen | Verlinkten Text kopieren, in einen neuen Absatz einfügen | Der eingefügte Link bringt `rel` und `title` mit | |
| A25 | Block duplizieren | Blockmenü → Duplizieren | Die Attribute sind im Duplikat vorhanden | |
| A26 | Andere Blocktypen | Dasselbe kurz in Überschrift, Liste und Zitat durchspielen (ein Link, Sponsored + Titel) | Schaltfläche erscheint, Attribute landen im HTML | Liste **erledigt 08.10.**; Überschrift und Zitat offen |
| A27 | Code-Ansicht hin und zurück | Strg/Cmd + Umschalt + Alt + M, zurück in die visuelle Ansicht | Keine Validierungswarnung, Attribute unverändert | |
| A28 | Zusammen mit Textauszeichnung | Einen Teil des Linktextes fett setzen, dann Attribute ändern | Fett bleibt erhalten, Link bleibt ein Element | |
| A29 | Fehlerkonsole | Browser-Konsole während A1–A28 offen halten | Keine Fehler oder Warnungen mit `bft` | |

## D. Zusammenspiel mit Rank Math

Rank Math meldet `core/link` ab und mit einer eigenen Oberfläche wieder an
(`assets/admin/js/gutenberg-formats.js`) und ergänzt im Classic-Dialog
Linktitel, nofollow und sponsored (`assets/admin/js/wplink.js`). Diese Fälle
gibt es deshalb nur auf dieser Seite — sie standen nicht im ursprünglichen
Auftrag.

| # | Fall | Handlung | Erwartet | Beobachtung |
|---|---|---|---|---|
| D1 | Titel überlebt eine Linkänderung | Titel über **Linkattribute** setzen, dann im Rank-Math-Dialog „Set to nofollow" anhaken, Anwenden | HTML enthält **beides**: `title="…"` und `rel="nofollow"` | **erledigt 08.10.** |
| D2 | Rank-Math-Dialog unverändert | Dialog öffnen | Alle Felder von Rank Math sind da, Verhalten wie gewohnt | |
| D3 | sponsored über Rank Math | In Rank Math „Set to sponsored" setzen, dann unser Popover öffnen | Unser Kästchen **Sponsored** ist angehakt — beide lesen dasselbe `rel` | |
| D4 | sponsored zurücknehmen | In Rank Math „Set to sponsored" wieder entfernen, Anwenden | `sponsored` ist weg und bleibt weg (wir schreiben `rel` nicht zurück) | |
| D5 | Adresse ändern | Titel setzen, dann im Rank-Math-Dialog die URL ändern, Anwenden | Neue Adresse, Titel bleibt | |
| D6 | Link entfernen | Titel setzen, dann Verknüpfung entfernen | Kein `<a>` mehr, kein zurückbleibendes `title` irgendwo | |
| D7 | Linktext ändern | Titel setzen, dann im Rank-Math-Dialog den Linktext ändern, Anwenden | Neuer Text; Titel bleibt **oder** ist weg — beides ist vertretbar, aber notieren, was passiert | |

## B. Classic-Editor / Classic-Block (Punkte 33–40)

Vorbereitung für B: einen **Classic-Block** in einen Beitrag einfügen
(Blocksuche → „Classic"), darin Text schreiben und ein Wort über die
Verknüpfen-Schaltfläche verlinken.

| # | Fall | Handlung | Erwartet | Beobachtung |
|---|---|---|---|---|
| B1 | Schaltfläche vorhanden | Werkzeugleiste des Classic-Blocks ansehen | Kettensymbol **Linkattribute** direkt hinter „Verknüpfung entfernen" | |
| B2 | Ausgegraut ohne Link | Cursor in unverlinkten Text | Schaltfläche ist ausgegraut und nicht klickbar | |
| B3 | Aktiv im Link | Cursor in den Link | Schaltfläche wird sofort bedienbar | |
| B4 | Dialog zeigt Bestand | Schaltfläche klicken | TinyMCE-Dialog mit beiden Kästchen und Titelfeld, vorhandene Werte vorbelegt | |
| B5 | Abbrechen | Werte ändern, **Cancel** | Nichts geändert | |
| B6 | Setzen | Sponsored + Nofollow + Titel, **OK** | Über das Zahnrad → „Als HTML bearbeiten" bzw. Registerkarte „Text": `rel="sponsored nofollow"` und `title="…"` | |
| B7 | Entfernen | Beide Haken weg, Titel leeren, OK | Weder `rel` noch `title` am `<a>` — keine leeren Attribute | |
| B8 | Fremde Tokens | Im Text-Modus `rel="noopener"` setzen, zurück, Sponsored setzen | `rel="noopener sponsored"` | |
| B9 | Rückgängig | Nach OK Strg/Cmd + Z | Die Änderung wird als **ein** Schritt zurückgenommen | |
| B10 | Speichern | Beitrag speichern, neu laden, Frontend prüfen | Attribute erhalten, kein Verlust des Blockinhalts | |
| B11 | Fehlerkonsole | während B1–B10 | Keine `bft`-Fehler | |

## C. Lebenszyklus (Punkte 41–48)

| # | Fall | Handlung | Erwartet | Beobachtung |
|---|---|---|---|---|
| C1 | Deaktivieren | Plugin deaktivieren, Beitrag aus A im Editor öffnen | `rel` und `title` stehen weiterhin im HTML, keine Validierungswarnung, Schaltfläche fehlt | |
| C2 | Erneut aktivieren | Aktivieren, Beitrag öffnen | Popover zeigt die gespeicherten Werte wieder an | |
| C3 | Deinstallieren | Auf einer **Testinstallation** löschen | Beiträge unverändert, keine Rückstände (`uninstall.php` tut absichtlich nichts) | |
| C4 | Frontend-Fußabdruck | Frontend-Quelltext nach `bft-advanced-link-attributes` durchsuchen | Kein Treffer — kein Skript, kein Stylesheet | |

---

## Wo wir stehen (Stand 08.10.2026, Abend)

Erledigt: **A1**, **A3**, **A26** (nur Liste), **D1**.

Als Nächstes dran, alles im selben Absatz mit einem Link:
**A4** (keine rechte Seitenleiste), **A5** (Fokus auf dem ersten Feld),
**A6** (Tab-Reihenfolge), **A7/A8/A9** (Abbrechen, Esc, Danebenklicken ändern
nichts), **A2** (Eintrag verschwindet ohne Link). Danach Portion 2 ab **A10**.

Browser-Konsole dabei offen lassen (**A29**).

Seit 09.10. steht `core/freeform` wieder in der Positivliste des Themes
(`bft-child/inc/setup.php`) — der Block „Klassisch" ist also normal über die
Blockauswahl einzufügen, Gruppe B braucht keinen Umweg mehr.

Ebenfalls seit 09.10.: Die Schaltfläche **Linkattribute** sitzt direkt neben
der Link-Schaltfläche, nicht mehr im Aufklappmenü `⌄` (Plugin 1.1.1).
**A1** ist damit erneut zu prüfen.

---

## Ergebnis

* Durchgeführt am: ____________
* Von: ____________
* Offene Abweichungen: ____________
