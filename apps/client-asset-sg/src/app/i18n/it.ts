import { AppTranslations } from './i18n';

export const itAppTranslations: AppTranslations = {
  logoSwissGeol: 'Logo Swissgeol Assets',
  welcomeTo: 'Benvenuti su',
  accessForbidden: 'Non avete accesso a questa applicazione.',
  resourceForbidden: 'IT Sie haben keinen Zugriff auf diese Ressource.',
  ok: 'OK',
  submit: 'IT Absenden',
  cancel: 'IT Abbrechen',
  login: 'Login',
  logout: 'IT Abmelden',
  yes: 'Sì',
  no: 'No',
  add: 'IT Hinzufügen',
  save: 'IT Speichern',
  required: 'IT Erforderlich',
  labelEdit: 'IT Bearbeiten',
  delete: 'IT Löschen',
  close: 'IT Schliessen',
  datePlaceholder: 'AAAA-MM-GG',
  workgroup: {
    title: 'IT Arbeitsgruppe',
  },
  menuBar: {
    assets: 'IT Assets',
    admin: 'IT Verwaltung',
    favourites: 'IT Favoriten',
    help: 'IT Hilfe',
    profile: 'IT Profil',
    settings: 'IT Einstellungen',
    signOut: 'IT Schliessen',
    userManagement: 'IT Benutzer Verwaltung',
  },
  map: {
    zoomIn: 'IT Hineinzoomen',
    zoomOut: 'IT Herauszoomen',
    zoomToOrigin: 'IT Zur Ursprungsposition zoomen',
    drawingModeOn: 'IT Zeichenmodus ein',
    drawingModeOff: 'IT Zeichenmodus aus',
    dragHandleLabel: 'IT Ziehgriff',
  },
  search: {
    textSearchFieldPlaceholder: 'IT Suche nach Original- oder  Öffentlichem Titel und Autor oder Einlieferer',
    searchInstructionsHeading: 'IT Asset-Suche',
    searchInstructions: 'IT Suche nach einem Asset über das Suchfeld oder durch Zeichnen eines Polygons auf der Karte.',
    closeInstructions: 'IT Anleitung schliessen',
    searchControl: 'IT Suchsteuerung',
    refineSearch: 'IT Suche verfeinern',
    searchResults: 'IT Assets',
    author: 'IT Autor',
    documentDate: 'IT Dokumentdatum',
    usage: 'IT Nutzung',
    detailedInformation: 'IT Detailinformationen',
    originalTitle: 'IT Originaltitel',
    kind: 'IT Art',
    topic: 'IT Thema',
    format: 'IT Format',
    createdDate: 'IT Erstellungsdatum',
    lastProcessedDate: 'IT Letztes Update',
    alternativeId: 'IT Alternativ-ID',
    contacts: 'IT Kontakte',
    subject: 'IT Thema',
    content: 'IT Inhalt',
    nationalInterest: 'IT Nat. Interesse',
    reference: 'IT Verweis',
    status: 'IT Status',
    closeAssetDetails: 'IT Assetdetails schliessen',
    usageCode: {
      public: 'IT Öffentliche Nutzung',
      internal: 'IT Interne Nutzung',
      useOnRequest: 'IT Nutzung auf Anfrage',
    },
    geometry: 'IT Geometrie',
    geometryCode: {
      Point: 'IT Punkt',
      LineString: 'IT Linie',
      Polygon: 'IT Polygon',
      None: 'IT Keine',
    },
    language: 'IT Sprache',
    languageItem: {
      None: 'IT keine',
    },
    resetSearch: 'IT Suche zurücksetzen',
    file: 'IT Datei',
    openFileInNewTab: 'IT {{fileName}} in neuem Tab öffnen',
    downloadFile: 'IT {{fileName}} herunterladen',
    assetsUnderMouseCursor: 'IT {{ assetsCount }} Assets unter dem Mauszeiger gefunden. Bitte wählen Sie eines aus:',
    removePolygon: 'IT Polygon aufheben',
    hideTable: 'IT Tabelle verbergen',
    showTable: 'IT Tabelle anzeigen',
  },
  contactRoles: {
    author: 'IT Autor',
    initiator: 'IT Auftraggeber',
    supplier: 'IT Einlieferer',
  },
  edit: {
    tabs: {
      general: {
        tabName: 'IT Allgemein',
        kind: 'IT Typ',
        language: 'IT Sprache',
        format: 'IT Format',
        topic: 'IT Thema',
        topics: 'IT Themen',
        title: 'IT Titel',
        publicTitle: 'IT Öffentlicher Titel',
        originalTitle: 'IT Originaltitel',
        sgsId: 'IT SGS-ID',
        date: 'IT Datum',
        creationDate: 'IT Erstellungsdatum',
        dateReceived: 'IT Eingangsdatum',
        type: 'IT Typ',
        alternativeId: 'IT Alternativ-ID',
        alternativeIdDescription: 'IT Beschreibung Alternativ-ID',
        addNewAlternativeId: 'IT Neue Alternativ-ID hinzufügen',
        files: 'IT Dateien',
        dragFileHere: 'IT Datei hierher ziehen',
        or: 'IT oder',
        selectFile: 'IT Datei auswählen',
        addNewFile: 'IT Neue Datei hinzufügen',
        willBeDeleted: 'IT Wird gelöscht werden',
        willBeUploaded: 'IT Wird hochgeladen werden',
        fileSizeToLarge: 'IT Die Dateigrösse darf 250MB nicht überschreiten.',
      },
      usage: {
        tabName: 'IT Nutzung',
        internalUsageReason: 'IT Interne Nutzung wird eingeschaltet, weil Externe Nutzung eingeschaltet wurde.',
        internalUsage: 'IT Interne Nutzung',
        externalUsage: 'IT Externe Nutzung',
        status: 'IT Status',
        expirationDate: 'IT Ablaufdatum',
        nationalInterest: 'IT Nationales Interesse',
        typeNationalInterest: 'IT Typ Nationales Interesse',
        type: 'IT Typ',
        types: 'IT Typen',
        noTypesAssigned: 'IT Keine Typen zugewiesen',
        questionDeleteNationalInterest: 'IT Möchten Sie fortfahren und die Einträge löschen?',
        validationErrors: {
          internalPublicUsageDateError:
            'IT Das interne Ablaufdatum muss näher oder gleich liegen als das der externen Nutzung',
        },
      },
      contacts: {
        tabName: 'IT Kontakte',
        linkContact: 'IT Neuen Kontakt-Link hinzufügen',
        link: 'IT Verlinken',
        createNewContact: 'IT Neuen Kontakt erstellen',
        editContact: 'IT Konktakt bearbeiten',
        unlink: 'IT Verlinkung aufheben',
        viewDetails: 'IT Konktaktdetails anzeigen',
        contact: 'IT Kontakt',
        role: 'IT Rolle',
        newContact: 'IT Neuer Kontakt',
        contactKind: 'IT Kontaktart',
        name: 'IT Name',
        street: 'IT Strasse',
        number: 'IT Nummer',
        postCode: 'IT PLZ',
        locality: 'IT Ort',
        country: 'IT Land',
        email: 'IT E-Mail',
        phone: 'IT Telefon',
        website: 'IT Website',
        create: 'IT Erstellen',
        noContacts: 'RM Keine Kontakte',
      },
      references: {
        tabName: 'IT Verweise',
        assetTitlePublic: 'IT Öffentlicher Titel',
        assetTitlePublicPlaceholder: 'IT Suche über den öffentlichen Titel',
        referenceHeadings: {
          parent: 'IT Übergeordneter Asset',
          subordinate: 'IT Untergeordnete Assets',
          sibling: 'IT Geschwister Assets',
          newReference: 'IT Neuer Verweis',
        },
        referenceType: {
          parent: 'IT Übergeordnet',
          subordinate: 'IT Untergeordnet',
          sibling: 'IT Geschwister',
        },
      },
      geometries: {
        geometry: 'IT Geometrie',
        tabName: 'IT Geometrien',
        noGeometries: 'IT Keine Geometrien',
        geometryType: 'IT Geometrietyp',
        selectGeometryLabel: 'IT Wählen Sie aus {{count}} Geometrien',
        geometryLineString: 'IT Linie',
        geometryPolygon: 'IT Polygon',
        geometryPoint: 'IT Punkt',
        geometryMenu: {
          buttonLabel: 'IT Menü für Geometrie',
          new: 'IT Neue Geometrie erfassen',
          remove: 'IT Geometrie löschen',
        },
        vertexMenu: {
          buttonLabel: 'IT Menü für Eckpunkt {{index}}',
          add: 'IT Eckpunkt hinzufügen nach',
          remove: 'IT Eckpunkt löschen',
        },
        instructionsPoint: 'IT Passen Sie die Koordinaten des neuen Punktes an',
        instructionsPolygonOrLIne: 'IT Zeichnen Sie mindestens {{ count }} Punkte',
        instructionsMorePolygonOrLIne: 'IT Zeichnen Sie mindestens {{ count }} weitere Punkte',
        createGeometry: 'IT Geometrie erstellen',
      },
      administration: {
        tabName: 'IT Administration',
        infoGeol: 'IT InfoGeol',
        sgsId: 'IT SGS-ID',
        data: 'IT Daten',
        contactData: 'IT Kontaktdaten',
        auxData: 'IT Zusatzdaten',
        municipality: 'IT Gemeinde',
        workStatus: 'IT Arbeitsstatus',
        lastProcessed: 'IT Letztes Update',
        by: 'IT Von',
        addWorkStatus: 'IT Hinzufügen Arbeitsstatus',
        tabValidationErrors: {
          tab: 'IT Tab',
          hasValidationErrors: 'IT enthält Validierungsfehler',
        },
      },
    },
    closeManageAsset: 'IT Asset verwalten schliessen',
    questionDiscardChanges: 'IT Möchten Sie die Änderungen verwerfen?',
    adminInstructionsEditHeading: 'IT Asset verwalten',
    adminInstructionsEdit: 'IT Suche nach einem Asset über das Menü Assets, um dieses zu verwalten.',
    adminInstructionsCreateHeading: 'IT Neues Asset',
    adminInstructionsCreate: 'IT Neues Asset erstellen',
    adminInstructionsSyncElasticAssetsHeading: 'IT Assets mit Elasticsearch synchronisieren',
    adminInstructionsSyncElasticAssets:
      'IT Gleicht den Zustand von Elasticsearch mit der Datenbank ab.' +
      'IT Damit wird sichergestellt, dass die Suche alle vorhandenen Assets miteinbezieht.',
    adminInstructionsSyncElasticAssetsStart: 'IT Synchronisation starten',
  },
  admin: {
    users: 'IT Benutzer',
    workgroups: 'IT Arbeitsgruppen',
    name: 'IT Name',
    role: 'IT Rolle',
    actions: 'IT Aktionen',
    email: 'IT E-Mail',
    back: 'IT Zurück',
    languages: {
      de: 'IT Deutsch',
      en: 'IT Englisch',
      fr: 'IT Französisch',
      it: 'IT Italienisch',
      rm: 'IT Rätoromanisch',
    },
    userPage: {
      admin: 'IT Admin',
      lang: 'IT Sprache',
      addWorkgroups: 'IT Arbeitsgruppen hinzufügen',
      more: 'IT weitere',
      userAddError: 'IT Füge mindestens einen Benutzer hinzu',
    },
    workgroupPage: {
      name: 'IT Name',
      isActive: 'IT Aktiv',
      activate: 'IT Aktivieren',
      deactivate: 'IT Deaktivieren',
      create: 'IT Erstellen',
      isDisabled: 'IT Deaktiviert',
      chooseUsersText: 'IT Füge Nutzer hinzu, um sie zu verwalten',
      addUsers: 'IT Benutzer hinzufügen',
    },
  },
};
