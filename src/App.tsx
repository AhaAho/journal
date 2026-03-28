/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import TextareaAutosize from 'react-textarea-autosize';
import { 
  BookOpen, 
  Calendar, 
  Image as ImageIcon, 
  Tag, 
  Settings, 
  Download, 
  Search, 
  Plus, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Sun,
  Star,
  ArrowLeft,
  Cloud,
  X,
  Bold,
  Italic,
  Type,
  List,
  Quote,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  FileText,
  Loader2,
  Trash2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { JournalEntry, ViewType, AppSettings } from './types';

// Initialize Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Mock Data ---
const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    date: new Date(),
    title: "The morning mist over the water",
    content: "I woke up before the sun today. There's a particular kind of silence here that feels thick, almost tactile. The lake is perfectly still, reflecting the villas along the shore like a dark mirror. I spent an hour just watching the fog lift from the peaks...",
    moodTags: ["Reflective", "Nature"],
    location: "Lake Como, Italy",
    weather: "24°C • Sunny",
    isFavorite: true
  },
  {
    id: '2',
    date: new Date(new Date().getTime() - 1000 * 60 * 60 * 4), // 4 hours ago
    title: "Lunch by the Harbor",
    content: "The local risotto is unlike anything I've ever tasted. Pure saffron and sun.",
    moodTags: ["Joyful"],
    location: "Lake Como, Italy",
    weather: "24°C • Sunny",
    imageUrl: "https://picsum.photos/seed/risotto/800/600",
    imageAlt: "Close-up of a vibrant yellow saffron risotto"
  },
  {
    id: '3',
    date: new Date(new Date().getTime() - 1000 * 60 * 60 * 24), // Yesterday
    title: "The frantic pace of the Duomo",
    content: "Contrast is the theme of this week. Yesterday was chaos at the cathedral square. Thousands of people, pigeons, and the overwhelming scale of the white marble. It’s hard to feel grounded when everything around you is so vertical. I found a small bookstore hidden away in a side alley...",
    moodTags: ["Urban", "Melancholy"],
    location: "Milan, Italy",
    weather: "19°C • Cloudy"
  }
];

// --- Helpers ---
const ensureDate = (date: any): Date => {
  if (date instanceof Date) return date;
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
};

