Feature: Elastic index

  Background:
    Given The user is logged in
    Given User has admin permissions
    
  Scenario: User creates elastic index
    When A user clicks administration menu button
    And The user clicks start sync button
    Then The user should see the sync progress
