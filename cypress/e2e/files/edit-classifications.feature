Feature: Edit Classifications

Background:
  Given the application has been accessed as "editor"
  And an asset with a PDF has been selected
  And the user navigates to the asset's edit files page
  And a PDF's page range editor is opened

Scenario: Display page ranges
  Then the file's page ranges are displayed

@mutation
Scenario: Change page range categories
  When a range's category select is opened
  And the active categories are deselected
  And the category "Titelseite" is selected
  And the category "Tabelle" is selected
  And the page range changes are saved
  And the editor's changes are saved
  And the page is reloaded
  And a PDF's page range editor is opened
  Then the page range has the category "Titelseite"
  Then the page range has the category "Tabelle"
