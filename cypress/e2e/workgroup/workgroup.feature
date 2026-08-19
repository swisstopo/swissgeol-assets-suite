Feature: Workgroup

Scenario Outline: The default workgroup is shown for the "<username>" user
  Given the application has been accessed as "<username>"
  Then the "Swisstopo" workgroup is visible

  Examples:
    | username  |
    | publisher |
    | reviewer  |
    | editor    |
    | reader    |

Scenario: The default workgroup is not selectable for the "admin" user
  Given the application has been accessed as "admin"
  Then the "Swisstopo" workgroup is visible
  And no workgroup is selectable
