--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (Debian 16.3-1.pgdg110+1)
-- Dumped by pg_dump version 16.2

-- Started on 2024-09-30 09:00:25 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4416 (class 0 OID 206764)
-- Dependencies: 263
-- Data for Name: asset_format_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
archive	No-GeolCode-specified	Archive	Archive-Format	Format d'archive		Formato d'archivio	Archive format	Archive format resp. compression format, such as zip, tar, gz, bz2 etc.	Archivformat resp. Komprimierungsformat, wie z.B. zip, tar, gz, bz2 etc.	Format d'archivage ou de compression, p. ex. zip, tar, gz, bz2, etc.		Formato d'archivio o formato di compressione, come zip, tar, gz, bz2 ecc.	Archive format resp. compression format, such as zip, tar, gz, bz2 etc.
other	No-GeolCode-specified	Other	Andere	Autres		Altro	Other	Other formats of assets not covered by the values in this list	Andere Formate von Assets, die nicht mit den Werten dieser Liste abgedeckt sind	Autres formats d'assets non couverts par les valeurs de cette liste		Altri formati di elementi non coperti dai valori di questo elenco	Other formats of assets not covered by the values in this list
textAnalog	No-GeolCode-specified	Text analog	Analoge Dokumente (Papier, Mikrofichen etc.)	Documents analogiques (papier, microfiches, etc.)		Documenti analogici (cartaceo, microfiche, ecc.)	Analogue documents (paper, microfiche etc.)	Analogue asset, on e.g. paper, microfiche etc.	Analoges Asset, auf z.B. Papier, Mikrofichen etc.	Asset analogique, p. ex. sur papier, microfiches, etc.		Elemento in formato analogico, ad esempio cartaceo, microfiche, ecc.	Analogue asset, on e.g. paper, microfiche etc.
graphicVector	No-GeolCode-specified	Graphic vector	Digitale Vektorgrafik	Format graphique numérique vectoriel		Grafica digitale vettoriale	Digital vector graphics	Vector graphics format, such as eps, ai, svg etc.	Vektorgrafikformat, wie z.B. eps, ai, svg etc.	Format graphique vectoriel, p. ex. eps, ai, svg, etc.		Formato grafico vettoriale, come eps, ai, svg ecc.	Vector graphics format, such as eps, ai, svg etc.
graphicRaster	No-GeolCode-specified	Graphic raster	Digitale Rastergrafik	Format graphique numérique raster		Grafica digitale raster	Digital raster graphics	Raster graphics format, such as tiff, jpeg, png etc.	Rastergrafikformat, wie z.B. tiff, jpeg, png etc.	Format graphique raster, p. ex. tiff, jpeg, png, etc.		Formato grafico raster, come tiff, jpeg, png ecc.	Raster graphics format, such as tiff, jpeg, png etc.
binary	No-GeolCode-specified	Binary	Digitales binäres Format	Format binaire numérique		Formato binario digitale	Digital binary format	Binary format	Binäres Format	Format binaire		Formato binario	Binary format
textDigital	No-GeolCode-specified	Text digital	Textformat digital	Format texte numérique		Formato testo digitale	Digital text format	Text or ASCII format, such as txt, doc, docx, xls, xlsx, xml, csv etc.	Textformat, wie z.B. txt, doc, docx, xls, xlsx, xml, csv etc.	Format texte, p. ex. txt, doc, docx, xls, xlsx, xml, csv etc.		Formato di testo, come txt, doc, docx, xls, xlsx, xml, csv ecc.	Text or ASCII format, such as txt, doc, docx, xls, xlsx, xml, csv etc.
seismic	No-GeolCode-specified	Seismic	Seismikspezifisches Format	Format spécifique à la sismique		Formato specifico per il sismica	Seismic specific format	Seismic-specific format, such as SPS, SEG2, SEGD, etc.	Seismikspezifisches Format, wie z.B. SPS, SEG2, SEGD etc.	Format spécifique à la sismologie, p. ex. SPS, SEG2, SEGD, etc.		Formato specifico per la sismica, come SPS, SEG2, SEGD, ecc.	Seismic-specific format, such as SPS, SEG2, SEGD, etc.
segy	No-GeolCode-specified	SEGY	SEGY	SEGY		SEGY	SEGY	Seismic-specific format SEGY	Seismikspezifisches Format SEGY	Format spécifique à la sismologie SEGY		Formato specifico sismico SEGY	Seismic-specific format SEGY
segyExported	No-GeolCode-specified	SEGY exported	SEGY exportiert	SEGY exporté		SEGY esportato	SEGY exported	Seismic-specific format SEGY exported	Seismikspezifisches Format SEGY exportiert	Format spécifique à la sismologie SEGY exporté		Formato specifico sismico SEGY esportato	Seismic-specific format SEGY exported
pdf	No-GeolCode-specified	PDF	PDF	PDF		PDF	PDF	Any versions of PDF formats	Jegliche Versionen von PDF-Formaten	Toutes les versions des formats PDF		Qualsiasi versione del formato PDF	Any versions of PDF formats
shapefile	No-GeolCode-specified	Shapefile	Shapefile	Shapefile		Shapefile	Shapefile	ESRI shapefile	ESRI-Shapefile	Shapefile ESRI		Formato ESRI	ESRI shapefile
las	No-GeolCode-specified	LAS	Log ASCII Standard	Log ASCII standard		Log ASCII Standard	Log ASCII Standard	Specific format for well logs, such as log ASCII standard	spezifisches Format für Well-Logs, wie z.B. Log ASCII Standard	Format spécifique pour les logs de forage, p. ex. standard Log ASCII		Formato specifico per i log di perforazione, come ad esempio lo standard ASCII dei log	Specific format for well logs, such as log ASCII standard
unknown	No-GeolCode-specified	Unknown	Unbekannt	Inconnu		Sconosciuto	Unknown	Format of the asset not known	Format des Assets nicht bekannt	Format de l'asset non connu		Formato non noto	Format of the asset not known
3D	No-GeolCode-specified	3D	3D-spezifisches Format	Format spécifique à la 3D		Formato specifico per il 3D	3D-specific format	Specific format for 3D models, such as mve, ts, xyz, kml/Collada, OBJ.	spezifisches Format für 3D-Modelle, wie z.B. mve, ts, xyz, kml/Collada, OBJ	Format spécifique pour les modèles 3D, p. ex. mve, ts, xyz, kml/Collada, OBJ		Formato specifico per i modelli 3D, come mve, ts, xyz, kml/Collada, OBJ.	Specific format for 3D models, such as mve, ts, xyz, kml/Collada, OBJ.
db	No-GeolCode-specified	DB	Datenbank	Base de données		Database	Database	Database format, e.g. gpkg, sql, fgdb, mdb	Datenbank-Format, wie z.B. gpkg, sql, fgdb, mdb	Format de base de données, p. ex. gpkg, sql, fgdb, mdb		Formato del database, ad esempio gpkg, sql, fgdb, mdb	Database format, e.g. gpkg, sql, fgdb, mdb
multimedia	No-GeolCode-specified	Multimedia	Multimedia-Format	Format multimédia		Formato multimediale	Multimedia format	Multimedia format, such as MPEG, mp4, mov, avi, wmv.	Multimedia-Format, wie z.B. MPEG, mp4, mov, avi, wmv	Format multimédia, p. ex. MPEG, mp4, mov, avi, wmv		Formato multimediale, come MPEG, mp4, mov, avi, wmv.	Multimedia format, such as MPEG, mp4, mov, avi, wmv.
\.


