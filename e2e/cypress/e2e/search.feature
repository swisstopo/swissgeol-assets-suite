Feature: search

  Background:
    Given The user is logged in

  Scenario: Search for test information
    When A user types information into the search field
    And The user clicks enter
    Then The user should see a test information in results