import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
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
  Phone
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
          <div className="bg-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <Thermometer size={16} className="text-slate-300 mb-1" />
            <span className="text-lg font-bold">{weatherData.temperature}°C</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Current</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <TrendingUp size={16} className="text-red-400 mb-1" />
            <span className="text-lg font-bold">{weatherData.maxTemp}°C</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Max Today</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <Wind size={16} className="text-blue-300 mb-1" />
            <span className="text-lg font-bold">{weatherData.windSpeed} <span className="text-[10px]">km/h</span></span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Wind</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">Drink water regularly</span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">Avoid 12pm–3pm outdoors</span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">ORS at public spots</span>
        </div>

        <a 
          href="./heat_bulletin.pdf"
          download="Heat_Bulletin.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center w-full py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors shadow-lg mb-6"
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
    <div className="bg-[#181c22] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-32 -mt-32 transition-colors duration-1000", glowColor)}></div>
      {content}
    </div>
  );
};

export default function Health({ onNavigate }: { onNavigate?: (view: any, context?: any) => void }) {
  const admissionsData = [
    { time: '00:00', admissions: 120, baseline: 100 },
    { time: '04:00', admissions: 145, baseline: 100 },
    { time: '08:00', admissions: 280, baseline: 110 },
    { time: '12:00', admissions: 310, baseline: 120 },
    { time: '16:00', admissions: 260, baseline: 115 },
    { time: '20:00', admissions: 190, baseline: 105 },
    { time: '23:59', admissions: 140, baseline: 100 },
  ];

  const pollutantRisks = [
    { name: 'PM 2.5', impact: 'High', systems: ['Cardiovascular', 'Respiratory'], color: 'bg-red-500' },
    { name: 'PM 10', impact: 'Moderate', systems: ['Respiratory', 'Eye Irritation'], color: 'bg-amber-500' },
    { name: 'NO2', impact: 'High', systems: ['Asthma', 'Immunity'], color: 'bg-red-400' },
    { name: 'O3', impact: 'Low', systems: ['Lungs', 'Throat'], color: 'bg-blue-400' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#181c22] dark:text-slate-100">Health Impact Assessment</h1>
          <p className="text-[#414753] dark:text-slate-400 mt-2 max-w-2xl font-medium">
            National epidemiological monitoring based on real-time exposure to particulate matter and toxic gases.
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
          { icon: Wind, label: 'Respiratory', status: 'High Risk', color: 'text-red-500', darkColor: 'dark:text-red-400', bg: 'bg-red-50', darkBg: 'dark:bg-red-900/30' },
          { icon: Heart, label: 'Cardiovascular', status: 'Elevated', color: 'text-amber-500', darkColor: 'dark:text-amber-400', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/30' },
          { icon: Brain, label: 'Neurovascular', status: 'Moderate', color: 'text-blue-500', darkColor: 'dark:text-blue-400', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/30' },
          { icon: Eye, label: 'Ocular Health', status: 'Normal', color: 'text-emerald-500', darkColor: 'dark:text-emerald-400', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/30' },
        ].map((system) => (
          <div key={system.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center group hover:shadow-md transition-all">
            <div className={cn("p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110", system.bg, system.darkBg, system.color, system.darkColor)}>
              <system.icon size={32} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{system.label}</h3>
            <p className={cn("text-[10px] font-black uppercase tracking-widest mt-2", system.color, system.darkColor)}>{system.status}</p>
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Medical Admissions Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold dark:text-slate-100">Respiratory Admissions Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily correlation between AQI spikes and ER visits.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1275e2]"></div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Baseline</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={admissionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1275e2" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#1275e2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="baseline" stroke="#e2e8f0" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="admissions" stroke="#1275e2" strokeWidth={3} fillOpacity={1} fill="url(#colorAdmissions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="lg:col-span-4 space-y-6">
          <RealtimeWeatherWarning />

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Stethoscope size={18} className="text-[#1275e2] dark:text-blue-400" /> Clinical Breakdown
            </h4>
            <div className="space-y-4">
              {pollutantRisks.map((p) => (
                <div key={p.name} className="flex items-start gap-3">
                  <div className={cn("w-1.5 h-10 rounded-full mt-1", p.color)}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-black dark:text-slate-200">{p.name}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", p.impact === 'High' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400')}>
                        {p.impact}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.systems.map(s => (
                        <span key={s} className="text-[9px] font-bold text-slate-400 dark:text-slate-500 group">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerable Groups */}
      <section className="mt-12">
        <h3 className="text-2xl font-black text-[#181c22] dark:text-slate-100 mb-8 tracking-tight">Vulnerable Groups Advisory</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Pediatric Care',
              icon: Baby,
              desc: 'Developing lungs are highly sensitive. Avoid outdoor school activities in Very Poor areas.',
              action: 'Check School Guidelines',
              url: 'https://www.healthygallatin.org/wp-content/uploads/2024/06/ActivityGuidelinesWildfireSmokeEventsSchools.pdf',
              color: 'text-pink-500',
              bg: 'bg-pink-50',
              darkBg: 'dark:bg-pink-900/30'
            },
            {
              title: 'Elderly Support',
              icon: UserRound,
              desc: 'Pre-existing respiratory conditions may worsen. Monitor SPO2 levels frequently.',
              action: 'Emergency Contact List',
              url: 'https://scw.dosje.gov.in/elderline',
              color: 'text-indigo-500',
              bg: 'bg-indigo-50',
              darkBg: 'dark:bg-indigo-900/30'
            },
            {
              title: 'Outdoor Workers',
              icon: MoreHorizontal,
              desc: 'High exposure risk. Requirement for industrial-grade masks and frequent health checkups.',
              action: 'Safety Standards',
              url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.134',
              color: 'text-amber-500',
              bg: 'bg-amber-50',
              darkBg: 'dark:bg-amber-900/30'
            },
          ].map((item) => (
            <div key={item.title} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden group hover:shadow-lg transition-all">
              <div className={cn("h-2 w-full", item.bg.replace('bg-', 'bg-').replace('50', '500'))}></div>
              <div className="p-6">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", item.bg, item.darkBg, item.color)}>
                  <item.icon size={24} />
                </div>
                <h4 className="text-lg font-bold mb-2 dark:text-slate-100">{item.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                  {item.desc}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:text-[#1275e2] dark:group-hover:text-blue-400 transition-colors"
                >
                  {item.action} <TrendingUp size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
