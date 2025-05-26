-- AlterTable
ALTER TABLE "asset"
  ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;

/*
 Migrate assets to the new publication workflow
 See https://github.com/swisstopo/swissgeol-assets-suite/issues/499#issuecomment-2894634488
 */
DO
$$
  DECLARE
    swisstopo_workgroup_id int;
    assets_to_publish      int[];
    default_assignee_id    uuid;
    rec                    record;
  BEGIN
    RAISE NOTICE 'Get ID for swisstopo workgroup';
    SELECT id
    FROM workgroup
    WHERE name = 'Swisstopo'
    INTO swisstopo_workgroup_id;

    RAISE NOTICE 'Get ID for default assignee';
    SELECT id FROM asset_user WHERE email = 'marcel.pfiffner@swisstopo.ch' INTO default_assignee_id;

    /*
    Set the workflow for all IDs that are not in assets_to_publish to DRAFT. To make sure any changes that happened during
    development, we reset the status of all workflows and associated changes to draft and unpublished.
     */
    RAISE NOTICE 'Set workflow status to draft and unpublish all selections, remove existing workflow changes';
    UPDATE workflow
    SET has_requested_changes = false,
        status                = 'Draft';
    UPDATE workflow_selection
    SET general      = false,
        normal_files = false,
        legal_files  = false,
        authors      = false,
        initiators   = false,
        suppliers    = false,
        "references" = false,
        geometries   = false,
        legacy       = false;
    TRUNCATE workflow_change;

    /*
    All assets that are currently published, should still be published. This means that the condition from the sync service
    should be used to select assets that should be published and have the is_public column set to true.
    */
    RAISE NOTICE 'Update currently published assets to new workflow model';
    RAISE NOTICE '-> Get assets that are currently published';
    SELECT ARRAY_AGG(a.asset_id)
    INTO assets_to_publish
    FROM asset a
           LEFT JOIN public_use p ON a.public_use_id = p.public_use_id
           LEFT JOIN LATERAL (SELECT *
                              FROM status_work
                              WHERE asset_id = a.asset_id
                              ORDER BY status_work_date
                                DESC
                              LIMIT 1) AS sw
                     ON a.asset_id = sw.asset_id
    WHERE p.is_available
      AND p.status_asset_use_item_code = 'approved'
      AND sw.status_work_item_code = 'published'
      AND workgroup_id = swisstopo_workgroup_id;
    RAISE NOTICE '-> Found % assets that are currently published', array_length(assets_to_publish, 1);

    RAISE NOTICE '-> Updating is_public to true';
    UPDATE asset
    SET is_public = true
    WHERE asset_id = ANY (assets_to_publish);

    /*
    For assets that are currently published, we assign Marcel as editor, check all boxes as reviewed and a subset as
    published, and set the general workflow status as published. Finally, create a history entry that shows this process.
    Subset = Contacts, Rechtliche Einwilligungen and legacy data should not be published.
     */
    RAISE NOTICE '-> Assign published workflows to Marcel and set status to Published';
    UPDATE workflow
    SET assignee_id = default_assignee_id,
        status      = 'Published'
    WHERE id = ANY (assets_to_publish);

    RAISE NOTICE '-> Update workflow selection for reviews to true for all selections for published workflows';
    UPDATE workflow_selection
    SET general      = true,
        normal_files = true,
        legal_files  = true,
        authors      = true,
        initiators   = true,
        suppliers    = true,
        "references" = true,
        geometries   = true,
        legacy       = true
    WHERE id IN (SELECT review_id FROM workflow WHERE id = ANY (assets_to_publish));

    RAISE NOTICE '-> Update workflow selection for approvals to true for a subselection for published workflows';
    UPDATE workflow_selection
    SET general      = true,
        normal_files = true,
        "references" = true,
        geometries   = true
    WHERE id IN (SELECT approval_id FROM workflow WHERE id = ANY (assets_to_publish));

    RAISE NOTICE '-> Create history entry for published changes';
    FOR rec IN (SELECT * FROM asset WHERE asset_id = ANY (assets_to_publish))
      LOOP
        INSERT INTO workflow_change (comment, from_status, to_status, to_assignee_id, workflow_id)
        VALUES ('Initial workflow migration', 'Draft', 'Published', default_assignee_id, rec.asset_id);
      END LOOP;
    RAISE NOTICE '--> Published workflows migrated!';

    /*
    For assets that are currently public, but not published, set them to is_public.
     */
    RAISE NOTICE 'Update currently non-published public assets to new workflow model';
    UPDATE asset
    SET is_public = true
    WHERE asset_id <> ANY (assets_to_publish)
      AND asset_id IN (SELECT asset_id
                       FROM asset a
                              LEFT JOIN public_use p ON a.public_use_id = p.public_use_id
                       WHERE p.is_available = true);

    /*
    Finally, for all assets that are NOT published, set the assignee to the person that last edited the asset
     */
    RAISE NOTICE 'Update assignees for public non-published workflows as well as internal workflows';
    FOR rec IN (SELECT a.asset_id, u.id, a.processor
                FROM asset a
                       LEFT JOIN asset_user u ON a.processor = u.email
                WHERE a.asset_id <> ANY (assets_to_publish)
                  AND a.processor IS NOT NULL
                  AND u.id IS NOT NULL)
      LOOP
        UPDATE workflow SET assignee_id = rec.id WHERE id = rec.asset_id;
      END LOOP;
  END
$$;
