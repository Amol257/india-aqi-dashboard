import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { FileDown, Filter, Thermometer, Wind, Droplets, MapPin, TrendingUp, TrendingDown, ShieldAlert, X, RefreshCw, Clock, Activity, Search as SearchIcon, Sun, Smile, Shield, Home, Users, AlertTriangle, Phone } from 'lucide-react';
import { 
  TOP_POLLUTED_CITIES, 
  AQI_DISTRIBUTION, 
  MAJOR_CITIES_COMPARISON,
  CITY_DIVE_PIE_DATA,
  TOTAL_CITIES,
  getAllCities,
  CityData
} from '../../constants';
import { cn } from '../../lib/utils';



export default function CityDive({ onNavigate, initialCity }: { onNavigate?: (view: 'summary' | 'city-dive' | 'composite' | 'stations' | 'health', context?: any) => void, initialCity?: string }) {
  const allCities = React.useMemo(() => getAllCities(), []);
  
  const [selectedCity, setSelectedCity] = React.useState<CityData>(() => {
    if (initialCity) {
      const found = allCities.find(c => c.name === initialCity);
      if (found) return found;
    }
    return MAJOR_CITIES_COMPARISON[0];
  });
  
  React.useEffect(() => {
    if (initialCity) {
      const found = allCities.find(c => c.name === initialCity);
      if (found) setSelectedCity(found);
    }
  }, [initialCity, allCities]);

  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [dropdownSearch, setDropdownSearch] = React.useState('');
  
  const filteredDropdownCities = allCities.filter(c => 
    c.name.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
    c.state.toLowerCase().includes(dropdownSearch.toLowerCase())
  ).slice(0, 50); // Show top 50 matches to keep it fast
  
  const [healthData, setHealthData] = React.useState<{
    pm25: number, 
    pm10: number, 
    no2: number, 
    so2: number, 
    ozone: number, 
    station: string,
    usAqi: number, // Derived from PM2.5 for severity logic
    respiratoryAdmissions?: number
  } | null>(null);
  const [healthLoading, setHealthLoading] = React.useState(false);
  const [healthError, setHealthError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string>('');
  const [noDataError, setNoDataError] = React.useState(false);

  const fetchAirQuality = React.useCallback(async (city: CityData) => {
    setHealthLoading(true);
    setHealthError(false);
    setNoDataError(false);
    try {
      // 1. Try Local Data First (Requested Switch)
      const localResponse = await fetch('/data/local_aqi.json');
      const localDataMap = await localResponse.json();
      
      // Try exact match or underscore match
      const cityName = city.name.trim();
      const apiCityName = cityName.replace(/\s+/g, '_');
      const cityInfo = localDataMap[cityName] || localDataMap[apiCityName];

      if (cityInfo && cityInfo.pollutants && Object.keys(cityInfo.pollutants).length > 0) {
        const p = cityInfo.pollutants;
        const pm25 = p['PM2.5']?.value ?? cityInfo.avgPm25 ?? 0;
        const pm10 = p['PM10']?.value ?? 0;
        const no2 = p['NO2']?.value ?? 0;
        const so2 = p['SO2']?.value ?? 0;
        const ozone = p['OZONE']?.value ?? 0;
        const station = p['PM2.5']?.station || p['PM10']?.station || cityInfo.name;
        const lastUpdate = p['PM2.5']?.lastUpdate || p['PM10']?.lastUpdate || 'Local Dataset';

        setHealthData({
          pm25,
          pm10,
          no2,
          so2,
          ozone,
          station,
          usAqi: Math.round(pm25 * 1.2),
          respiratoryAdmissions: cityInfo.respiratoryAdmissions
        });
        setLastUpdated(lastUpdate);
        setHealthLoading(false);
        return; // Success with local data
      }

      // 2. Fallback to API if local data not found (Keep for future)
      const apiCity = city.name.trim().replace(/\s+/g, '_');
      const apiKey = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
      const url = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${apiKey}&format=json&filters[city]=${apiCity}&limit=100`;

      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.records || data.records.length === 0) {
        setNoDataError(true);
        return;
      }

      const records = data.records;
      const pm25Record = records.find((r: any) => r.pollutant_id === 'PM2.5');
      const pm10Record = records.find((r: any) => r.pollutant_id === 'PM10');
      const no2Record = records.find((r: any) => r.pollutant_id === 'NO2');
      const so2Record = records.find((r: any) => r.pollutant_id === 'SO2');
      const ozoneRecord = records.find((r: any) => r.pollutant_id === 'OZONE');

      const pm25 = parseFloat(pm25Record?.avg_value ?? '0');
      const pm10 = parseFloat(pm10Record?.avg_value ?? '0');
      const no2 = parseFloat(no2Record?.avg_value ?? '0');
      const so2 = parseFloat(so2Record?.avg_value ?? '0');
      const ozone = parseFloat(ozoneRecord?.avg_value ?? '0');
      
      const lastUpdate = pm25Record?.last_update || pm10Record?.last_update || '';
      const station = pm25Record?.station || pm10Record?.station || city.name;

      setHealthData({
        pm25,
        pm10,
        no2,
        so2,
        ozone,
        station,
        usAqi: Math.round(pm25 * 1.2)
      });
      setLastUpdated(lastUpdate);
    } catch (err) {
      console.error('Data Fetch Error:', err);
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAirQuality(selectedCity);
    const interval = setInterval(() => fetchAirQuality(selectedCity), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCity, fetchAirQuality]);
  
  const pieData = CITY_DIVE_PIE_DATA;

  const getHealthSeverity = (pm25: number) => {
    if (pm25 <= 12) return { label: 'Good', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', accent: '#22c55e' };
    if (pm25 <= 35) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', accent: '#eab308' };
    if (pm25 <= 55) return { label: 'Unhealthy for Sensitive Groups', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', accent: '#f97316' };
    if (pm25 <= 150) return { label: 'Unhealthy', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', accent: '#ef4444' };
    return { label: 'Hazardous', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', accent: '#a855f7' };
  };

  const getSeverityActions = (pm25: number) => {
    if (pm25 <= 12) {
      return [
        { icon: Sun, label: "Air is clean today", subtitle: "SAFE FOR ALL OUTDOOR ACTIVITY.", color: "text-green-500" },
        { icon: Smile, label: "Great day to go outside", subtitle: "UV PROTECTION STILL RECOMMENDED.", color: "text-green-500" }
      ];
    }
    if (pm25 <= 35) {
      return [
        { icon: Shield, label: "Wear N95 Mask", subtitle: "RECOMMENDED FOR SENSITIVE INDIVIDUALS.", color: "text-amber-500" },
        { icon: Wind, label: "Ventilate carefully", subtitle: "OPEN WINDOWS DURING COOLER HOURS ONLY.", color: "text-amber-500" }
      ];
    }
    if (pm25 <= 55) {
      return [
        { icon: Shield, label: "Wear N95 Mask", subtitle: "MANDATORY FOR OUTDOOR ACTIVITIES.", color: "text-orange-500" },
        { icon: Droplets, label: "Indoor Protection", subtitle: "KEEP AIR PURIFIERS ON HIGH MODE.", color: "text-orange-500" }
      ];
    }
    if (pm25 <= 150) {
      return [
        { icon: ShieldAlert, label: "Wear N95 Mask", subtitle: "MANDATORY FOR ALL OUTDOOR ACTIVITIES.", color: "text-red-500" },
        { icon: Home, label: "Stay Indoors", subtitle: "LIMIT ALL OUTDOOR EXPOSURE.", color: "text-red-500" },
        { icon: Users, label: "Check on elderly & children", subtitle: "HIGH-RISK GROUPS MUST STAY INDOORS.", color: "text-red-500" }
      ];
    }
    return [
      { icon: AlertTriangle, label: "Stay Indoors — Seal Windows", subtitle: "AVOID ALL OUTDOOR ACTIVITY.", color: "text-purple-500" },
      { icon: Wind, label: "Air Purifier Mandatory", subtitle: "REPLACE FILTER IF USED HEAVILY.", color: "text-purple-500" },
      { icon: Phone, label: "Call 112 if needed", subtitle: "SEEK HELP FOR BREATHING DIFFICULTY.", color: "text-purple-500" }
    ];
  };

  const severity = healthData ? getHealthSeverity(healthData.pm25) : null;
  const pctRise = healthData ? Math.max(0, Math.min(Math.round(((healthData.pm25 - 15) / 15) * 100), 200)) : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#181c22]">City Dive</h1>
          <p className="text-[#414753] mt-1 max-w-2xl">
            In-depth air quality analytics for {allCities.length} monitored regions across India.
          </p>
        </div>
        <div className="flex gap-3 self-start">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#e6e8f1] border border-[#c1c6d5] font-bold text-xs text-[#181c22] hover:bg-[#e0e2eb] transition-all"
            >
              <Filter size={16} /> {selectedCity.name}
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Region</span>
                    <button onClick={() => setIsDropdownOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="relative">
                    <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Find a city..."
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] outline-none focus:border-[#1275e2] transition-colors"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {filteredDropdownCities.map(city => (
                    <button 
                      key={city.name}
                      onClick={() => {
                        setSelectedCity(city);
                        setIsDropdownOpen(false);
                        setDropdownSearch('');
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-3",
                        selectedCity.name === city.name ? "bg-blue-50 text-[#1275e2]" : "text-slate-700"
                      )}
                    >
                      {city.imageUrl ? (
                        <img src={city.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <MapPin size={14} />
                        </div>
                      )}
                      <div>
                        <div>{city.name}</div>
                        <div className="text-[9px] text-slate-400 font-medium">{city.state}</div>
                      </div>
                      <div className={cn(
                        "ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-black",
                        city.aqi > 300 ? "bg-red-100 text-red-600" : city.aqi > 150 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                      )}>
                        {city.aqi}
                      </div>
                    </button>
                  ))}
                  {filteredDropdownCities.length === 0 && (
                    <div className="px-4 py-6 text-center text-slate-400 text-xs">
                      No matching cities found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1275e2] text-white font-bold text-xs shadow-md shadow-blue-100 hover:opacity-90 transition-all">
            <FileDown size={16} /> Export Report
          </button>
        </div>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Featured City Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden h-full flex flex-col justify-end group cursor-pointer transition-all duration-500 hover:shadow-xl hover:shadow-blue-50">
          <div className="absolute top-0 left-0 w-full h-full">
            <img 
              src={selectedCity.imageUrl || "https://images.unsplash.com/photo-1587474260584-1f20d4296ca4?auto=format&fit=crop&q=80&w=1200"} 
              alt={selectedCity.name} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          </div>
          
          <div className="relative z-10 p-8 flex flex-col md:flex-row items-end justify-between gap-6">
            <div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-lg text-white",
                selectedCity.aqi > 200 ? "bg-[#ba1a1a]" : "bg-[#c55b00]"
              )}>
                {selectedCity.status}
              </span>
              <h2 className="text-white text-4xl font-black tracking-tight">{selectedCity.name}, {selectedCity.state}</h2>
              <p className="text-white/80 text-sm font-bold mt-2 max-w-xl leading-relaxed">
                {selectedCity.description || `Current air quality in ${selectedCity.name} is ${selectedCity.status.toLowerCase()} with a concentration of ${selectedCity.pm25} µg/m³ of PM2.5.`}
              </p>
              <div className="flex items-center gap-6 text-white/90 mt-4 font-bold text-sm">
                <div className="flex items-center gap-1.5"><Thermometer size={18} className="text-red-400" /> 32°C</div>
                <div className="flex items-center gap-1.5"><Wind size={18} className="text-blue-400" /> 12km/h W</div>
                <div className="flex items-center gap-1.5"><Droplets size={18} className="text-cyan-400" /> 64% Hum</div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/20 text-center min-w-[140px] transform group-hover:translate-y-[-8px] transition-transform">
              <div className="text-white/80 text-[10px] uppercase font-black tracking-widest">AQI Level</div>
              <div className="text-white text-5xl font-black mt-1">{selectedCity.aqi}</div>
              <div className="text-white/60 text-[10px] font-black mt-2 uppercase tracking-widest">{selectedCity.trend === 'up' ? 'Rising' : 'Falling'}</div>
            </div>
          </div>
        </div>

        {/* National AQI Range Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center h-full">
          <h3 className="text-xl font-bold self-start mb-6">National AQI Range</h3>
          
          <div className="relative w-full aspect-square max-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-black">{TOTAL_CITIES}</div>
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Cities Tracked</div>
            </div>
          </div>

          <div className="w-full mt-6 space-y-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between group transition-all p-1.5 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                </div>
                <span className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest">{item.value} cities</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Polluted Bar Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Top 20 Most Polluted Today</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">PM 2.5 Concentration</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {allCities.slice().sort((a, b) => b.aqi - a.aqi).slice(0, 20).map((city) => (
              <div key={city.name} className="group cursor-pointer" onClick={() => setSelectedCity(city)}>
                <div className="flex justify-between items-end text-xs font-black mb-2 text-[#181c22]">
                  <span className="group-hover:text-[#1275e2] transition-colors">{city.name}</span>
                  <span className="text-slate-400 font-bold">{city.aqi} AQI</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div 
                    className={cn(
                      "h-full rounded-full relative group-hover:brightness-110 transition-all duration-1000",
                      city.aqi > 400 ? "bg-[#ba1a1a]" : city.aqi > 300 ? "bg-[#c55b00]" : "bg-[#f97316]"
                    )}
                    style={{ width: `${Math.min(100, (city.aqi / 500) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-auto pt-6 border-t border-slate-50 flex justify-center">
            <button 
              onClick={() => onNavigate && onNavigate('stations')}
              className="text-[#1275e2] flex items-center gap-2 text-sm font-bold uppercase tracking-widest group"
            >
              View all monitoring stations <TrendingUp size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Health Advisory */}
        <div className={cn(
          "lg:col-span-4 rounded-2xl p-4 shadow-sm overflow-hidden relative transition-all duration-500 h-full flex flex-col",
          healthError || noDataError ? "bg-red-50 border-red-200" : severity ? `${severity.bg} border ${severity.border}` : "bg-slate-50 border border-slate-100"
        )}>
          {healthLoading && !healthData ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <RefreshCw className="animate-spin text-blue-500" size={32} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Analyzing Air Quality...</p>
            </div>
          ) : healthError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <ShieldAlert className="text-red-500" size={32} />
              <p className="text-sm font-bold text-slate-700">Could not load air quality data. Tap refresh to try again.</p>
              <button 
                onClick={() => fetchAirQuality(selectedCity)}
                className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-red-200"
              >
                Tap Refresh
              </button>
            </div>
          ) : noDataError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <ShieldAlert className="text-amber-500" size={32} />
              <p className="text-sm font-bold text-slate-700 leading-tight">No CPCB data available for {selectedCity.name}. Data may not be monitored in this location.</p>
              <button 
                onClick={() => fetchAirQuality(selectedCity)}
                className="px-4 py-2 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-amber-200"
              >
                Try Again
              </button>
            </div>
          ) : healthData && severity ? (
            <>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl text-white shadow-lg", severity.label === 'Hazardous' ? 'bg-purple-600' : severity.label === 'Unhealthy' ? 'bg-red-600' : severity.label === 'Unhealthy for Sensitive Groups' ? 'bg-orange-600' : severity.label === 'Moderate' ? 'bg-amber-600' : 'bg-green-600')}>
                    <ShieldAlert size={18} />
                  </div>
                  <h4 className={cn("text-base font-black tracking-tight", severity.color.replace('text-', 'text-'))}>Health Advisory</h4>
                </div>
                <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest", severity.bg, severity.color, "border", severity.border)}>
                  STATION DATA
                </div>
              </div>
              
              <div className="mb-6 relative z-10">
                {severity.label === 'Good' && (
                  <p className="text-sm font-bold text-slate-700 leading-snug">
                    Air quality in <span className="font-black text-slate-900">{selectedCity.name}</span> is good today. PM2.5 is within safe limits.
                  </p>
                )}
                {severity.label === 'Moderate' && (
                  <p className="text-sm font-bold text-slate-700 leading-snug">
                    Moderate PM2.5 levels in <span className="font-black text-slate-900">{selectedCity.name}</span>. Sensitive individuals should take precautions outdoors.
                  </p>
                )}
                {severity.label === 'Unhealthy for Sensitive Groups' && (
                  <p className="text-sm font-bold text-slate-700 leading-snug">
                    Due to severe PM2.5 levels in <span className="font-black text-slate-900">{selectedCity.name}</span>, respiratory risks have increased by <span className={cn("text-lg font-black", severity.color)}>{pctRise}%</span> this week.
                  </p>
                )}
                {severity.label === 'Unhealthy' && (
                  <p className="text-sm font-bold text-slate-700 leading-snug">
                    Unhealthy air in <span className="font-black text-slate-900">{selectedCity.name}</span>. PM2.5 is <span className={cn("text-lg font-black", severity.color)}>{Math.round(healthData.pm25 / 15)}x</span> above WHO limits. Avoid all outdoor activity.
                  </p>
                )}
                {severity.label === 'Hazardous' && (
                  <p className="text-sm font-bold text-slate-700 leading-snug">
                    Hazardous air quality in <span className="font-black text-slate-900">{selectedCity.name}</span>. All age groups at severe risk.
                  </p>
                )}
                {healthData.respiratoryAdmissions && healthData.respiratoryAdmissions > 0 && (
                  <div className="mt-3 p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60 flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Activity size={16} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Local Health Impact</p>
                      <p className="text-xs font-bold text-slate-700 leading-snug">
                        <span className="text-red-600 font-black">{healthData.respiratoryAdmissions.toLocaleString()}</span> respiratory hospitalizations recorded in this region.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stat Tiles - Now 4 Tiles in a row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-white/60 backdrop-blur p-3 rounded-xl border border-white shadow-sm text-center">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PM2.5</div>
                  <div className="text-lg font-black text-slate-800">{healthData.pm25}</div>
                  <div className="text-[8px] font-bold text-slate-400">µg/m³</div>
                </div>
                <div className="bg-white/60 backdrop-blur p-3 rounded-xl border border-white shadow-sm text-center">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PM10</div>
                  <div className="text-lg font-black text-slate-800">{healthData.pm10}</div>
                  <div className="text-[8px] font-bold text-slate-400">µg/m³</div>
                </div>
                <div className="bg-white/60 backdrop-blur p-3 rounded-xl border border-white shadow-sm text-center">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">NO2</div>
                  <div className="text-lg font-black text-slate-800">{healthData.no2}</div>
                  <div className="text-[8px] font-bold text-slate-400">µg/m³</div>
                </div>
                <div className="bg-white/60 backdrop-blur p-3 rounded-xl border border-white shadow-sm text-center">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SO2</div>
                  <div className="text-lg font-black text-slate-800">{healthData.so2}</div>
                  <div className="text-[8px] font-bold text-slate-400">µg/m³</div>
                </div>
              </div>
              
              <div className="space-y-3 relative z-10">
                {getSeverityActions(healthData.pm25).map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <div key={idx} className="flex gap-4 p-4 bg-white/60 backdrop-blur rounded-xl border border-white shadow-sm items-center">
                      <div className={action.color}><Icon size={24} /></div>
                      <div>
                        <p className="font-black text-sm text-[#181c22] leading-tight">{action.label}</p>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-tight">{action.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-4 border-t border-black/5 flex flex-col gap-2 relative z-10">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight truncate">{healthData.station}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lastUpdated}</span>
                  </div>
                  <button 
                    onClick={() => fetchAirQuality(selectedCity)}
                    className={cn(
                      "p-1.5 rounded-md hover:bg-black/5 transition-all",
                      healthLoading && "animate-spin"
                    )}
                  >
                    <RefreshCw size={14} className="text-[#1275e2]" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Regional Comparison Grid */}
      <div className="mt-12">
        <h3 className="text-2xl font-black text-[#181c22] mb-8 tracking-tight">Regional Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MAJOR_CITIES_COMPARISON.slice(0, 4).map((city) => (
            <div key={city.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{city.name}</h4>
                  <div className="text-3xl font-black text-[#1275e2] group-hover:scale-110 transition-transform origin-left">{city.aqi}</div>
                </div>
                <span className={cn(
                  "text-[11px] font-black flex items-center px-2 py-1 rounded-full",
                  city.trend === 'down' ? "bg-emerald-50 text-emerald-600" : city.trend === 'up' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"
                )}>
                  {city.trend === 'down' ? <TrendingDown size={14} className="mr-1" /> : city.trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : null}
                  {city.trendValue || 'STABLE'}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                {city.aqi <= 50 ? `${city.status} air quality. Favorable conditions for outdoor activities.` : 
                 city.aqi <= 100 ? `${city.status} air quality. Acceptable levels of air pollution.` : 
                 city.aqi <= 200 ? `${city.status} air quality. Sensitive groups may experience minor health impacts.` : 
                 city.aqi <= 300 ? `${city.status} air quality. General public may experience health impacts.` :
                 `${city.status} air quality. Health alert: everyone may experience more serious health effects.`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
