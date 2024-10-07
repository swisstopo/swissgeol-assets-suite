# Changelog

## [Unreleased]

### Added

- Anonymer Modus für view-assets
- Synchronisations-Service zwischen verschiedenen Instanzen prod, prod-extern, prod-view

### Changed

- Admins haben nun auf alle Arbeitsgruppen Leserechte anstatt Schreibrechte - für das Schreiben muss ein Admin sich der Arbeitsgruppe hinzufügen
- Der Button für Polygon-Filter ist nun links bei den restlichen Filtern
- Dependency Updates

### Fixed

- Benutzer mit Underscore in der Email können nun auch auf die Appliation zugreifen
- Die Trefferzahlen bei Filtern spiegeln nun die tatsächliche Anzahl der Treffer wieder - davor wurden nicht alle Werte beachtet
- Navigation der Applikation über vorwärts und rückwärts Buttons behält nun den Suchstatus bei

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
