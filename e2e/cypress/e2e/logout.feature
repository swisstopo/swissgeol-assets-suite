Feature: logout

  Background:
    Given The user is logged in

  Scenario: Logout
    When The user clicks profile menu button
    And The user clicks logout button
    Then The user should see logout page