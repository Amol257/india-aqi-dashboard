/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  MapPin, 
  Layers, 
  Radio, 
  Activity, 
  Search, 
  Bell, 
  Settings,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { cn, getCityImage } from './lib/utils';
import Summary from './components/views/Summary';
import CityDive from './components/views/CityDive';
import Composite from './components/views/Composite';
import Stations from './components/views/Stations';
import Health from './components/views/Health';
import { MAJOR_CITIES_COMPARISON, TOP_POLLUTED_CITIES, STATIONS_DATA, getAllCities, CityData } from './constants';

type View = 'summary' | 'city-dive' | 'composite' | 'stations' | 'health';

export default function App() {
  const [activeView, setActiveView] = useState<View>('summary');
  const [activeContext, setActiveContext] = useState<string | CityData | undefined>(undefined);
  
  const [stations, setStations] = useState<any[]>(STATIONS_DATA);
  const [cities, setCities] = useState<CityData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const blurTimerRef = useRef<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const notifications = useMemo(() => {
    if (cities.length === 0) return [];
    const sortedCities = [...cities].sort((a, b) => b.aqi - a.aqi);
    const severeCities = sortedCities.filter(c => c.aqi > 200);
    const goodCities = sortedCities.filter(c => c.aqi < 50);
    const notes = [];

    if (severeCities.length > 0) {
      notes.push({ id: 1, title: `AQI Alert: ${severeCities[0].name}`, message: `AQI has reached "${severeCities[0].status}" levels (${severeCities[0].aqi}).`, time: 'Just now', type: 'error' });
    }
    if (goodCities.length > 0) {
      notes.push({ id: 2, title: `Better Air: ${goodCities[0].name}`, message: `Air quality improved to "${goodCities[0].status}" (${goodCities[0].aqi}).`, time: '1h ago', type: 'success' });
    } else if (sortedCities.length > 0) {
      notes.push({ id: 2, title: `Update: ${sortedCities[sortedCities.length-1].name}`, message: `Best air quality in the region: ${sortedCities[sortedCities.length-1].aqi} AQI.`, time: '2h ago', type: 'success' });
    }
    const avgAqi = Math.round(cities.reduce((acc, c) => acc + c.aqi, 0) / cities.length);
    notes.push({ id: 3, title: 'Health Insight', message: avgAqi > 100 ? 'Regional average AQI is elevated.' : 'Air quality is within acceptable limits.', time: '5h ago', type: 'warning' });
    return notes;
  }, [cities]);

  const allCities = useMemo(() => {
    // If we have dynamic cities, use them. Otherwise fallback to constants.
    return cities.length > 0 ? cities : MAJOR_CITIES_COMPARISON;
  }, [cities]);

  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('data/local_aqi.json');
        if (response.ok) {
          const data = await response.json();
          if (data.stations) setStations(data.stations);
          if (data.city_aggregation) {
            const dynamicCities: CityData[] = Object.values(data.city_aggregation).map((c: any) => {
              const staticRef = [...MAJOR_CITIES_COMPARISON, ...TOP_POLLUTED_CITIES].find(sc => sc.name === c.name);
              return {
                name: c.name,
                state: c.state,
                aqi: c.avgAqi,
                status: c.avgAqi > 300 ? "Severe" : c.avgAqi > 200 ? "Very Poor" : c.avgAqi > 100 ? "Poor" : c.avgAqi > 50 ? "Moderate" : "Good",
                pm25: c.pollutants?.["PM2.5"]?.value || Math.round(c.avgAqi * 0.6),
                trend: staticRef?.trend || "stable",
                trendValue: staticRef?.trendValue || "LIVE",
                imageUrl: staticRef?.imageUrl || `db/cities/${c.name}/${c.name}.jpg`,
                admissions: c.respiratoryAdmissions,
                density: c.density,
                category: c.category,
                description: staticRef?.description || `Real-time monitoring indicates ${c.avgAqi} AQI in ${c.name}.`
              };
            });
            setCities(dynamicCities);
          }
          setLastUpdated(data.fetchedAt);
        }
      } catch (error) {
        console.error("Failed to fetch latest AQI data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatestData();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
    };
  }, []);

  const toggleTheme = (targetMode: boolean) => {
    if (isDarkMode === targetMode) return;
    
    // Check for View Transitions API support
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        flushSync(() => {
          setIsDarkMode(targetMode);
        });
      });
    } else {
      setIsDarkMode(targetMode);
    }
  };

  const searchResults = allCities.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { id: 'summary', label: 'Summary', icon: LayoutDashboard },
    { id: 'city-dive', label: 'City Dive', icon: MapPin },
    { id: 'composite', label: 'Composite', icon: Layers },
    { id: 'stations', label: 'Stations', icon: Radio },
    { id: 'health', label: 'Health', icon: Activity },
  ];

  const handleNavigate = (view: View, context?: any) => {
    setActiveView(view);
    if (context) setActiveContext(context);
  };

  const renderView = () => {
    switch (activeView) {
      case 'summary': return <Summary onNavigate={handleNavigate} stations={stations} cities={allCities} lastUpdated={lastUpdated} />;
      case 'city-dive': return <CityDive onNavigate={handleNavigate} initialCity={activeContext} cities={allCities} />;
      case 'composite': return <Composite onNavigate={handleNavigate} stations={stations} cities={allCities} />;
      case 'stations': return <Stations onNavigate={handleNavigate} stations={stations} lastUpdated={lastUpdated} />;
      case 'health': return <Health onNavigate={handleNavigate} cities={allCities} />;
      default: return <Summary onNavigate={handleNavigate} stations={stations} cities={allCities} lastUpdated={lastUpdated} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950 text-[#181c22] dark:text-slate-200 font-sans selection:bg-blue-100 transition-colors duration-300">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-4 md:px-6 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-lg md:text-xl font-bold tracking-tight text-[#1275e2] dark:text-blue-400 truncate max-w-[120px] sm:max-w-none">AQI Health India</span>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center bg-[#ebedf7] dark:bg-slate-800 rounded-full px-3 md:px-4 py-1.5 border border-[#c1c6d5] dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#005ab4] transition-all relative">
            <Search className="text-[#717785] dark:text-slate-400 mr-2" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                blurTimerRef.current = window.setTimeout(() => setIsSearchFocused(false), 200);
              }}
              className="bg-transparent border-none outline-none text-sm w-20 sm:w-32 md:w-64 placeholder:text-[#717785] dark:placeholder:text-slate-500"
            />
            
            {/* Search Results Dropdown */}
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl max-h-64 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  searchResults.map((city, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-100 dark:border-slate-700 last:border-0 group"
                      onMouseDown={() => {
                        handleNavigate('city-dive', city);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                          <img 
                            src={getCityImage(city.name, city.imageUrl, city.state)} 
                            alt="" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564507592333-c60657451dd6?auto=format&fit=crop&q=80&w=100';
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#181c22] dark:text-slate-100">{city.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{city.state}</div>
                        </div>
                      </div>
                      <div className={cn(
                        "text-xs font-bold px-2 py-1 rounded-full",
                        city.aqi > 200 ? "text-red-600 bg-red-50 dark:bg-red-900/30" : "text-blue-600 bg-blue-50 dark:bg-blue-900/30"
                      )}>
                        {city.aqi}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">No cities found</div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsSettingsOpen(false);
                }}
                className={cn(
                  "p-2 rounded-full transition-all relative group",
                  isNotificationsOpen ? "bg-blue-50 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Bell className={cn("transition-colors", isNotificationsOpen ? "text-[#1275e2] dark:text-blue-400" : "text-slate-600 dark:text-slate-400 group-hover:text-[#1275e2] dark:group-hover:text-blue-400")} size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden z-20"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">Notifications</h3>
                        <button className="text-[10px] font-bold text-[#1275e2] dark:text-blue-400 hover:underline">Mark all read</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-blue-50/30 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-xs group-hover:text-[#1275e2] dark:group-hover:text-blue-400 transition-colors dark:text-slate-200">{n.title}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{n.message}</p>
                          </div>
                        ))}
                      </div>
                      <button className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1275e2] dark:hover:text-blue-400 transition-colors border-t border-slate-100 dark:border-slate-700">
                        View All Notifications
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                  setIsNotificationsOpen(false);
                }}
                className={cn(
                  "p-2 rounded-full transition-all group",
                  isSettingsOpen ? "bg-blue-50 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Settings className={cn("transition-colors", isSettingsOpen ? "text-[#1275e2] dark:text-blue-400" : "text-slate-600 dark:text-slate-400 group-hover:text-[#1275e2] dark:group-hover:text-blue-400")} size={20} />
              </button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden z-20"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">Preferences</h3>
                      </div>
                      <div className="p-2 space-y-1">
                        <div className="px-3 py-2 space-y-2">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Theme Mode</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => toggleTheme(false)}
                              className={cn(
                                "py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 touch-manipulation",
                                !isDarkMode 
                                  ? "bg-[#1275e2] text-white shadow-lg shadow-blue-100" 
                                  : "bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                              )}
                            >
                              <Sun size={14} /> Light
                            </button>
                            <button 
                              onClick={() => toggleTheme(true)}
                              className={cn(
                                "py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 touch-manipulation",
                                isDarkMode 
                                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                                  : "bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                              )}
                            >
                              <Moon size={14} /> Dark
                            </button>
                          </div>
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Language</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">English</span>
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Units</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">AQI (US)</span>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 text-center">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">v2.4.0 Stable Build</p>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* Side Navigation Bar */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 pt-20 px-4 z-40 transition-transform duration-300 ease-in-out md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-8 px-2">
          <h2 className="text-lg font-black text-[#1275e2] dark:text-blue-400">India AQI</h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">National Dashboard</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as View);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-[#1275e2] dark:text-blue-400 font-semibold" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-md transition-colors",
                  isActive ? "bg-blue-100 dark:bg-blue-900/40" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                )}>
                  <Icon size={16} fill={isActive ? "currentColor" : "none"} />
                </div>
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto mb-10 px-2">
          <div className="bg-[#ebedf7] dark:bg-slate-800 rounded-xl p-4 border border-[#c1c6d5]/30 dark:border-slate-700">
            <p className="text-[10px] text-[#717785] dark:text-slate-400 font-bold uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold dark:text-slate-200">
                {lastUpdated ? `Sync: ${new Date(lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Real-time Sync Active'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pt-24 pb-20 px-4 md:px-6 md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="will-change-[opacity,transform]"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 md:hidden z-50 flex items-center justify-around px-2 pb-safe transition-colors">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200",
                isActive ? "text-[#1275e2] dark:text-blue-400 scale-110" : "text-slate-400 dark:text-slate-500"
              )}
            >
              <Icon size={20} fill={isActive ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Health Diagnostic Modal */}
      <AnimatePresence>
        {isHealthModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsHealthModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                      <Activity size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black dark:text-slate-100">Guardian Briefing</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Health Diagnostic</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsHealthModalOpen(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Risk Score */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Risk Score</span>
                      <span className={cn(
                        "text-xs font-black px-3 py-1 rounded-full uppercase",
                        (cities.reduce((a, b) => a + b.aqi, 0) / cities.length) > 150 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {(cities.reduce((a, b) => a + b.aqi, 0) / (cities.length || 1)) > 150 ? 'High Risk' : 'Optimal'}
                      </span>
                    </div>
                    <div className="text-4xl font-black dark:text-slate-100">
                      {Math.round(cities.reduce((a, b) => a + b.aqi, 0) / (cities.length || 1))} <span className="text-sm font-bold text-slate-400">AVG AQI</span>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Protocol</h4>
                    {[
                      { icon: Sun, text: "Optimal for outdoor activities", active: (cities.reduce((a, b) => a + b.aqi, 0) / (cities.length || 1)) < 100 },
                      { icon: Activity, text: "Mask recommended for sensitive groups", active: (cities.reduce((a, b) => a + b.aqi, 0) / (cities.length || 1)) >= 100 },
                      { icon: Bell, text: "Avoid high-traffic zones today", active: true }
                    ].filter(r => r.active).map((rec, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                        <rec.icon size={18} className="text-blue-500" />
                        <span className="text-sm font-bold dark:text-slate-300">{rec.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    handleNavigate('health');
                    setIsHealthModalOpen(false);
                  }}
                  className="w-full mt-8 py-4 bg-[#1275e2] dark:bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 dark:shadow-none hover:translate-y-[-2px] active:translate-y-0 transition-all"
                >
                  See Full Health Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contextual FAB */}
      <button 
        onClick={() => setIsHealthModalOpen(true)}
        className={cn(
          "fixed right-6 bottom-20 md:bottom-8 w-14 h-14 bg-[#1275e2] dark:bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group z-30",
          (cities.reduce((a, b) => a + b.aqi, 0) / (cities.length || 1)) > 150 ? "animate-pulse" : ""
        )}
      >
        <Activity size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}
