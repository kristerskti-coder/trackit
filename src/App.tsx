import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, LayoutGrid, List, MapPin, Bell, ChevronRight, 
  Camera, Filter, X, ArrowLeft, Sun, Moon, Package,
  Trash2, Edit2, CheckCircle2, Clock, Warehouse, Box, DoorOpen,
  Archive, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Item, Location, Reminder, AppState, LocationType } from './types';
import { getAppState, saveAppState } from './lib/store';

// --- Types ---
type NavTab = 'dashboard' | 'items' | 'add' | 'locations' | 'reminders';

// --- Utility Components ---
const IconButton = ({ icon: Icon, onClick, className = "" }: { icon: any, onClick?: () => void, className?: string }) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all ${className}`}
  >
    <Icon className="w-5 h-5" />
  </button>
);

const ViewHeader = ({ rightElement }: { rightElement?: React.ReactNode }) => (
  <header className="flex items-center justify-between px-6 py-4 glass fixed top-0 left-0 right-0 z-50 border-b border-gray-100 dark:border-white/5">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center shadow-sm">
        <Package className="w-5 h-5 text-white" />
      </div>
      <h1 className="text-xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">TrackIt</h1>
    </div>
    <div className="flex items-center gap-1">
      {rightElement}
    </div>
  </header>
);

// Helper to get location icon
const getLocationIcon = (type: LocationType) => {
  switch (type) {
    case 'Shelf': return Warehouse;
    case 'Cabinet': return LayoutGrid;
    case 'Drawer': return Box;
    case 'Closet': return DoorOpen;
    case 'Box': return Archive;
    case 'Room': return Home;
    default: return MapPin;
  }
};

// --- Main App Component ---
export default function App() {
  const [state, setState] = useState<AppState>(() => getAppState());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('trackit_theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);

  // Check for active reminders on load
  useEffect(() => {
    const now = new Date();
    const activeReminders = state.reminders.filter(r => {
      const remDate = new Date(`${r.date}T${r.time}`);
      return r.active && remDate <= now && remDate > new Date(now.getTime() - 1000 * 60 * 60); // within last hour
    });

    if (activeReminders.length > 0) {
      const item = state.items.find(i => i.id === activeReminders[0].itemId);
      setNotification({
        title: 'Reminder',
        message: `Don't forget your ${item?.name || 'item'}!`
      });
      setTimeout(() => setNotification(null), 5000);
    }
  }, []);

  // Persistence
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    localStorage.setItem('trackit_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Dark Mode Toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Handlers ---
  const addItem = (item: Omit<Item, 'id' | 'lastUpdated'>) => {
    const newItem: Item = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: Date.now(),
    };
    setState(prev => ({ ...prev, items: [newItem, ...prev.items] }));
    setActiveTab('dashboard');
  };

  const addLocation = (location: Omit<Location, 'id'>) => {
    const newLoc: Location = {
      ...location,
      id: 'loc_' + Math.random().toString(36).substr(2, 9),
    };
    setState(prev => ({ ...prev, locations: [...prev.locations, newLoc] }));
  };

  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    const newRem: Reminder = {
      ...reminder,
      id: 'rem_' + Math.random().toString(36).substr(2, 9),
    };
    setState(prev => ({ ...prev, reminders: [...prev.reminders, newRem] }));
    setActiveTab('reminders');
  };

  const deleteItem = (id: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id),
      reminders: prev.reminders.filter(r => r.itemId !== id)
    }));
  };

  // --- Filtered Data ---
  const filteredItems = useMemo(() => {
    return state.items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [state.items, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen pb-24 bg-apple-bg dark:bg-black font-sans transition-colors duration-300">
      
      {/* Search Header for most views */}
      {activeTab !== 'add' && (
        <ViewHeader 
          rightElement={
            <IconButton 
              icon={isDarkMode ? Sun : Moon} 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="text-gray-900 dark:text-white"
            />
          } 
        />
      )}

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-24 left-4 right-4 z-[100] apple-card p-4 bg-apple-blue text-white shadow-xl flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold">{notification.title}</h4>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="ml-auto p-1">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <ItemDetailModal 
            item={selectedItem} 
            location={state.locations.find(l => l.id === selectedItem.locationId)} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
      </AnimatePresence>

      <main className="pt-20 px-4 max-w-2xl mx-auto text-gray-900 dark:text-white">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardView 
              state={state} 
              setActiveTab={setActiveTab} 
              setSearchQuery={setSearchQuery}
              onSelectItem={setSelectedItem}
            />
          )}
          {activeTab === 'items' && (
            <ItemsListView 
              items={filteredItems} 
              locations={state.locations}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categories={state.categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onDelete={deleteItem}
              onSelectItem={setSelectedItem}
            />
          )}
          {activeTab === 'add' && (
            <AddItemView 
              locations={state.locations} 
              categories={state.categories}
              onAdd={addItem}
              onCancel={() => setActiveTab('dashboard')}
              onAddLocation={addLocation}
            />
          )}
          {activeTab === 'locations' && (
            <LocationsView 
              locations={state.locations} 
              items={state.items}
              onAddLocation={addLocation}
            />
          )}
          {activeTab === 'reminders' && (
            <RemindersView 
              reminders={state.reminders} 
              items={state.items}
              onAddReminder={addReminder}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-gray-200 dark:border-white/5 px-6 py-3 flex items-center justify-between z-50">
        <NavButton active={activeTab === 'dashboard'} icon={LayoutGrid} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
        <NavButton active={activeTab === 'items'} icon={List} label="Items" onClick={() => setActiveTab('items')} />
        <div className="relative -top-6">
          <button 
            onClick={() => setActiveTab('add')}
            className="w-14 h-14 bg-apple-blue rounded-full flex items-center justify-center shadow-lg shadow-apple-blue/30 active:scale-95 transition-transform"
          >
            <Plus className="w-8 h-8 text-white" />
          </button>
          <span className="text-[10px] absolute -bottom-4 left-1/2 -translate-x-1/2 font-medium text-apple-blue">Add</span>
        </div>
        <NavButton active={activeTab === 'locations'} icon={MapPin} label="Locations" onClick={() => setActiveTab('locations')} />
        <NavButton active={activeTab === 'reminders'} icon={Bell} label="Reminders" onClick={() => setActiveTab('reminders')} />
      </nav>
    </div>
  );
}

// --- View Components ---

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-apple-blue' : 'text-apple-gray dark:text-gray-500'}`}
    >
      <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function DashboardView({ state, setActiveTab, setSearchQuery, onSelectItem }: { state: AppState, setActiveTab: (t: NavTab) => void, setSearchQuery: (q: string) => void, onSelectItem: (item: Item) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
      {/* Search Bar */}
        <div className="relative mb-8 mt-4 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-apple-gray group-focus-within:text-apple-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Find your items"
            className="w-full pl-12 pr-4 py-4 rounded-apple-lg border-none bg-apple-card dark:bg-[#1C1C1E] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-apple-blue/50 transition-all cursor-pointer"
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => setActiveTab('items')}
            readOnly
          />
        </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <motion.div 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('add')}
          className="bg-apple-blue rounded-apple-lg p-5 text-white flex flex-col justify-between aspect-square cursor-pointer shadow-lg shadow-apple-blue/20"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-display font-bold leading-tight">Quick Add<br/>Item</h3>
        </motion.div>
        
        <div className="grid grid-rows-2 gap-4">
          <StatMiniCard icon={CheckCircle2} label="Items" value={state.items.length.toString()} color="text-apple-blue" bg="bg-blue-50 dark:bg-blue-500/10" />
          <StatMiniCard icon={Bell} label="Reminders" value={state.reminders.length.toString()} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-500/10" />
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-display font-bold">Recently Tracked</h2>
        <button onClick={() => setActiveTab('items')} className="text-apple-blue text-sm font-semibold hover:opacity-70">See All</button>
      </div>
      <div className="space-y-4 mb-10">
        {state.items.slice(0, 3).length > 0 ? (
          state.items.slice(0, 3).map((item, idx) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onSelectItem(item)}
              className="cursor-pointer active:scale-[0.98] transition-transform"
            >
              <ItemCard 
                item={item} 
                location={state.locations.find(l => l.id === item.locationId)?.name || 'Unknown'} 
              />
            </motion.div>
          ))
        ) : (
          <div className="apple-card p-10 text-center text-apple-gray border-dashed border-2">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="font-medium">No items tracked yet</p>
          </div>
        )}
      </div>

      {/* Popular Locations */}
      <h2 className="text-xl font-display font-bold mb-5">Active Spots</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
        {state.locations.map(loc => {
          const Icon = getLocationIcon(loc.type);
          return (
            <motion.div 
              key={loc.id} 
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('locations')}
              className="flex flex-col items-center gap-3 min-w-[90px] cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-apple-card dark:bg-[#1C1C1E] shadow-sm flex items-center justify-center text-apple-blue border border-gray-100 dark:border-white/5">
                <Icon className="w-8 h-8" />
              </div>
              <span className="text-xs font-semibold text-center truncate w-full">{loc.name}</span>
            </motion.div>
          );
        })}
        <button 
          onClick={() => setActiveTab('locations')}
          className="flex flex-col items-center gap-3 min-w-[90px]"
        >
          <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center text-apple-gray">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-center truncate w-full">New Spot</span>
        </button>
      </div>
    </motion.div>
  );
}

