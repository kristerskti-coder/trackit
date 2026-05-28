import { Item, Location, Reminder, AppState } from '../types';

const STORAGE_KEY = 'trackit_v1';

const INITIAL_STATE: AppState = {
  items: [
    {
      id: '1',
      name: 'Car Keys',
      description: 'Main set of keys for the Tesla',
      locationId: 'loc1',
      category: 'Essential Objects',
      lastUpdated: Date.now(),
      photo: 'https://images.unsplash.com/photo-1590234123513-81861788bc55?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: '2',
      name: 'Passport',
      description: 'Current valid passport for international travel',
      locationId: 'loc2',
      category: 'Personal Documents',
      lastUpdated: Date.now(),
      photo: 'https://images.unsplash.com/photo-1544333346-64e4fe18274b?auto=format&fit=crop&q=80&w=300'
    }
  ],
  locations: [
    { id: 'loc1', name: 'Entry Table', type: 'Shelf', icon: 'Warehouse' },
    { id: 'loc2', name: 'Desk Drawer', type: 'Drawer', icon: 'Box' },
    { id: 'loc3', name: 'Kitchen Cabinet', type: 'Cabinet', icon: 'LayoutGrid' },
    { id: 'loc4', name: 'Hallway Closet', type: 'Closet', icon: 'DoorOpen' }
  ],
  reminders: [
    { id: 'rem1', itemId: '1', date: '2023-10-24', time: '08:30', repeat: true, priority: 'Medium', active: true }
  ],
  categories: ['Essential Objects', 'Personal Documents', 'Electronics', 'Tools', 'Office']
};

export const getAppState = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveAppState(INITIAL_STATE);
    return INITIAL_STATE;
  }
  return JSON.parse(stored);
};

export const saveAppState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};
