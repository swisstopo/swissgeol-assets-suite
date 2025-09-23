Feature: Show Classifications

Scenario: Display file in asset's detail
  Given the application has been accessed as "reader"
  And an asset with a PDF has been selected
  Then the asset's details contain its PDF
  And the PDF shows its page number
  And the PDF shows all of its classifications
