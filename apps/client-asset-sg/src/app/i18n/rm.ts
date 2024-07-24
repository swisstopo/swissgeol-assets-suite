import { AppTranslations } from './i18n';

export const rmAppTranslations: AppTranslations = {
  logoSwissGeol: 'Logo Swissgeol Assets',
  welcomeTo: 'RM Willkommen bei',
  accessForbidden: 'RM Sie haben keinen Zugriff auf diese Applikation.',
  resourceForbidden: 'RM Sie haben keinen Zugriff auf diese Ressource.',
  ok: 'OK',
  submit: 'RM Absenden',
  cancel: 'RM Abbrechen',
  login: 'Login',
  logout: 'RM Abmelden',
  yes: 'Sì',
  no: 'No',
  add: 'RM Hinzufügen',
  save: 'RM Speichern',
  required: 'RM Erforderlich',
  labelEdit: 'RM Bearbeiten',
  delete: 'RM Löschen',
  close: 'RM Schliessen',
  datePlaceholder: 'AAAA-MM-GG',
  workgroup: {
    title: 'IT Arbeitsgruppe',
  },
  menuBar: {
    assets: 'RM Assets',
    admin: 'RM Verwaltung',
    favourites: 'RM Favoriten',
    help: 'RM Hilfe',
    profile: 'RM Profil',
    settings: 'RM Einstellungen',
    signOut: 'RM Schliessen',
    userManagement: 'RM Benutzer Verwaltung',
  },
  map: {
    zoomIn: 'RM Hineinzoomen',
    zoomOut: 'RM Herauszoomen',
    zoomToOrigin: 'RM Zur Ursprungsposition zoomen',
    drawingModeOn: 'RM Zeichenmodus ein',
    drawingModeOff: 'RM Zeichenmodus aus',
    dragHandleLabel: 'RM Ziehgriff',
  },
  search: {
    textSearchFieldPlaceholder: 'RM Suche nach Original- oder  Öffentlichem Titel und Autor oder Einlieferer',
    searchInstructionsHeading: 'RM Asset-Suche',
    searchInstructions: 'RM Suche nach einem Asset über das Suchfeld oder durch Zeichnen eines Polygons auf der Karte.',
    closeInstructions: 'RM Anleitung schliessen',
    searchControl: 'RM Suchsteuerung',
    refineSearch: 'RM Suche verfeinern',
    searchResults: 'RM Assets',
    author: 'RM Autor',
    documentDate: 'RM Dokumentdatum',
    usage: 'RM Nutzung',
    detailedInformation: 'RM Detailinformationen',
    originalTitle: 'RM Originaltitel',
    kind: 'RM Art',
    topic: 'RM Thema',
    format: 'RM Format',
    createdDate: 'RM Erstellungsdatum',
    lastProcessedDate: 'RM Letztes Update',
    alternativeId: 'RM Alternativ-ID',
    contacts: 'RM Kontakte',
    subject: 'RM Thema',
    content: 'RM Inhalt',
    nationalInterest: 'RM Nat. Interesse',
    reference: 'RM Verweis',
    status: 'RM Status',
    closeAssetDetails: 'RM Assetdetails schliessen',
    usageCode: {
      public: 'RM Öffentliche Nutzung',
      internal: 'RM Interne Nutzung',
      useOnRequest: 'RM Nutzung auf Anfrage',
    },
    geometry: 'RM Geometrie',
    geometryCode: {
      Point: 'RM Punkt',
      LineString: 'RM Linie',
      Polygon: 'RM Polygon',
      None: 'RM Keine',
    },
    language: 'RM Sprache',
    languageItem: {
      None: 'RM keine',
    },
    resetSearch: 'RM Suche zurücksetzen',
    file: 'RM Datei',
    openFileInNewTab: 'RM {{fileName}} in neuem Tab öffnen',
    downloadFile: 'RM {{fileName}} herunterladen',
    assetsUnderMouseCursor: 'RM {{ assetsCount }} Assets unter dem Mauszeiger gefunden. Bitte wählen Sie eines aus:',
    removePolygon: 'RM Polygon aufheben',
    hideTable: 'RM Tabelle verbergen',
    showTable: 'RM Tabelle anzeigen',
  },
  contactRoles: {
    author: 'RM Autor',
    initiator: 'RM Auftraggeber',
    supplier: 'RM Einlieferer',
  },
  edit: {
    tabs: {
      general: {
        tabName: 'RM Allgemein',
        kind: 'RM Typ',
        language: 'RM Sprache',
        format: 'RM Format',
        topic: 'RM Thema',
        topics: 'RM Themen',
        title: 'RM Titel',
        publicTitle: 'RM Öffentlicher Titel',
        originalTitle: 'RM Originaltitel',
        sgsId: 'RM SGS-ID',
        date: 'RM Datum',
        creationDate: 'RM Erstellungsdatum',
        dateReceived: 'RM Eingangsdatum',
        type: 'RM Typ',
        alternativeId: 'RM Alternativ-ID',
        alternativeIdDescription: 'RM Beschreibung Alternativ-ID',
        addNewAlternativeId: 'RM Neue Alternativ-ID hinzufügen',
        files: 'RM Dateien',
        dragFileHere: 'RM Datei hierher ziehen',
        or: 'FRM oder',
        selectFile: 'RM Datei auswählen',
        addNewFile: 'RM Neue Datei hinzufügen',
        willBeDeleted: 'RM Wird gelöscht werden',
        willBeUploaded: 'RM Wird hochgeladen werden',
        fileSizeToLarge: 'RM Die Dateigrösse darf 250MB nicht überschreiten.',
      },
      usage: {
        tabName: 'RM Nutzung',
        internalUsageReason: 'RM Interne Nutzung wird eingeschaltet, weil Externe Nutzung eingeschaltet wurde.',
        internalUsage: 'RM Interne Nutzung',
        externalUsage: 'RM Externe Nutzung',
        status: 'RM Status',
        expirationDate: 'RM Ablaufdatum',
        nationalInterest: 'RM Nationales Interesse',
        typeNationalInterest: 'RM Typ Nationales Interesse',
        type: 'RM Typ',
        types: 'RM Typen',
        noTypesAssigned: 'RM Keine Typen zugewiesen',
        questionDeleteNationalInterest: 'RM Möchten Sie fortfahren und die Einträge löschen?',
        validationErrors: {
          internalPublicUsageDateError:
            'RM Das interne Ablaufdatum muss näher oder gleich liegen als das der externen Nutzung',
        },
      },
      contacts: {
        tabName: 'RM Kontakte',
        linkContact: 'RM Neuen Kontakt-Link hinzufügen',
        link: 'RM Verlinken',
        createNewContact: 'RM Neuen Kontakt erstellen',
        editContact: 'RM Konktakt bearbeiten',
        unlink: 'RM Verlinkung aufheben',
        viewDetails: 'RM Konktaktdetails anzeigen',
        contact: 'RM Kontakt',
        role: 'RM Rolle',
        newContact: 'RM Neuer Kontakt',
        contactKind: 'RM Kontaktart',
        name: 'RM Name',
        street: 'RM Strasse',
        number: 'RM Nummer',
        postCode: 'RM PLZ',
        locality: 'RM Ort',
        country: 'RM Land',
        email: 'RM E-Mail',
        phone: 'RM Telefon',
        website: 'RM Website',
        create: 'RM Erstellen',
        noContacts: 'RM Keine Kontakte',
      },
      references: {
        tabName: 'RM Verweise',
        assetTitlePublic: 'RM Öffentlicher Titel',
        assetTitlePublicPlaceholder: 'RM Suche über den öffentlichen Titel',
        referenceHeadings: {
          parent: 'RM Übergeordneter Asset',
          subordinate: 'RM Untergeordnete Assets',
          sibling: 'RM Geschwister Assets',
          newReference: 'RM Neuer Verweis',
        },
        referenceType: {
          parent: 'RM Übergeordnet',
          subordinate: 'RM Untergeordnet',
          sibling: 'RM Geschwister',
        },
      },
      geometries: {
        tabName: 'RM Geometrien',
        geometry: 'RM Geometrie',
        noGeometries: 'RM Keine Geometrien',
        geometryType: 'RM Geometrietyp',
        selectGeometryLabel: 'RM Wählen Sie aus {{count}} Geometrien',
        geometryLineString: 'RM Linie',
        geometryPolygon: 'RM Polygon',
        geometryPoint: 'RM Punkt',
        geometryMenu: {
          buttonLabel: 'RM Menü für Geometrie',
          new: 'RM Neue Geometrie erfassen',
          remove: 'RM Geometrie löschen',
        },
        vertexMenu: {
          buttonLabel: 'RM Menü für Eckpunkt {{index}}',
          add: 'RM Eckpunkt hinzufügen nach',
          remove: 'RM Eckpunkt löschen',
        },
        instructionsPoint: 'RM Passen Sie die Koordinaten des neuen Punktes an',
        instructionsPolygonOrLIne: 'RM Zeichnen Sie mindestens {{ count }} Punkte',
        instructionsMorePolygonOrLIne: 'RM Zeichnen Sie mindestens {{ count }} weitere Punkte',
        createGeometry: 'RM Geometrie erstellen',
      },
      administration: {
        tabName: 'RM Administration',
        infoGeol: 'RM InfoGeol',
        sgsId: 'RM SGS-ID',
        data: 'RM Daten',
        contactData: 'RM Kontaktdaten',
        auxData: 'RM Zusatzdaten',
        municipality: 'RM Gemeinde',
        workStatus: 'RM Arbeitsstatus',
        lastProcessed: 'RM Letztes Update',
        by: 'RM Von',
        addWorkStatus: 'RM Hinzufügen Arbeitsstatus',
        tabValidationErrors: {
          tab: 'RM Tab',
          hasValidationErrors: 'RM enthält Validierungsfehler',
        },
      },
    },
    closeManageAsset: 'RM Asset verwalten schliessen',
    questionDiscardChanges: 'RM Möchten Sie die Änderungen verwerfen?',
    adminInstructionsEditHeading: 'RM Asset verwalten',
    adminInstructionsEdit: 'RM Suche nach einem Asset über das Menü Assets, um dieses zu verwalten.',
    adminInstructionsCreateHeading: 'RM Neues Asset',
    adminInstructionsCreate: 'RM Neues Asset erstellen',
    adminInstructionsSyncElasticAssetsHeading: 'RM Assets mit Elasticsearch synchronisieren',
    adminInstructionsSyncElasticAssets:
      'RM Gleicht den Zustand von Elasticsearch mit der Datenbank ab.' +
      'RM Damit wird sichergestellt, dass die Suche alle vorhandenen Assets miteinbezieht.',
    adminInstructionsSyncElasticAssetsStart: 'RM Synchronisation starten',
  },
  admin: {
    users: 'RM Benutzer',
    workgroups: 'RM Arbeitsgruppen',
    name: 'RM Name',
    role: 'RM Rolle',
    actions: 'RM Aktionen',
    email: 'RM E-Mail',
    back: 'RM Zurück',
    languages: {
      de: 'RM Deutsch',
      en: 'RM Englisch',
      fr: 'RM Französisch',
      it: 'RM Italienisch',
      rm: 'RM Rätoromanisch',
    },
    userPage: {
      admin: 'RM Admin',
      lang: 'RM Sprache',
      addWorkgroups: 'RM Arbeitsgruppen hinzufügen',
      more: 'RM weitere',
      userAddError: 'RM Füge mindestens einen Benutzer hinzu',
    },
    workgroupPage: {
      name: 'RM Name',
      isActive: 'RM Aktiv',
      create: 'RM Erstellen',
      activate: 'RM Aktivieren',
      deactivate: 'RM Deaktivieren',
      isDisabled: 'RM Deaktiviert',
      chooseUsersText: 'RM Füge Nutzer hinzu, um sie zu verwalten',
      addUsers: 'RM Benutzer hinzufügen',
    },
  },
};