--
-- TOC entry 4417 (class 0 OID 206771)
-- Dependencies: 264
-- Data for Name: asset_kind_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
package	No-GeolCode-specified	Asset package	Asset-Paket	Collection d'assets		Raccolta di elementi	Asset package	Collection/package of assets of different types	Sammlung/Paket von Assets verschiedener Arten	Collection/paquet d'assets de différents types		Raccolta di elementi di diverso tipo	Collection/package of assets of different types
other	No-GeolCode-specified	Other	Andere	Autre		Altro	Other	Other types of assets not covered by the values in this list	Andere Arten von Assets, die nicht mit den Werten dieser Liste abgedeckt sind	Autres types d'assets non couverts par les valeurs de cette liste		Altri tipi di elementi non coperti dai valori di questo elenco	Other types of assets not covered by the values in this list
rawData	No-GeolCode-specified	Raw data	Rohdaten	Données brutes		Dati grezzi	Raw data	Raw data	Rohdaten	Données brutes		Dati grezzi	Raw data
report	No-GeolCode-specified	Report	Bericht	Rapport		Rapporto	Report	Geological reports or other documentation of geological investigations	Geologsiche Berichte oder sonstige Dokumentationen von geologischen Untersuchungen	Rapports géologiques ou autres documentations d'études géologiques		Rapporti geologici o altra documentazione di indagini geologiche	Geological reports or other documentation of geological investigations
measurements	No-GeolCode-specified	Measurements	Messungen allgemein	Mesures en général		Misure	Measurements	Any type of measurements, if not further specifiable	Jegliche Arten von Messungen, wenn nicht genauer spezifizierbar	Tout type de mesures, en l'absence d'autres précisions		Qualsiasi tipo di misura, se non ulteriormente specificabile	Any type of measurements, if not further specifiable
log	No-GeolCode-specified	Log	LOG	Log		Log	Log	Borehole log or other log data	Bohr-Log oder andere Log-Daten	Log de forage ou autres données de log		Log di perforazione o altri dati di log	Borehole log or other log data
deviceOutput	No-GeolCode-specified	Device output	Geräteoutput	Données de sortie de l'appareil		Output del dispositivo	Device output	Data output directly from an instrument	Daten, die direkt aus einem Gerät ausgegeben wurden	Données sortant directement d'un appareil		Dati di output ottenuti direttamente da uno strumento	Data output directly from an instrument
manualFieldRecord	No-GeolCode-specified	Manual field record	Feldaufzeichnung	Enregistrement de terrain		Registrazione manuale sul campo	Manual field record	Records made during fieldwork	Aufzeichnungen, die bei der Feldarbeit gemacht wurden	Enregistrements réalisés lors du travail sur le terrain		Registrazioni effettuate durante i lavori sul campo	Records made during fieldwork
labData	No-GeolCode-specified	Lab data	Labormessung	Mesure en laboratoire		Dati di laboratorio	Laboratory data	Data collected in the laboratory, e.g. grain distribution, compressive strength tests, etc.	Daten, die im Labor erhoben wurden, wie z.B. Kornverteilung, Druckversuche, etc.	Données collectées en laboratoire, p. ex. répartition granulométrique, essais de compression, etc.		Dati raccolti in laboratorio, ad esempio distribuzione granulometrica, prove di pressione, ecc.	Data collected in the laboratory, e.g. grain distribution, compressive strength tests, etc.
map	No-GeolCode-specified	Map	Karte allgemein	Carte en général		Mappa	Map	Any type of maps, if not specifiable	Jegliche Arten von Karten, wenn nicht genauer spezifizierbar	Tout type de carte, en l'absence d'autres précisions		Qualsiasi tipo di mappa, se non specificabile	Any type of maps, if not specifiable
shotpointmap	No-GeolCode-specified	Shotpoint map	Schusspunktkarte	Carte des points de tir		Mappa dei punti di tiro	Shotpoint map	Map of seismic survey shot points	Karte der Schusspunkte bei einer Seismischen Untersuchung	Carte des points de tir lors d'une étude sismique		Mappa dei punti di tiro durante un'indagine sismica	Map of seismic survey shot points
basemap	No-GeolCode-specified	Basemap	Basemap	Carte de base		Mappa di base	Basemap	Base map	Grundkarte	Carte de base		Mappa di base	Base map
wellLocationmap	No-GeolCode-specified	Well location map	Bohrstandortkarte	Carte du site de forage		Mappa della posizione della perforazione	Borehole location map	Map showing locations of one or more boreholes	Karte mit den Standorten von einer oder mehrer Bohrungen	Carte montrant l'emplacement d'un ou de plusieurs forages		Mappa che mostra l'ubicazione di uno o più perforazioni	Map showing locations of one or more boreholes
geologicalMap	No-GeolCode-specified	Geological map	Geologische Karte	Carte géologique		Carta geologica	Geological map	Geological map	Geologische Karte	Carte géologique		Carta geologica	Geological map
location	No-GeolCode-specified	Location	Situationsplan	Plan de situation		Posizione	Location	Site plan,locality plan of an investigation	Situationsplan, Lageplan einer Untersuchung	Plan de situation, plan d'implantation d'une étude		Localizzazone del sito o di un'indagine	Site plan,locality plan of an investigation
crossSection	No-GeolCode-specified	Cross section	Geologischer Profilschnitt	Coupe géologique		Sezione geologica trasversale	Cross section	Geological cross section or profile	Geologische Längen- oder Querprofile	Coupes géologiques longitudinales ou transversales		Profili geologici longitudinali o trasversali	Geological cross section or profile
seismicSection	No-GeolCode-specified	Seismic section	Seismische Section	Section sismique		Sezione sismica	Seismic section	Seismic section	Seismische Sektion	Section sismique		Sezione sismica	Seismic section
drillPath	No-GeolCode-specified	Drill path	Bohrpfad	Trajectoire de forage		Percorso di perforazione	Borehole path	Borehole path: information on the spatial course of the borehole	Bohrpfad: Angaben zum räumlichen Verlauf der Bohrung	Trajectoire de forage : indications sur le tracé spatial du forage		Percorso della perforazione: informazioni sulla traccia della perforazione	Borehole path: information on the spatial course of the borehole
softwareCode	No-GeolCode-specified	Software / code	Software-Code	Code du logiciel		Software / codice	Software / code	Software, script, code/coding	Software, Skript, Code/Codierung	Logiciel, script, code/codage		Software, script, codice	Software, script, code/coding
model	No-GeolCode-specified	Model	Modell	Modèle		Modello	Model	Models, e.g. 3D model, block model, etc.	Modelle, z.B. 3D-Modell, Blocksturzmodell, etc.	Modèles, p. ex. modèle 3D, modèle de chute de blocs, etc.		Modelli, ad esempio modello 3D, modello di scivolamento di blocchi, ecc.	Models, e.g. 3D model, block model, etc.
photo	No-GeolCode-specified	Photo	Foto	Photo		Foto	Photo	Any kind of photos	Jegliche Art von Fotos	Tout type de photos		Qualsiasi tipo di foto	Any kind of photos
seismic3D	No-GeolCode-specified	Seismic 3D	Seismische 3D Untersuchung	Étude sismique 3D		Sismica 3D	Seismic 3D	Data from 3D seismic surveys (3D seismic)	Daten aus 3D-seismischen Untersuchungen (3D-Seismik)	Données d'études sismiques 3D		Dati provenienti da indagini sismiche 3D (sismica 3D)	Data from 3D seismic surveys (3D seismic)
profileSection	No-GeolCode-specified	Profile / section	Profil / Profilschnitt	Profil / Coupe		Profilo / sezione	Profile / section	Any kind of sections or profiles, if not further specifiable	Jegliche Arten von Profilen, wenn nicht genauer spezifizierbar	Tout type de profil ou de coupe, en l'absence d'autres précisions		Qualsiasi tipo di profilo, se non ulteriormente specificabile	Any kind of sections or profiles, if not further specifiable
seismicInterpretation	No-GeolCode-specified	Seismic interpretation	Seismische Interpretation	Interprétation sismique		Interpretazione sismica	Seismic interpretation	Profile with seismic interpretation	Profil mit seismischer Interpretation	Profil avec interprétation sismique		Profilo con interpretazione sismica	Profile with seismic interpretation
boreholeProfile	No-GeolCode-specified	Borehole profile	Bohrprofil	Profil de forage		Profilo della perforazione	Borehole profile	Borehole profile: representation of the drilled layers, layer interpretations and further information on the borehole	Bohrprofil: Darstellung der erbohrten Schichten, Schichtinterpretationen und weiteren Angaben zur Bohrung	Profil de forage : représentation des couches forées, interprétations des couches et autres indications sur le forage.		Profilo della perforazione: rappresentazione degli strati perforati, interpretazione degli strati e ulteriori informazioni sulla perforazione	Borehole profile: representation of the drilled layers, layer interpretations and further information on the borehole
boreholeCompletion	No-GeolCode-specified	Borehole completion	Bohrlochausbau	Aménagement du forage		Completamento della perforazione	Borehole completion	Borehole completion: details of casing, backfill, internals (e.g. piezometer), etc.	Bohrlochausbau: Angaben zu Verrohrung, Hinterfüllung, Einbauten (z.B. Piezometer), etc.	Aménagement du trou de forage : indications sur le tubage, le remblayage, les installations (p. ex. piézomètre), etc.		Completamento dela perforazione: dettagli del tipo di tubatura, del riempimento, dei componenti interni (ad es. piezometro), ecc.	Borehole completion: details of casing, backfill, internals (e.g. piezometer), etc.
configuration	No-GeolCode-specified	configuration	Konfiguration	Configuration		Configurazione	configuration	Configurations of modelling or other calculations	Konfigurationen von Modellierungen oder sonstigen Berechnungen	Configurations de modélisations ou autres calculs		Configurazioni di modellazione o altri calcoli	Configurations of modelling or other calculations
multmedia	No-GeolCode-specified	Multmedia	Multimediadatei	Fichier multimédia		File multimediale	Multmedia	Any type of multimedia files, if not further specifiable.	Jegliche Art von Multimediadateien, wenn nicht genauer spezifizierbar	Tout type de fichier multimédia, en l'absence d'autres précisions		Qualsiasi tipo di file multimediale, se non ulteriormente specificabile.	Any type of multimedia files, if not further specifiable.
video	No-GeolCode-specified	Video	Video	Vidéo		Video	Video	Any type of video	Jegliche Art von Videos	Tout type de vidéos		Qualsiasi tipo di video	Any type of video
unknown	No-GeolCode-specified	Unknown	Unbekannt	Inconnu		Sconosciuto	Unknown	Assets whose nature/type is not known	Assets, deren Art/Typ nicht bekannt ist	Assets dont la nature/le type n'est pas connu/e		Attività la cui natura/tipo non è nota	Assets whose nature/type is not known
inSitu	No-GeolCode-specified	In-situ measurment	In-situ Messung	Mesure in situ		Misurazione in situ	In-situ measurement	Any kind of in-situ measurements, such as pump test, well test, etc.	Jegliche Art von In-situ Messungen, wie z.B. Pumpversuch, Well-Test, etc.	Tout type de mesures in situ, p. ex. essai de pompage, test de puits, etc.		Qualsiasi tipo di misurazione in situ, come un test di pompaggio, il test del pozzo, ecc.	Any kind of in-situ measurements, such as pump test, well test, etc.
\.


