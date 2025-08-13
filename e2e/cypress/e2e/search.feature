Feature: search

  Background:
    Given The user is logged in
    And User has editor permissions
    And Elastic index is created
    And Test asset is created

  Scenario: Search for test asset as editor or higher
    Given User has editor permissions
    When A user types CypressTestAsset into the search field
    And The user clicks enter
    Then The user should see the asset in results
    And The asset should display all relevant attributes
    And The footer should be visible as well as the edit asset button

  Scenario: Details as a reader
    Given User has reader permissions
    When A user types CypressTestAsset into the search field
    And The user clicks enter
    Then The user should see the asset in results
    And The footer should not be visible
