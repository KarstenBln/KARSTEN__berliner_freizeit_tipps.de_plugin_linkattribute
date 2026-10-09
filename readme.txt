=== BFT Advanced Link Attributes ===
Contributors: karstenwachholz
Tags: links, rel, sponsored, nofollow, editor
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.1.2
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Ergänzt die Linkbearbeitung im Block- und im Classic-Editor um sponsored, nofollow und einen Link-Titel.

== Description ==

Redakteure setzen zusätzliche Linkattribute direkt dort, wo sie den Link im Text auswählen:

* `rel="sponsored"` für Werbe- und Affiliate-Links
* `rel="nofollow"`
* `title="…"` als Kurzinfo

Das Plugin ersetzt keine Blöcke und verändert die vorhandene Linkbearbeitung von WordPress nicht. Es fügt eine eigene Schaltfläche **Linkattribute** zur Werkzeugleiste hinzu, die erscheint, sobald der Cursor in einem Link steht.

= Wie es arbeitet =

Die Attribute werden in das vorhandene Link-Format von WordPress geschrieben, nicht in ein eigenes. Dadurch können keine verschachtelten `<a>`-Elemente und keine konkurrierenden Linkformate entstehen.

Gespeichert wird ausschließlich im HTML des Beitrags. Es gibt keine eigenen Datenbanktabellen, keine Post-Meta-Felder und keine unsichtbaren Zusatzblöcke.

= Was es nicht tut =

* Kein JavaScript und kein CSS im Frontend
* Keine Hintergrundprozesse, keine Cronjobs
* Keine Anfragen an fremde Server
* Keine automatische Änderung vorhandener Beiträge bei Installation, Aktivierung, Deaktivierung oder Deinstallation
* Keine SEO-Vorschläge und keine Warnhinweise — die Entscheidung bleibt bei der Redaktion

= Unterstützte Blöcke =

Alle Core-Blöcke mit RichText-Linkbearbeitung, darunter Absatz, Überschrift, Liste, Zitat und Pullquote. Dazu der Classic-/Freeform-Block über ein eigenes, unabhängiges Modul.

Der Button-Block (`core/button`) wird **nicht** unterstützt, siehe „Bekannte Einschränkungen".

== Installation ==

1. ZIP-Archiv unter Plugins → Installieren → Plugin hochladen auswählen.
2. Aktivieren.

Es gibt keine Einstellungsseite. Das Plugin ist sofort einsatzbereit.

== Frequently Asked Questions ==

= Bleibt der Titel erhalten, wenn ich den Link danach bearbeite? =

Ja. Die Linkbearbeitung von WordPress baut ihr Format bei jeder Änderung neu auf und kennt kein `title` — ohne Zutun wäre der Titel danach weg. Das Plugin legt sich deshalb um die vorhandene Linkbearbeitung und trägt den Titel wieder ein. Die Oberfläche selbst bleibt unverändert, auch wenn ein anderes Plugin sie ersetzt hat.

Nicht zurückgeholt werden `rel`-Tokens: welche dort stehen, entscheidet die Oberfläche, die gerade bedient wird.

= Was passiert mit den Attributen, wenn ich das Plugin deaktiviere? =

Nichts. Sie stehen im HTML des Beitrags und werden im Frontend weiterhin ausgeliefert. Zum Bearbeiten brauchst du das Plugin wieder.

= Bleiben vorhandene rel-Werte erhalten? =

Ja. Das Plugin ändert ausschließlich die Tokens `sponsored` und `nofollow`. Werte wie `noopener`, `noreferrer` oder `ugc` bleiben unverändert und behalten ihre Reihenfolge.

= Was ist mit Affiliate-Links mit Tracking-Parametern? =

Die Adresse wird nie angefasst. Das Plugin ändert nur `rel` und `title`.

== Known limitations ==

Siehe CHANGELOG.md und die Architekturdokumentation im Repository.

== Changelog ==

= 1.1.2 =
* Eigenes Symbol statt der Kette, die schon „Link einfügen/ändern" trägt.

= 1.1.1 =
* Die Schaltfläche sitzt jetzt direkt neben der Link-Schaltfläche statt im Aufklappmenü.

= 1.1.0 =
* Der Link-Titel überlebt jetzt auch, wenn der Link danach über die Linkbearbeitung geändert wird.

= 1.0.4 =
* Behoben: Jeder Block mit Text meldete im Editor „In diesem Block ist ein Fehler aufgetreten".

= 1.0.3 =
* Behoben: Nach einem Update lud der Browser weiter das alte Classic-Bundle.

= 1.0.2 =
* Behoben: Das Classic-Modul brach beim Start mit „Failed to initialize plugin: bftlinkattrs" ab.

= 1.0.1 =
* Behoben: Jede wp-admin-Seite lief in eine Endlosschleife der Skriptauflösung (Gateway Timeout).

= 1.0.0 =
* Erste Fassung.
