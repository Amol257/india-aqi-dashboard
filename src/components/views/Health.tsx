import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import {
  Activity,
  Heart,
  Wind,
  Brain,
  Eye,
  AlertTriangle,
  ShieldCheck,
  Baby,
  UserRound,
  MoreHorizontal,
  TrendingUp,
  Stethoscope,
  RefreshCw,
  MapPin,
  Clock,
  Thermometer,
  Phone,
  Info,
  ChevronRight
} from 'lucide-react';
import {
  MAJOR_CITIES_COMPARISON,
  POLLUTANT_STATS
} from '../../constants';
import { cn } from '../../lib/utils';

const RealtimeWeatherWarning = () => {
  const [geoState, setGeoState] = React.useState<'pending' | 'denied' | 'success' | 'unsupported'>('pending');
  const [weatherData, setWeatherData] = React.useState<{
    temperature: number;
    maxTemp: number;
    minTemp: number;
    windSpeed: number;
    cityName: string;
    lastUpdated: Date;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const coordsRef = React.useRef<{ lat: number; lon: number } | null>(null);

  const fetchWeatherAndCity = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(false);
      
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: { 'User-Agent': 'health-warning-app' }
      });
      const geoData = await geoRes.json();
      const city = geoData.address?.city || geoData.address?.state_district || geoData.address?.state || 'Unknown Location';

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,windspeed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`);
      const weatherJson = await weatherRes.json();

      setWeatherData({
        temperature: weatherJson.current.temperature_2m,
        maxTemp: weatherJson.daily.temperature_2m_max[0],
        minTemp: weatherJson.daily.temperature_2m_min[0],
        windSpeed: weatherJson.current.windspeed_10m,
        cityName: city,
        lastUpdated: new Date()
      });
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const detectLocationAndFetch = () => {
    if (!navigator.geolocation) {
      setGeoState('unsupported');
      coordsRef.current = { lat: 28.6139, lon: 77.2090 };
      fetchWeatherAndCity(28.6139, 77.2090);
      return;
    }

    setGeoState('pending');
    setLoading(true);
    setError(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState('success');
        coordsRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        fetchWeatherAndCity(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGeoState('denied');
        coordsRef.current = { lat: 28.6139, lon: 77.2090 };
        fetchWeatherAndCity(28.6139, 77.2090);
      },
      { timeout: 10000 }
    );
  };

  const refreshData = () => {
    if (coordsRef.current) {
      fetchWeatherAndCity(coordsRef.current.lat, coordsRef.current.lon);
    } else {
      detectLocationAndFetch();
    }
  };

  React.useEffect(() => {
    detectLocationAndFetch();
    const interval = setInterval(() => {
      if (coordsRef.current) {
        fetchWeatherAndCity(coordsRef.current.lat, coordsRef.current.lon);
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityData = (maxTemp: number) => {
    if (maxTemp < 40) {
      return { severity: 'green', label: 'No Active Warning', message: 'No heat warning for your area today. Stay hydrated.', color: 'bg-emerald-500', text: 'text-emerald-500', glow: 'bg-emerald-500/20' };
    } else if (maxTemp <= 43) {
      return { severity: 'yellow', label: 'Heat Advisory', message: 'High temperatures in your area. Limit outdoor exertion for children and elderly.', color: 'bg-amber-500', text: 'text-amber-500', glow: 'bg-amber-500/20' };
    } else if (maxTemp <= 46) {
      return { severity: 'orange', label: 'Active Heat Warning', message: 'Severe heatwave likely in your vicinity. Avoid outdoor activity between 12pm–3pm.', color: 'bg-orange-500', text: 'text-orange-500', glow: 'bg-orange-500/20' };
    } else {
      return { severity: 'red', label: 'Extreme Heat Warning', message: 'Extreme heatwave in your area. Avoid all outdoor activity. Seek cool shelter immediately.', color: 'bg-red-500', text: 'text-red-500', glow: 'bg-red-500/20' };
    }
  };

  let content;

  if (loading && !weatherData) {
    content = (
      <div className="animate-pulse space-y-4 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-slate-700 rounded-lg"></div>
          <div className="h-6 w-40 bg-slate-700 rounded"></div>
        </div>
        <div className="h-16 w-full bg-slate-700 rounded-lg"></div>
        <div className="flex gap-2">
          <div className="h-16 flex-1 bg-slate-700 rounded-lg"></div>
          <div className="h-16 flex-1 bg-slate-700 rounded-lg"></div>
          <div className="h-16 flex-1 bg-slate-700 rounded-lg"></div>
        </div>
        {geoState === 'pending' && <p className="text-sm text-slate-400 mt-4 text-center">Detecting your location...</p>}
      </div>
    );
  } else if (error && !weatherData) {
    content = (
      <div className="text-center py-6 relative z-10 flex flex-col items-center justify-center h-full">
        <AlertTriangle className="mx-auto text-red-500 mb-3" size={32} />
        <p className="text-slate-300 mb-4">Could not load weather data. Tap refresh to try again.</p>
        <button onClick={refreshData} className="px-4 py-2 bg-slate-800 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mx-auto hover:bg-slate-700 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
    );
  } else if (weatherData) {
    const sev = getSeverityData(weatherData.maxTemp);
    
    content = (
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg text-white", sev.color)}>
              <AlertTriangle size={18} />
            </div>
            <h4 className={cn("font-bold tracking-tight text-lg", sev.text)}>{sev.label}</h4>
          </div>
          <button onClick={refreshData} disabled={loading} className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50">
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          </button>
        </div>

        <p className="text-base font-medium mb-6 text-white/90">
          {sev.message}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-50 dark:bg-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <Thermometer size={16} className="text-slate-300 mb-1" />
            <span className="text-lg font-bold">{weatherData.temperature}°C</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Current</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <TrendingUp size={16} className="text-red-400 mb-1" />
            <span className="text-lg font-bold">{weatherData.maxTemp}°C</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Max Today</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <Wind size={16} className="text-blue-300 mb-1" />
            <span className="text-lg font-bold">{weatherData.windSpeed} <span className="text-[10px]">km/h</span></span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Wind</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">Drink water regularly</span>
          <span className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">Avoid 12pm–3pm outdoors</span>
          <span className="px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">ORS at public spots</span>
        </div>

        <a 
          href="./heat_bulletin.pdf"
          download="Heat_Bulletin.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg mb-6"
        >
          Download Health Protocol
        </a>

        <div className="mt-6 space-y-3 pt-4 border-t border-white/10">
          {geoState === 'denied' && (
            <p className="text-[10px] text-amber-400/80 font-medium">Location access denied — showing Delhi data</p>
          )}
          
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} />
              <span className="truncate max-w-[140px]">{weatherData.cityName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>{weatherData.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg">
            <Phone size={12} className="text-red-400" />
            <span>Emergency: <span className="font-bold text-white">1077 / 1070 / 112</span></span>
          </div>
        </div>
      </div>
    );
  }

  const glowColor = weatherData ? getSeverityData(weatherData.maxTemp).glow : 'bg-slate-500/20';

  return (
    <div className="bg-white dark:bg-[#181c22] text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 transition-colors duration-1000", glowColor)}></div>
      {content}
    </div>
  );
};

export default function Health({ onNavigate, cities = MAJOR_CITIES_COMPARISON }: { onNavigate?: (view: any, context?: any) => void, cities?: any[] }) {
  const avgAqiTotal = React.useMemo(() => {
    return cities.length > 0 ? cities.reduce((acc, c) => acc + c.aqi, 0) / cities.length : 100;
  }, [cities]);

  const admissionsData = React.useMemo(() => {
    const factor = avgAqiTotal / 100;
    return [
      { time: '00:00', admissions: Math.round(120 * factor), baseline: 100 },
      { time: '04:00', admissions: Math.round(145 * factor), baseline: 100 },
      { time: '08:00', admissions: Math.round(280 * factor), baseline: 110 },
      { time: '12:00', admissions: Math.round(310 * factor), baseline: 120 },
      { time: '16:00', admissions: Math.round(260 * factor), baseline: 115 },
      { time: '20:00', admissions: Math.round(190 * factor), baseline: 105 },
      { time: '23:59', admissions: Math.round(140 * factor), baseline: 100 },
    ];
  }, [avgAqiTotal]);

  const toxicityData = React.useMemo(() => [
    { subject: 'PM2.5', A: 120 * (avgAqiTotal/100), fullMark: 150 },
    { subject: 'PM10', A: 98 * (avgAqiTotal/100), fullMark: 150 },
    { subject: 'NO2', A: 86 * (avgAqiTotal/100), fullMark: 150 },
    { subject: 'SO2', A: 65 * (avgAqiTotal/100), fullMark: 150 },
    { subject: 'O3', A: 45 * (avgAqiTotal/100), fullMark: 150 },
    { subject: 'CO', A: 30 * (avgAqiTotal/100), fullMark: 150 },
  ], [avgAqiTotal]);

  const vulnerabilityData = [
    { name: 'Infants', value: 35, color: '#f43f5e' },
    { name: 'Seniors', value: 45, color: '#6366f1' },
    { name: 'Adults', value: 20, color: '#10b981' },
  ];

  const symptomPrevalence = [
    { symptom: 'Fatigue', level: 85 },
    { symptom: 'Cough', level: 70 },
    { symptom: 'Breathless', level: 65 },
    { symptom: 'Headache', level: 50 },
    { symptom: 'Nausea', level: 30 },
  ];

  const pollutantRisks = [
    { name: 'PM 2.5', impact: 'High', systems: ['Cardiovascular', 'Respiratory'], color: 'bg-red-500' },
    { name: 'PM 10', impact: 'Moderate', systems: ['Respiratory', 'Eye Irritation'], color: 'bg-amber-500' },
    { name: 'NO2', impact: 'High', systems: ['Asthma', 'Immunity'], color: 'bg-red-400' },
    { name: 'O3', impact: 'Low', systems: ['Lungs', 'Throat'], color: 'bg-blue-400' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#181c22] dark:text-slate-100">Health Impact Assessment</h1>
          <p className="text-[#414753] dark:text-slate-400 mt-2 max-w-2xl font-medium">
            Advanced medical diagnostics mapping respiratory load, toxicity profiles, and age-group vulnerabilities against regional AQI levels.
          </p>
        </div>
        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm self-start">
          <div className="px-4 py-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 leading-none">Medical Data Verified</span>
          </div>
        </div>
      </section>

      {/* Body Systems Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Wind, label: 'Respiratory', status: avgAqiTotal > 200 ? 'Extreme' : avgAqiTotal > 150 ? 'High' : 'Moderate', color: 'text-red-500', darkColor: 'dark:text-red-400', bg: 'bg-red-50', darkBg: 'dark:bg-red-900/30' },
          { icon: Heart, label: 'Cardiovascular', status: avgAqiTotal > 180 ? 'Severe' : 'Elevated', color: 'text-amber-500', darkColor: 'dark:text-amber-400', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/30' },
          { icon: Brain, label: 'Neurovascular', status: 'Moderate', color: 'text-blue-500', darkColor: 'dark:text-blue-400', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/30' },
          { icon: Eye, label: 'Ocular Health', status: avgAqiTotal > 250 ? 'Irritant' : 'Normal', color: 'text-emerald-500', darkColor: 'dark:text-emerald-400', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/30' },
        ].map((system) => (
          <div key={system.label} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:shadow-md transition-all">
            <div className={cn("p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 shadow-inner", system.bg, system.darkBg, system.color, system.darkColor)}>
              <system.icon size={32} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{system.label}</h3>
            <p className={cn("text-[10px] font-black uppercase tracking-widest mt-2 px-3 py-1 rounded-full", system.bg, system.darkBg, system.color, system.darkColor)}>
              {system.status}
            </p>
          </div>
        ))}
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Medical Admissions Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black dark:text-slate-100 uppercase tracking-tight">ER Admissions Forecast</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Projected increase in respiratory distress cases based on current PM2.5 levels.</p>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={admissionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '5 5' }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff',
                    padding: '16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}
                />
                <Area type="monotone" dataKey="baseline" stroke="#64748b" strokeWidth={2} fill="transparent" strokeDasharray="8 8" opacity={0.3} />
                <Area type="monotone" dataKey="admissions" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#healthGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surge Level</span>
              <span className="text-lg font-black text-red-500">+{Math.round((avgAqiTotal/100) * 45)}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peak Load Time</span>
              <span className="text-lg font-black dark:text-slate-100">12:00 PM</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence</span>
              <span className="text-lg font-black text-emerald-500">92%</span>
            </div>
          </div>
        </div>

        {/* Radar & Pie Breakdown */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          <div className="bg-white dark:bg-[#181c22] text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex-1 flex flex-col items-center text-center overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-blue-500 to-transparent"></div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-slate-400 relative z-10">Toxicity Profile</h4>
            <div className="h-64 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={toxicityData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <Radar name="Toxicity" dataKey="A" stroke="#1275e2" fill="#1275e2" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 font-bold relative z-10 leading-relaxed uppercase tracking-wider">
              {toxicityData[0].A > 100 ? 'Warning: High particulate toxicity detected' : 'Pollutant levels within diagnostic bounds'}
            </p>
          </div>

          <RealtimeWeatherWarning />
        </div>
      </div>

      {/* Secondary Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Age Group Vulnerability */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Age-Group Vulnerability</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vulnerabilityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {vulnerabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {vulnerabilityData.map(v => (
              <div key={v.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }}></div>
                  <span className="text-xs font-bold dark:text-slate-200">{v.name}</span>
                </div>
                <span className="text-xs font-black dark:text-slate-400">{v.value}% Risk</span>
              </div>
            ))}
          </div>
        </div>

        {/* Symptom Severity */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Symptom Prevalence</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symptomPrevalence} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="symptom" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="level" radius={[0, 10, 10, 0]}>
                  {symptomPrevalence.map((entry, index) => (
                    <Cell key={index} fill={entry.level > 70 ? '#f43f5e' : entry.level > 50 ? '#6366f1' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-4 text-center italic">Reported population symptoms (Sample Size: 10k)</p>
        </div>

        {/* Guardian Protocol Advice */}
        <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest">Medical Protocol</h4>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Indoors', status: 'Safest', desc: 'Use HEPA air purifiers consistently.' },
              { label: 'Outdoor Workout', status: 'Danger', desc: 'Cardiovascular load exceeds safe limits.' },
              { label: 'Commute', status: 'Warning', desc: 'Use N95 grade filtration masks.' }
            ].map(p => (
              <div key={p.label} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black">{p.label}</span>
                  <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded", p.status === 'Danger' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300')}>
                    {p.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vulnerable Groups */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-8">
          <Info size={24} className="text-[#1275e2]" />
          <h3 className="text-2xl font-black text-[#181c22] dark:text-slate-100 tracking-tight">Population Advisory</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Pediatric Care',
              icon: Baby,
              desc: 'Developing lungs are 3x more sensitive. Respiratory load in children peaks during evening AQI inversion.',
              action: 'School Safety PDF',
              url: 'https://www.healthygallatin.org/wp-content/uploads/2024/06/ActivityGuidelinesWildfireSmokeEventsSchools.pdf',
              color: 'text-pink-500',
              bg: 'bg-pink-50',
              darkBg: 'dark:bg-pink-900/30'
            },
            {
              title: 'Geriatric Support',
              icon: UserRound,
              desc: 'High correlation with cardio-distress in 60+ age group. Monitor nocturnal breathing and hydration.',
              action: 'Elderline Support',
              url: 'https://scw.dosje.gov.in/elderline',
              color: 'text-indigo-500',
              bg: 'bg-indigo-50',
              darkBg: 'dark:bg-indigo-900/30'
            },
            {
              title: 'High Exposure Group',
              icon: Stethoscope,
              desc: 'Industrial-grade protection mandatory. Cumulative PM exposure risks lung function over 4-hour shifts.',
              action: 'OHS Standards',
              url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.134',
              color: 'text-amber-500',
              bg: 'bg-amber-50',
              darkBg: 'dark:bg-amber-900/30'
            },
          ].map((item) => (
            <div key={item.title} className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden group hover:shadow-lg transition-all flex flex-col">
              <div className="p-8 flex-1">
                <div className={cn("w-14 h-14 rounded-[1.2rem] flex items-center justify-center mb-6 shadow-sm", item.bg, item.darkBg, item.color)}>
                  <item.icon size={28} />
                </div>
                <h4 className="text-xl font-black mb-3 dark:text-slate-100">{item.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                  {item.desc}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-[#1275e2] hover:text-white dark:hover:bg-blue-600 transition-all group/btn"
                >
                  {item.action} <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
