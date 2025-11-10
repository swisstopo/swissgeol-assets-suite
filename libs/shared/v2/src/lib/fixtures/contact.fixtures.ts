import { Contact, ContactKindCode } from '../models/contact';

const geo2XSarlGeophysicsAndGeology: Contact = {
  id: 1531,
  name: 'Geo2X Sàrl Geophysics and Geology',
  street: null,
  houseNumber: null,
  plz: null,
  locality: 'Genève',
  country: 'Schweiz',
  telephone: null,
  email: null,
  website: null,
  kindCode: ContactKindCode.Unknown,
};

const servicesIndustrielsDeGeneveSIG: Contact = {
  id: 1664,
  name: 'Services Industriels de Genève SIG',
  street: null,
  houseNumber: null,
  plz: null,
  locality: 'Genève',
  country: 'Schweiz',
  telephone: null,
  email: null,
  website: null,
  kindCode: ContactKindCode.Unknown,
};

const geoExpertAg: Contact = {
  id: 219,
  name: 'GeoExpert AG',
  street: null,
  houseNumber: null,
  plz: null,
  locality: 'Schwerzenbach',
  country: 'Schweiz',
  telephone: null,
  email: null,
  website: null,
  kindCode: ContactKindCode.Unknown,
};

const geoEnergieSuisse: Contact = {
  id: 1600,
  name: 'Geo Energie Suisse',
  street: null,
  houseNumber: null,
  plz: null,
  locality: '### Unknown ###',
  country: 'Schweiz',
  telephone: null,
  email: null,
  website: null,
  kindCode: ContactKindCode.Unknown,
};

export const contactFixtures = {
  geo2XSarlGeophysicsAndGeology,
  servicesIndustrielsDeGeneveSIG,
  geoExpertAg,
  geoEnergieSuisse,
};
