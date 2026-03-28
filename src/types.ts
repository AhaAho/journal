export interface JournalEntry {
  id: string;
  date: Date;
  title: string;
  content: string;
  moodTags: string[];
  location?: string;
  weather?: string;
  imageUrl?: string;
  imageAlt?: string;
  isFavorite?: boolean;
}

export type ViewType = 'timeline' | 'editor' | 'calendar' | 'media' | 'tags';

export interface AppSettings {
  theme: 'light' | 'dark';
  font: 'classic' | 'modern';
}
