#!/usr/bin/env bash
#
# Baut das installierbare ZIP-Archiv.
#
# Enthalten ist nur, was WordPress zur Laufzeit braucht: PHP-Dateien, der
# fertige Build und die Sprachdateien. Quellcode, node_modules und die
# Bauwerkzeuge bleiben draussen — das Archiv laesst sich damit ohne Node.js
# direkt ueber die Plugin-Verwaltung installieren.
set -euo pipefail

SLUG="bft-advanced-link-attributes"
WURZEL="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
VERSION="$( grep -m1 "^ \* Version:" "$WURZEL/$SLUG.php" | tr -d ' ' | cut -d: -f2 )"
AUSGABE="$WURZEL/$SLUG-$VERSION.zip"

if [ ! -f "$WURZEL/build/gutenberg.js" ]; then
	echo "Kein Build vorhanden. Erst 'npm run build' ausfuehren." >&2
	exit 1
fi

TMP="$( mktemp -d )"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/$SLUG"
cd "$WURZEL"

cp "$SLUG.php" uninstall.php readme.txt CHANGELOG.md "$TMP/$SLUG/"
cp -R includes build "$TMP/$SLUG/"
[ -d languages ] && cp -R languages "$TMP/$SLUG/"

rm -f "$AUSGABE"
cd "$TMP"
zip -rq "$AUSGABE" "$SLUG" -x '*.DS_Store'

echo "Erstellt: $AUSGABE"
unzip -l "$AUSGABE" | tail -n 3