--
-- TOC entry 4418 (class 0 OID 206792)
-- Dependencies: 267
-- Data for Name: contact_kind_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_kind_item (contact_kind_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
private	No-GeolCode-specified	Private company or private person	Privatfirma oder Privatperson	Entreprise privée ou personne privée		Azienda privata o persona privata	Private company or private person	Private company or private person	Privatfirma oder Privatperson	Entreprise privée ou personne privée		Azienda privata o persona privata	Private company or private person
fedAdmin	No-GeolCode-specified	Federal authority	Bundesbehörde	Autorité fédérale		Autorità federale	Federal authority	Federal authority	Bundesbehörde	Autorité fédérale		Autorità federale	Federal authority
other	No-GeolCode-specified	Other	Andere	Autre		Altro	Other	Other	Andere	Autre		Altro	Other
university	No-GeolCode-specified	University	Universität, Fachhochschule FH	Université, haute école spécialisée HES		Università, Università di Scienze Applicate	University, Vocational University	University and vocational university	Universität und Fachhochschule	Université et haute école spécialisée		Università e scuole universitarie professionali	University and vocational university
community	No-GeolCode-specified	Community	Gemeinde	Commune		Comune	Municipality	Municipality	Gemeinde	Commune		Comune	Municipality
cantonAdmin	No-GeolCode-specified	Cantonal authority	Kantonale Bewilligungsbehörde	Autorité cantonale chargée de délivrer les autorisations		Autorità cantonale di autorizzazione	Cantonal licensing authority	Cantonal authority	Kantonale Behörde	Autorité cantonale		Autorità cantonale	Cantonal authority
swisstopo	No-GeolCode-specified	swisstopo	swisstopo	swisstopo		swisstopo	swisstopo	swisstopo	swisstopo	swisstopo		swisstopo	swisstopo
unknown	No-GeolCode-specified	Unknown	Unbekannt	Inconnu		Sconosciuto	Unknown	Unknown	Unbekannt	Inconnu		Sconosciuto	Unknown
\.


--
-- TOC entry 4419 (class 0 OID 206806)
-- Dependencies: 269
-- Data for Name: language_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.language_item (language_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
EN	No-GeolCode-specified	english	englisch	anglais	englais	inglese	english	Asset in English	Asset in Englisch	Asset en anglais		Asset in inglese	Asset in English
IT	No-GeolCode-specified	italian	italienisch	italien	talian	italiano	italian	Asset in Italian	Asset in Italienisch	Asset en italien		Elemento in italiano	Asset in Italian
FR	No-GeolCode-specified	french	französisch	français	franzos	francese	french	Asset in French	Asset in Französisch	Asset en français		Elemento in francese	Asset in French
DE	No-GeolCode-specified	german	deutsch	allemand	tudestg	tedesco	german	Asset in German	Asset in Deutsch	Asset en allemand		Elemento in tedesco	Asset in German
other	No-GeolCode-specified	other languages	andere Sprachen	autres langues	autras linguas	altre lingue	other languages	Asset in other languages	Asset in anderer Sprachen	Assets dans d'autres langues		Elemento in altre lingue	Asset in other languages
NUM	No-GeolCode-specified	numeric	numerisch	numérique		numerico	numeric	Asset with numerical structure, e.g. programme code, configurations	Asset mit numerischem Aufbau, wie z.B. Programmcode, Konfigurationen	Asset à structure numérique, p. ex. code de programme, configurations		Elemento con struttura numerica, ad es. codice programma, configurazioni	Asset with numerical structure, e.g. programme code, configurations
\.


--
-- TOC entry 4420 (class 0 OID 206813)
-- Dependencies: 270
-- Data for Name: man_cat_label_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
energyRessources	No-GeolCode-specified	Energy ressources	Geoenergie, Geothermie, Energierohstoffe (Erdöl/Erdgas/Kohle)	Géoénergie, géothermie, matières premières énergétiques (pétrole/gaz naturel/charbon)		Geoenergia, energia geotermica, risorse energetiche (petrolio/gas naturale/carbone)	Geoenergy, geothermal energy, energy resources (oil/natural gas/coal)	Geoenergy assets, e.g. geothermal energy, energy resources (oil, gas, coal), etc.	Assets zum Thema Geoenergie, wie z.B. Geothermie, Energierohstoffe (Erdöl, Erdgas, Kohle), etc.	Assets sur le thème des géoénergies, p. ex. géothermie, matières premières énergétiques (pétrole, gaz naturel, charbon), etc.		Elementi sul tema della geoenergia, ad esempio energia geotermica, risorse energetiche (petrolio, gas, carbone), ecc.	Geoenergy assets, e.g. geothermal energy, energy resources (oil, gas, coal), etc.
science	No-GeolCode-specified	Science	Wissenschaftl. Abschlussarbeiten	Travaux scientifiques de fin d'études		Tesi scientifiche	Scientific theses	Assets in the form of a scientific thesis	Assets ins Form einer  wissenschaftl. Abschlussarbeiten	Assets sous la forme d'un travail scientifique de fin d'études		Elementi in  forma di tesi scientifica	Assets in the form of a scientific thesis
geotechnics	No-GeolCode-specified	Geotechnics	Geotechnik	Géotechnique		Geotecnica	Geotechnics	Assets on the topic of geotechnics	Assets zum Thema Geotechnik	Assets sur le thème de la géotechnique		Elementi sul tema della geotecnica	Assets on the topic of geotechnics
geophysics	No-GeolCode-specified	Geophysics	Geophysik	Géophysique		Geofisica	Geophysics	Assets on the topic of geophysics	Assets zum Thema Geophysik	Assets sur le thème de la géophysique		Elementi sul tema della geofisica	Assets on the topic of geophysics
borehole	No-GeolCode-specified	Borehole	Bohrungen	Forages		Perforazioni	Boreholes	Assets on the topic of boreholes, e.g. borehole profiles and reports	Assets zum Thema Bohrungen, z.B. Bohrprofile und Berichte zu Bohrungen	Assets sur le thème des forages, p. ex. profils et rapports de forage		Elementi sul tema della perforazione, ad esempio profili e rpporti di perforazione.	Assets on the topic of boreholes, e.g. borehole profiles and reports
other	No-GeolCode-specified	Other	Andere	Autres		Altro	Other	Assets on other topics not covered by the values in this list	Assets zu anderen Themen, die nicht mit den Werten dieser Liste abgedeckt sind	Assets sur d'autres thèmes qui ne sont pas couverts par les valeurs de cette liste		Elementi su altri argomenti non coperti dai valori di questo elenco	Assets on other topics not covered by the values in this list
naturalHazards	No-GeolCode-specified	Natural hazards	Naturgefahren	Dangers naturels		Rischi naturali	Natural hazards	Assets on the topic of natural hazards	Assets zum Thema Naturgefahren	Assets sur le thème des dangers naturels		Elementi sul tema dei rischi naturali	Assets on the topic of natural hazards
hydrogeology	No-GeolCode-specified	Hydrogeology	Hydrogeologie	Hydrogéologie		Idrogeologia	Hydrogeology	Assets on the topic of hydrogeology	Assets zum Thema Hydrogeologie	Assets sur le thème de l'hydrogéologie		Elementi sul tema dell'idrogeologia	Assets on the topic of hydrogeology
pollution	No-GeolCode-specified	Pollution	Altlasten	Sites contaminés		Siti contaminati	Contaminated sites	Assets on the topic of contaminated sites	Assets zum Thema Altlasten	Assets sur le thème des sites contaminés		Elementi sul tema dei siti contaminati	Assets on the topic of contaminated sites
mineralRessources	No-GeolCode-specified	Mineralressources	Mineralische Rohstoffe	Matières premières minérales		Risorse minerali	Mineral Resources	Assets on the topic of mineral resources (incl. mining, quarries, gravel pits, etc.)	Assets zum Thema Mineralische Rohstoffe (inkl. Bergbau, Steinbruch, Kiesgrube etc.)	Assets sur le thème des ressources minérales (y compris exploitation minière, carrières, gravières, etc.)		Elementi sul tema delle risorse minerali (incluse miniere, cave di roccia, cave di ghiaia, ecc.)	Assets on the topic of mineral resources (incl. mining, quarries, gravel pits, etc.)
prospection	No-GeolCode-specified	Prospection	Prospektion (z.B. Rohstoffe)	Prospection (p. ex. matières premières)		Prospezione (ad es. materie prime)	Prospecting (e.g. raw materials)	Assets on the topic of prospecting, e.g. of mineral raw materials	Assets zum Thema Prospektion, wie z.B. von mineralischen Rohstoffen	Assets sur le thème de la prospection, p. ex. matières premières minérales		Elementi sul tema della prospezione, ad esempio di materie prime minerali	Assets on the topic of prospecting, e.g. of mineral raw materials
exploration	No-GeolCode-specified	Exploration	Exploration	Exploration		Esplorazione	Exploration	Assets on the topic of exploration, e.g. of minerals and raw materials	Assets zum Thema Exploration, wie z.B. von mineralischen Rohstoffen	Assets sur le thème de l'exploration, p. ex. ressources minérales		Elementi sul tema dell'esplorazione, ad es. di materie prime minerali	Assets on the topic of exploration, e.g. of minerals and raw materials
\.


--
-- TOC entry 4421 (class 0 OID 206841)
-- Dependencies: 274
-- Data for Name: status_asset_use_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.status_asset_use_item (status_asset_use_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
tobechecked	No-GeolCode-specified	to be checked	Zu prüfen	À vérifier		Da testare	To be checked	Terms of use of the asset need to be checked	Nutzungsbedingungen des Assets müssen geprüft werden	Les conditions d'utilisation de l'asset doivent être vérifiées		Le condizioni di utilizzo dell'elemento devono essere valutate.	Terms of use of the asset need to be checked
underclarification	No-GeolCode-specified	under clarification	In Prüfung	En cours de vérification		In esame	Currently being checked	Terms of use of the asset are currently being checked	Nutzungsbedingungen des Assets werden zurzeit geprüft	Les conditions d'utilisation de l'asset sont en cours de vérification		Le condizioni di utilizzo dell'elemento sono attualmente in fase di valutazione	Terms of use of the asset are currently being checked
approved	No-GeolCode-specified	approved	Finalisiert	Finalisé		Finalizzato	Finalised	Terms of use of the asset are available and confirmed	Nutzungsbedingungen des Assets liegen vor und sind bestätigt	Les conditions d'utilisation de l'asset sont disponibles et confirmées		Le condizioni di utilizzo dell'elemento sono disponibili e confermate	Terms of use of the asset are available and confirmed
\.


--
-- TOC entry 4422 (class 0 OID 206848)
-- Dependencies: 275
-- Data for Name: status_work_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.status_work_item (status_work_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
initiateAsset	No-GeolCode-specified	Initially edited	Ersterfassung Asset	Saisie initiale		Acquisizione iniziale dell'elemento	Initial capture asset	Asset is derived from initial capture in the system	Ersterfassung des Assets im System	Première saisie de l'asset dans le système		L'elemento é inserito per la prima volta nel sistema	Asset is derived from initial capture in the system
edited	No-GeolCode-specified	Edited	Bearbeitet	Traité dans le système		Modificato	Processed	Asset is processed in the system	Asset ist im System bearbeitet	L'asset a été traité dans le système		L'elemento é elaborato dal sistema	Asset is processed in the system
importedOld	No-GeolCode-specified	Old data imported	Importierte Altdaten	Import d'anciennes données		Importazione di dati legacy	Imported legacy data	Asset originates from imported legacy data (InfoGeol)	Asset stammt von importieren Altdaten (InfoGeol) ab	L'asset provient de données anciennes importées (InfoGeol)		L'elemento proviene da dati legacy importati (InfoGeol)	Asset originates from imported legacy data (InfoGeol)
docClassified	No-GeolCode-specified	Document classified	Dokument klassifiziert	Document classé		Documento classificato	Document classified	Asset is assigned to a thematic class	Asset ist einer thematischen Klasse zugewiesen	L'asset a été attribué à une classe thématique		L'elemento è assegnato a una classe tematica	Asset is assigned to a thematic class
objectsExtracted	No-GeolCode-specified	Objects extracted	Objekte extrahiert	Objets extraits		Oggetti estratti	Objects extracted	Objects extracted from asset	Aus Asset wurden Objekte extrahiert	Des objets ont été extraits de l'asset		Degli oggetti sono stati estratti dall'elemento	Objects extracted from asset
OCRprocessed	No-GeolCode-specified	OCR processed	OCR prozessiert	Traité par OCR		Elaborazione OCR	OCR processed	OCR has been performed for asset	Für Asset wurde OCR ausgeführt	L'asset a été traité par OCR		L'OCR è stato eseguito per gli elementi	OCR has been performed for asset
importedDigi	No-GeolCode-specified	Imported digitisation	Importierte Digitalisierung	Numérisation importée		Digitalizzazione importata	Imported digitised	Asset is derived from imported digital data (digi.swissgeol.ch)	Asset stammt von importierten digitalen Daten ab (digi.swissgeol.ch)	L'asset provient de données numériques importées (digi.swissgeol.ch)		L'elemento deriva da dati digitali importati (digi.swissgeol.ch)	Asset is derived from imported digital data (digi.swissgeol.ch)
published	No-GeolCode-specified	published	Publiziert	Publié		Pubblicato	Published	Asset is published	Asset ist publiziert	L'asset est publié		L'elemento è pubblicato	Asset is published
\.


-- Completed on 2024-09-30 09:00:26 UTC

--
-- PostgreSQL database dump complete
--

