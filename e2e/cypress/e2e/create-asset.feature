Feature: create

  Background:
    Given The user is logged in
    And User has admin permissions
    And Test data is imported
    And Elastic index is created


  Scenario: User creates the asset
    When A user clicks the administration menu button
    And The user clicks the Create Asset button
    Then The user should see the Create Asset form
    And The user fills out general information
    And The user fills out usage information
    And The user fills out contacts information
    And The user fills out geometry information 
    And The user fills out administration information
    And The user clicks the save button
    Then The asset is created