export const deAppTranslations = {
  logoSwissGeol: 'Logo Swissgeol Assets',
  welcomeTo: 'Willkommen bei',
  accessForbidden: 'Sie haben keinen Zugriff auf diese Applikation.',
  resourceForbidden: 'Sie haben keinen Zugriff auf diese Ressource.',
  ok: 'OK',
  submit: 'Absenden',
  cancel: 'Abbrechen',
  confirm: 'Bestätigen',
  confirmDelete: 'Sind Sie sicher, dass Sie dieses Asset löschen wollen?',
  deleteSuccess: 'Das Asset wurde erfolgreich gelöscht.',
  login: 'Anmelden',
  logout: 'Abmelden',
  yes: 'Ja',
  no: 'Nein',
  add: 'Hinzufügen',
  save: 'Speichern',
  required: 'Erforderlich',
  labelEdit: 'Bearbeiten',
  delete: 'Löschen',
  close: 'Schliessen',
  datePlaceholder: 'JJJJ-MM-TT',
  workgroup: {
    title: 'Arbeitsgruppe',
    errors: {
      nameTaken: "Der Name '{{name}}' wird bereits von einer anderen Arbeitsgruppe verwendet.",
    },
  },
  favorites: {
    title: 'Favoriten',
  },
  menuBar: {
    filters: 'Filter',
    admin: 'Verwaltung',
    favourites: 'Favoriten',
    help: 'Hilfe',
    profile: 'Profil',
    settings: 'Einstellungen',
    signOut: 'Schliessen',
    createAsset: 'Neues Asset',
  },
  map: {
    zoomIn: 'Hineinzoomen',
    zoomOut: 'Herauszoomen',
    zoomToOrigin: 'Zur Ursprungsposition zoomen',
    drawingModeOn: 'Der Zeichenmodus ist ausgeschaltet. Klicken Sie, um den Zeichenmodus einzuschalten',
    drawingModeOff: 'Der Zeichenmodus ist eingeschaltet. Klicken Sie, um den Zeichenmodus auszuschalten',
    dragHandleLabel: 'Ziehgriff',
  },
  search: {
    textSearchFieldPlaceholder: 'Suche nach...',
    searchInstructionsHeading: 'Asset-Suche',
    searchInstructions:
      'Suchen Sie nach einem Asset über das Suchfeld oder durch Zeichnen eines Polygons auf der Karte.',
    closeInstructions: 'Anleitung schliessen',
    searchControl: 'Suchsteuerung',
    refineSearch: 'Suche verfeinern',
    searchResults: 'Assets',
    author: 'Autor',
    documentDate: 'Dokumentdatum',
    usage: 'Nutzung',
    detailedInformation: 'Detailinformationen',
    originalTitle: 'Originaltitel',
    kind: 'Art',
    topic: 'Thema',
    format: 'Format',
    createdDate: 'Erstellungsdatum',
    lastProcessedDate: 'Letztes Update',
    alternativeId: 'Alternativ-ID',
    contacts: 'Kontakte',
    subject: 'Thema',
    content: 'Inhalt',
    nationalInterest: 'Nat. Interesse',
    reference: 'Verweis',
    status: 'Status',
    closeAssetDetails: 'Assetdetails schliessen',
    usageCode: {
      public: 'Öffentliche Nutzung',
      internal: 'Interne Nutzung',
      useOnRequest: 'Nutzung auf Anfrage',
    },
    geometry: 'Geometrie',
    geometryCode: {
      Point: 'Punkt',
      LineString: 'Linie',
      Polygon: 'Polygon',
      None: 'Keine',
    },
    language: 'Sprache',
    languageItem: {
      None: 'keine',
    },
    workgroup: 'Arbeitsgruppe',
    resetSearch: 'Filter zurücksetzen',
    file: 'Datei',
    legalFile: 'Rechtliche Einwilligungen',
    openFileInNewTab: '{{fileName}} in neuem Tab öffnen',
    downloadFile: '{{fileName}} herunterladen',
    assetsUnderMouseCursor: '{{ assetsCount }} Assets unter dem Mauszeiger gefunden. Bitte wählen Sie eines aus:',
    removePolygon: 'Polygon aufheben',
    drawPolygon: 'Polygon Selektion',
    hideTable: 'Tabelle verbergen',
    showTable: 'Tabelle anzeigen',
  },
  contactRoles: {
    author: 'Autor',
    initiator: 'Auftraggeber',
    supplier: 'Einlieferer',
  },
  edit: {
    tabs: {
      general: {
        tabName: 'Allgemein',
        kind: 'Typ',
        language: 'Sprache',
        format: 'Format',
        topic: 'Thema',
        topics: 'Themen',
        title: 'Titel',
        publicTitle: 'Öffentlicher Titel',
        originalTitle: 'Originaltitel',
        sgsId: 'SGS-ID',
        date: 'Datum',
        creationDate: 'Erstellungsdatum',
        dateReceived: 'Eingangsdatum',
        type: 'Typ',
        alternativeId: 'Alternativ-ID',
        alternativeIdDescription: 'Beschreibung Alternativ-ID',
        addNewAlternativeId: 'Neue Alternativ-ID hinzufügen',
        referencesWarning: 'Um die Arbeitsgruppe zu ändern, müssen Sie erst alle Verweise entfernen.',
      },
      files: {
        tabName: 'Dateien',
        Normal: {
          one: 'Normale Datei',
          many: 'Normale Dateien',
        },
        Legal: {
          one: 'Rechtliche Einwilligung',
          many: 'Rechtliche Einwilligungen',
        },
        legalDocItemCode: 'Typ',
        or: 'oder',
        dragFileHere: 'Datei hierher ziehen',
        selectFile: 'Datei auswählen',
        addNewFile: 'Neue Datei hinzufügen',
        willBeDeleted: 'Wird gelöscht werden',
        willBeUploaded: 'Wird hochgeladen werden',
        fileSizeToLarge: 'Die Dateigrösse darf 250 MB nicht überschreiten.',
      },
      usage: {
        tabName: 'Nutzung',
        internalUsageReason: 'Interne Nutzung wird eingeschaltet, weil Externe Nutzung eingeschaltet wurde.',
        internalUsage: 'Interne Nutzung',
        externalUsage: 'Externe Nutzung',
        status: 'Status',
        expirationDate: 'Ablaufdatum',
        nationalInterest: 'Nationales Interesse',
        typeNationalInterest: 'Typ Nationales Interesse',
        type: 'Typ',
        types: 'Typen',
        noTypesAssigned: 'Keine Typen zugewiesen',
        questionDeleteNationalInterest: 'Möchten Sie fortfahren und die Einträge löschen?',
        validationErrors: {
          internalPublicUsageDateError:
            'Das interne Ablaufdatum muss näher oder gleich liegen als das der externen Nutzung',
        },
      },
      contacts: {
        tabName: 'Kontakte',
        linkContact: 'Neuen Kontakt-Link hinzufügen',
        link: 'Verlinken',
        createNewContact: 'Neuen Kontakt erstellen',
        editContact: 'Konktakt bearbeiten',
        unlink: 'Verlinkung aufheben',
        viewDetails: 'Konktaktdetails anzeigen',
        contact: 'Kontakt',
        role: 'Rolle',
        newContact: 'Neuer Kontakt',
        contactKind: 'Kontaktart',
        name: 'Name',
        street: 'Strasse',
        number: 'Nummer',
        postCode: 'PLZ',
        locality: 'Ort',
        country: 'Land',
        email: 'E-Mail',
        phone: 'Telefon',
        website: 'Website',
        create: 'Erstellen',
        noContacts: 'Keine Kontakte',
        contactPlaceholder: 'Suche über Namen',
      },
      references: {
        tabName: 'Verweise',
        assetTitlePublic: 'Öffentlicher Titel',
        assetTitlePublicPlaceholder: 'Suche über den öffentlichen Titel',
        referenceHeadings: {
          parent: 'Übergeordneter Asset',
          subordinate: 'Untergeordnete Assets',
          sibling: 'Geschwister Assets',
          newReference: 'Neuer Verweis',
        },
        referenceType: {
          parent: 'Übergeordnet',
          subordinate: 'Untergeordnet',
          sibling: 'Geschwister',
        },
      },
      geometries: {
        tabName: 'Geometrien',
        geometry: 'Geometrie',
        noGeometries: 'Keine Geometrien',
        geometryType: 'Geometrietyp',
        selectGeometryLabel: 'Wählen Sie aus {{count}} Geometrien',
        geometryLineString: 'Linie',
        geometryPolygon: 'Polygon',
        geometryPoint: 'Punkt',
        geometryMenu: {
          buttonLabel: 'Menü für Geometrie',
          new: 'Neue Geometrie erfassen',
          remove: 'Geometrie löschen',
        },
        vertexMenu: {
          buttonLabel: 'Menü für Eckpunkt {{index}}',
          add: 'Eckpunkt hinzufügen nach',
          remove: 'Eckpunkt löschen',
        },
        instructionsPoint: 'Passen Sie die Koordinaten des neuen Punktes an',
        instructionsPolygonOrLIne: 'Zeichnen Sie mindestens {{ count }} Punkte',
        instructionsMorePolygonOrLIne: 'Zeichnen Sie mindestens {{ count }} weitere Punkte',
        createGeometry: 'Geometrie erstellen',
      },
      administration: {
        tabName: 'Administration',
        infoGeol: 'InfoGeol',
        sgsId: 'SGS-ID',
        data: 'Daten',
        contactData: 'Kontaktdaten',
        auxData: 'Zusatzdaten',
        municipality: 'Gemeinde',
        workStatus: 'Arbeitsstatus',
        lastProcessed: 'Letztes Update',
        by: 'Von',
        addWorkStatus: 'Hinzufügen Arbeitsstatus',
        tabValidationErrors: {
          tab: 'Tab',
          hasValidationErrors: 'enthält Validierungsfehler',
        },
      },
    },
    closeManageAsset: 'Asset verwalten schliessen',
    questionDiscardChanges: 'Möchten Sie die Änderungen verwerfen?',
    userManagementHeading: 'Benutzer',
    userManagementButton: 'Benutzer verwalten',
    adminInstructionsSyncElasticAssetsHeading: 'Assets mit Elasticsearch synchronisieren',
    adminInstructionsSyncElasticAssets:
      'Gleicht den Zustand von Elasticsearch mit der Datenbank ab.' +
      ' Damit wird sichergestellt, dass die Suche alle vorhandenen Assets miteinbezieht.',
    adminInstructionsSyncElasticAssetsStart: 'Synchronisation starten',
  },
  admin: {
    users: 'Benutzer',
    user: 'Benutzer',
    workgroups: 'Arbeitsgruppen',
    name: 'Name',
    role: 'Rolle',
    actions: 'Aktionen',
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail',
    back: 'Zurück',
    languages: {
      de: 'Deutsch',
      en: 'Englisch',
      fr: 'Französisch',
      it: 'Italienisch',
    },
    userPage: {
      admin: 'Admin',
      noAdmin: 'Nicht Admin',
      lang: 'Sprache',
      general: 'Allgemein',
      addWorkgroups: 'Arbeitsgruppe hinzufügen',
      more: 'weitere',
      userAddError: 'Füge mindestens einen Benutzer hinzu',
      workgroupAddError: 'Wähle mindestens eine Arbeitsgruppe aus',
      amount: 'Anz. Assets',
    },
    workgroupPage: {
      name: 'Name',
      isActive: 'Aktiv',
      activate: 'Aktivieren',
      deactivate: 'Deaktivieren',
      create: 'Neue Arbeitsgruppe',
      isDisabled: 'Inaktiv',
      chooseUsersText: 'Füge Benutzer hinzu, um sie zu verwalten',
      addUsers: 'Benutzer hinzufügen',
      usersPerRole: 'Benutzer pro Rolle',
      delete: 'Arbeitsgruppe löschen',
      unableToDelete: 'Die Arbeitsgruppe kann nicht gelöscht werden, da ihr noch Assets zugewiesen sind.',
    },
  },
  paginator: {
    itemsPerPage: 'Elemente pro Seite',
    range: '{{start}} – {{end}} von {{length}}',
  },
  disclaimer: {
    title: 'Nutzungsbedingungen',
    liability: {
      title: 'Haftungsausschluss',
      content:
        'Obwohl das Bundesamt für Landestopografie swisstopo mit aller Sorgfalt auf die Richtigkeit der veröffentlichten Informationen achtet, kann hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit dieser Informationen keine Gewährleistung übernommen werden.' +
        '<br><br>' +
        'Swisstopo behält sich ausdrücklich vor, jederzeit Inhalte ohne Ankündigung ganz oder teilweise zu ändern, zu löschen oder zeitweise nicht zu veröffentlichen.' +
        '<br><br>' +
        'Haftungsansprüche gegen swisstopo wegen Schäden materieller oder immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen, durch Missbrauch der Verbindung oder durch technische Störungen entstanden sind, werden ausgeschlossen.',
    },
    tracking: {
      title: 'Datenerfassung',
      content:
        'Damit wir unser Webangebot optimal auf Ihre Bedürfnisse ausrichten können, verwenden wir das Analysetool Google Analytics. Dabei wird Ihr Verhalten auf der Website in anonymisierter Form erfasst. Es werden also keine personenbezogenen Daten übermittelt oder gespeichert. Wenn Sie damit nicht einverstanden sind, können Sie die Datenerfassung durch Analysetools unterbinden und diese Website trotzdem ohne Einschränkungen nutzen.' +
        '<br><br>' +
        'Weitere rechtliche Bestimmungen finden Sie hier: {{external}}',
      consentLabel: 'Einwilligung zur Datenerfassung (optional)',
    },
    accept: 'Akzeptieren',
  },
};
