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
  attendees: string[];
  notes: string | null;
  createdAt: string;
  host: { id: string; name: string; colour: string; initial: string } | null;
  coHost: { id: string; name: string; colour: string; initial: string } | null;
  photos: EntryPhotoRecord[];
}

export interface SuggestionRecord {
  id: string;
  countryCode: string;
  suggestedBy: string | null;
  note: string | null;
  interested: string[];
  createdAt: string;
}

export interface PersonRecord {
  id: string;
  name: string;
  createdAt: string;
}

export interface CommentRecord {
  id: string;
  entryId: string;
  authorName: string;
  body: string;
  createdAt: string;
}
