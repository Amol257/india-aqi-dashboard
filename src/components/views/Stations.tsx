import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ScatterChart, Scatter
} from 'recharts';
import { Radio, Search, SlidersHorizontal, Map, Settings2, Download, Plus, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TOTAL_STATIONS, STATIONS_DATA, HISTOGRAM_DATA } from '../../constants';
import { cn } from '../../lib/utils';

export default function Stations({ onNavigate }: { onNavigate?: (view: any, context?: any) => void }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [region, setRegion] = React.useState('All India');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [mapAqiFilters, setMapAqiFilters] = React.useState(['0-50', '51-100', '101-150', '151-200', '201-250', '250+']);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc' | 'none'>('none');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const stations = STATIONS_DATA;

  // Dynamic counts derived from stations data
  const totalSites = stations.length;
  const activeCount = stations.filter(s => s.status === 'ACTIVE').length;
  const offlineCount = stations.filter(s => s.status !== 'ACTIVE').length;
  const serviceCount = 0; // future implementation

  const toggleAqiFilter = (filter: string) => {
    setMapAqiFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  const getAqiCategory = (aqi: number) => {
    if (aqi <= 50) return '0-50';
    if (aqi <= 100) return '51-100';
    if (aqi <= 150) return '101-150';
    if (aqi <= 200) return '151-200';
    if (aqi <= 250) return '201-250';
    return '250+';
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return '#22C55E';
    if (aqi <= 100) return '#84CC16';
    if (aqi <= 150) return '#EAB308';
    if (aqi <= 200) return '#F97316';
    if (aqi <= 250) return '#EF4444';
    return '#A855F7';
  };

  // Base filtering (Region, Status, Search)
  const baseFilteredStations = React.useMemo(() => {
    let result = stations.filter(s => {
      if (region !== 'All India' && s.region !== region) return false;
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      if (searchQuery && !s.location.toLowerCase().includes(searchQuery.toLowerCase()) && !s.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    return result;
  }, [stations, region, statusFilter, searchQuery]);

  // Final filtered list including legend toggles for Map and Table
  const filteredStations = React.useMemo(() => {
    let result = [...baseFilteredStations];
    
    if (mapAqiFilters.length > 0) {
      result = result.filter(s => mapAqiFilters.includes(getAqiCategory(s.aqi)));
    }

    if (sortOrder === 'asc') {
      result.sort((a, b) => a.aqi - b.aqi);
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.aqi - a.aqi);
    }
    // Default (none) remains in original order

    return result;
  }, [baseFilteredStations, mapAqiFilters, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
  const paginatedStations = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStations, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, region, statusFilter, mapAqiFilters]);

  const goodAqiCount = baseFilteredStations.filter(s => s.aqi <= 100).length;
  const mediumAqiCount = baseFilteredStations.filter(s => s.aqi > 100 && s.aqi <= 200).length;
  const highAqiCount = baseFilteredStations.filter(s => s.aqi > 200).length;

  const histogramData = [
    { range: '0-50', count: baseFilteredStations.filter(s => s.aqi <= 50).length, color: '#22C55E', isActive: mapAqiFilters.length === 0 || mapAqiFilters.includes('0-50') },
    { range: '51-100', count: baseFilteredStations.filter(s => s.aqi > 50 && s.aqi <= 100).length, color: '#84CC16', isActive: mapAqiFilters.length === 0 || mapAqiFilters.includes('51-100') },
    { range: '101-150', count: baseFilteredStations.filter(s => s.aqi > 100 && s.aqi <= 150).length, color: '#EAB308', isActive: mapAqiFilters.length === 0 || mapAqiFilters.includes('101-150') },
    { range: '151-200', count: baseFilteredStations.filter(s => s.aqi > 150 && s.aqi <= 200).length, color: '#F97316', isActive: mapAqiFilters.length === 0 || mapAqiFilters.includes('151-200') },
    { range: '201-250', count: baseFilteredStations.filter(s => s.aqi > 200 && s.aqi <= 250).length, color: '#EF4444', isActive: mapAqiFilters.length === 0 || mapAqiFilters.includes('201-250') },
    { range: '250+', count: baseFilteredStations.filter(s => s.aqi > 250).length, color: '#A855F7', isActive: mapAqiFilters.length === 0 || mapAqiFilters.includes('250+') }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#181c22] dark:text-slate-100">Stations Analysis</h1>
          <p className="text-[#414753] dark:text-slate-400 mt-2 max-w-2xl font-medium tracking-tight">
            Real-time telemetry and distribution analysis of {activeCount} active monitoring sites.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm self-start group transition-all hover:border-[#1275e2]">
          <div className="bg-[#1275e2] text-white p-2 rounded-lg group-hover:scale-110 transition-transform">
             <Radio size={16} />
          </div>
          <span className="text-xs font-black text-[#181c22] dark:text-slate-100 pr-5 uppercase tracking-widest">{activeCount} Active Sites</span>
        </div>
      </section>

      {/* Filter Dock */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-3xl p-3 md:p-1.5 flex flex-col md:flex-row items-center gap-6 shadow-lg shadow-[#ebedf7]/50 dark:shadow-none sticky top-20 z-30 transition-all hover:shadow-2xl">
        <div className="flex items-center gap-4 w-full md:w-auto px-4 md:border-r border-[#c1c6d5]/30 dark:border-slate-700/50">
          <span className="text-[10px] font-black text-[#717785] dark:text-slate-500 uppercase tracking-widest leading-none">Region</span>
          <select 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-transparent border-none text-sm font-black text-[#181c22] dark:text-slate-100 focus:ring-0 cursor-pointer min-w-[120px]"
          >
            <option className="dark:bg-slate-900">All India</option>
            <option className="dark:bg-slate-900">North India</option>
            <option className="dark:bg-slate-900">South India</option>
            <option className="dark:bg-slate-900">West India</option>
            <option className="dark:bg-slate-900">East India</option>
            <option className="dark:bg-slate-900">Central India</option>
          </select>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto px-4 md:border-r border-[#c1c6d5]/30 dark:border-slate-700/50">
          <span className="text-[10px] font-black text-[#717785] dark:text-slate-500 uppercase tracking-widest leading-none">Status</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-black text-[#181c22] dark:text-slate-100 focus:ring-0 cursor-pointer min-w-[120px]"
          >
            <option value="All" className="dark:bg-slate-900">All ({totalSites})</option>
            <option value="ACTIVE" className="dark:bg-slate-900">Live ({activeCount})</option>
            <option value="SERVICE" className="dark:bg-slate-900">Service ({serviceCount})</option>
            <option value="OFFLINE" className="dark:bg-slate-900">Offline ({offlineCount})</option>
          </select>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto px-4 md:border-r border-[#c1c6d5]/30 dark:border-slate-700/50">
          <span className="text-[10px] font-black text-[#717785] dark:text-slate-500 uppercase tracking-widest leading-none">Sort</span>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-transparent border-none text-sm font-black text-[#181c22] dark:text-slate-100 focus:ring-0 cursor-pointer min-w-[120px]"
          >
            <option value="none" className="dark:bg-slate-900">Default</option>
            <option value="asc" className="dark:bg-slate-900">AQI (Low to High)</option>
            <option value="desc" className="dark:bg-slate-900">AQI (High to Low)</option>
          </select>
        </div>

        <div className="flex flex-1 items-center gap-3 px-4 w-full group">
          <Search size={18} className="text-[#c1c6d5] group-focus-within:text-[#1275e2] transition-colors" />
          <input 
            type="text" 
            placeholder="Search stations..." 
            className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-[#c1c6d5] dark:text-slate-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="w-full md:w-auto bg-[#1275e2] text-white px-8 py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-100 dark:shadow-none hover:scale-[1.02] transition-all">
          <SlidersHorizontal size={14} /> 
          Filters
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black text-[#181c22] dark:text-slate-100 tracking-tight">Station Distribution</h3>
              <p className="text-xs font-bold text-[#717785] dark:text-slate-500 uppercase tracking-widest mt-1">Network density across major clusters</p>
            </div>
            <Map size={24} className="text-[#1275e2] dark:text-blue-400" />
          </div>

          {/* Interactive Legend Above Map - 6 Ranges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: '0-50', color: 'bg-[#22C55E]', label: '0-50', count: baseFilteredStations.filter(s => s.aqi <= 50).length },
              { id: '51-100', color: 'bg-[#84CC16]', label: '51-100', count: baseFilteredStations.filter(s => s.aqi > 50 && s.aqi <= 100).length },
              { id: '101-150', color: 'bg-[#EAB308]', label: '101-150', count: baseFilteredStations.filter(s => s.aqi > 100 && s.aqi <= 150).length },
              { id: '151-200', color: 'bg-[#F97316]', label: '151-200', count: baseFilteredStations.filter(s => s.aqi > 150 && s.aqi <= 200).length },
              { id: '201-250', color: 'bg-[#EF4444]', label: '201-250', count: baseFilteredStations.filter(s => s.aqi > 200 && s.aqi <= 250).length },
              { id: '250+', color: 'bg-[#A855F7]', label: '250+', count: baseFilteredStations.filter(s => s.aqi > 250).length },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => toggleAqiFilter(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-95",
                  mapAqiFilters.includes(item.id) 
                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700" 
                    : "bg-slate-50 dark:bg-slate-900 border-transparent opacity-40 grayscale"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", item.color)} />
                <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{item.label}</span>
                <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 ml-1">{item.count}</span>
              </button>
            ))}
          </div>

          <div className="h-[320px] w-full rounded-2xl bg-[#ebedf7]/40 dark:bg-slate-800/20 relative overflow-hidden group shadow-inner border border-[#c1c6d5]/10 dark:border-slate-700/50 z-0">
            <MapContainer 
              center={[22.5937, 78.9629]} 
              zoom={4} 
              style={{ height: '100%', width: '100%' }} 
              zoomControl={false}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {filteredStations.map(s => (
                <CircleMarker
                  key={s.id}
                  center={[s.lat, s.lng]}
                  radius={8}
                  fillColor={getAqiColor(s.aqi)}
                  color="#ffffff"
                  weight={2}
                  fillOpacity={0.8}
                >
                  <Popup className="rounded-xl overflow-hidden shadow-xl">
                    <div className="text-center p-1">
                      <p className="font-black text-sm text-[#181c22] leading-tight">{s.location}</p>
                      <p className="text-[10px] font-bold text-[#717785] mt-1">{s.city}</p>
                      <div className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest text-white" style={{ backgroundColor: getAqiColor(s.aqi) }}>
                        {s.aqi} AQI
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="md:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-10">AQI Range Histogram</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData}>
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      fillOpacity={entry.isActive ? 0.6 : 0.05} 
                    />
                  ))}
                </Bar>
                <XAxis dataKey="range" hide />
                <YAxis hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4 px-2">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">GOOD</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">SEVERE</span>
          </div>
        </div>

        <div className="md:col-span-3 bg-[#0a73e0] text-white rounded-3xl p-8 shadow-xl shadow-blue-100 dark:shadow-none flex flex-col justify-between group">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Network Uptime</p>
            <div className="text-5xl font-black mt-2 tracking-tighter">99.2%</div>
          </div>
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mt-6">
            <div className="h-full bg-white transition-all duration-1000" style={{ width: '99.2%' }}></div>
          </div>
          <p className="text-[9px] font-bold mt-4 uppercase opacity-60 tracking-wider">Target: 99.5%</p>
        </div>

        <div className="md:col-span-3 bg-[#ebedf7] dark:bg-slate-800 rounded-3xl p-8 border border-[#c1c6d5]/20 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg Latency</p>
            <div className="text-5xl font-black text-[#1275e2] dark:text-blue-400 mt-2 tracking-tighter">1.2s</div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-6 h-10">
            {[30, 50, 40, 90].map((h, i) => (
              <div key={i} className="flex-1 bg-[#1275e2]/30 dark:bg-blue-400/30 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="md:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-lg font-black tracking-tight dark:text-slate-100 mb-6">System Health Status</h4>
            <div className="grid grid-cols-3 gap-8">
              {[
                { l: 'Good AQI', v: goodAqiCount, c: 'text-emerald-500', darkC: 'dark:text-emerald-400' },
                { l: 'Medium AQI', v: mediumAqiCount, c: 'text-amber-500', darkC: 'dark:text-amber-400' },
                { l: 'High AQI', v: highAqiCount, c: 'text-red-500', darkC: 'dark:text-red-400' },
              ].map(i => (
                <div key={i.l}>
                  <div className={cn("text-3xl font-black", i.c, i.darkC)}>{i.v}</div>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1 tracking-widest">{i.l}</div>
                </div>
              ))}
            </div>
          </div>
          <Settings2 size={160} className="absolute -bottom-8 -right-8 text-[#1275e2] opacity-[0.03] dark:opacity-[0.05] group-hover:rotate-12 transition-transform duration-1000" />
        </div>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 mt-12 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-6">
            <h3 className="font-black text-lg tracking-tight px-2 dark:text-slate-100">Station Inventory</h3>
            <div className="flex items-center gap-3 px-4 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Show</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black px-2 py-1 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-100 transition-all cursor-pointer"
              >
                <option value={10}>1-10</option>
                <option value={25}>1-25</option>
                <option value={50}>1-50</option>
                <option value={100}>1-100</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 dark:text-slate-300 transition-all">CSV</button>
            <button className="px-4 py-2 bg-[#1275e2] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-50 dark:shadow-none">+ Add</button>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Pollutants</th>
                <th className="px-6 py-4">AQI</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginatedStations.length > 0 ? paginatedStations.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 font-mono text-xs font-black text-slate-400 dark:text-slate-500 tracking-tighter">#{s.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-black text-sm text-[#181c22] dark:text-slate-100">{s.location}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{s.city}</p>
                  </td>
                  <td className="px-6 py-4 flex gap-1 pt-6">
                    {s.pollutants.map(p => <span key={p} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#1275e2] dark:text-blue-400 text-[9px] font-black rounded-md">{p}</span>)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: getAqiColor(s.aqi) }} />
                      <span className="font-black text-lg tracking-tighter dark:text-slate-100">{s.aqi}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", s.status === 'ACTIVE' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400")}>{s.status}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-700">
                      <Search size={48} strokeWidth={1.5} />
                      <p className="text-sm font-bold uppercase tracking-widest">No stations found matching your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Showing <span className="text-slate-900 dark:text-slate-100">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-slate-100">{Math.min(currentPage * itemsPerPage, filteredStations.length)}</span> of <span className="text-slate-900 dark:text-slate-100">{filteredStations.length}</span> stations
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <Radio size={16} className="rotate-90 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                        currentPage === pageNum 
                          ? "bg-[#1275e2] text-white shadow-lg shadow-blue-100 dark:shadow-none" 
                          : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <Radio size={16} className="-rotate-90 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