function StatMiniCard({ icon: Icon, label, value, color, bg }: { icon: any, label: string, value: string, color: string, bg: string }) {
  return (
    <div className="apple-card p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-lg font-bold font-display">{value}</div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-apple-gray">{label}</div>
      </div>
    </div>
  );
}

function ItemCard({ item, location, showDelete, onDelete, onClick }: { item: Item, location: string, showDelete?: boolean, onDelete?: (id: string) => void, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="apple-card p-4 flex items-center gap-4 group">
      <div className="w-16 h-16 rounded-apple bg-gray-100 dark:bg-black overflow-hidden flex-shrink-0">
        {item.photo ? (
          <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-apple-gray opacity-20" />
          </div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="font-semibold text-base truncate">{item.name}</h4>
        <p className="text-sm text-apple-gray truncate">{location}</p>
      </div>
      {showDelete ? (
        <button onClick={() => onDelete?.(item.id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="w-5 h-5" />
        </button>
      ) : (
        <ChevronRight className="w-5 h-5 text-apple-gray" />
      )}
    </div>
  );
}

function ItemDetailModal({ item, location, onClose }: { item: Item, location: Location | undefined, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 glass"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100, scale: 0.95 }} 
        animate={{ y: 0, scale: 1 }} 
        exit={{ y: 100, scale: 0.95 }}
        className="apple-card w-full max-w-md overflow-hidden bg-white dark:bg-[#1C1C1E]"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative aspect-video bg-gray-100 dark:bg-black">
          {item.photo ? (
            <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-apple-gray opacity-20" />
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue text-[10px] uppercase font-bold tracking-wider">
              {item.category}
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">{item.name}</h2>
          
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 dark:bg-black/20 rounded-apple">
            <div className="w-10 h-10 rounded-full bg-apple-blue/10 flex items-center justify-center text-apple-blue">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-apple-gray">Last seen in</p>
              <p className="font-semibold">{location?.name || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-apple-gray uppercase mb-1">Description</h4>
              <p className="text-gray-600 dark:text-gray-400">{item.description || 'No description provided.'}</p>
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
              <button onClick={() => {}} className="flex-grow py-3 bg-apple-blue text-white rounded-apple font-bold">Edit Details</button>
              <button 
                onClick={() => {
                  onClose();
                }} 
                className="flex-grow py-3 bg-gray-100 dark:bg-white/5 text-apple-gray rounded-apple font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ItemsListView({ 
  items, 
  locations, 
  searchQuery, 
  setSearchQuery, 
  categories, 
  selectedCategory, 
  setSelectedCategory,
  onDelete,
  onSelectItem
}: { 
  items: Item[], 
  locations: Location[], 
  searchQuery: string, 
  setSearchQuery: (q: string) => void,
  categories: string[],
  selectedCategory: string | null,
  setSelectedCategory: (c: string | null) => void,
  onDelete: (id: string) => void,
  onSelectItem: (item: Item) => void
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-3xl font-display font-bold mb-6">Inventory</h1>
      
      {/* Search & Filter */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-apple-gray" />
          <input 
            type="text" 
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-apple bg-black/5 dark:bg-white/5 border-none text-base focus:ring-2 focus:ring-apple-blue"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-apple-blue text-white' : 'bg-gray-200 dark:bg-white/10 text-apple-gray'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-apple-blue text-white' : 'bg-gray-200 dark:bg-white/10 text-apple-gray'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-full w-fit mx-auto mb-4">
            <Search className="w-8 h-8 text-apple-gray opacity-30" />
          </div>
          <p className="text-apple-gray font-medium">No items found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id}>
              <ItemCard 
                item={item} 
                location={locations.find(l => l.id === item.locationId)?.name || 'Unknown'} 
                showDelete 
                onDelete={onDelete}
                onClick={() => onSelectItem(item)}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AddItemView({ 
  locations, 
  categories, 
  onAdd, 
  onCancel,
  onAddLocation
}: { 
  locations: Location[], 
  categories: string[], 
  onAdd: (item: any) => void, 
  onCancel: () => void,
  onAddLocation: (loc: any) => void
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [locationId, setLocationId] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [photo, setPhoto] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNewLoc, setShowNewLoc] = useState(false);
  const [newLocName, setNewLocName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !locationId) return;
    onAdd({ name, description: desc, locationId, category, photo });
  };

  const handleCreateLoc = () => {
    if (!newLocName) return;
    onAddLocation({ name: newLocName, type: 'Other' });
    setShowNewLoc(false);
    setNewLocName('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="pb-8">
      <div className="flex items-center justify-between mb-2">
        <IconButton icon={ArrowLeft} onClick={onCancel} />
        <h1 className="text-3xl font-display font-bold">Add Item</h1>
        <div className="w-10" />
      </div>
      <p className="text-apple-gray mb-8">Catalog a new item to your personal inventory.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="apple-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-white/5">
            <label className="text-[10px] uppercase font-bold text-apple-gray mb-1 block">Item Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. MacBook Pro M3"
              className="w-full bg-transparent border-none p-0 text-lg focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-700"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="p-5">
            <label className="text-[10px] uppercase font-bold text-apple-gray mb-1 block">Description</label>
            <textarea 
              placeholder="Add notes or serial numbers..."
              className="w-full bg-transparent border-none p-0 text-base focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-700 min-h-[80px]"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
        </div>

        <div className="apple-card p-5">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] uppercase font-bold text-apple-gray block">Location</label>
            <button type="button" onClick={() => setShowNewLoc(true)} className="text-apple-blue text-xs font-semibold flex items-center gap-1">
              <Plus className="w-3 h-3" /> New Location
            </button>
          </div>
          
          {showNewLoc ? (
            <div className="flex gap-2">
              <input 
                type="text" 
                autoFocus
                placeholder="Location name..."
                className="flex-grow bg-gray-100 dark:bg-white/5 rounded-apple px-4 py-2 border-none text-sm"
                value={newLocName}
                onChange={e => setNewLocName(e.target.value)}
              />
              <button type="button" onClick={handleCreateLoc} className="bg-apple-blue text-white px-3 py-1 rounded-apple text-xs font-bold">Add</button>
              <button type="button" onClick={() => setShowNewLoc(false)} className="text-apple-gray p-1"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <select 
              required
              className="w-full bg-gray-100 dark:bg-white/5 rounded-apple px-4 py-3 border-none text-sm focus:ring-2 focus:ring-apple-blue appearance-none"
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
            >
              <option value="">Select a location...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="apple-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-apple-blue" />
            <h3 className="text-lg font-display font-semibold">Photo</h3>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
            capture="environment"
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-apple-lg border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-apple-blue transition-colors overflow-hidden relative"
          >
            {photo ? (
              <>
                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white font-bold text-sm">Change Photo</p>
                </div>
              </>
            ) : (
              <>
                <Plus className="w-10 h-10 text-apple-gray opacity-20" />
                <span className="text-xs text-apple-gray font-medium">Add a visual reference</span>
              </>
            )}
          </div>
        </div>

        <div className="apple-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-display font-semibold">Category</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button 
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${category === cat ? 'bg-apple-blue text-white' : 'bg-gray-100 dark:bg-white/5 text-apple-gray'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full py-4 bg-apple-blue text-white rounded-apple-lg font-bold text-lg shadow-lg shadow-apple-blue/20 active:scale-95 transition-all">
          Save Item
        </button>
      </form>
    </motion.div>
  );
}

function LocationsView({ locations, items, onAddLocation }: { locations: Location[], items: Item[], onAddLocation: (loc: any) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('Room');

  const types: LocationType[] = ['Shelf', 'Cabinet', 'Drawer', 'Closet', 'Box', 'Room', 'Other'];

  const handleAdd = () => {
    if (!name) return;
    onAddLocation({ name, type });
    setName('');
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-3xl font-display font-bold mb-2">Locations</h1>
      <p className="text-apple-gray mb-8">Manage your inventory by storage area.</p>

      <div 
        onClick={() => setIsAdding(true)}
        className="bg-apple-card dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-apple-lg p-6 mb-8 cursor-pointer active:scale-95 transition-transform flex items-center gap-6 shadow-sm"
      >
        <div className="p-4 bg-apple-blue/10 rounded-2xl text-apple-blue">
          <MapPin className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-apple-blue block mb-1">Organization</span>
          <h3 className="text-xl font-bold font-display">Add New Storage Spot</h3>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <div className="apple-card p-5 space-y-4">
              <div className="p-3 border-b border-gray-100 dark:border-white/5">
                <label className="text-[10px] uppercase font-bold text-apple-gray mb-1 block">Spot Name</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. Master Bedroom Closet"
                  className="w-full bg-transparent border-none p-0 text-lg focus:ring-0"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-apple-gray mb-2 block px-3">Storage Type</label>
                <div className="flex flex-wrap gap-2 px-3">
                  {types.map(t => (
                    <button key={t} onClick={() => setType(t)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${type === t ? 'bg-apple-blue text-white' : 'bg-gray-100 dark:bg-white/5 text-apple-gray'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAdd} className="flex-grow py-3 bg-apple-blue text-white rounded-apple font-bold active:scale-95 transition-transform">Create Location</button>
                <button onClick={() => setIsAdding(false)} className="px-6 py-3 bg-gray-100 dark:bg-white/5 text-apple-gray rounded-apple font-bold">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <h4 className="text-[10px] uppercase font-bold tracking-widest text-apple-gray mb-4 px-1">Active Storage Spots</h4>
      <div className="space-y-4">
        {locations.map((loc, idx) => {
          const Icon = getLocationIcon(loc.type);
          const itemCount = items.filter(i => i.locationId === loc.id).length;
          return (
            <motion.div 
              key={loc.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="apple-card p-4 flex items-center justify-between group cursor-pointer hover:border-apple-blue/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-black/40 flex items-center justify-center text-apple-blue">
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{loc.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue uppercase tracking-tight">{loc.type}</span>
                    <span className="text-xs text-apple-gray font-medium">{itemCount} items</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-apple-gray group-hover:translate-x-1 transition-transform" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RemindersView({ reminders, items, onAddReminder }: { reminders: Reminder[], items: Item[], onAddReminder: (rem: any) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [itemId, setItemId] = useState('');
  const [date, setDate] = useState('2023-10-24');
  const [time, setTime] = useState('08:30');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const handleAdd = () => {
    if (!itemId) return;
    onAddReminder({ itemId, date, time, repeat: false, priority, active: true });
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-3xl font-display font-bold mb-2">Reminders</h1>
      <p className="text-apple-gray mb-8">Set smart alerts for your essential items.</p>

      <div 
        onClick={() => setIsAdding(true)}
        className="apple-card p-6 flex flex-col items-center justify-center border-dashed border-2 border-gray-200 dark:border-white/10 mb-8 cursor-pointer hover:border-apple-blue transition-all"
      >
        <Bell className="w-8 h-8 text-apple-blue mb-2" />
        <span className="font-semibold">New Reminder</span>
      </div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 glass">
          <div className="apple-card w-full max-w-md p-6 space-y-6">
            <h2 className="text-2xl font-bold font-display">Set Reminder</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-apple-gray mb-1 block">Select Item</label>
                <select 
                  className="w-full bg-gray-100 dark:bg-white/5 rounded-apple px-4 py-3 border-none text-sm appearance-none"
                  value={itemId}
                  onChange={e => setItemId(e.target.value)}
                >
                  <option value="">Choose an item...</option>
                  {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-apple-gray mb-1 block">Date</label>
                  <input type="date" className="w-full bg-gray-100 dark:bg-white/5 rounded-apple px-4 py-3 border-none text-sm" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-apple-gray mb-1 block">Time</label>
                  <input type="time" className="w-full bg-gray-100 dark:bg-white/5 rounded-apple px-4 py-3 border-none text-sm" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-apple-gray mb-1 block">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Low', 'Medium', 'High'] as const).map(p => (
                    <button key={p} onClick={() => setPriority(p)} className={`py-2 rounded-apple text-xs font-bold ${priority === p ? 'bg-apple-blue text-white' : 'bg-gray-100 dark:bg-white/5 text-apple-gray'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleAdd} className="flex-grow py-4 bg-apple-blue text-white rounded-apple-lg font-bold">Set Reminder</button>
              <button onClick={() => setIsAdding(false)} className="px-6 py-4 bg-gray-100 dark:bg-white/5 text-apple-gray rounded-apple-lg font-bold">Cancel</button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {reminders.map(rem => {
          const item = items.find(i => i.id === rem.itemId);
          return (
            <div key={rem.id} className="apple-card p-5 flex items-center gap-4">
              <div className={`p-3 rounded-full ${rem.priority === 'High' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold">{item?.name || 'Deleted Item'}</h4>
                <p className="text-xs text-apple-gray font-medium">{rem.date} @ {rem.time}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  rem.priority === 'High' ? 'bg-red-100 text-red-600' : 
                  rem.priority === 'Medium' ? 'bg-orange-100 text-orange-600' : 
                  'bg-gray-100 text-gray-500'
                }`}>
                  {rem.priority}
                </span>
                <span className="text-[10px] text-apple-blue font-bold">REPEAT ON</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