export default function App() {
  const [view, setView] = useState<ViewType>('timeline');
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('journal_entries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((e: any) => ({ ...e, date: ensureDate(e.date) }));
        }
      } catch (e) {
        return INITIAL_ENTRIES;
      }
    }
    return INITIAL_ENTRIES;
  });
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('journal_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      font: 'classic'
    };
  });

  useEffect(() => {
    localStorage.setItem('journal_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('journal_settings', JSON.stringify(settings));
  }, [settings]);

  const currentEntry = useMemo(() => 
    entries.find(e => e.id === currentEntryId), 
  [entries, currentEntryId]);

  const [filterFavorite, setFilterFavorite] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const toggleTag = (tag: string | null) => setSelectedTag(prev => prev === tag ? null : tag);
  const toggleLocation = (loc: string | null) => setSelectedLocation(prev => prev === loc ? null : loc);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(query) || 
        e.content.toLowerCase().includes(query) ||
        e.moodTags.some(t => t.toLowerCase().includes(query))
      );
    }
    if (filterFavorite) {
      result = result.filter(e => e.isFavorite);
    }
    if (selectedTag) {
      result = result.filter(e => e.moodTags.includes(selectedTag));
    }
    if (selectedLocation) {
      result = result.filter(e => e.location === selectedLocation);
    }
    return result;
  }, [entries, searchQuery, filterFavorite, selectedTag, selectedLocation]);

  const handleNewEntry = (date?: Date | string) => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: ensureDate(date),
      title: "",
      content: "",
      moodTags: [],
      location: "Current Location",
      weather: "20°C • Clear"
    };
    setEntries(prev => [newEntry, ...prev]);
    setCurrentEntryId(newEntry.id);
    setView('editor');
  };

  const handleEditEntry = (id: string) => {
    setCurrentEntryId(id);
    setView('editor');
  };

  const handleUpdateEntry = (updatedEntry: JournalEntry) => {
    setEntries(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  const handleDeleteEntry = (id: string) => {
    setEntryToDelete(id);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      setEntries(prev => prev.filter(e => e.id !== entryToDelete));
      setEntryToDelete(null);
      if (view === 'editor') setView('timeline');
    }
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen selection:bg-primary-container selection:text-on-primary-container ${settings.theme === 'dark' ? 'dark' : ''} ${settings.font === 'modern' ? 'font-label' : 'font-body'}`}>
      
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-background/80 backdrop-blur-md shadow-sm border-b border-stone-200/20 print:hidden">
        <div className="flex items-center gap-8">
          <span className="font-headline italic text-2xl text-primary">The Living Journal</span>
          {view === 'timeline' && (
            <div className="hidden md:flex items-center bg-surface-container-highest px-4 py-1.5 rounded-full gap-2">
              <Search className="text-on-surface-variant w-4 h-4" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm font-label placeholder-on-surface-variant/60 w-64" 
                placeholder="Search entries..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {view === 'timeline' && (
            <button 
              onClick={handleNewEntry}
              className="bg-primary text-white px-5 py-2 rounded-full font-label text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              New Entry
            </button>
          )}
          {view === 'editor' && (
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100/50 text-on-surface-variant font-label text-sm hover:bg-stone-200/50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Export
              </button>
              <button 
                onClick={() => setView('timeline')}
                className="px-6 py-2 rounded-full bg-gradient-to-br from-primary to-primary-container text-white font-label font-bold text-sm shadow-md hover:scale-95 transition-transform duration-200"
              >
                Done
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-stone-500 hover:bg-stone-100/50 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={handleExport}
              className="p-2 text-stone-500 hover:bg-stone-100/50 rounded-full transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] flex flex-col py-8 bg-surface-container-low border-r border-stone-200/20 w-64 z-40 print:hidden transition-all duration-500 ${view === 'editor' ? '-translate-x-full' : 'translate-x-0'}`}>
          <div className="px-6 mb-10">
            <h2 className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant/60 font-bold mb-1">Navigation</h2>
            <p className="font-label text-[10px] text-stone-400">Reflections & Memories</p>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            <SidebarLink 
              icon={<BookOpen className="w-5 h-5" />} 
              label="Journal" 
              active={view === 'timeline' || view === 'editor'} 
              onClick={() => setView('timeline')} 
            />
            <SidebarLink 
              icon={<Calendar className="w-5 h-5" />} 
              label="Calendar" 
              active={view === 'calendar'} 
              onClick={() => setView('calendar')} 
            />
            <SidebarLink 
              icon={<ImageIcon className="w-5 h-5" />} 
              label="Media" 
              active={view === 'media'} 
              onClick={() => setView('media')} 
            />
            <SidebarLink 
              icon={<Tag className="w-5 h-5" />} 
              label="Tags" 
              active={view === 'tags'} 
              onClick={() => setView('tags')} 
            />
          </nav>
          <div className="px-4 space-y-1 mb-16">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex w-full items-center gap-4 px-4 py-3 text-stone-500 hover:text-stone-700 font-label text-sm tracking-wide transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <button className="flex w-full items-center gap-4 px-4 py-3 text-stone-500 hover:text-stone-700 font-label text-sm tracking-wide transition-colors">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-500 ${view === 'editor' ? 'ml-0' : 'ml-64'}`}>
          <AnimatePresence mode="wait">
            {view === 'timeline' && (
              <TimelineView 
                entries={entries} 
                filteredEntries={filteredEntries}
                onEdit={handleEditEntry} 
                onDelete={handleDeleteEntry}
                onNewAtDate={handleNewEntry}
                filterFavorite={filterFavorite}
                onToggleFavorite={() => setFilterFavorite(!filterFavorite)}
                selectedTag={selectedTag}
                onToggleTag={toggleTag}
                selectedLocation={selectedLocation}
                onToggleLocation={toggleLocation}
              />
            )}
            {view === 'editor' && currentEntry && (
              <EditorView 
                entry={currentEntry} 
                onUpdate={handleUpdateEntry} 
                onDelete={handleDeleteEntry}
                onBack={() => setView('timeline')}
              />
            )}
            {(view === 'calendar' || view === 'media' || view === 'tags') && (
              <PlaceholderView 
                view={view} 
                entries={entries} 
                onEdit={handleEditEntry} 
                onDelete={handleDeleteEntry}
                onNewAtDate={handleNewEntry}
                onSelectTag={(tag: string) => {
                  setSelectedTag(tag);
                  setView('timeline');
                }}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            settings={settings} 
            onUpdate={setSettings} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        )}
        {entryToDelete && (
          <DeleteConfirmationModal 
            onConfirm={confirmDelete}
            onCancel={() => setEntryToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {view === 'timeline' && (
        <button 
          onClick={handleNewEntry}
          className="fixed bottom-10 right-10 w-16 h-16 rounded-full writing-canvas-gradient text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-all duration-300 z-50 group print:hidden"
        >
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}
    </div>
  );
}

// --- Sub-components ---

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-4 py-3 font-label text-sm tracking-wide transition-all duration-300 rounded-lg ${
        active 
          ? 'text-primary font-bold border-r-4 border-primary bg-stone-200/30' 
          : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/30'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TimelineView({ 
  entries, 
  filteredEntries,
  onEdit, 
  onDelete, 
  onNewAtDate, 
  filterFavorite, 
  onToggleFavorite,
  selectedTag,
  onToggleTag,
  selectedLocation,
  onToggleLocation
}: { 
  entries: JournalEntry[], 
  filteredEntries: JournalEntry[],
  onEdit: (id: string) => void, 
  onDelete: (id: string) => void, 
  onNewAtDate: (d: Date) => void, 
  filterFavorite: boolean, 
  onToggleFavorite: () => void,
  selectedTag: string | null,
  onToggleTag: (tag: string | null) => void,
  selectedLocation: string | null,
  onToggleLocation: (loc: string | null) => void
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const today = new Date();
  
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const allTags = useMemo(() => Array.from(new Set(entries.flatMap(e => e.moodTags))), [entries]);
  const allLocations = useMemo(() => Array.from(new Set(entries.map(e => e.location).filter(Boolean))), [entries]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex h-full"
    >
      {/* Left Pane: Calendar & Filters */}
      <section className="w-80 border-r border-stone-200/10 p-8 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-xl text-on-surface">
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1 hover:bg-stone-100 rounded-md"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-stone-100 rounded-md"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-4 text-center font-label text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-4">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center font-label text-sm">
            {blanks.map(b => <div key={`blank-${b}`} />)}
            {days.map((day) => {
              const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const isToday = day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
              const hasEntry = entries.find(e => {
                const d = ensureDate(e.date);
                return d.getDate() === day && d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
              });
              return (
                <div 
                  key={day} 
                  onClick={() => {
                    if (hasEntry) onEdit(hasEntry.id);
                    else onNewAtDate(date);
                  }}
                  className={`py-1 rounded-full transition-colors cursor-pointer ${
                    isToday ? 'bg-primary text-white shadow-md font-bold' : 
                    hasEntry ? 'text-primary font-bold' : 'hover:bg-stone-100'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-6">
          <div 
            onClick={onToggleFavorite}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${filterFavorite ? 'bg-primary text-white shadow-md' : 'bg-surface-container-low text-stone-500 hover:bg-stone-200/50'}`}
          >
            <Star className={`w-5 h-5 ${filterFavorite ? 'fill-white' : ''}`} />
            <span className="font-label text-sm font-bold">Favorites Only</span>
          </div>
          <div>
            <h4 className="font-label text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-3">Mood Tags</h4>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <span 
                  key={tag} 
                  onClick={() => onToggleTag(tag)}
                  className={`px-3 py-1 rounded-md font-label text-xs font-medium cursor-pointer transition-colors ${
                    selectedTag === tag 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-stone-200'
                  }`}
                >
                  {tag}
                </span>
              ))}
              {allTags.length === 0 && <p className="text-[10px] text-stone-400 italic">No tags yet</p>}
            </div>
          </div>
          <div className="pt-6 border-t border-stone-200/40">
            <h4 className="font-label text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-3">Recent Locations</h4>
            <div className="space-y-3">
              {allLocations.map(loc => (
                <div 
                  key={loc} 
                  onClick={() => onToggleLocation(loc)}
                  className={`flex items-center gap-3 font-label text-sm cursor-pointer transition-colors ${
                    selectedLocation === loc ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${selectedLocation === loc ? 'fill-primary' : ''}`} />
                  {loc}
                </div>
              ))}
              {allLocations.length === 0 && <p className="text-[10px] text-stone-400 italic">No locations yet</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Right Pane: Timeline Content */}
      <section className="flex-1 p-10 bg-surface overflow-y-auto custom-scrollbar">
        <header className="mb-12">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="font-headline text-4xl font-bold text-on-surface mb-2">My Timeline</h1>
              <p className="font-label text-sm text-on-surface-variant/70">
                Reflecting on the journey of {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            {(selectedTag || selectedLocation || filterFavorite) && (
              <button 
                onClick={() => {
                  onToggleTag(null);
                  onToggleLocation(null);
                  if (filterFavorite) onToggleFavorite();
                }}
                className="text-[10px] font-label uppercase tracking-widest text-primary hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </header>
        <div className="relative space-y-12">
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-surface-container-high z-0"></div>
          
          {/* Group entries by day */}
          {Object.entries(
            filteredEntries.reduce((acc, entry) => {
              const dateKey = ensureDate(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
              if (!acc[dateKey]) acc[dateKey] = [];
              acc[dateKey].push(entry);
              return acc;
            }, {} as Record<string, JournalEntry[]>)
          ).sort((a, b) => ensureDate(b[1][0].date).getTime() - ensureDate(a[1][0].date).getTime()).map(([date, dayEntries]) => (
            <DayGroup 
              key={date} 
              date={date} 
              location={dayEntries[0].location || "Unknown Location"} 
              icon={dayEntries[0].weather?.toLowerCase().includes('sun') ? <Sun className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
              onToggleLocation={onToggleLocation}
              selectedLocation={selectedLocation}
            >
              {dayEntries.map(entry => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onClick={() => onEdit(entry.id)} 
                  onDelete={onDelete}
                  onToggleTag={onToggleTag}
                  selectedTag={selectedTag}
                />
              ))}
            </DayGroup>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function DayGroup({ date, location, icon, onToggleLocation, selectedLocation, children }: any) {
  const day = date.split(',')[1].trim().split(' ')[1];
  return (
    <div className="relative z-10">
      <div className="flex items-center gap-6 mb-8 pl-1">
        <div className="w-10 h-10 rounded-full bg-white border-2 border-primary flex items-center justify-center font-label font-bold text-primary shadow-sm">
          {day}
        </div>
        <div>
          <h2 className="font-headline text-xl font-bold">{date}</h2>
          <p 
            onClick={() => onToggleLocation(location)}
            className={`font-label text-[10px] uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors ${
              selectedLocation === location ? 'text-primary font-bold' : 'text-stone-400 hover:text-primary'
            }`}
          >
            {location} {icon}
          </p>
        </div>
      </div>
      <div className="pl-16 space-y-6">
        {children}
      </div>
    </div>
  );
}

function EntryCard({ entry, onClick, onDelete, onToggleTag, selectedTag }: any) {
  return (
    <article 
      onClick={onClick}
      className="relative bg-surface-container-lowest rounded-3xl shadow-[0_4px_20px_rgba(81,68,56,0.06),0_2px_4px_rgba(81,68,56,0.04)] max-w-3xl hover:translate-y-[-2px] transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(entry.id);
        }}
        className="absolute top-4 right-4 p-2 bg-stone-100/80 backdrop-blur-md rounded-full text-stone-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all z-10"
        title="Delete Entry"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      {entry.imageUrl ? (
        <div className="grid grid-cols-2 h-64">
          <div className="p-8 flex flex-col justify-center">
            <p className="font-label text-[10px] uppercase tracking-widest text-stone-400 mb-2">
              {ensureDate(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <h3 className="font-headline text-xl font-bold text-on-surface mb-4">{entry.title}</h3>
            <p className="font-body text-md leading-relaxed text-on-surface-variant line-clamp-2 italic">"{entry.content}"</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {entry.moodTags.map((tag: string) => (
                <span 
                  key={tag} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTag(tag);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-label transition-colors ${
                    selectedTag === tag 
                      ? 'bg-primary text-white' 
                      : 'bg-stone-100 text-stone-500 hover:bg-primary hover:text-white'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={entry.imageUrl} 
              alt={entry.imageAlt} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      ) : (
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-headline text-2xl font-bold text-on-surface">{entry.title || "Untitled Entry"}</h3>
            <div className="flex items-center gap-2">
              {entry.isFavorite && <Star className="text-primary w-4 h-4 fill-primary" />}
              <span className="font-label text-[10px] text-stone-400">
                {ensureDate(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <p className="font-body text-lg leading-relaxed text-on-surface mb-6 line-clamp-3">
            {entry.content || "Start writing your thoughts..."}
          </p>
          <div className="flex items-center gap-3">
            {entry.moodTags.map((tag: string) => (
              <span 
                key={tag} 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTag(tag);
                }}
                className={`px-3 py-1 rounded-md font-label text-xs font-medium transition-colors ${
                  selectedTag === tag 
                    ? 'bg-primary text-white shadow-sm' 
                    : tag === 'Reflective' 
                      ? 'bg-primary-container/20 text-on-primary-container hover:bg-primary hover:text-white' 
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-white'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function EditorView({ entry, onUpdate, onDelete, onBack }: { entry: JournalEntry, onUpdate: (e: JournalEntry) => void, onDelete: (id: string) => void, onBack: () => void }) {
  const [localEntry, setLocalEntry] = useState(entry);
  const [isPolishing, setIsPolishing] = useState(false);
  const [newTag, setNewTag] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state if entry changes (e.g. from outside update)
  useEffect(() => {
    setLocalEntry(entry);
  }, [entry.id]);

  useEffect(() => {
    onUpdate(localEntry);
  }, [localEntry]);

  const handleAddTag = () => {
    if (newTag && !localEntry.moodTags.includes(newTag)) {
      setLocalEntry({ ...localEntry, moodTags: [...localEntry.moodTags, newTag] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setLocalEntry({ ...localEntry, moodTags: localEntry.moodTags.filter(t => t !== tag) });
  };

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const newText = value.substring(0, selectionStart) + before + selectedText + after + value.substring(selectionEnd);
    setLocalEntry({ ...localEntry, content: newText });
    
    // Reset focus and selection after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = selectionStart + before.length + selectedText.length + after.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handlePolish = async () => {
    if (!localEntry.content || isPolishing) return;
    
    setIsPolishing(true);
    try {
      const model = "gemini-3-flash-preview";
      const response = await genAI.models.generateContent({
        model,
        contents: `Polish the following journal entry to make it more evocative and editorial, while maintaining the original meaning and tone. Keep it concise. \n\nEntry: ${localEntry.content}`,
        config: {
          systemInstruction: "You are a professional editor for a high-end literary journal. Your tone is sophisticated, warm, and poetic.",
        }
      });
      
      if (response.text) {
        setLocalEntry({ ...localEntry, content: response.text });
      }
    } catch (error) {
      console.error("AI Polish failed:", error);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background flex flex-col items-center pt-8 pb-32"
    >
      <div className="w-full max-w-4xl px-8 md:px-12 flex flex-col gap-12">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-stone-400 hover:text-primary hover:bg-stone-100 rounded-full transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-label text-sm font-medium">Back to Timeline</span>
              </button>
            </div>
            <button 
              onClick={() => setLocalEntry({ ...localEntry, isFavorite: !localEntry.isFavorite })}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${localEntry.isFavorite ? 'text-primary bg-primary/10' : 'text-stone-400 hover:bg-stone-100'}`}
            >
              <Star className={`w-5 h-5 ${localEntry.isFavorite ? 'fill-primary' : ''}`} />
              <span className="font-label text-sm font-medium">{localEntry.isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
            </button>
          </div>
          <div className="flex flex-col">
            <span className="font-label text-sm uppercase tracking-[0.2em] text-primary">
              {ensureDate(localEntry.date).toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
            <input 
              className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-on-surface bg-transparent border-none p-0 focus:ring-0 placeholder:text-outline-variant/30"
              value={localEntry.title}
              onChange={(e) => setLocalEntry({ ...localEntry, title: e.target.value })}
              placeholder={ensureDate(localEntry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 py-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label text-xs">
              <MapPin className="w-3 h-3" />
              <input 
                className="bg-transparent border-none p-0 focus:ring-0 w-32"
                value={localEntry.location}
                onChange={(e) => setLocalEntry({ ...localEntry, location: e.target.value })}
                placeholder="Location"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label text-xs">
              <Cloud className="w-3 h-3" />
              <input 
                className="bg-transparent border-none p-0 focus:ring-0 w-32"
                value={localEntry.weather}
                onChange={(e) => setLocalEntry({ ...localEntry, weather: e.target.value })}
                placeholder="Weather"
              />
            </div>
            <div className="flex items-center gap-2">
              {localEntry.moodTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-label text-xs">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant font-label text-xs">
                <Tag className="w-3 h-3" />
                <input 
                  className="bg-transparent border-none p-0 focus:ring-0 w-20"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add Tag"
                />
              </div>
            </div>
          </div>
        </header>

        {localEntry.imageUrl && (
          <div className="relative group w-full aspect-[16/9] rounded-xl overflow-hidden shadow-sm bg-surface-container-low">
            <img 
              src={localEntry.imageUrl} 
              alt={localEntry.imageAlt} 
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white/90 font-label text-xs italic">{localEntry.imageAlt}</div>
            <button 
              onClick={() => setLocalEntry({ ...localEntry, imageUrl: undefined })}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <TextareaAutosize 
          ref={textareaRef}
          className="w-full min-h-[500px] bg-transparent border-none resize-none font-body text-xl md:text-2xl leading-[1.8] text-on-surface placeholder:text-outline-variant/30 p-0 focus:ring-0 transition-all duration-300" 
          placeholder="The ink flows where the heart leads..."
          value={localEntry.content}
          onChange={(e) => setLocalEntry({ ...localEntry, content: e.target.value })}
          spellCheck="false"
        />
      </div>

      {/* Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 print:hidden">
        <div className="flex items-center gap-1 p-2 bg-background/90 backdrop-blur-xl rounded-2xl shadow-xl border border-stone-200/30">
          <div className="flex items-center px-2 gap-1 border-r border-stone-200/50 mr-1">
            <ToolbarButton onClick={() => insertText('**', '**')} icon={<Bold className="w-4 h-4" />} title="Bold" />
            <ToolbarButton onClick={() => insertText('_', '_')} icon={<Italic className="w-4 h-4" />} title="Italic" />
            <ToolbarButton onClick={() => insertText('### ')} icon={<Type className="w-4 h-4" />} title="Heading" />
          </div>
          <div className="flex items-center px-2 gap-1 border-r border-stone-200/50 mr-1">
            <ToolbarButton onClick={() => insertText('- ')} icon={<List className="w-4 h-4" />} title="List" />
            <ToolbarButton onClick={() => insertText('> ')} icon={<Quote className="w-4 h-4" />} title="Quote" />
          </div>
          <div className="flex items-center px-2 gap-1">
            <ToolbarButton onClick={() => {
              const url = window.prompt('Enter image URL:');
              if (url) setLocalEntry({ ...localEntry, imageUrl: url, imageAlt: 'Journal Image' });
            }} icon={<ImageIcon className="w-4 h-4" />} title="Add Image" />
            <ToolbarButton onClick={() => {
              const url = window.prompt('Enter link URL:');
              if (url) insertText('[', `](${url})`);
            }} icon={<LinkIcon className="w-4 h-4" />} title="Add Link" />
          </div>
          <div className="w-px h-6 bg-stone-200/50 mx-2"></div>
          <button 
            onClick={handlePolish}
            disabled={isPolishing}
            className={`p-2 rounded-lg transition-all ${isPolishing ? 'text-primary animate-pulse' : 'text-primary hover:bg-primary/10'}`}
            title="Polish with AI"
          >
            {isPolishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 fill-primary/10" />}
          </button>
          <div className="w-px h-6 bg-stone-200/50 mx-2"></div>
          <button 
            onClick={() => onDelete(localEntry.id)}
            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Entry"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 w-full h-8 flex items-center justify-between px-8 bg-transparent pointer-events-none">
        <div className="hidden md:block"></div>
        <div className="font-label text-[10px] uppercase tracking-[0.15em] text-stone-400/80 bg-background/60 backdrop-blur-sm px-4 py-1 rounded-t-lg pointer-events-auto">
          {localEntry.content.split(/\s+/).filter(Boolean).length} words · {Math.ceil(localEntry.content.split(/\s+/).filter(Boolean).length / 200)} minutes reading time
        </div>
      </footer>
    </motion.div>
  );
}

function ToolbarButton({ icon, onClick, title }: { icon: React.ReactNode, onClick?: () => void, title?: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className="p-2 hover:bg-stone-200/50 rounded-lg text-on-surface-variant transition-colors"
    >
      {icon}
    </button>
  );
}

function DeleteConfirmationModal({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-background rounded-3xl shadow-2xl overflow-hidden border border-stone-200/30 p-8"
      >
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="font-headline text-2xl font-bold text-on-surface">Delete Entry?</h3>
            <p className="font-label text-sm text-on-surface-variant/70 leading-relaxed">
              This action will permanently remove this reflection from your journal. It cannot be undone.
            </p>
          </div>
          <div className="flex flex-col w-full gap-3 mt-4">
            <button 
              onClick={onConfirm}
              className="w-full py-3 bg-red-500 text-white font-label font-bold text-xs tracking-widest uppercase rounded-xl shadow-lg hover:bg-red-600 transition-all active:scale-95"
            >
              Delete Permanently
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-3 bg-stone-100 text-on-surface font-label font-bold text-xs tracking-widest uppercase rounded-xl hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsModal({ settings, onUpdate, onClose }: { settings: AppSettings, onUpdate: (s: AppSettings) => void, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 md:p-8 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-xl h-full bg-surface-container-lowest rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20"
      >
        <div className="px-8 py-6 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface">Journal Settings</h2>
            <p className="font-label text-[10px] uppercase tracking-[0.15em] text-on-surface-variant mt-1">Refine your editorial experience</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200/50 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 hide-scrollbar space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Settings className="text-primary w-5 h-5" />
              <h3 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">Aesthetic Preferences</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => onUpdate({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' })}
                className="bg-surface-container-low p-6 rounded-2xl border-2 border-transparent hover:border-outline-variant/30 transition-all cursor-pointer"
              >
                <span className="font-label text-[10px] uppercase font-bold text-stone-400 block mb-4">Interface Mode</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sun className="text-amber-600 w-5 h-5" />
                    <span className="font-headline text-lg">{settings.theme === 'light' ? 'Morning (Light)' : 'Evening (Dark)'}</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.theme === 'light' ? 'bg-primary-container' : 'bg-stone-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.theme === 'light' ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
              </div>
              <div 
                onClick={() => onUpdate({ ...settings, font: settings.font === 'classic' ? 'modern' : 'classic' })}
                className={`bg-surface-container-low p-6 rounded-2xl border-2 transition-all cursor-pointer ${settings.font === 'modern' ? 'border-primary ring-4 ring-primary/5' : 'border-transparent hover:border-outline-variant/30'}`}
              >
                <span className="font-label text-[10px] uppercase font-bold text-stone-400 block mb-4">Typography Soul</span>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-headline text-lg">{settings.font === 'classic' ? 'Classic Serif' : 'Modern Sans'}</span>
                    <span className="font-label text-[10px] text-stone-500">{settings.font === 'classic' ? 'Traditional Editorial' : 'Clean & Contemporary'}</span>
                  </div>
                  {settings.font === 'classic' ? <CheckCircle2 className="text-primary w-6 h-6 fill-primary/10" /> : <div className="w-6 h-6 rounded-full border-2 border-primary/20" />}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6">
              <Share2 className="text-primary w-5 h-5" />
              <h3 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">Archival & Export</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-surface-container-high rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-headline text-xl">Digital Keepsake (PDF)</h4>
                    <p className="font-label text-xs text-on-surface-variant mt-1">High-quality typesetting with all imagery</p>
                  </div>
                  <FileText className="text-primary w-8 h-8" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 rounded-full bg-primary text-white font-label text-xs font-bold tracking-wider transition-transform active:scale-95">Full Journal</button>
                  <button className="px-4 py-2 rounded-full bg-white text-on-surface font-label text-xs font-bold tracking-wider border border-outline-variant/30 hover:bg-stone-50">Last 30 Days</button>
                  <button className="px-4 py-2 rounded-full bg-white text-on-surface font-label text-xs font-bold tracking-wider border border-outline-variant/30 hover:bg-stone-50">Custom Range</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-8 bg-surface-container-lowest border-t border-stone-100 flex items-center justify-between">
          <button className="font-label text-xs font-bold text-red-600 uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">Clear Cache</button>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-8 py-3 bg-stone-100 text-on-surface font-label font-bold text-xs tracking-widest uppercase rounded-xl hover:bg-stone-200 transition-colors">Close</button>
            <button className="px-10 py-3 writing-canvas-gradient text-white font-label font-bold text-xs tracking-widest uppercase rounded-xl shadow-xl hover:opacity-90 transition-all scale-100 active:scale-95">Generate Export</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PlaceholderView({ view, entries, onEdit, onDelete, onNewAtDate, onSelectTag }: { view: string, entries: JournalEntry[], onEdit: (id: string) => void, onDelete: (id: string) => void, onNewAtDate: (d: Date) => void, onSelectTag: (tag: string) => void }) {
  if (view === 'calendar') {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-10 max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-12">
          <h1 className="font-headline text-4xl font-bold text-on-surface">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h1>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-3 hover:bg-stone-100 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></button>
            <button onClick={nextMonth} className="p-3 hover:bg-stone-100 rounded-full transition-colors"><ChevronRight className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center font-label text-xs font-bold uppercase tracking-widest text-stone-400 py-4">{d}</div>
          ))}
          {blanks.map(b => <div key={`blank-${b}`} />)}
          {days.map(day => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dayEntries = entries.filter(e => {
              const d = ensureDate(e.date);
              return d.getDate() === day && 
                     d.getMonth() === currentMonth.getMonth() && 
                     d.getFullYear() === currentMonth.getFullYear();
            });
            
            return (
              <div 
                key={day} 
                className={`aspect-square rounded-2xl p-4 border border-stone-100 flex flex-col gap-2 transition-all group ${dayEntries.length > 0 ? 'bg-white shadow-sm hover:shadow-md cursor-pointer' : 'bg-stone-50/50 hover:bg-stone-100 cursor-pointer'}`}
                onClick={() => {
                  if (dayEntries.length > 0) onEdit(dayEntries[0].id);
                  else onNewAtDate(date);
                }}
              >
                <span className={`font-label text-sm font-bold ${dayEntries.length > 0 ? 'text-primary' : 'text-stone-400'}`}>{day}</span>
                <div className="flex flex-wrap gap-1">
                  {dayEntries.map(e => (
                    <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ))}
                </div>
                {dayEntries.length > 0 && (
                  <p className="text-[10px] font-label text-stone-500 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {dayEntries[0].title || "Untitled"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (view === 'media') {
    const mediaEntries = entries.filter(e => e.imageUrl);
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-10"
      >
        <h1 className="font-headline text-4xl font-bold text-on-surface mb-8">Media Gallery</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaEntries.map(entry => (
            <div 
              key={entry.id} 
              onClick={() => onEdit(entry.id)}
              className="aspect-square rounded-2xl overflow-hidden cursor-pointer group relative"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="absolute top-4 right-4 p-2 bg-stone-100/80 backdrop-blur-md rounded-full text-stone-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all z-10"
                title="Delete Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <img 
                src={entry.imageUrl} 
                alt={entry.imageAlt} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-white text-xs font-label font-bold truncate">{entry.title}</p>
              </div>
            </div>
          ))}
          {mediaEntries.length === 0 && (
            <p className="col-span-full text-center text-stone-400 py-20 font-label">No media found in your journal yet.</p>
          )}
        </div>
      </motion.div>
    );
  }

  if (view === 'tags') {
    const allTags = entries.flatMap(e => e.moodTags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="p-10"
      >
        <h1 className="font-headline text-4xl font-bold text-on-surface mb-8">Tags & Moods</h1>
        <div className="flex flex-wrap gap-4">
          {Object.entries(tagCounts).map(([tag, count]) => (
            <div 
              key={tag}
              onClick={() => onSelectTag(tag)}
              className="px-6 py-4 bg-surface-container-low rounded-2xl border border-stone-200/50 flex items-center gap-4 hover:bg-stone-200/30 transition-colors cursor-pointer"
            >
              <Tag className="text-primary w-5 h-5" />
              <div>
                <p className="font-headline text-lg font-bold">{tag}</p>
                <p className="font-label text-xs text-stone-400">{count} entries</p>
              </div>
            </div>
          ))}
          {Object.keys(tagCounts).length === 0 && (
            <p className="text-center text-stone-400 py-20 font-label w-full">No tags found in your journal yet.</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full text-stone-400 gap-4"
    >
      <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center">
        {view === 'calendar' && <Calendar className="w-10 h-10" />}
        {view === 'media' && <ImageIcon className="w-10 h-10" />}
        {view === 'tags' && <Tag className="w-10 h-10" />}
      </div>
      <h2 className="font-headline text-2xl font-bold capitalize">{view} View</h2>
      <p className="font-label text-sm">This feature is coming soon to your journal.</p>
    </motion.div>
  );
}
