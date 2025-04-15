import { AppTranslations } from './i18n';

export const enAppTranslations: AppTranslations = {
  logoSwissGeol: 'Logo Swissgeol Assets',
  welcomeTo: 'Welcome to',
  accessForbidden: 'You do not have access to this application.',
  resourceForbidden: 'You do not have access to this resource.',
  ok: 'OK',
  submit: 'Submit',
  cancel: 'Cancel',
  confirm: 'Confirm',
  confirmDelete: 'Are you sure you want to delete this asset?',
  deleteSuccess: 'The asset was successfully deleted.',
  login: 'Login',
  logout: 'Logout',
  yes: 'Yes',
  no: 'No',
  add: 'Add',
  save: 'Save',
  required: 'Required',
  labelEdit: 'Edit',
  delete: 'Delete',
  close: 'Close',
  datePlaceholder: 'YYYY-MM-DD',
  workgroup: {
    title: 'Workgroup',
    errors: {
      nameTaken: "The name '{{name}}' is already taken by another workgroup.",
    },
  },
  favorites: {
    title: 'Favorites',
  },
  workflow: {
    status: 'Status',
    assignee: 'Assignee',
  },
  workflowStatus: {
    Draft: 'Draft',
    InReview: 'Review',
    Reviewed: 'Reviewed',
    Published: 'Published',
  },
  menuBar: {
    filters: 'Filters',
    admin: 'Administration',
    favourites: 'Favourites',
    help: 'Help',
    profile: 'Profile',
    settings: 'Settings',
    signOut: 'Close',
    createAsset: 'New Asset',
  },
  map: {
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomToOrigin: 'Zoom to origin',
    drawingModeOn: 'Drawing mode is off. Click to turn on drawing mode',
    drawingModeOff: 'Drawing mode is on. Click to turn off drawing mode',
    dragHandleLabel: 'Drag handle',
  },
  search: {
    textSearchFieldPlaceholder: 'Search by...',
    searchInstructionsHeading: 'Asset-Search',
    searchInstructions: 'Search for an asset using the search field or by drawing a ploygon on the map.',
    closeInstructions: 'Close instructions',
    searchControl: 'Search control',
    refineSearch: 'Refine search',
    searchResults: 'Assets',
    author: 'Author',
    documentDate: 'Document date',
    usage: 'Usage',
    detailedInformation: 'Detailed informationen',
    originalTitle: 'Original title',
    kind: 'Kind',
    topic: 'Topic',
    format: 'Format',
    createdDate: 'Date created',
    lastProcessedDate: 'Last update',
    alternativeId: 'Alternative ID',
    contacts: 'Contacts',
    subject: 'Subject',
    content: 'Content',
    nationalInterest: 'Nat. Interest',
    reference: 'Reference',
    status: 'Status',
    closeAssetDetails: 'Close asset details',
    usageCode: {
      public: 'Public use',
      internal: 'Internal use',
      useOnRequest: 'Use on request',
    },
    geometry: 'Geometry',
    geometryCode: {
      Point: 'Point',
      LineString: 'Line',
      Polygon: 'Polygon',
      None: 'None',
    },
    language: 'Language',
    languageItem: {
      None: 'none',
    },
    workgroup: 'Workgroup',
    resetSearch: 'Reset filters',
    file: 'File',
    legalFile: 'Legal consent',
    openFileInNewTab: 'Open {{fileName}} in new tab',
    downloadFile: 'Download {{fileName}}',
    assetsUnderMouseCursor: '{{ assetsCount }} assets found under the mouse cursor. Please select one:',
    removePolygon: 'Remove polygon',
    drawPolygon: 'Polygon selection',
    hideTable: 'Hide table',
    showTable: 'Show table',
  },
  contactRoles: {
    author: 'Author',
    initiator: 'Client',
    supplier: 'Supplier',
  },
  edit: {
    tabs: {
      general: {
        tabName: 'General',
        kind: 'Kind',
        language: 'Language',
        format: 'Format',
        topic: 'Topic',
        topics: 'Topics',
        title: 'Title',
        publicTitle: 'Public title',
        originalTitle: 'Original title',
        sgsId: 'SGS ID',
        date: 'Date',
        creationDate: 'Creation date',
        dateReceived: 'Receipt date',
        type: 'Type',
        alternativeId: 'Alternative ID',
        alternativeIdDescription: 'Alternative ID Description',
        addNewAlternativeId: 'Add new alternative ID',
        referencesWarning: 'In order to change the workgroup, you must first remove all references.',
      },
      files: {
        tabName: 'Files',
        Normal: {
          one: 'Normal File',
          many: 'Normal Files',
        },
        Legal: {
          one: 'Legal consent',
          many: 'Legal consents',
        },
        legalDocItemCode: 'Type',
        dragFileHere: 'Drag file here',
        or: 'or',
        selectFile: 'Select file',
        addNewFile: 'Add new file',
        willBeDeleted: 'Will be deleted',
        willBeUploaded: 'Will be uploaded',
        fileSizeToLarge: 'File size may not exceed 250MB',
      },
      usage: {
        tabName: 'Usage',
        internalUsageReason: 'Internal use is switched on because external use has been switched on.',
        internalUsage: 'Internal usage',
        externalUsage: 'External usage',
        status: 'Status',
        expirationDate: 'Expiration date',
        nationalInterest: 'National interest',
        typeNationalInterest: 'Type of national interest',
        type: 'Type',
        types: 'Types',
        noTypesAssigned: 'No types assigned',
        questionDeleteNationalInterest: 'Do you want to go ahead and delete the entries?',
        validationErrors: {
          internalPublicUsageDateError:
            'The internal expiry date must be closer or the same as that of the external use',
        },
      },
      contacts: {
        tabName: 'Contacts',
        linkContact: 'Add new Contact-Link',
        link: 'Link',
        unlink: 'Unlink contact',
        viewDetails: 'Show contact details',
        createNewContact: 'Create new contact',
        editContact: 'Edit contact',
        contact: 'Contact',
        role: 'Role',
        newContact: 'New Contact',
        contactKind: 'Contact kind',
        name: 'Name',
        street: 'Street',
        number: 'Number',
        postCode: 'Post code',
        locality: 'Locality',
        country: 'Country',
        email: 'Email',
        phone: 'Telephone',
        website: 'Website',
        create: 'Create',
        noContacts: 'No contacts',
        contactPlaceholder: 'Search by name',
      },
      references: {
        tabName: 'References',
        assetTitlePublic: 'Public title',
        assetTitlePublicPlaceholder: 'Search via public title',
        referenceHeadings: {
          parent: 'Main asset',
          subordinate: 'Subordinate assets',
          sibling: 'Sibling assets',
          newReference: 'New reference',
        },
        referenceType: {
          parent: 'Main',
          subordinate: 'Subordinate',
          sibling: 'Sibling',
        },
      },
      geometries: {
        geometry: 'Geometry',
        tabName: 'Geometries',
        noGeometries: 'No geometries',
        geometryType: 'Geometry type',
        selectGeometryLabel: 'Select from {{count}} geometries',
        geometryLineString: 'Line/Trace',
        geometryPolygon: 'Polygon',
        geometryPoint: 'Point',
        geometryMenu: {
          buttonLabel: 'Menu for geometry',
          new: 'Create a new geometry',
          remove: 'Delete geometry',
        },
        vertexMenu: {
          buttonLabel: 'Menu for vertex {{index}}',
          add: 'Add vertex after',
          remove: 'Remove vertex',
        },
        instructionsPoint: 'Adjust the coordinates of the new point',
        instructionsPolygonOrLIne: 'Draw at least {{ count }} points',
        instructionsMorePolygonOrLIne: 'Draw at least {{ count }} more points',
        createGeometry: 'Create geometry',
      },
      administration: {
        tabName: 'Administration',
        infoGeol: 'InfoGeol',
        sgsId: 'SGS ID',
        data: 'Data',
        contactData: 'Contact data',
        auxData: 'Auxiliary data',
        municipality: 'Municipality',
        workStatus: 'Work status',
        lastProcessed: 'Last processed',
        by: 'By',
        addWorkStatus: 'Add work status',
        tabValidationErrors: {
          tab: 'Tab',
          hasValidationErrors: 'has validation errors',
        },
      },
      status: {
        tabName: 'Status',
        changeStatus: 'Change Status Manually',
        requestReview: 'Request Review',
        requestChanges: 'Request Changes',
        finishReview: 'Finish Review',
      },
    },
    closeManageAsset: 'Close manage asset',
    unsavedChanges: 'Unsaved Changes',
    discardChanges: 'Discard changes',
    questionDiscardChanges: 'Do you want to discard your changes?',
    userManagementHeading: 'Users',
    userManagementButton: 'Manage users',
    adminInstructionsSyncElasticAssetsHeading: 'Synchronize assets with Elasticsearch',
    adminInstructionsSyncElasticAssets:
      'Equalizes the state of Elasticsearch with the local database.' +
      ' This ensures that the search includes all existing assets.',
    adminInstructionsSyncElasticAssetsStart: 'Start synchronization',
  },
  admin: {
    users: 'Users',
    user: 'User',
    workgroups: 'Workgroups',
    name: 'Name',
    role: 'Role',
    actions: 'Actions',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    back: 'Back',
    languages: {
      de: 'German',
      en: 'English',
      fr: 'French',
      it: 'Italian',
    },
    userPage: {
      admin: 'Admin',
      noAdmin: 'No admin',
      lang: 'Language',
      addWorkgroups: 'Add workgroup',
      general: 'General',
      more: 'more',
      userAddError: 'Add at least one user',
      workgroupAddError: 'Add at least one workgroup',
      amount: 'Number of Assets',
    },
    workgroupPage: {
      name: 'Name',
      isActive: 'Active',
      activate: 'Activate',
      deactivate: 'Deactivate',
      create: 'New Workgroup',
      isDisabled: 'Inactive',
      chooseUsersText: 'Add users to manage',
      addUsers: 'Add users',
      usersPerRole: 'Users per Role',
      delete: 'Delete workgroup',
      unableToDelete: 'The workgroup can not be deleted because it still has assets assigned to it.',
    },
  },
  paginator: {
    itemsPerPage: 'Items per page',
    range: '{{start}} – {{end}} of {{length}}',
  },
  disclaimer: {
    title: 'Terms of Service',
    liability: {
      title: 'Limitation of liability',
      content:
        'Although every care has been taken by the Federal Office of Topography swisstopo to ensure the accuracy of the information published, no guarantee can be given with regard to the accurate, reliable, up-to-date or complete nature of this information.' +
        '<br><br>' +
        'swisstopo reserves the right to alter or remove the content, in full or in part, without prior notice.' +
        '<br><br>' +
        'Liability claims against swisstopo for material or immaterial damage resulting from access to or use or non-use of the published information, from misuse of the connection or from technical faults are excluded.',
    },
    tracking: {
      title: 'Data acquisition',
      content:
        'To enable us to optimally tailor our website to your needs, we use the analysis tool Google Analytics. Your behaviour on the website is recorded in anonymised form. No personal data is transmitted or stored. If you do not wish to consent to this, you can stop data collection by analysis tools and still use this website without restrictions.' +
        '<br><br>' +
        'Further legal provisions can be found here: {{external}}',
      consentLabel: 'Consent to data acquisition (optional)',
    },
    accept: 'Accept',
  },
  mapLayers: {
    geometry: {
      name: 'Geometry',
      items: {
        point: 'Asset Point',
        line: 'Asset Line',
        polygon: 'Asset Area',
      },
    },
    access: {
      name: 'Access',
      items: {
        public: 'Public',
        internal: 'Internal',
        restricted: 'Restricted',
      },
    },
  },
};
