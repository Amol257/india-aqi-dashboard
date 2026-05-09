import React, { useMemo, useState } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { Cloud, Factory, Sun, Download, Filter, Shield, Activity, Wind, Layers, TrendingUp } from 'lucide-react';
import { 
  MAJOR_CITIES_COMPARISON, 
  STATIONS_DATA, 
  POLLUTANTS_SUMMARY,
  getAllCities 
} from '../../constants';
import { cn, exportToCSV } from '../../lib/utils';

export default function Composite({ 
  onNavigate,
  stations = STATIONS_DATA,
  cities = MAJOR_CITIES_COMPARISON
}: { 
  onNavigate?: (view: any, context?: any) => void,
  stations?: any[],
  cities?: any[]
}) {
  const [activePollutant, setActivePollutant] = useState('pm25');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);

  const allCities = cities;

  const correlationData = useMemo(() => {
    // Map UI ID to CSV ID
    const pollutantMap: Record<string, string> = {
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'no2': 'NO2',
      'so2': 'SO2',
      'o3': 'OZONE',
      'co': 'CO'
    };
    const csvId = pollutantMap[activePollutant] || activePollutant;

    return stations.map(stn => {
      const pollutantVal = (stn.pollutant_values as Record<string, any>)?.[csvId] || 0;
      return {
        city: stn.location,
        x: pollutantVal,
        y: stn.aqi,
        region: stn.region.replace(' India', '')
      };
    }).filter(d => (selectedRegion === 'All' || d.region === selectedRegion) && d.x > 0);
  }, [activePollutant, selectedRegion, stations]);

  const dynamicPollutants = useMemo(() => {
    const pollutantMap: Record<string, string> = {
      'pm25': 'PM2.5',
      'pm10': 'PM10',
      'no2': 'NO2',
      'so2': 'SO2',
      'o3': 'OZONE',
      'co': 'CO'
    };

    return POLLUTANTS_SUMMARY.map(p => {
      const csvId = pollutantMap[p.id] || p.id;
      const relevantStations = stations.filter(s => 
        (selectedRegion === 'All' || s.region.startsWith(selectedRegion)) && 
        (s.pollutant_values as Record<string, any>)?.[csvId] !== undefined
      );
      
      const avgVal = relevantStations.length > 0 
        ? Math.round(relevantStations.reduce((acc, s) => acc + ((s.pollutant_values as Record<string, any>)?.[csvId] || 0), 0) / relevantStations.length)
        : p.value;

      // Dynamic status based on value
      let status = "Good";
      if (avgVal > 150) status = "Poor";
      else if (avgVal > 75) status = "Moderate";

      return {
        ...p,
        value: avgVal,
        status: status,
        icon: p.id === 'pm25' ? Cloud : p.id === 'pm10' ? Factory : Sun
      };
    });
  }, [selectedRegion, stations]);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#181c22] dark:text-slate-100">Composite Air Quality Index</h1>
          <p className="text-[#414753] dark:text-slate-400 mt-1 max-w-2xl font-medium">
            Real-time weighted integration of {stations.length} monitoring stations across India.
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <button 
            onClick={() => exportToCSV(stations, 'aqi_composite_data')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0a73e0] text-white font-bold text-xs shadow-lg shadow-blue-100 dark:shadow-none hover:bg-[#005ab4] transition-all"
          >
            <Download size={16} /> Export Data
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[#c1c6d5] dark:border-slate-700 font-bold text-xs text-[#181c22] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <Filter size={16} /> {selectedRegion === 'All' ? 'Region' : selectedRegion}
            </button>
            {isRegionDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {['All', 'North', 'South', 'East', 'West', 'Central'].map(region => (
                  <button 
                    key={region}
                    className={cn(
                      "w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between group/item",
                      selectedRegion === region ? "bg-blue-50 dark:bg-blue-900/30 text-[#005ab4] dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                    )}
                    onClick={() => {
                      setSelectedRegion(region);
                      setIsRegionDropdownOpen(false);
                    }}
                  >
                    {region === 'All' ? 'All Regions' : `${region} India`}
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      selectedRegion === region ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700 group-hover/item:bg-blue-300 dark:group-hover/item:bg-blue-500"
                    )} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Correlation Plot Area */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-[#181c22] dark:text-slate-100 tracking-tight">Pollutant vs AQI Correlation</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></div>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Hazardous</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#005ab4]"></div>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Stable</span>
              </div>
            </div>
          </div>

          <div className="relative w-full aspect-video bg-[#ebedf7]/40 dark:bg-slate-800/40 rounded-2xl overflow-hidden px-4 py-6 border border-[#c1c6d5]/20 dark:border-slate-700/30 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c1c6d5" strokeOpacity={0.3} />
                <XAxis type="number" dataKey="x" hide domain={[0, 'auto']} />
                <YAxis type="number" dataKey="y" hide domain={[0, 500]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pollutantMap: Record<string, string> = {
                        'pm25': 'PM2.5', 'pm10': 'PM10', 'no2': 'NO2', 'so2': 'SO2', 'o3': 'OZONE', 'co': 'CO'
                      };
                      const csvId = pollutantMap[activePollutant] || activePollutant;
                      const unit = POLLUTANTS_SUMMARY.find(p => p.id === activePollutant)?.unit || '';
                      
                      return (
                        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-100 dark:border-slate-700 shadow-xl rounded-lg">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100">{data.city}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">AQI: {data.y}</p>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                              {csvId}: {data.x} {unit}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="National Telemetry" data={correlationData}>
                  {correlationData.map((entry, index) => {
                    const color = entry.y > 300 ? '#ba1a1a' : entry.y > 200 ? '#bd5700' : entry.y > 100 ? '#bd8b00' : '#005ab4';
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={color} 
                        fillOpacity={0.5}
                        stroke={color}
                        strokeWidth={1}
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-5 py-1.5 rounded-full border border-[#c1c6d5]/30 dark:border-slate-700/40 shadow-sm">
              <div className="text-[9px] font-black text-[#717785] dark:text-slate-400 tracking-widest uppercase">X: {activePollutant.toUpperCase()} Conc.</div>
              <div className="w-px h-3 bg-[#c1c6d5] dark:bg-slate-700"></div>
              <div className="text-[9px] font-black text-[#717785] dark:text-slate-400 tracking-widest uppercase">Y: Composite AQI</div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6">
            {[
              { label: 'Correlation', value: '0.89' },
              { label: 'Active Stations', value: stations.length.toString() },
              { label: 'Data Quality', value: '98%' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#f1f3fc] dark:bg-slate-800 p-4 rounded-xl border border-[#c1c6d5]/20 dark:border-slate-700/30 text-center">
                <div className="text-[10px] font-black text-[#717785] dark:text-slate-500 uppercase tracking-widest leading-none mb-2">{stat.label}</div>
                <div className="text-2xl font-black text-[#005ab4] dark:text-blue-400">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pollutant Cards */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {dynamicPollutants.map((poll) => {
            const Icon = poll.icon;
            const isActive = activePollutant === poll.id;
            return (
              <button 
                key={poll.id} 
                onClick={() => setActivePollutant(poll.id)}
                className={cn(
                  "bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 transition-all text-left group",
                  isActive ? "ring-2 ring-blue-100 dark:ring-blue-900/30 scale-[1.02] shadow-lg" : "hover:translate-x-1 hover:shadow-md"
                )}
                style={{ borderLeftColor: poll.color }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "p-2 rounded-xl transition-colors",
                    isActive ? "bg-blue-100 dark:bg-blue-900/40 text-[#005ab4] dark:text-blue-400" : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-[#005ab4] dark:group-hover:text-blue-400"
                  )}>
                    <Icon size={20} />
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.15em]",
                    poll.status === 'Poor' ? "bg-red-50 dark:bg-red-900/30 text-[#ba1a1a] dark:text-red-400" : poll.status === 'Moderate' ? "bg-blue-50 dark:bg-blue-900/30 text-[#465f88] dark:text-blue-300" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {poll.status}
                  </span>
                </div>
                
                <div className="text-3xl font-black text-[#181c22] dark:text-slate-100">
                  {poll.value} <span className="text-sm font-bold text-slate-400 dark:text-slate-500 ml-1">{poll.unit}</span>
                </div>
                <div className={cn("text-sm font-black mb-4", poll.id === 'pm25' ? "text-[#005ab4] dark:text-blue-400" : poll.id === 'pm10' ? "text-[#465f88] dark:text-blue-300" : "text-[#763400] dark:text-orange-400")}>
                  {poll.name}
                </div>
                
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ 
                      width: `${Math.min(100, (poll.value / (poll.id === 'pm25' ? 300 : poll.id === 'pm10' ? 400 : poll.id === 'co' ? 10 : 200)) * 100)}%`,
                      backgroundColor: poll.color 
                    }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                  <span className="text-slate-400 dark:text-slate-500">National Average</span>
                  <span className={cn(poll.change.includes('+') ? "text-[#ba1a1a] dark:text-red-400" : "text-emerald-500 dark:text-emerald-400")}>{poll.change}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Health Impact Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Recommended: N95', sub: 'Active protection advised in hotspots', icon: Shield, color: 'text-[#005ab4]', bg: 'bg-[#005ab4]/5' },
          { label: 'Indoor Air: Medium', sub: 'HEPA filtration recommended indoors', icon: Wind, color: 'text-[#465f88]', bg: 'bg-[#465f88]/5' },
          { label: 'Outdoor Activity: Limited', sub: 'Minimize strenuous aerobic exercise', icon: Activity, color: 'text-[#964400]', bg: 'bg-[#964400]/5' },
        ].map((item) => (
          <div key={item.label} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-white dark:border-slate-800 shadow-sm flex items-center gap-6 hover:scale-[1.02] transition-transform cursor-default">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", item.bg, item.color)}>
              <item.icon size={28} />
            </div>
            <div>
              <div className="text-sm font-black text-[#181c22] dark:text-slate-100 leading-tight mb-1">{item.label}</div>
              <div className="text-[11px] font-bold text-[#717785] dark:text-slate-400 tracking-tight">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* National Geographic Dispersion */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-neutral-100 dark:text-slate-800">
           <Layers size={140} className="rotate-[-15deg] opacity-[0.03] dark:opacity-[0.1]" />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-black text-[#181c22] dark:text-slate-100 mb-10 tracking-tight">National Geographic Dispersion</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {allCities.slice(0, 12).map((city) => (
              <div 
                key={city.name} 
                className="flex flex-col gap-3 group/chip cursor-pointer"
                onClick={() => onNavigate?.('city-dive', city.name)}
              >
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none flex items-center justify-between">
                  {city.name.replace(' NCR', '')}
                  <TrendingUp size={12} className={cn("opacity-0 group-hover/chip:opacity-100 transition-opacity", city.aqi > 200 ? "text-red-500" : "text-amber-500")} />
                </div>
                <div className="flex items-end justify-between gap-2 border-b border-transparent group-hover/chip:border-slate-100 dark:group-hover/chip:border-slate-800 pb-2 transition-all">
                  <span className="text-4xl font-black tracking-tighter leading-none dark:text-slate-100">{city.aqi}</span>
                  <div 
                    className="w-1.5 rounded-full mb-1 transition-all duration-500" 
                    style={{ 
                      height: `${Math.min(40, (city.aqi / 500) * 40)}px`,
                      backgroundColor: city.aqi > 300 ? '#ba1a1a' : city.aqi > 200 ? '#bd5700' : city.aqi > 100 ? '#bd8b00' : '#005ab4'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => onNavigate?.('stations')}
              className="px-8 py-3 bg-[#f1f3fc] dark:bg-slate-800 hover:bg-[#e6e8f1] dark:hover:bg-slate-700 text-[#005ab4] dark:text-blue-400 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all"
            >
              View All {stations.length} Stations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
