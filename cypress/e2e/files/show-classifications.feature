Feature: Show Classifications

Background:
  Given the application has been accessed as "reader"
  And an asset with a PDF has been selected
  And the asset's details contain its PDF

Scenario: Show file in asset detail
  Then the PDF shows its page number
  And the PDF shows all of its languages
  And the PDF shows all of its page categories

Scenario: Show table of contents for file
  When the PDF's table of contents is toggled
  Then the table becomes visible
  And the table lists the file's classifications

