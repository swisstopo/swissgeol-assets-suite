Feature: Login

Scenario: Redirect to external sign in mask
  When the application is visited
  Then the user is redirected to the sign in mask
