Feature: User edit

@mutation
Scenario: Admin can edit asset after adding workgroup membership
  Given the application has been accessed as "admin"
  And an asset from workgroup "Swisstopo" has been selected
  Then the edit button should not be visible
  When the admin navigates to the settings panel
  And the admin user is selected
  And the "Swisstopo" workgroup is added with role "Editor"
  And the admin navigates back to the viewer
  Then the edit button should be visible

