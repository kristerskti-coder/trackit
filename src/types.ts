export type LocationType = 'Shelf' | 'Cabinet' | 'Drawer' | 'Closet' | 'Box' | 'Room' | 'Other';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description?: string;
  icon?: string;
  itemCount?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  locationId: string;
  category: string;
  photo?: string;
  lastUpdated: number;
}

export interface Reminder {
  id: string;
  itemId: string;
  date: string;
  time: string;
  repeat: boolean;
  priority: 'Low' | 'Medium' | 'High';
  active: boolean;
}

export interface AppState {
  items: Item[];
  locations: Location[];
  reminders: Reminder[];
  categories: string[];
}
