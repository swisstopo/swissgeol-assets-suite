Feature: Login

Scenario: Redirect to external sign in mask
  When the application is visited
  Then the user is redirected to the sign in mask

Scenario Outline: Sign in with authorized user "<username>"
  When the application is visited
  And the user is redirected to the sign in mask
  And the username "<username>" is entered
  And the password "<password>" is entered
  And the confirm button is clicked
  Then the sign in mask redirects to the application
  And the user "<full name>" is signed in

  Examples:
    | username  | password  | full name      |
    | admin     | admin     | Admin Istrator |
    | publisher | publisher | Pub Lisher     |
    | reviewer  | reviewer  | Re Viewer      |
    | editor    | editor    | Edit Or        |
    | reader    | reader    | Rea Der        |

Scenario: Sign in with unauthorized user
  When the application is visited
  And the user is redirected to the sign in mask
  And the username "illegal" is entered
  And the password "illegal" is entered
  And the confirm button is clicked
  Then the user is redirected to the unauthorized mask

Scenario: Cancel sign in
  When the application is visited
  And the user is redirected to the sign in mask
  And the cancel button is clicked
  Then the user is redirected to the welcome mask
  When the user clicks the login button
  Then the user is redirected to the sign in mask
