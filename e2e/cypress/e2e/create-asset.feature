Feature: create

  Background:
    Given The user is logged in
    And User has editor permissions
    And User has admin permissions
    And Elastic index is created


  Scenario: User creates the asset
    When A user clicks the Create Asset menu button
    Then The user should see the Create Asset form
    And The user fills out general information
    And The user clicks the save button
    Then The asset is created
