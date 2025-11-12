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

Scenario: The default workgroup is not shown for the "admin" user
  Given the application has been accessed as "admin"
  Then no workgroups are visible
