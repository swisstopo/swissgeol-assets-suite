# Changelog

## [Unreleased]

### Added

### Changed

### Fixed

## v1.8.0

### Added

- Benutzer, die nicht mehr in der entsprechenden Cognito-Gruppe existieren, werden nächtlich aus der Datenbank gelöscht und können sich nicht mehr einloggen.

### Changed

- Wenn man das Bearbeitungsformular eines Assets schliesst, landet man neu auf der Startseite der Applikation.
- Rätoromanisch wurde als Sprache entfernt.

### Fixed

- Alternativ-Ids im Bearbeitungsformular können nun korrekt bearbeiten werden.
- Bearbeitete Assets werden nun korrekt im UI angezeigt, ohne dass ein Neuladen der Seite notwendig ist.

## v1.7.0

### Added

- Assets können nun als Favoriten markiert und wiedergefunden werden
- Ein disclaimer wird auf der Startseite angezeigt
- Assets können gelöscht werden

### Changed

- Verweise sind nur noch zu Assets in derselben Workgroups möglich
- Die Hintergrundkarte kann weiter herausgezoomt werden

### Fixed

## v1.6.0

### Added

### Changed

### Fixed

- Asset Detailansicht bleibt nicht mehr bestehen nach einem Suchreset

## v1.5.0

### Added

- Anonymer Modus für view-assets
- Synchronisations-Service zwischen verschiedenen Instanzen prod, prod-extern, prod-view
- Dokumente für rechtliche Einwilligungen (_Legal Docs_) können nun separat von normalen Dateien
  hochgeladen und angezeigt werden. Diese Einwilligungen können zusätzlich mit einem Typ versehen werden,
  der die Art von Dokument wiederspiegelt.

### Changed

- Admins haben nun auf alle Arbeitsgruppen Leserechte anstatt Schreibrechte - für das Schreiben muss ein Admin sich der Arbeitsgruppe hinzufügen
- Der Button für Polygon-Filter ist nun links bei den restlichen Filtern
- Dependency Updates
- Existierende Dateien, welche mit `_LDoc.pdf` enden,
  wurden als rechtliche Einwilligung mit Typ `permissionForm` markiert.
- PDFs werden mit dem neuen [OCR Service](https://github.com/swisstopo/swissgeol-ocr) verarbeitet, um den Text zu extrahieren
- Sidebar und Header wurden entsprechend dem neuen UI/UX Konzept überarbeitet

### Fixed

- Benutzer mit Underscore in der Email können nun auch auf die Appliation zugreifen
- Die Trefferzahlen bei Filtern spiegeln nun die tatsächliche Anzahl der Treffer wieder - davor wurden nicht alle Werte beachtet
- Navigation der Applikation über vorwärts und rückwärts Buttons behält nun den Suchstatus bei
- Eine benutzerfreundliche Fehlermeldung wird angezeigt, wenn beim erstellen einer neuen Workgroup der Name bereits verwendet wird

## v1.4.0

### Added

- Suchfilter zeigen Anzahl Ergebnisse und sind inital verfügbar
- Mehrsprachigkeit von Assets
- Versionsnummer der Applikation wird angezeigt
- Direktauswahl von Assets ohne Suche
- Testing
- Regeneriere Elasticsearch Index via Admin Panel
- Einteilung von Assets in Arbeitsgruppen

### Changed

- UI Refactoring: Neuanordnung der Container
- UI Refactoring: Suchergebnisse als Tabelle
- Update Dependencies
- Bearbeitungsrechte werden auf Basis der Arbeitsgruppen vergeben anstatt global

### Fixed

- Error Handling
