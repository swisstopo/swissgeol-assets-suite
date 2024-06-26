import { StatusWorkItem } from '@prisma/client';

export const statusWorkItems: StatusWorkItem[] = [
  {
    statusWorkItemCode: 'initiateAsset',
    geolCode: 'No-GeolCode-specified',
    name: 'Initially edited',
    nameDe: 'Ersterfassung Asset',
    nameFr: 'Saisie initiale',
    nameRm: '',
    nameIt: "Acquisizione iniziale dell'elemento",
    nameEn: 'Initial capture asset',
    description: 'Asset is derived from initial capture in the system',
    descriptionDe: 'Ersterfassung des Assets im System',
    descriptionFr: "Première saisie de l'asset dans le système",
    descriptionRm: '',
    descriptionIt: "L'elemento é inserito per la prima volta nel sistema",
    descriptionEn: 'Asset is derived from initial capture in the system',
  },
  {
    statusWorkItemCode: 'edited',
    geolCode: 'No-GeolCode-specified',
    name: 'Edited',
    nameDe: 'Bearbeitet',
    nameFr: 'Traité dans le système',
    nameRm: '',
    nameIt: 'Modificato',
    nameEn: 'Processed',
    description: 'Asset is processed in the system',
    descriptionDe: 'Asset ist im System bearbeitet',
    descriptionFr: "L'asset a été traité dans le système",
    descriptionRm: '',
    descriptionIt: "L'elemento é elaborato dal sistema",
    descriptionEn: 'Asset is processed in the system',
  },
  {
    statusWorkItemCode: 'importedOld',
    geolCode: 'No-GeolCode-specified',
    name: 'Old data imported',
    nameDe: 'Importierte Altdaten',
    nameFr: "Import d'anciennes données",
    nameRm: '',
    nameIt: 'Importazione di dati legacy',
    nameEn: 'Imported legacy data',
    description: 'Asset originates from imported legacy data (InfoGeol)',
    descriptionDe: 'Asset stammt von importieren Altdaten (InfoGeol) ab',
    descriptionFr: "L'asset provient de données anciennes importées (InfoGeol)",
    descriptionRm: '',
    descriptionIt: "L'elemento proviene da dati legacy importati (InfoGeol)",
    descriptionEn: 'Asset originates from imported legacy data (InfoGeol)',
  },
  {
    statusWorkItemCode: 'docClassified',
    geolCode: 'No-GeolCode-specified',
    name: 'Document classified',
    nameDe: 'Dokument klassifiziert',
    nameFr: 'Document classé',
    nameRm: '',
    nameIt: 'Documento classificato',
    nameEn: 'Document classified',
    description: 'Asset is assigned to a thematic class',
    descriptionDe: 'Asset ist einer thematischen Klasse zugewiesen',
    descriptionFr: "L'asset a été attribué à une classe thématique",
    descriptionRm: '',
    descriptionIt: "L'elemento è assegnato a una classe tematica",
    descriptionEn: 'Asset is assigned to a thematic class',
  },
  {
    statusWorkItemCode: 'objectsExtracted',
    geolCode: 'No-GeolCode-specified',
    name: 'Objects extracted',
    nameDe: 'Objekte extrahiert',
    nameFr: 'Objets extraits',
    nameRm: '',
    nameIt: 'Oggetti estratti',
    nameEn: 'Objects extracted',
    description: 'Objects extracted from asset',
    descriptionDe: 'Aus Asset wurden Objekte extrahiert',
    descriptionFr: "Des objets ont été extraits de l'asset",
    descriptionRm: '',
    descriptionIt: "Degli oggetti sono stati estratti dall'elemento",
    descriptionEn: 'Objects extracted from asset',
  },
  {
    statusWorkItemCode: 'OCRprocessed',
    geolCode: 'No-GeolCode-specified',
    name: 'OCR processed',
    nameDe: 'OCR prozessiert',
    nameFr: 'Traité par OCR',
    nameRm: '',
    nameIt: 'Elaborazione OCR',
    nameEn: 'OCR processed',
    description: 'OCR has been performed for asset',
    descriptionDe: 'Für Asset wurde OCR ausgeführt',
    descriptionFr: "L'asset a été traité par OCR",
    descriptionRm: '',
    descriptionIt: "L'OCR è stato eseguito per gli elementi",
    descriptionEn: 'OCR has been performed for asset',
  },
  {
    statusWorkItemCode: 'importedDigi',
    geolCode: 'No-GeolCode-specified',
    name: 'Imported digitisation',
    nameDe: 'Importierte Digitalisierung',
    nameFr: 'Numérisation importée',
    nameRm: '',
    nameIt: 'Digitalizzazione importata',
    nameEn: 'Imported digitised',
    description: 'Asset is derived from imported digital data (digi.swissgeol.ch)',
    descriptionDe: 'Asset stammt von importierten digitalen Daten ab (digi.swissgeol.ch)',
    descriptionFr: "L'asset provient de données numériques importées (digi.swissgeol.ch)",
    descriptionRm: '',
    descriptionIt: "L'elemento deriva da dati digitali importati (digi.swissgeol.ch)",
    descriptionEn: 'Asset is derived from imported digital data (digi.swissgeol.ch)',
  },
  {
    statusWorkItemCode: 'published',
    geolCode: 'No-GeolCode-specified',
    name: 'published',
    nameDe: 'Publiziert',
    nameFr: 'Publié',
    nameRm: '',
    nameIt: 'Pubblicato',
    nameEn: 'Published',
    description: 'Asset is published',
    descriptionDe: 'Asset ist publiziert',
    descriptionFr: "L'asset est publié",
    descriptionRm: '',
    descriptionIt: "L'elemento è pubblicato",
    descriptionEn: 'Asset is published',
  },
];
