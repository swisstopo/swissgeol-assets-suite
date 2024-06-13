Feature: search

  Background:
    Given The user is logged in
    And Test asset is created
    And Elastic index is created

  Scenario: Search for test asset
    When A user types CypressTestAsset into the search field
    And The user clicks enter
    Then The user should see the asset in results
