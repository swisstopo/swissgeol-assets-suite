import * as fs from 'fs/promises';

import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { Ord as OrdString } from 'fp-ts/string';

export const addPostInitMigration = async () => {
  const filesAndDirs = await fs.readdir('./migrations', { withFileTypes: true });
  const newDirAfterInit = pipe(
    filesAndDirs,
    A.filter((f) => f.isDirectory()),
    A.map((f) => f.name),
    A.filter((f) => f.endsWith('_init')),
    A.sort(OrdString),
    A.head,
    O.map((f) => `./migrations/${Number(f.substring(0, 14)) + 1}_post-init`),
  );

  if (O.isNone(newDirAfterInit)) {
    throw new Error('No migration directory found');
  } else {
    await fs.mkdir(newDirAfterInit.value);
    await fs.writeFile(`${newDirAfterInit.value}/migration.sql`, postInitSql);
  }
};

const postInitSql = `
CREATE VIEW public.all_study 
AS
SELECT study_area.asset_id,
   concat('study_area_', study_area.study_area_id::text) AS study_id,
   study_area.study_area_id AS id,
   study_area.geom,
   study_area.geom = st_centroid(study_area.geom) AS is_point,
   st_astext(st_centroid(study_area.geom)) AS centroid_geom_text,
   st_astext(study_area.geom) AS geom_text
  FROM study_area
UNION ALL
SELECT study_location.asset_id,
   concat('study_location_', study_location.study_location_id::text) AS study_id,
   study_location.study_location_id AS id,
   study_location.geom,
   study_location.geom = st_centroid(study_location.geom) AS is_point,
   st_astext(st_centroid(study_location.geom)) AS centroid_geom_text,
   st_astext(study_location.geom) AS geom_text
  FROM study_location
UNION ALL
SELECT study_trace.asset_id,
   concat('study_trace_', study_trace.study_trace_id::text) AS study_id,
   study_trace.study_trace_id AS id,
   study_trace.geom,
   study_trace.geom = st_centroid(study_trace.geom) AS is_point,
   st_astext(st_centroid(study_trace.geom)) AS centroid_geom_text,
   st_astext(study_trace.geom) AS geom_text
  FROM study_trace;
  
alter table auth.users drop column confirmed_at;
alter table auth.users add column confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED;

insert into auth.schema_migrations(version) values('00');
insert into auth.schema_migrations(version) values('20210710035447');
insert into auth.schema_migrations(version) values('20210722035447');
insert into auth.schema_migrations(version) values('20210730183235');
insert into auth.schema_migrations(version) values('20210909172000');
insert into auth.schema_migrations(version) values('20210927181326');
insert into auth.schema_migrations(version) values('20211122151130');
insert into auth.schema_migrations(version) values('20211124214934');
insert into auth.schema_migrations(version) values('20211202183645');
insert into auth.schema_migrations(version) values('20220114185221');
insert into auth.schema_migrations(version) values('20220114185340');
insert into auth.schema_migrations(version) values('20220224000811');
insert into auth.schema_migrations(version) values('20220323170000');
insert into auth.schema_migrations(version) values('20220429102000');
insert into auth.schema_migrations(version) values('20220531120530');
insert into auth.schema_migrations(version) values('20220614074223');
`;

(async function main() {
  await addPostInitMigration();
})();
