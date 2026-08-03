export interface HostRecord {
  id: string;
  name: string;
  colour: string;
  initial: string;
  createdAt: string;
  entryCount: number;
}

export interface EntryPhotoRecord {
  id: string;
  url: string;
}

export interface EntryRecord {
  id: string;
  countryCode: string;
  hostId: string;
  coHostId: string | null;
  date: string;
  dishes: string[];
  notes: string | null;
  createdAt: string;
  host: { id: string; name: string; colour: string; initial: string } | null;
  coHost: { id: string; name: string; colour: string; initial: string } | null;
  photos: EntryPhotoRecord[];
}
