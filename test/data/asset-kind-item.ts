import { faker } from '@faker-js/faker';
import { AssetKindItem } from '@prisma/client';

export const fakeAssetKindItemCode = (): string =>
  faker.helpers.arrayElement(assetKindItems.map((item) => item.assetKindItemCode));

export const assetKindItems: AssetKindItem[] = [
  {
    assetKindItemCode: 'package',
    geolCode: 'No-GeolCode-specified',
    name: 'Asset package',
    nameDe: 'Asset-Paket',
    nameFr: "Collection d'assets",
    nameIt: 'Raccolta di elementi',
    nameEn: 'Asset package',
    description: 'Collection/package of assets of different types',
    descriptionDe: 'Sammlung/Paket von Assets verschiedener Arten',
    descriptionFr: "Collection/paquet d'assets de différents types",
    descriptionIt: 'Raccolta di elementi di diverso tipo',
    descriptionEn: 'Collection/package of assets of different types',
  },
  {
    assetKindItemCode: 'other',
    geolCode: 'No-GeolCode-specified',
    name: 'Other',
    nameDe: 'Andere',
    nameFr: 'Autre',
    nameIt: 'Altro',
    nameEn: 'Other',
    description: 'Other types of assets not covered by the values in this list',
    descriptionDe: 'Andere Arten von Assets, die nicht mit den Werten dieser Liste abgedeckt sind',
    descriptionFr: "Autres types d'assets non couverts par les valeurs de cette liste",
    descriptionIt: 'Altri tipi di elementi non coperti dai valori di questo elenco',
    descriptionEn: 'Other types of assets not covered by the values in this list',
  },
  {
    assetKindItemCode: 'rawData',
    geolCode: 'No-GeolCode-specified',
    name: 'Raw data',
    nameDe: 'Rohdaten',
    nameFr: 'Données brutes',
    nameIt: 'Dati grezzi',
    nameEn: 'Raw data',
    description: 'Raw data',
    descriptionDe: 'Rohdaten',
    descriptionFr: 'Données brutes',
    descriptionIt: 'Dati grezzi',
    descriptionEn: 'Raw data',
  },
  {
    assetKindItemCode: 'report',
    geolCode: 'No-GeolCode-specified',
    name: 'Report',
    nameDe: 'Bericht',
    nameFr: 'Rapport',
    nameIt: 'Rapporto',
    nameEn: 'Report',
    description: 'Geological reports or other documentation of geological investigations',
    descriptionDe: 'Geologsiche Berichte oder sonstige Dokumentationen von geologischen Untersuchungen',
    descriptionFr: "Rapports géologiques ou autres documentations d'études géologiques",
    descriptionIt: 'Rapporti geologici o altra documentazione di indagini geologiche',
    descriptionEn: 'Geological reports or other documentation of geological investigations',
  },
  {
    assetKindItemCode: 'measurements',
    geolCode: 'No-GeolCode-specified',
    name: 'Measurements',
    nameDe: 'Messungen allgemein',
    nameFr: 'Mesures en général',
    nameIt: 'Misure',
    nameEn: 'Measurements',
    description: 'Any type of measurements, if not further specifiable',
    descriptionDe: 'Jegliche Arten von Messungen, wenn nicht genauer spezifizierbar',
    descriptionFr: "Tout type de mesures, en l'absence d'autres précisions",
    descriptionIt: 'Qualsiasi tipo di misura, se non ulteriormente specificabile',
    descriptionEn: 'Any type of measurements, if not further specifiable',
  },
  {
    assetKindItemCode: 'log',
    geolCode: 'No-GeolCode-specified',
    name: 'Log',
    nameDe: 'LOG',
    nameFr: 'Log',
    nameIt: 'Log',
    nameEn: 'Log',
    description: 'Borehole log or other log data',
    descriptionDe: 'Bohr-Log oder andere Log-Daten',
    descriptionFr: 'Log de forage ou autres données de log',
    descriptionIt: 'Log di perforazione o altri dati di log',
    descriptionEn: 'Borehole log or other log data',
  },
  {
    assetKindItemCode: 'deviceOutput',
    geolCode: 'No-GeolCode-specified',
    name: 'Device output',
    nameDe: 'Geräteoutput',
    nameFr: "Données de sortie de l'appareil",
    nameIt: 'Output del dispositivo',
    nameEn: 'Device output',
    description: 'Data output directly from an instrument',
    descriptionDe: 'Daten, die direkt aus einem Gerät ausgegeben wurden',
    descriptionFr: "Données sortant directement d'un appareil",
    descriptionIt: 'Dati di output ottenuti direttamente da uno strumento',
    descriptionEn: 'Data output directly from an instrument',
  },
  {
    assetKindItemCode: 'manualFieldRecord',
    geolCode: 'No-GeolCode-specified',
    name: 'Manual field record',
    nameDe: 'Feldaufzeichnung',
    nameFr: 'Enregistrement de terrain',
    nameIt: 'Registrazione manuale sul campo',
    nameEn: 'Manual field record',
    description: 'Records made during fieldwork',
    descriptionDe: 'Aufzeichnungen, die bei der Feldarbeit gemacht wurden',
    descriptionFr: 'Enregistrements réalisés lors du travail sur le terrain',
    descriptionIt: 'Registrazioni effettuate durante i lavori sul campo',
    descriptionEn: 'Records made during fieldwork',
  },
  {
    assetKindItemCode: 'labData',
    geolCode: 'No-GeolCode-specified',
    name: 'Lab data',
    nameDe: 'Labormessung',
    nameFr: 'Mesure en laboratoire',
    nameIt: 'Dati di laboratorio',
    nameEn: 'Laboratory data',
    description: 'Data collected in the laboratory, e.g. grain distribution, compressive strength tests, etc.',
    descriptionDe: 'Daten, die im Labor erhoben wurden, wie z.B. Kornverteilung, Druckversuche, etc.',
    descriptionFr: 'Données collectées en laboratoire, p. ex. répartition granulométrique, essais de compression, etc.',
    descriptionIt: 'Dati raccolti in laboratorio, ad esempio distribuzione granulometrica, prove di pressione, ecc.',
    descriptionEn: 'Data collected in the laboratory, e.g. grain distribution, compressive strength tests, etc.',
  },
  {
    assetKindItemCode: 'map',
    geolCode: 'No-GeolCode-specified',
    name: 'Map',
    nameDe: 'Karte allgemein',
    nameFr: 'Carte en général',
    nameIt: 'Mappa',
    nameEn: 'Map',
    description: 'Any type of maps, if not specifiable',
    descriptionDe: 'Jegliche Arten von Karten, wenn nicht genauer spezifizierbar',
    descriptionFr: "Tout type de carte, en l'absence d'autres précisions",
    descriptionIt: 'Qualsiasi tipo di mappa, se non specificabile',
    descriptionEn: 'Any type of maps, if not specifiable',
  },
  {
    assetKindItemCode: 'shotpointmap',
    geolCode: 'No-GeolCode-specified',
    name: 'Shotpoint map',
    nameDe: 'Schusspunktkarte',
    nameFr: 'Carte des points de tir',
    nameIt: 'Mappa dei punti di tiro',
    nameEn: 'Shotpoint map',
    description: 'Map of seismic survey shot points',
    descriptionDe: 'Karte der Schusspunkte bei einer Seismischen Untersuchung',
    descriptionFr: "Carte des points de tir lors d'une étude sismique",
    descriptionIt: "Mappa dei punti di tiro durante un'indagine sismica",
    descriptionEn: 'Map of seismic survey shot points',
  },
  {
    assetKindItemCode: 'basemap',
    geolCode: 'No-GeolCode-specified',
    name: 'Basemap',
    nameDe: 'Basemap',
    nameFr: 'Carte de base',
    nameIt: 'Mappa di base',
    nameEn: 'Basemap',
    description: 'Base map',
    descriptionDe: 'Grundkarte',
    descriptionFr: 'Carte de base',
    descriptionIt: 'Mappa di base',
    descriptionEn: 'Base map',
  },
  {
    assetKindItemCode: 'wellLocationmap',
    geolCode: 'No-GeolCode-specified',
    name: 'Well location map',
    nameDe: 'Bohrstandortkarte',
    nameFr: 'Carte du site de forage',
    nameIt: 'Mappa della posizione della perforazione',
    nameEn: 'Borehole location map',
    description: 'Map showing locations of one or more boreholes',
    descriptionDe: 'Karte mit den Standorten von einer oder mehrer Bohrungen',
    descriptionFr: "Carte montrant l'emplacement d'un ou de plusieurs forages",
    descriptionIt: "Mappa che mostra l'ubicazione di uno o più perforazioni",
    descriptionEn: 'Map showing locations of one or more boreholes',
  },
  {
    assetKindItemCode: 'geologicalMap',
    geolCode: 'No-GeolCode-specified',
    name: 'Geological map',
    nameDe: 'Geologische Karte',
    nameFr: 'Carte géologique',
    nameIt: 'Carta geologica',
    nameEn: 'Geological map',
    description: 'Geological map',
    descriptionDe: 'Geologische Karte',
    descriptionFr: 'Carte géologique',
    descriptionIt: 'Carta geologica',
    descriptionEn: 'Geological map',
  },
  {
    assetKindItemCode: 'location',
    geolCode: 'No-GeolCode-specified',
    name: 'Location',
    nameDe: 'Situationsplan',
    nameFr: 'Plan de situation',
    nameIt: 'Posizione',
    nameEn: 'Location',
    description: 'Site plan,locality plan of an investigation',
    descriptionDe: 'Situationsplan, Lageplan einer Untersuchung',
    descriptionFr: "Plan de situation, plan d'implantation d'une étude",
    descriptionIt: "Localizzazone del sito o di un'indagine",
    descriptionEn: 'Site plan,locality plan of an investigation',
  },
  {
    assetKindItemCode: 'crossSection',
    geolCode: 'No-GeolCode-specified',
    name: 'Cross section',
    nameDe: 'Geologischer Profilschnitt',
    nameFr: 'Coupe géologique',
    nameIt: 'Sezione geologica trasversale',
    nameEn: 'Cross section',
    description: 'Geological cross section or profile',
    descriptionDe: 'Geologische Längen- oder Querprofile',
    descriptionFr: 'Coupes géologiques longitudinales ou transversales',
    descriptionIt: 'Profili geologici longitudinali o trasversali',
    descriptionEn: 'Geological cross section or profile',
  },
  {
    assetKindItemCode: 'seismicSection',
    geolCode: 'No-GeolCode-specified',
    name: 'Seismic section',
    nameDe: 'Seismische Section',
    nameFr: 'Section sismique',
    nameIt: 'Sezione sismica',
    nameEn: 'Seismic section',
    description: 'Seismic section',
    descriptionDe: 'Seismische Sektion',
    descriptionFr: 'Section sismique',
    descriptionIt: 'Sezione sismica',
    descriptionEn: 'Seismic section',
  },
  {
    assetKindItemCode: 'drillPath',
    geolCode: 'No-GeolCode-specified',
    name: 'Drill path',
    nameDe: 'Bohrpfad',
    nameFr: 'Trajectoire de forage',
    nameIt: 'Percorso di perforazione',
    nameEn: 'Borehole path',
    description: 'Borehole path: information on the spatial course of the borehole',
    descriptionDe: 'Bohrpfad: Angaben zum räumlichen Verlauf der Bohrung',
    descriptionFr: 'Trajectoire de forage : indications sur le tracé spatial du forage',
    descriptionIt: 'Percorso della perforazione: informazioni sulla traccia della perforazione',
    descriptionEn: 'Borehole path: information on the spatial course of the borehole',
  },
  {
    assetKindItemCode: 'softwareCode',
    geolCode: 'No-GeolCode-specified',
    name: 'Software / code',
    nameDe: 'Software-Code',
    nameFr: 'Code du logiciel',
    nameIt: 'Software / codice',
    nameEn: 'Software / code',
    description: 'Software, script, code/coding',
    descriptionDe: 'Software, Skript, Code/Codierung',
    descriptionFr: 'Logiciel, script, code/codage',
    descriptionIt: 'Software, script, codice',
    descriptionEn: 'Software, script, code/coding',
  },
  {
    assetKindItemCode: 'model',
    geolCode: 'No-GeolCode-specified',
    name: 'Model',
    nameDe: 'Modell',
    nameFr: 'Modèle',
    nameIt: 'Modello',
    nameEn: 'Model',
    description: 'Models, e.g. 3D model, block model, etc.',
    descriptionDe: 'Modelle, z.B. 3D-Modell, Blocksturzmodell, etc.',
    descriptionFr: 'Modèles, p. ex. modèle 3D, modèle de chute de blocs, etc.',
    descriptionIt: 'Modelli, ad esempio modello 3D, modello di scivolamento di blocchi, ecc.',
    descriptionEn: 'Models, e.g. 3D model, block model, etc.',
  },
  {
    assetKindItemCode: 'photo',
    geolCode: 'No-GeolCode-specified',
    name: 'Photo',
    nameDe: 'Foto',
    nameFr: 'Photo',
    nameIt: 'Foto',
    nameEn: 'Photo',
    description: 'Any kind of photos',
    descriptionDe: 'Jegliche Art von Fotos',
    descriptionFr: 'Tout type de photos',
    descriptionIt: 'Qualsiasi tipo di foto',
    descriptionEn: 'Any kind of photos',
  },
  {
    assetKindItemCode: 'seismic3D',
    geolCode: 'No-GeolCode-specified',
    name: 'Seismic 3D',
    nameDe: 'Seismische 3D Untersuchung',
    nameFr: 'Étude sismique 3D',
    nameIt: 'Sismica 3D',
    nameEn: 'Seismic 3D',
    description: 'Data from 3D seismic surveys (3D seismic)',
    descriptionDe: 'Daten aus 3D-seismischen Untersuchungen (3D-Seismik)',
    descriptionFr: "Données d'études sismiques 3D",
    descriptionIt: 'Dati provenienti da indagini sismiche 3D (sismica 3D)',
    descriptionEn: 'Data from 3D seismic surveys (3D seismic)',
  },
  {
    assetKindItemCode: 'profileSection',
    geolCode: 'No-GeolCode-specified',
    name: 'Profile / section',
    nameDe: 'Profil / Profilschnitt',
    nameFr: 'Profil / Coupe',
    nameIt: 'Profilo / sezione',
    nameEn: 'Profile / section',
    description: 'Any kind of sections or profiles, if not further specifiable',
    descriptionDe: 'Jegliche Arten von Profilen, wenn nicht genauer spezifizierbar',
    descriptionFr: "Tout type de profil ou de coupe, en l'absence d'autres précisions",
    descriptionIt: 'Qualsiasi tipo di profilo, se non ulteriormente specificabile',
    descriptionEn: 'Any kind of sections or profiles, if not further specifiable',
  },
  {
    assetKindItemCode: 'seismicInterpretation',
    geolCode: 'No-GeolCode-specified',
    name: 'Seismic interpretation',
    nameDe: 'Seismische Interpretation',
    nameFr: 'Interprétation sismique',
    nameIt: 'Interpretazione sismica',
    nameEn: 'Seismic interpretation',
    description: 'Profile with seismic interpretation',
    descriptionDe: 'Profil mit seismischer Interpretation',
    descriptionFr: 'Profil avec interprétation sismique',
    descriptionIt: 'Profilo con interpretazione sismica',
    descriptionEn: 'Profile with seismic interpretation',
  },
  {
    assetKindItemCode: 'boreholeProfile',
    geolCode: 'No-GeolCode-specified',
    name: 'Borehole profile',
    nameDe: 'Bohrprofil',
    nameFr: 'Profil de forage',
    nameIt: 'Profilo della perforazione',
    nameEn: 'Borehole profile',
    description:
      'Borehole profile: representation of the drilled layers, layer interpretations and further information on the borehole',
    descriptionDe:
      'Bohrprofil: Darstellung der erbohrten Schichten, Schichtinterpretationen und weiteren Angaben zur Bohrung',
    descriptionFr:
      'Profil de forage : représentation des couches forées, interprétations des couches et autres indications sur le forage.',
    descriptionIt:
      'Profilo della perforazione: rappresentazione degli strati perforati, interpretazione degli strati e ulteriori informazioni sulla perforazione',
    descriptionEn:
      'Borehole profile: representation of the drilled layers, layer interpretations and further information on the borehole',
  },
  {
    assetKindItemCode: 'boreholeCompletion',
    geolCode: 'No-GeolCode-specified',
    name: 'Borehole completion',
    nameDe: 'Bohrlochausbau',
    nameFr: 'Aménagement du forage',
    nameIt: 'Completamento della perforazione',
    nameEn: 'Borehole completion',
    description: 'Borehole completion: details of casing, backfill, internals (e.g. piezometer), etc.',
    descriptionDe: 'Bohrlochausbau: Angaben zu Verrohrung, Hinterfüllung, Einbauten (z.B. Piezometer), etc.',
    descriptionFr:
      'Aménagement du trou de forage : indications sur le tubage, le remblayage, les installations (p. ex. piézomètre), etc.',
    descriptionIt:
      'Completamento dela perforazione: dettagli del tipo di tubatura, del riempimento, dei componenti interni (ad es. piezometro), ecc.',
    descriptionEn: 'Borehole completion: details of casing, backfill, internals (e.g. piezometer), etc.',
  },
  {
    assetKindItemCode: 'configuration',
    geolCode: 'No-GeolCode-specified',
    name: 'configuration',
    nameDe: 'Konfiguration',
    nameFr: 'Configuration',
    nameIt: 'Configurazione',
    nameEn: 'configuration',
    description: 'Configurations of modelling or other calculations',
    descriptionDe: 'Konfigurationen von Modellierungen oder sonstigen Berechnungen',
    descriptionFr: 'Configurations de modélisations ou autres calculs',
    descriptionIt: 'Configurazioni di modellazione o altri calcoli',
    descriptionEn: 'Configurations of modelling or other calculations',
  },
  {
    assetKindItemCode: 'multmedia',
    geolCode: 'No-GeolCode-specified',
    name: 'Multmedia',
    nameDe: 'Multimediadatei',
    nameFr: 'Fichier multimédia',
    nameIt: 'File multimediale',
    nameEn: 'Multmedia',
    description: 'Any type of multimedia files, if not further specifiable.',
    descriptionDe: 'Jegliche Art von Multimediadateien, wenn nicht genauer spezifizierbar',
    descriptionFr: "Tout type de fichier multimédia, en l'absence d'autres précisions",
    descriptionIt: 'Qualsiasi tipo di file multimediale, se non ulteriormente specificabile.',
    descriptionEn: 'Any type of multimedia files, if not further specifiable.',
  },
  {
    assetKindItemCode: 'video',
    geolCode: 'No-GeolCode-specified',
    name: 'Video',
    nameDe: 'Video',
    nameFr: 'Vidéo',
    nameIt: 'Video',
    nameEn: 'Video',
    description: 'Any type of video',
    descriptionDe: 'Jegliche Art von Videos',
    descriptionFr: 'Tout type de vidéos',
    descriptionIt: 'Qualsiasi tipo di video',
    descriptionEn: 'Any type of video',
  },
  {
    assetKindItemCode: 'unknown',
    geolCode: 'No-GeolCode-specified',
    name: 'Unknown',
    nameDe: 'Unbekannt',
    nameFr: 'Inconnu',
    nameIt: 'Sconosciuto',
    nameEn: 'Unknown',
    description: 'Assets whose nature/type is not known',
    descriptionDe: 'Assets, deren Art/Typ nicht bekannt ist',
    descriptionFr: "Assets dont la nature/le type n'est pas connu/e",
    descriptionIt: 'Attività la cui natura/tipo non è nota',
    descriptionEn: 'Assets whose nature/type is not known',
  },
  {
    assetKindItemCode: 'inSitu',
    geolCode: 'No-GeolCode-specified',
    name: 'In-situ measurment',
    nameDe: 'In-situ Messung',
    nameFr: 'Mesure in situ',
    nameIt: 'Misurazione in situ',
    nameEn: 'In-situ measurement',
    description: 'Any kind of in-situ measurements, such as pump test, well test, etc.',
    descriptionDe: 'Jegliche Art von In-situ Messungen, wie z.B. Pumpversuch, Well-Test, etc.',
    descriptionFr: 'Tout type de mesures in situ, p. ex. essai de pompage, test de puits, etc.',
    descriptionIt: 'Qualsiasi tipo di misurazione in situ, come un test di pompaggio, il test del pozzo, ecc.',
    descriptionEn: 'Any kind of in-situ measurements, such as pump test, well test, etc.',
  },
];
