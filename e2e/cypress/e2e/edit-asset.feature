Feature: edit

  Background:
    Given The user is logged in
    And User has admin permissions
    And User has editor permissions
    And Elastic index is created
    And Test asset is created

    @login
  Scenario: Edit asset
    When A user types CypressTestAsset into the search field
    And The user clicks enter
    Then The user should see the asset in results
    And The user selects asset from the results
    Then The user should see asset details
    And The user clicks edit button
    And The user edits asset information
    And The user clicks save
    Then The changes are saved
