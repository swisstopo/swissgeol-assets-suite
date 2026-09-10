-- VERIFIED codelist migration
-- Merges/renames Topic, Kind and Format codelists and migrates asset references.
-- Generated from swissgeol_codelist_migration_spec_VERIFIED.json (rich-text code strikethrough preserved).
-- No workflow/status field is modified.

BEGIN;

-- Abort on removed Kind values that have no defined migration target.
DO $$
DECLARE
  v_code text;
  v_count bigint;
BEGIN
  FOREACH v_code IN ARRAY ARRAY['configuration', 'package', 'shotpointmap']
  LOOP
    SELECT COUNT(*) INTO v_count FROM asset WHERE asset_kind_item_code = v_code;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'Cannot remove asset kind %: % asset(s) still reference it and no target mapping is specified.', v_code, v_count;
    END IF;
  END LOOP;
END $$;

-- =============================================================
-- TOPIC target reference rows
-- =============================================================

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('borehole', 'No-GeolCode-specified', 'Borehole', 'Bohrungen', 'Forages', 'Perforazioni', 'Boreholes', 'Assets on the topic of boreholes, e.g. borehole profiles and reports', 'Assets zum Thema Bohrungen, z.B. Bohrprofile und Berichte zu Bohrungen', 'Assets sur le thème des forages, p. ex. profils et rapports de forage', 'Elementi sul tema della perforazione, ad esempio profili e rapporti di perforazione.', 'Assets on the topic of boreholes, e.g. borehole profiles and reports')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('deepPlanning', 'No-GeolCode-specified', 'Deep planning', 'Tiefenplanung (Tiefenlager, CO₂-Sequestrierung)', 'Planification souterraine (stockage en profondeur, séquestration du CO₂)', 'Pianificazione sottosuolo profondo (deposito sotterraneo, sequestro di CO₂)', 'Deep subsurface planning (geological storage, CO₂ sequestration)', 'Assets on the topic of deep subsuface planning (geological storage, CO₂ sequestration)', 'Assets zum Thema Tiefenplanung, insb. Tiefenlagerung und CO₂-Sequestrierung', 'Assets sur le thème de la planification souterraine (stockage en profondeur, séquestration du CO₂)', 'Elementi relative alla pianificazione sotterranea, in particolare allo stoccaggio sotterraneo e al sequestro di CO₂', 'Assets on the topic of deep subsurface planning (geological storage, CO₂ sequestration)')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('drillingTechnology', 'No-GeolCode-specified', 'Drilling technology', 'Bohrtechnik', 'Technique de forage', 'Tecnica di perforazione', 'Drilling technology', 'Assets on the topic of drilling technology', 'Assets zum Thema Bohrtechnik', 'Assets sur le thème de la technique de forage', 'Elementi sul tema della tecnica di perforazione', 'Assets on the topic of drilling technology')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('energyRessources', 'No-GeolCode-specified', 'Energy ressources', 'Geoenergie / Geothermie / Energierohstoffe (Erdöl/Erdgas/Kohle)', 'Géoénergie / géothermie / matières premières énergétiques (pétrole/gaz naturel/charbon)', 'Geoenergia / energia geotermica / risorse energetiche (petrolio/gas naturale/carbone)', 'Geoenergy / geothermal energy / energy resources (oil/natural gas/coal)', 'Geoenergy assets, e.g. geothermal energy, energy resources (oil, gas, coal), etc.', 'Assets zum Thema Geoenergie, wie z.B. Geothermie, Energierohstoffe (Erdöl, Erdgas, Kohle), etc.', 'Assets sur le thème des géoénergies, p. ex. géothermie, matières premières énergétiques (pétrole, gaz naturel, charbon), etc.', 'Elementi sul tema della geoenergia, ad esempio energia geotermica, risorse energetiche (petrolio, gas, carbone), ecc.', 'Geoenergy assets, e.g. geothermal energy, energy resources (oil, gas, coal), etc.')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('explorationProspection', 'No-GeolCode-specified', 'Exploration / Prospection', 'Exploration / Prospektion (z.B. Rohstoffe)', 'Exploration / Prospection (par exemple matières premières)', 'Esplorazione / Prospezione (ad es. materie prime)', 'Exploration / Prospecting (e.g. raw materials)', 'Assets on the topic of exploration and prospection, e.g. of minerals and raw materials', 'Assets zum Thema Exploration und Prospektion, wie z.B. von mineralischen Rohstoffen', 'Assets sur le thème de l''exploration et prospection, p. ex. ressources minérales', 'Elementi sul tema dell''esplorazione e prospezione, ad es. di materie prime minerali', 'Assets on the topic of exploration and prospection, e.g. of minerals and raw materials')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('geophysics', 'No-GeolCode-specified', 'Geophysics', 'Geophysik', 'Géophysique', 'Geofisica', 'Geophysics', 'Assets on the topic of geophysics', 'Assets zum Thema Geophysik', 'Assets sur le thème de la géophysique', 'Elementi sul tema della geofisica', 'Assets on the topic of geophysics')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('geotechnics', 'No-GeolCode-specified', 'Geotechnics', 'Geotechnik / Baugrund (inkl. Tunnel-/Untertagebau)', 'Géotechnique / Sol de fondation (y compris construction de tunnels et travaux souterrains)', 'Geotecnica / Terreni di fondazione (comprese gallerie e opere sotterranee)', 'Geotechnics / Ground conditions (including tunnelling and underground construction)', 'Assets on the topic of geotechnics, Ground conditions (including tunnelling and underground construction)', 'Assets zum Thema Geotechnik, Baugrund (inkl. Tunnel- und Untertagebau)', 'Assets sur le thème de la géotechnique et sol de fondation (y compris construction de tunnels et travaux souterrains)', 'Elementi sul tema della geotecnica e del terreno di fondazione (comprese le gallerie e le opere sotterranee)', 'Assets on the topic of geotechnics, Ground conditions (including tunnelling and underground construction)')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('hydrogeology', 'No-GeolCode-specified', 'Hydrogeology', 'Hydrogeologie', 'Hydrogéologie', 'Idrogeologia', 'Hydrogeology', 'Assets on the topic of hydrogeology', 'Assets zum Thema Hydrogeologie', 'Assets sur le thème de l''hydrogéologie', 'Elementi sul tema dell''idrogeologia', 'Assets on the topic of hydrogeology')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('mineralRessources', 'No-GeolCode-specified', 'Mineralressources', 'Mineralische Rohstoffe', 'Matières premières minérales', 'Risorse minerali', 'Mineral Resources', 'Assets on the topic of mineral resources (incl. mining, quarries, gravel pits, etc.)', 'Assets zum Thema Mineralische Rohstoffe (inkl. Bergbau, Steinbruch, Kiesgrube etc.)', 'Assets sur le thème des ressources minérales (y compris exploitation minière, carrières, gravières, etc.)', 'Elementi sul tema delle risorse minerali (incluse miniere, cave di roccia, cave di ghiaia, ecc.)', 'Assets on the topic of mineral resources (incl. mining, quarries, gravel pits, etc.)')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('naturalHazards', 'No-GeolCode-specified', 'Natural hazards', 'Naturgefahren', 'Dangers naturels', 'Rischi naturali', 'Natural hazards', 'Assets on the topic of natural hazards', 'Assets zum Thema Naturgefahren', 'Assets sur le thème des dangers naturels', 'Elementi sul tema dei rischi naturali', 'Assets on the topic of natural hazards')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('other', 'No-GeolCode-specified', 'Other', 'Andere', 'Autres', 'Altro', 'Other', 'Assets on other topics not covered by the values in this list', 'Assets zu anderen Themen, die nicht mit den Werten dieser Liste abgedeckt sind', 'Assets sur d''autres thèmes qui ne sont pas couverts par les valeurs de cette liste', 'Elementi su altri argomenti non coperti dai valori di questo elenco', 'Assets on other topics not covered by the values in this list')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('palaeontology', 'No-GeolCode-specified', 'Palaeontology', 'Paläonthologie', 'Paléontologie', 'Paleontologia', 'Palaeontology', 'Assets on the topic of palaeontology', 'Assets zum Thema Paläonthologie', 'Assets sur le thème de la paléontologie', 'Elementi sul tema della paleontologia', 'Assets on the topic of palaeontology')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('petrophysics', 'No-GeolCode-specified', 'Petrophysics', 'Petrophysik', 'Pétrophysique', 'Petrofisica', 'Petrophysics', 'Assets on the topic of petrophysics', 'Assets zum Thema Petrophysik', 'Assets sur le thème de la pétrophysique', 'Elementi sul tema della petrofisica', 'Assets on the topic of petrophysics')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('pollution', 'No-GeolCode-specified', 'Pollution', 'Belastete Standorte', 'Sites contaminés', 'Siti contaminati', 'Contaminated sites', 'Assets on the topic of contaminated sites', 'Assets zum Thema belastete Standorte', 'Assets sur le thème des sites contaminés', 'Elementi sul tema dei siti contaminati', 'Assets on the topic of contaminated sites')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('science', 'No-GeolCode-specified', 'Science', 'Wissenschaftliche Arbeiten / Publikationen', 'Travaux scientifiques / Publications', 'Tesi scientifiche / Pubblicazioni', 'Scientific theses / Publications', 'Assets in the form of a scientific thesis and publications', 'Assets in Form einer wissenschaftlichen Arbeit respektive einer Publikation', 'Assets sous la forme de travaux scientifiques et de publications', 'Elementi in forma di lavoro scientifico o pubblicazione', 'Assets in the form of a scientific thesis and publications')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('stratigraphy', 'No-GeolCode-specified', 'Stratigraphy', 'Litho- / Chronostratigraphie', 'Lithostratigraphie / chronostratigraphie', 'Litostratigrafia / Cronostratigrafia', 'Lithostratigraphy / Chronostratigraphy', 'Assets on the topic of lithostratigraphy and chronostratigraphy', 'Assets zu den Themen Litho- und Chronostratigraphie', 'Assets sur les thèmes de la lithostratigraphie ou de la chronostratigraphie.', 'Elementi sui temi della litostratigrafia e della cronostratigrafia', 'Assets on the topic of lithostratigraphy and chronostratigraphy')
ON CONFLICT (man_cat_label_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

-- =============================================================
-- KIND target reference rows
-- =============================================================

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('2Dseismic', 'No-GeolCode-specified', '2D seismic', '2D-Seismik', 'Sismique 2D', 'Sismica 2D', '2D seismic', 'Data from 2D seismic surveys (2D seismic)', 'Daten aus 2D-seismischen Untersuchungen (2D-Seismik)', 'Données issues d''études sismiques en 2D (sismique 2D)', 'Dati provenienti da indagini sismiche bidimensionali (sismica 2D)', 'Data from 2D seismic surveys (2D seismic)')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('3Dseismic', 'No-GeolCode-specified', '3D seismic', '3D-Seismik', 'Sismique 3D', 'Sismica 3D', '3D seismic', 'Data from 3D seismic surveys (3D seismic)', 'Daten aus 3D-seismischen Untersuchungen (3D-Seismik)', 'Données issues d''études sismiques en 3D (sismique 3D)', 'Dati provenienti da indagini sismiche tridimensionali (sismica 3D)', 'Data from 3D seismic surveys (3D seismic)')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('boreholeCompletion', 'No-GeolCode-specified', 'Borehole completion', 'Bohrlochausbau', 'Aménagement du forage', 'Completamento della perforazione', 'Borehole completion', 'Details of casing, backfill, internals (e.g. piezometer), etc.', 'Angaben zu Verrohrung, Hinterfüllung, Einbauten (z.B. Piezometer), etc.', 'Informations sur le tubage, le remblayage, les équipements (p. ex. piézomètre), etc.', 'Dettagli del tipo di tubatura, del riempimento, dei componenti interni (ad es. piezometro), ecc.', 'Details of casing, backfill, internals (e.g. piezometer), etc.')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('boreholePath', 'No-GeolCode-specified', 'Borehole path', 'Bohrpfad', 'Trajectoire de forage', 'Traiettoria di perforazione', 'Borehole path', 'Information on the spatial path of the borehole', 'Angaben zum räumlichen Verlauf der Bohrung', 'Informations sur le tracé spatial du forage', 'Informazioni sulla traiettoria della perforazione', 'Information on the spatial path of the borehole')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('boreholeProfile', 'No-GeolCode-specified', 'Borehole profile', 'Bohrprofil', 'Profil de forage', 'Profilo della perforazione', 'Borehole profile', 'Representation of the drilled layers, layer interpretations and further information on the borehole', 'Darstellung der erbohrten Schichten, Schichtinterpretationen und weiteren Angaben zur Bohrung', 'Représentation des couches forées, interprétations des couches et autres indications relatives au forage', 'Rappresentazione degli strati perforati, interpretazione degli strati e ulteriori informazioni sulla perforazione', 'Representation of the drilled layers, layer interpretations and further information on the borehole')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('crossSection', 'No-GeolCode-specified', 'Cross section', 'Profilschnitt (geologisch/geotechnisch)', 'Coupe transversale (géologique/géotechnique)', 'Sezione geologica (geologica/geotecnica)', 'Cross-section (geological/geotechnical)', 'Geological or geotechnical cross section', 'Geologische oder geotechnische Längen- oder Querprofile', 'Coupes longitudinales ou transversales géologiques ou géotechniques.', 'Sezione (geologica o geotecnica) longitudinale o trasversale', 'Geological or geotechnical cross section')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('geologicalMap', 'No-GeolCode-specified', 'Geological map', 'Geologische Karte', 'Carte géologique', 'Carta geologica', 'Geological map', 'Geological map', 'Geologische Karte', 'Carte géologique', 'Carta geologica', 'Geological map')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('inSitu', 'No-GeolCode-specified', 'In-situ measurment', 'In-situ Messung', 'Mesure in situ', 'Misurazione in situ', 'In-situ measurement', 'Any kind of in-situ measurements, such as pump test, well test, etc.', 'Jegliche Art von In-situ Messungen, wie z.B. Pumpversuch, Well-Test, etc.', 'Tout type de mesures in situ, p. ex. essai de pompage, test de puits, etc.', 'Qualsiasi tipo di misurazione in situ, come un test di pompaggio, il test del pozzo, ecc.', 'Any kind of in-situ measurements, such as pump test, well test, etc.')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('interpretation', 'No-GeolCode-specified', 'Interpretation', 'Interpretation', 'Interprétation', 'Interpretazione', 'Interpretation', 'Any type of interpretations', 'Jegliche Art von Interpretationen', 'Toute forme d''interprétation', 'Qualsiasi tipo di interpretazione', 'Any type of interpretations')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('labAnalysis', 'No-GeolCode-specified', 'Laboratory analysis', 'Laboranalyse', 'Analyse en laboratoire', 'Analisi di laboratorio', 'Laboratory analysis', 'Data collected in the laboratory, e.g. grain distribution, compressive strength tests, etc.', 'Daten, die im Labor erhoben wurden, wie z.B. Kornverteilung, Druckversuche, etc.', 'Données collectées en laboratoire, p. ex. répartition granulométrique, essais de compression, etc.', 'Dati raccolti in laboratorio, ad esempio distribuzione granulometrica, prove di pressione, ecc.', 'Data collected in the laboratory, e.g. grain distribution, compressive strength tests, etc.')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('location', 'No-GeolCode-specified', 'Location', 'Situationsplan', 'Plan de situation', 'Posizione', 'Location', 'Site plan, locality plan of an investigation', 'Situationsplan, Lageplan einer Untersuchung', 'Plan de situation, plan d''implantation d''une étude', 'Localizzazone del sito o di un''indagine', 'Site plan, locality plan of an investigation')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('log', 'No-GeolCode-specified', 'Log data', 'Log-Daten', 'Données de Log', 'Dati di log', 'Log data', 'Borehole-log or other log data', 'Bohr-Log oder andere Log-Daten', 'Log de forage ou autres données de log', 'Log di perforazione o altri dati di log', 'Borehole-log or other log data')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('manualFieldRecord', 'No-GeolCode-specified', 'Manual field record', 'Feldaufzeichnung', 'Notes de terrain', 'Registrazione manuale sul campo', 'Manual field record', 'Records made during fieldwork', 'Aufzeichnungen, die bei der Feldarbeit gemacht wurden', 'Notes prises lors du travail sur le terrain', 'Registrazioni effettuate durante i lavori sul campo', 'Records made during fieldwork')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('map', 'No-GeolCode-specified', 'Map', 'Karte allgemein', 'Carte en général', 'Mappa generale', 'Map in general', 'Any type of maps, if not specified', 'Jegliche Art von Karten, wenn nicht genauer spezifizierbar', 'Tout type de carte, en l''absence d''autres précisions', 'Qualsiasi tipo di mappa, se non specificabile', 'Any type of maps, if not specified')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('measurements', 'No-GeolCode-specified', 'Measurements', 'Messungen allgemein', 'Mesures en général', 'Misurazioni in generale', 'Measurements in general', 'Any type of measurements, if not further specified', 'Jegliche Art von Messungen, wenn nicht genauer spezifizierbar', 'Tout type de mesures, en l''absence d''autres précisions', 'Qualsiasi tipo di misura, se non ulteriormente specificabile', 'Any type of measurements, if not further specified')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('model', 'No-GeolCode-specified', 'Model', 'Modell', 'Modèle', 'Modello', 'Model', 'Models, e.g. 3D model, block model, etc.', 'Modelle, z.B. 3D-Modell, Blocksturzmodell, etc.', 'Modèles, p. ex. modèle 3D, modèle de chute de blocs, etc.', 'Modelli, ad esempio modello 3D, modello di scivolamento di blocchi, ecc.', 'Models, e.g. 3D model, block model, etc.')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('multmedia', 'No-GeolCode-specified', 'Multmedia', 'Multimediadatei', 'Fichier multimédia', 'File multimediale', 'Multimedia file', 'Any type of multimedia files, if not further specified', 'Jegliche Art von Multimediadateien, wenn nicht genauer spezifizierbar', 'Tout type de fichier multimédia, en l''absence d''autres précisions', 'Qualsiasi tipo di file multimediale, se non ulteriormente specificabile', 'Any type of multimedia files, if not further specified')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('other', 'No-GeolCode-specified', 'Other', 'Andere', 'Autre', 'Altro', 'Other', 'Other types of assets not covered by the values in this list', 'Andere Arten von Assets, die nicht mit den Werten dieser Liste abgedeckt sind', 'Autres types d''assets non couverts par les valeurs de cette liste', 'Altri tipi di elementi non coperti dai valori di questo elenco', 'Other types of assets not covered by the values in this list')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('photoVideo', 'No-GeolCode-specified', 'Photo / Video', 'Foto / Video', 'Photo / Vidéo', 'Foto / Video', 'Photo / Video', 'Any type of photos or videos', 'Jegliche Art von Fotos oder Videos', 'Tout type de photos ou de vidéos', 'Qualsiasi tipo di foto o video', 'Any type of photos or videos')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('processedData', 'No-GeolCode-specified', 'Processed data', 'Prozessierte Daten', 'Données traitées', 'Dati elaborati', 'Processed data', 'Any type of processed data or computer outputs', 'Jegliche Art von prozessierten Daten oder Computer-Outputs', 'Tout type de données traitées ou de résultats informatiques', 'Qualsiasi tipo di dati elaborati o generati da computer', 'Any type of processed data or computer outputs')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('publication', 'No-GeolCode-specified', 'Publication', 'Publikation', 'Publication', 'Pubblicazione', 'Publication', 'Any type of publications', 'Jegliche Art von Publikationen', 'Tout type de publication', 'Qualsiasi tipo di pubblicazione', 'Any type of publications')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('rawData', 'No-GeolCode-specified', 'Raw data', 'Rohdaten', 'Données brutes', 'Dati grezzi', 'Raw data', 'Raw data', 'Rohdaten', 'Données brutes', 'Dati grezzi', 'Raw data')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('report', 'No-GeolCode-specified', 'Report', 'Bericht', 'Rapport', 'Rapporto', 'Report', 'Geological reports or other documentation of geological investigations', 'Geologsiche Berichte oder sonstige Dokumentationen von geologischen Untersuchungen', 'Rapports géologiques ou autres documentations d''études géologiques', 'Rapporti geologici o altra documentazione di indagini geologiche', 'Geological reports or other documentation of geological investigations')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('softwareCode', 'No-GeolCode-specified', 'Software / Code', 'Software / Code', 'Logiciel / Code', 'Software / Codice', 'Software / Code', 'Software, script, code/coding', 'Software, Skript, Code/Codierung', 'Logiciel, script, code/codage', 'Software, script, codice', 'Software, script, code/coding')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('stratiProfile', 'No-GeolCode-specified', 'Stratigraphic profile', 'Stratigraphisches Profil', 'Profil stratigraphique', 'Profilo stratigrafico', 'Stratigraphic profile', 'Lithostratigraphic or chronostratigraphic profiles/columns', 'Lithostratigraphische oder chronostratigraphische Profile/Kolonnenprofile', 'Profils lithostratigraphiques ou chronostratigraphiques / profils en colonne', 'Profili litostratigrafici o cronostratigrafici / profili a colonna', 'Lithostratigraphic or chronostratigraphic profiles/columns')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('unknown', 'No-GeolCode-specified', 'Unknown', 'Unbekannt', 'Inconnu', 'Sconosciuto', 'Unknown', 'Assets whose nature/type is not known', 'Assets, deren Art/Typ nicht bekannt ist', 'Assets dont la nature/le type n''est pas connu/e', 'Attività la cui natura o il tipo dell''elemento non è nota', 'Assets whose nature/type is not known')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('wellLocationmap', 'No-GeolCode-specified', 'Well location map', 'Bohrstandortkarte', 'Carte du site de forage', 'Mappa della posizione della perforazione', 'Borehole location map', 'Map showing locations of one or more boreholes', 'Karte mit den Standorten von einer oder mehren Bohrungen', 'Carte montrant l''emplacement d''un ou de plusieurs forages', 'Mappa che mostra l''ubicazione di una o più perforazioni', 'Map showing locations of one or more boreholes')
ON CONFLICT (asset_kind_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

-- =============================================================
-- FORMAT target reference rows
-- =============================================================

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('3D', 'No-GeolCode-specified', '3D', '3D-spezifisches Format', 'Format spécifique 3D', 'Formato specifico per il 3D', '3D-specific format', 'Specific format for 3D models, such as mve, ts, xyz, kml/Collada, OBJ', 'Spezifisches Format für 3D-Modelle, wie z.B. mve, ts, xyz, kml/Collada, OBJ', 'Format spécifique pour les modèles 3D, p. ex. mve, ts, xyz, kml/Collada, OBJ', 'Formato specifico per modelli 3D, come ad esempio mve, ts, xyz, kml/Collada, OBJ', 'Specific format for 3D models, such as mve, ts, xyz, kml/Collada, OBJ')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('GISFormat', 'No-GeolCode-specified', 'GIS format', 'GIS-Format', 'Format SIG', 'Formato GIS', 'GIS format', 'GIS formats, such as shapefile (shp), geopackage (gpkg), geojson, etc.', 'GIS-Formate, wie z.B. shapefile (shp), geopackage (gpkg), geojson, etc.', 'Formats SIG, tels que shapefile (shp), geopackage (gpkg), geojson, etc.', 'Formati SIG, come ad esempio shapefile (shp), geopackage (gpkg), geojson ecc.', 'GIS formats, such as shapefile (shp), geopackage (gpkg), geojson, etc.')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('archive', 'No-GeolCode-specified', 'Archive', 'Archivformat', 'Format d''archivage', 'Formato di archiviazione', 'Archive format', 'Archive format resp. compression format, such as zip, tar, gz, bz2, etc.', 'Archivformat resp. Komprimierungsformat, wie z.B. zip, tar, gz, bz2, etc.', 'Format d''archivage ou de compression, p. ex. zip, tar, gz, bz2, etc.', 'Formato di archiviazione o di compressione, come ad esempio zip, tar, gz, bz2, ecc.', 'Archive format resp. compression format, such as zip, tar, gz, bz2, etc.')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('binary', 'No-GeolCode-specified', 'Binary', 'Binäres Format', 'Format binaire', 'Formato binario', 'Binary format', 'Binary format', 'Binäres Format', 'Format binaire', 'Formato binario', 'Binary format')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('db', 'No-GeolCode-specified', 'DB', 'Datenbank', 'Base de données', 'Banca dati', 'Database', 'Database format, e.g. sql, fgdb, mdb', 'Datenbank-Format, wie z.B. sql, fgdb, mdb', 'Format de base de données, p. ex. sql, fgdb, mdb', 'Formato della banca dati, ad esempio sql, fgdb, mdb', 'Database format, e.g. sql, fgdb, mdb')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('graphicRaster', 'No-GeolCode-specified', 'Graphic raster', 'Rasterformat', 'Format graphique raster', 'Formato raster', 'Raster format', 'Raster graphics format, such as tiff, jpeg, png, etc.', 'Rastergrafikformat, wie z.B. tiff, jpeg, png, etc.', 'Format graphique raster, p. ex. tiff, jpeg, png, etc.', 'Formato raster, come ad esempio tiff, jpeg, png, ecc.', 'Raster graphics format, such as tiff, jpeg, png, etc.')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('graphicVector', 'No-GeolCode-specified', 'Graphic vector', 'Vektorformat', 'Format graphique vectoriel', 'Formato vettoriale', 'Vector format', 'Vector graphics format, such as eps, ai, svg, etc.', 'Vektorgrafikformat, wie z.B. eps, ai, svg, etc.', 'Format graphique vectoriel, p. ex. eps, ai, svg, etc.', 'Formato vettoriale, come ad esempio eps, ai, svg, ecc.', 'Vector graphics format, such as eps, ai, svg, etc.')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('las', 'No-GeolCode-specified', 'LAS', 'LAS', 'LAS', 'LAS', 'LAS', 'Specific format for well logs, such as log ASCII standard (las)', 'Spezifisches Format für Bohr-Logs, wie z.B. Log ASCII Standard (las)', 'Format spécifique pour les logs de forage, p. ex. standard Log ASCII (las)', 'Formato specifico per i log di perforazione, come ad esempio il Log ASCII Standard (LAS)', 'Specific format for well logs, such as log ASCII standard (las)')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('multimedia', 'No-GeolCode-specified', 'Multimedia', 'Multimedia-Format', 'Format multimédia', 'Formato multimediale', 'Multimedia format', 'Multimedia format, such as MPEG, mp4, mov, avi, wmv, etc.', 'Multimedia-Format, wie z.B. MPEG, mp4, mov, avi, wmv, etc.', 'Format multimédia, p. ex. MPEG, mp4, mov, avi, wmv, etc.', 'Formati multimediali, come ad esempio MPEG, mp4, mov, avi, wmv, ecc.', 'Multimedia format, such as MPEG, mp4, mov, avi, wmv, etc.')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('other', 'No-GeolCode-specified', 'Other', 'Andere', 'Autres', 'Altro', 'Other', 'Other formats of assets not covered by the values in this list', 'Andere Assets-Formate, die nicht mit den Werten dieser Liste abgedeckt sind', 'Autres formats d''assets non couverts par les valeurs de cette liste', 'Altri formati non inclusi in questo elenco', 'Other formats of assets not covered by the values in this list')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('pdf', 'No-GeolCode-specified', 'PDF', 'PDF', 'PDF', 'PDF', 'PDF', 'Any versions of PDF formats', 'Jegliche Versionen von PDF-Formaten', 'Toutes les versions des formats PDF', 'Qualsiasi versione del formato PDF', 'Any versions of PDF formats')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('segy', 'No-GeolCode-specified', 'SEGY', 'SEGY', 'SEGY', 'SEGY', 'SEGY', 'Seismic-specific format SEGY', 'Seismikspezifisches Format SEGY', 'Format spécifique à la sismique SEGY', 'Formato specifico sismico SEGY', 'Seismic-specific format SEGY')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('seismic', 'No-GeolCode-specified', 'Seismic', 'Seismikspezifisches Format (ohne SEGY)', 'Format spécifique à la sismique (hors SEGY)', 'Formato specifico per la sismica (escluso SEGY)', 'Seismic-specific format (excluding SEGY)', 'Other seismic-specific formats, such as SPS, SEG2, SEGD, etc.', 'Andere seismikspezifischen Formate, wie z.B. SPS, SEG2, SEGD, etc.', 'D''autres formats spécifiques à la sismique, tels que SPS, SEG2, SEGD, etc.', 'Altri formati specifici per i dati sismici, come ad esempio SPS, SEG2, SEGD, ecc.', 'Other seismic-specific formats, such as SPS, SEG2, SEGD, etc.')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('textAnalog', 'No-GeolCode-specified', 'Text analog', 'Analoge Dokumente', 'Documents analogiques', 'Documenti analogici', 'Analogue documents', 'Analogue asset, on e.g. paper, microfiche, etc.', 'Analoges Asset, auf z.B. Papier, Mikrofichen, etc.', 'Asset analogique, p. ex. sur papier, microfiches, etc.', 'Elemento in formato analogico, ad esempio cartaceo, microfiche, ecc.', 'Analogue asset, on e.g. paper, microfiche, etc.')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('textDigital', 'No-GeolCode-specified', 'Text digital', 'Textformat digital', 'Format de texte numérique', 'Formato testo digitale', 'Digital text format', 'Text or ASCII format, such as txt, doc, docx, xls, xlsx, xml, csv, etc.', 'Text- oder ASCII-Format, wie z.B. txt, doc, docx, xls, xlsx, xml, csv, etc.', 'Format texte ou ASCII, p. ex. txt, doc, docx, xls, xlsx, xml, csv, etc.', 'Formato testo o ASCII, ad esempio txt, doc, docx, xls, xlsx, xml, csv, ecc.', 'Text or ASCII format, such as txt, doc, docx, xls, xlsx, xml, csv, etc.')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

INSERT INTO asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_it, name_en, description, description_de, description_fr, description_it, description_en)
VALUES ('unknown', 'No-GeolCode-specified', 'Unknown', 'Unbekannt', 'Inconnu', 'Sconosciuto', 'Unknown', 'Format of the asset not known', 'Format des Assets nicht bekannt', 'Format de l''asset inconnu', 'Formato dell''asset non noto', 'Format of the asset not known')
ON CONFLICT (asset_format_item_code) DO UPDATE SET
  geol_code = EXCLUDED.geol_code,
  name = EXCLUDED.name,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_it = EXCLUDED.name_it,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_it = EXCLUDED.description_it,
  description_en = EXCLUDED.description_en;

-- =============================================================
-- TOPIC relation migration
-- =============================================================

INSERT INTO man_cat_label_ref (asset_id, man_cat_label_item_code)
SELECT asset_id, 'explorationProspection'
FROM man_cat_label_ref
WHERE man_cat_label_item_code = 'prospection'
ON CONFLICT (asset_id, man_cat_label_item_code) DO NOTHING;

DELETE FROM man_cat_label_ref
WHERE man_cat_label_item_code = 'prospection';

DELETE FROM man_cat_label_item
WHERE man_cat_label_item_code = 'prospection';

-- =============================================================
-- KIND code/reference migration
-- =============================================================

UPDATE asset SET asset_kind_item_code = 'map' WHERE asset_kind_item_code = 'basemap';

UPDATE asset SET asset_kind_item_code = 'crossSection' WHERE asset_kind_item_code = 'profileSection';

UPDATE asset SET asset_kind_item_code = 'processedData' WHERE asset_kind_item_code = 'deviceOutput';

UPDATE asset SET asset_kind_item_code = 'photoVideo' WHERE asset_kind_item_code = 'video';

UPDATE asset SET asset_kind_item_code = 'boreholePath' WHERE asset_kind_item_code = 'drillPath';

UPDATE asset SET asset_kind_item_code = 'labAnalysis' WHERE asset_kind_item_code = 'labData';

UPDATE asset SET asset_kind_item_code = '3Dseismic' WHERE asset_kind_item_code = 'seismic3D';

UPDATE asset SET asset_kind_item_code = 'interpretation' WHERE asset_kind_item_code = 'seismicInterpretation';

UPDATE asset SET asset_kind_item_code = '2Dseismic' WHERE asset_kind_item_code = 'seismicSection';

DELETE FROM asset_kind_item WHERE asset_kind_item_code IN ('basemap', 'profileSection', 'deviceOutput', 'video', 'drillPath', 'labData', 'seismic3D', 'seismicInterpretation', 'seismicSection');

DELETE FROM asset_kind_item WHERE asset_kind_item_code IN ('configuration', 'package', 'shotpointmap');

-- =============================================================
-- FORMAT code/reference migration
-- =============================================================

UPDATE asset SET asset_format_item_code = 'segy' WHERE asset_format_item_code = 'segyExported';

UPDATE asset SET asset_format_item_code = 'GISFormat' WHERE asset_format_item_code = 'shapefile';

DELETE FROM asset_format_item WHERE asset_format_item_code IN ('segyExported', 'shapefile');

-- Post-migration safety checks.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM man_cat_label_ref WHERE man_cat_label_item_code = 'prospection') THEN
    RAISE EXCEPTION 'Topic migration incomplete: prospection reference remains.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM asset
    WHERE asset_kind_item_code IN ('basemap', 'profileSection', 'deviceOutput', 'video', 'drillPath', 'labData', 'seismic3D', 'seismicInterpretation', 'seismicSection')
  ) THEN
    RAISE EXCEPTION 'Kind migration incomplete: obsolete code reference remains.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM asset
    WHERE asset_format_item_code IN ('segyExported', 'shapefile')
  ) THEN
    RAISE EXCEPTION 'Format migration incomplete: obsolete code reference remains.';
  END IF;
END $$;

COMMIT;
