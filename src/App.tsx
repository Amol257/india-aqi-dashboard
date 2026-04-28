/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { cn } from './lib/utils';
import Summary from './components/views/Summary';
import CityDive from './components/views/CityDive';
import Composite from './components/views/Composite';
import Stations from './components/views/Stations';
import Health from './components/views/Health';
import { MAJOR_CITIES_COMPARISON, TOP_POLLUTED_CITIES, STATIONS_DATA, getAllCities } from './constants';

type View = 'summary' | 'city-dive' | 'composite' | 'stations' | 'health';

export default function App() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'AQI Alert: Delhi', message: 'AQI has reached "Severe" levels (412). Avoid outdoor activities.', time: '12m ago', type: 'error' },
    { id: 2, title: 'Better Air: Mumbai', message: 'Air quality improved to "Satisfactory" (84). Great for a walk!', time: '2h ago', type: 'success' },
    { id: 3, title: 'Health Tip', message: 'High Ozone levels expected in Bangalore this afternoon.', time: '5h ago', type: 'warning' },
  ];

  const allCities = React.useMemo(() => getAllCities(), []);

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
      case 'summary': return <Summary onNavigate={handleNavigate} />;
      case 'city-dive': return <CityDive onNavigate={handleNavigate} initialCity={activeContext} />;
      case 'composite': return <Composite onNavigate={handleNavigate} />;
      case 'stations': return <Stations onNavigate={handleNavigate} />;
      case 'health': return <Health onNavigate={handleNavigate} />;
      default: return <Summary onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#181c22] font-sans selection:bg-blue-100">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-xl font-bold tracking-tight text-[#1275e2]">AQI Health India</span>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <div className="hidden sm:flex items-center bg-[#ebedf7] rounded-full px-4 py-1.5 border border-[#c1c6d5] focus-within:ring-2 focus-within:ring-[#005ab4] transition-all relative">
            <Search className="text-[#717785] mr-2" size={18} />
            <input 
              type="text" 
              placeholder="Search cities..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="bg-transparent border-none outline-none text-sm w-32 md:w-64 placeholder:text-[#717785]"
            />
            
            {/* Search Results Dropdown */}
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 shadow-xl rounded-xl max-h-64 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  searchResults.map((city, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                      onClick={() => {
                        handleNavigate('city-dive', city.name);
                        setSearchQuery('');
                      }}
                    >
                      <div>
                        <div className="font-bold text-sm text-[#181c22]">{city.name}</div>
                        <div className="text-[10px] text-slate-500">{city.state}</div>
                      </div>
                      <div className="text-xs font-bold text-[#1275e2]">AQI: {city.aqi}</div>
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
                  isNotificationsOpen ? "bg-blue-50" : "hover:bg-slate-50"
                )}
              >
                <Bell className={cn("transition-colors", isNotificationsOpen ? "text-[#1275e2]" : "text-slate-600 group-hover:text-[#1275e2]")} size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-80 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-20"
                    >
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Notifications</h3>
                        <button className="text-[10px] font-bold text-[#1275e2] hover:underline">Mark all read</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-xs group-hover:text-[#1275e2] transition-colors">{n.title}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                          </div>
                        ))}
                      </div>
                      <button className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1275e2] transition-colors border-t border-slate-100">
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
                  isSettingsOpen ? "bg-blue-50" : "hover:bg-slate-50"
                )}
              >
                <Settings className={cn("transition-colors", isSettingsOpen ? "text-[#1275e2]" : "text-slate-600 group-hover:text-[#1275e2]")} size={20} />
              </button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-20"
                    >
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Preferences</h3>
                      </div>
                      <div className="p-2 space-y-1">
                        <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                          <span className="text-xs font-bold text-slate-700">Appearance</span>
                          <span className="text-[10px] font-black text-[#1275e2] bg-blue-100 px-2 py-0.5 rounded-full uppercase">Light</span>
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                          <span className="text-xs font-bold text-slate-700">Language</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">English</span>
                        </div>
                        <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                          <span className="text-xs font-bold text-slate-700">Units</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">AQI (US)</span>
                        </div>
                        <div className="h-px bg-slate-100 my-2" />
                        <div className="px-3 py-2 flex items-center justify-between hover:bg-red-50 rounded-lg cursor-pointer transition-colors group">
                          <span className="text-xs font-bold text-red-600">Emergency Mode</span>
                          <div className="w-8 h-4 bg-slate-200 rounded-full relative">
                            <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 text-center">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">v2.4.0 Stable Build</p>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 bg-blue-100 flex items-center justify-center overflow-hidden">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                alt="User" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Side Navigation Bar */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 pt-20 px-4 z-40 transition-transform duration-300 ease-in-out md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-8 px-2">
          <h2 className="text-lg font-black text-[#1275e2]">India AQI</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">National Dashboard</p>
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
                    ? "bg-blue-50 text-[#1275e2] font-semibold" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-md transition-colors",
                  isActive ? "bg-blue-100" : "bg-slate-100 group-hover:bg-slate-200"
                )}>
                  <Icon size={16} fill={isActive ? "currentColor" : "none"} />
                </div>
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto mb-10 px-2">
          <div className="bg-[#ebedf7] rounded-xl p-4 border border-[#c1c6d5]/30">
            <p className="text-[10px] text-[#717785] font-bold uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold">Real-time Sync Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pt-24 pb-20 px-4 md:px-6 md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-lg border-t border-slate-200 md:hidden z-50 flex items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200",
                isActive ? "text-[#1275e2] scale-110" : "text-slate-400"
              )}
            >
              <Icon size={20} fill={isActive ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Contextual FAB */}
      <button className="fixed right-6 bottom-20 md:bottom-8 w-14 h-14 bg-[#1275e2] text-white rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group z-30">
        <Activity size={24} className="group-hover:animate-pulse" />
      </button>
    </div>
  );
}
