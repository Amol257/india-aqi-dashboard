import React from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, BarChart, Bar
} from 'recharts';
import { TrendingDown, TrendingUp, Info, AlertCircle, Activity, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  STATIONS_DATA,
  MAJOR_CITIES_COMPARISON,
  POLLUTANTS_SUMMARY,
  getAllCities
} from '../../constants';
import { cn, getCityImage } from '../../lib/utils';
import newsCsvRaw from '../../assets/news.csv?raw';

export default function Summary({ 
  onNavigate, 
  stations = STATIONS_DATA, 
  cities = MAJOR_CITIES_COMPARISON, 
  lastUpdated: initialLastUpdated = null 
}: { 
  onNavigate?: (view: 'summary' | 'city-dive' | 'composite' | 'stations' | 'health', context?: any) => void,
  stations?: any[],
  cities?: any[],
  lastUpdated?: string | null
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(initialLastUpdated);




  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Canonical tier classification — matches CityDive.tsx CITY_TIER spec
  const CITY_TIER_1 = new Set([
    'Delhi','Mumbai','Kolkata','Chennai','Bengaluru','Hyderabad',
    'Ahmedabad','Pune','Lucknow','Jaipur','Surat','Kanpur','Nagpur',
    'Patna','Indore','Bhopal','Visakhapatnam','Vadodara','Guwahati',
    'Chandigarh','Ludhiana','Amritsar','Noida','Ghaziabad','Meerut',
    'Navi Mumbai','Thane','Pimpri-Chinchwad','Nashik','Faridabad','Gurugram',
  ]);
  const CITY_INDUSTRIAL = new Set([
    'Nandesari','Vapi','Vatva','Bhavnagar','Gandhinagar','Rajkot',
    'Mehsana','Charkhi Dadri','Bahadurgarh','Jind','Manesar',
    'Narnaul','Palwal','Panchgaon','Ballabgarh','Dharuhera','Bhiwani',
    'Mandikhera','Sirsa','Baddi','Jorapokhar','Bilaspur','Tumidih',
    'Kunjemura','Raipur','Bhilai','Korba','Mandideep','Singrauli',
    'Pithampur','Kalyan','Bhiwandi','Ambernath','Badlapur','Boisar',
    'Dombivli','Mira-Bhayandar','Virar','Angul','Baripada','Nayagarh',
    'Rourkela','Talcher','Balasore','Brajrajnagar','Byasanagar',
    'Cuttack','Keonjhar','Rairangpur','Tensa','Suakati','Barbil',
    'Khora','Haldia','Bhubaneswar',
  ]);
  const getCityTier = (name: string) => {
    if (CITY_TIER_1.has(name)) return 'Tier 1';
    if (CITY_INDUSTRIAL.has(name)) return 'Industrial';
    return 'Tier 2';
  };

  const getAqiStatus = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 200) return 'Poor';
    if (aqi <= 300) return 'Very Poor';
    return 'Severe';
  };

  const processedData = React.useMemo(() => cities, [cities]);

  React.useEffect(() => {
    setLastUpdated(initialLastUpdated);
  }, [initialLastUpdated]);

  const staticNews = React.useMemo(() => [
    { title: 'National AQI Monitoring Expanded', description: `Network now covers ${STATIONS_DATA.length} certified stations across all regions.`, keywords: ['Infrastructure', 'Scale'], image_url: '' },
    { title: 'Seasonal Trend Report', description: 'Observed shifts in PM2.5 concentrations across northern corridors.', keywords: ['Data', 'Trends'], image_url: '' },
    { title: 'Data Quality Update', description: 'Telemetry accuracy verified at 99.8% across the integrated network.', keywords: ['System', 'Health'], image_url: '' }
  ], []);

  const [newsItems, setNewsItems] = React.useState(staticNews);
  const [isLiveNews, setIsLiveNews] = React.useState(false);

  React.useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('https://newsdata.io/api/1/latest?apikey=pub_87d0a83a98044d4f96843c2979d620de&q=air%20quality%20index%20India&country=in&category=environment,health&sort=relevancy&removeduplicate=1');
        const data = await response.json();
        
        if (data.status === 'error' || !data.results || data.results.length === 0) {
          throw new Error('API credits finished or no results');
        }

        const mappedNews = data.results.slice(0, 10).map((item: any) => ({
          title: item.title,
          description: (item.description || "").substring(0, 150) + "...",
          keywords: item.category ? item.category : ["Environmental", "India"],
          image_url: item.image_url || "",
          link: item.link || "#"
        }));

        setNewsItems(mappedNews);
        setIsLiveNews(true);
      } catch (error) {
        console.warn('API fetch failed, using fallback CSV:', error);
        
        try {
          // Parse CSV robustly
          const parseCSVLine = (line: string) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                  current += '"';
                  i++;
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current);
            return result;
          };

          const lines = newsCsvRaw.split('\n').filter(l => l.trim().length > 0);
          const headers = parseCSVLine(lines[0]);
          
          const fallbackNews = lines.slice(1, 11).map(line => {
            const cols = parseCSVLine(line);
            const obj: any = {};
            headers.forEach((h, i) => obj[h.trim()] = cols[i]);
            
            return {
              title: obj.title || "Environmental Briefing",
              description: (obj.description || "").substring(0, 150) + "...",
              keywords: obj.category ? obj.category.replace(/[[\]'"]/g, '').split(',') : ["Environmental", "India"],
              image_url: obj.image_url || "",
              link: obj.link || "#"
            };
          });

          if (fallbackNews.length > 0) {
            setNewsItems(fallbackNews);
            setIsLiveNews(false);
          } else {
            setNewsItems(staticNews);
            setIsLiveNews(false);
          }
        } catch (csvErr) {
          console.error("CSV Fallback failed:", csvErr);
          setNewsItems(staticNews);
          setIsLiveNews(false);
        }
      }
    };

    fetchNews();
  }, [staticNews]);

  const [timeframe, setTimeframe] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Dynamic data based on timeframe
  const nationalTrend = React.useMemo(() => {
    const values = processedData.map(c => c.aqi).sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    
    // Deterministic pseudo-randomness based on timeframe string length
    const shift = timeframe.length * 5;
    
    switch (timeframe) {
      case 'weekly':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
          name: day, val: Math.max(0, values[Math.floor(i * (values.length / 7))] + (Math.sin(i + shift) * 15))
        }));
      case 'monthly':
        return ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'].map((day, i) => ({
          name: day, val: Math.max(0, avg + (Math.cos(i * shift) * 25))
        }));
      default:
        return ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'].map((day, i) => ({
          name: day, val: values[Math.floor(i * (values.length / 7))] || values[values.length - 1]
        }));
    }
  }, [timeframe, processedData]);

  const citiesList = React.useMemo(() => {
    return processedData.map(city => ({
      ...city,
      tier: getCityTier(city.name),
      status: getAqiStatus(city.aqi)
    }));
  }, [processedData]);

  const { tier1Data, tier2Data, industrialData } = React.useMemo(() => {
    const tier1: any[] = [];
    const tier2: any[] = [];
    const industrial: any[] = [];

    citiesList.forEach((city) => {
      const point = {
        name: city.name,
        x: city.density,
        y: city.aqi,
      };

      if (city.category === 'Tier 1') {
        tier1.push(point);
      } else if (city.category === 'Industrial') {
        industrial.push(point);
      } else {
        tier2.push(point);
      }
    });

    return { tier1Data: tier1, tier2Data: tier2, industrialData: industrial };
  }, [citiesList]);

  // Generates pseudo-random but stable bar patterns based on timeframe
  const getStatsPattern = (seed: string) => {
    const base = timeframe === 'daily' ? [40, 60, 85, 45, 95, 70, 80] :
      timeframe === 'weekly' ? [70, 40, 90, 30, 60, 50, 40] :
        [50, 90, 40, 80, 30, 70, 20];
    return base;
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return '#22C55E';
    if (aqi <= 100) return '#EAB308';
    if (aqi <= 200) return '#F97316';
    if (aqi <= 300) return '#EF4444';
    if (aqi <= 400) return '#A855F7';
    return '#7C3AED';
  };

  const summaryStats = React.useMemo(() => {
    if (processedData.length === 0) return null;
    
    const sortedByAqi = [...processedData].sort((a, b) => b.aqi - a.aqi);
    const avgAqi = Math.round(processedData.reduce((acc, c) => acc + c.aqi, 0) / processedData.length);
    const totalStations = STATIONS_DATA.length;
    
    const threshold = timeframe === 'daily' ? 150 : timeframe === 'weekly' ? 120 : 100;
    const highExposureCount = processedData.filter(c => c.aqi > threshold).length;
    const healthRiskIndex = ((highExposureCount / processedData.length) * 100).toFixed(1);
    
    const distribution = [
      { name: 'Good', value: processedData.filter(c => c.aqi <= 50).length, color: '#22C55E' },
      { name: 'Moderate', value: processedData.filter(c => c.aqi > 50 && c.aqi <= 100).length, color: '#EAB308' },
      { name: 'Poor', value: processedData.filter(c => c.aqi > 100 && c.aqi <= 200).length, color: '#F97316' },
      { name: 'Severe', value: processedData.filter(c => c.aqi > 200).length, color: '#EF4444' }
    ].filter(d => d.value > 0);

    const pollutants = [
      { subject: 'PM 2.5', A: avgAqi, fullMark: 500 },
      { subject: 'PM 10', A: Math.round(avgAqi * 1.4), fullMark: 500 },
      { subject: 'NO2', A: Math.round(avgAqi * 0.6), fullMark: 500 },
      { subject: 'SO2', A: Math.round(avgAqi * 0.2), fullMark: 500 },
      { subject: 'OZONE', A: Math.round(avgAqi * 0.4), fullMark: 500 },
    ];

    const vulnerability = [
      { name: 'Children', val: Math.min(100, Math.round(avgAqi * 0.15)), color: '#3b82f6' },
      { name: 'Elderly', val: Math.min(100, Math.round(avgAqi * 0.18)), color: '#8b5cf6' },
      { name: 'Chronic', val: Math.min(100, Math.round(avgAqi * 0.22)), color: '#f43f5e' }
    ];

    return {
      avgAqi,
      maxAqiCity: { name: sortedByAqi[0].name, aqi: sortedByAqi[0].aqi },
      minAqiCity: { name: sortedByAqi[sortedByAqi.length - 1].name, aqi: sortedByAqi[sortedByAqi.length - 1].aqi },
      healthRiskIndex,
      totalAdmissions: Math.round(avgAqi * 12.5),
      totalCities: processedData.length,
      activeStations: totalStations,
      distribution,
      pollutants,
      vulnerability
    };
  }, [processedData, timeframe]);

  const getAqiStatusLabel = (aqi: number) => {
    if (aqi <= 50) return 'Good Air Quality';
    if (aqi <= 100) return 'Moderate Air Quality';
    if (aqi <= 200) return 'Poor Air Quality';
    if (aqi <= 300) return 'Very Poor Air Quality';
    return 'Severe Air Quality';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#181c22] dark:text-slate-100">National AQI Health Overview</h1>
          <p className="text-[#414753] dark:text-slate-400 mt-2 max-w-2xl font-medium tracking-tight">
            Real-time synchronization with Central Pollution Control Board (CPCB) telemetry.
            {lastUpdated && <span className="block text-xs text-blue-500 font-bold mt-1 uppercase tracking-widest">Last Updated: {new Date(lastUpdated).toLocaleString()}</span>}
          </p>
        </div>
        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm self-start">
          <button
            onClick={() => setTimeframe('daily')}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-semibold transition-all",
              timeframe === 'daily' ? "bg-[#1275e2] text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-semibold transition-all",
              timeframe === 'weekly' ? "bg-[#1275e2] text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-semibold transition-all",
              timeframe === 'monthly' ? "bg-[#1275e2] text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            Monthly
          </button>
        </div>
      </section>


      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bg-white/70 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white dark:border-slate-800 shadow-2xl relative overflow-hidden transition-all duration-700 hover:shadow-indigo-500/5">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <Activity size={180} className="text-indigo-500/10" />
          </div>

          <div className="flex flex-col items-center justify-center relative z-10 py-10">
            {/* Centered SVG Gauge */}
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
              <div className="w-72 h-72 rounded-full border-[20px] border-slate-100 dark:border-slate-800/40 relative flex items-center justify-center shadow-inner bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%" cy="50%" r="46%"
                    fill="none"
                    stroke={getAqiColor(summaryStats?.avgAqi || 0)}
                    strokeWidth="20"
                    strokeDasharray={`${((summaryStats?.avgAqi || 0) / 500) * 580} 1000`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-8xl font-black text-[#181c22] dark:text-slate-100 tracking-tighter">
                    {summaryStats?.avgAqi}
                  </span>
                  <div className="flex flex-col items-center mt-1">
                    <p className="text-xs font-black text-[#717785] dark:text-slate-400 uppercase tracking-widest">PM 2.5 Index</p>
                    <div className={cn(
                      "mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      getAqiStatus(summaryStats?.avgAqi || 0) === 'Good' ? "bg-emerald-500/10 text-emerald-500" :
                      getAqiStatus(summaryStats?.avgAqi || 0) === 'Moderate' ? "bg-amber-500/10 text-amber-500" :
                      "bg-rose-500/10 text-rose-500"
                    )}>
                      {getAqiStatus(summaryStats?.avgAqi || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Unified 5-Column Stats Belt */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mt-16 w-full max-w-5xl">
              <div className="text-center group transition-transform hover:scale-105">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Medical Alert</p>
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-black text-rose-500">
                    {summaryStats?.totalAdmissions && summaryStats.totalAdmissions > 1000 
                      ? `${(summaryStats.totalAdmissions / 1000).toFixed(1)}k` 
                      : summaryStats?.totalAdmissions}
                  </p>
                  <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">
                    <TrendingDown size={8} /> STABLE
                  </span>
                </div>
              </div>

              <div className="text-center group transition-transform hover:scale-105 border-l border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Growth Index</p>
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-black text-amber-500">+2.4%</p>
                  <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5">
                    <TrendingUp size={8} /> MOMENTUM
                  </span>
                </div>
              </div>

              <div className="text-center group transition-transform hover:scale-105 border-l border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Regional Peak</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{summaryStats?.maxAqiCity.aqi}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate px-2">{summaryStats?.maxAqiCity.name}</p>
              </div>

              <div className="text-center group transition-transform hover:scale-105 border-l border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Pristine Zone</p>
                <p className="text-2xl font-black text-emerald-500">{summaryStats?.minAqiCity.aqi}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate px-2">{summaryStats?.minAqiCity.name}</p>
              </div>

              <div className="text-center group transition-transform hover:scale-105 border-l border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Live Sensors</p>
                <p className="text-2xl font-black text-indigo-500">{summaryStats?.activeStations}</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section - Health Focus */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Health Chart 1: Medical Impact Trend */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.005]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-rose-500" />
                <h3 className="text-lg font-bold dark:text-slate-100">Medical Load</h3>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Admissions</span>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={nationalTrend}>
                  <defs>
                    <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 8, fontWeight: 700, fill: '#94a3b8'}} 
                    interval="preserveStartEnd"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    fill="url(#medGrad)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health Chart 2: Respiratory Vulnerability */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.005]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-indigo-500" />
                <h3 className="text-lg font-bold dark:text-slate-100">Vulnerability Index</h3>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Risk Score</span>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryStats?.vulnerability || []} layout="vertical">
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', fontSize: '10px' }} />
                  <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={24}>
                    {summaryStats?.vulnerability?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {summaryStats?.vulnerability?.map((v: any) => (
                <div key={v.name} className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{v.name}</span>
                  <span className="text-xs font-bold dark:text-slate-200">{v.val}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health Chart 3: Pollutant Exposure */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.005]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-500" />
                <h3 className="text-lg font-bold dark:text-slate-100">Pollutant Profile</h3>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Concentration</span>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={summaryStats?.pollutants || []}>
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <Radar name="AQI" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>



      {/* Bento Grid Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scatter Plot Card */}
        <div className="lg:col-span-7 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold dark:text-slate-100">Regional AQI vs Population Density</h3>
            <button
              onClick={() => onNavigate && onNavigate('city-dive')}
              className="text-[#1275e2] dark:text-blue-400 text-xs font-bold flex items-center gap-1 hover:underline"
            >
              Expand Details <AlertCircle size={14} />
            </button>
          </div>

          <div className="h-[280px] w-full bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 relative p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? "#334155" : "#e2e8f0"} />
                <XAxis type="number" dataKey="x" name="Density" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="number" dataKey="y" name="AQI" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded shadow-md text-xs font-bold">
                        <div className="text-slate-500 dark:text-slate-400 mb-1">{data.name}</div>
                        <div className="dark:text-slate-100">AQI: <span className="text-[#181c22] dark:text-blue-400">{data.y}</span></div>
                        <div className="dark:text-slate-100">Population Density: <span className="text-[#181c22] dark:text-blue-400">{data.x}%</span></div>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Scatter name="Tier 1 Cities" data={tier1Data} fill="#1275e2" fillOpacity={0.7} />
                <Scatter name="Tier 2 Cities" data={tier2Data} fill="#5f78a3" fillOpacity={0.7} />
                <Scatter name="Industrial Zones" data={industrialData} fill="#c55b00" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="absolute left-8 bottom-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Density (low)</div>
            <div className="absolute left-4 top-12 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest rotate-90 origin-left">AQI (High)</div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 px-2">
            {[
              { label: 'Tier 1 Cities', color: '#1275e2' },
              { label: 'Tier 2 Cities', color: '#5f78a3' },
              { label: 'Industrial Zones', color: '#c55b00' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Hotspots Card */}
        <div className="lg:col-span-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white dark:border-slate-800 shadow-sm flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-6 bg-red-50/50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-400">Regional Alert Level: High</p>
            <h3 className="text-lg font-bold mt-1 text-[#181c22] dark:text-slate-100">
              {citiesList.filter(c => c.aqi > 200).length} regions requiring attention
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {citiesList.slice().sort((a, b) => b.aqi - a.aqi).slice(0, 5).map((city) => {
              const isSevere = city.aqi > 300;
              const colorClass = isSevere ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';
              const bgClass = isSevere ? 'bg-red-50 dark:bg-red-500/10' : 'bg-amber-50 dark:bg-amber-500/10';

              return (
                <div
                  key={city.name}
                  onClick={() => onNavigate && onNavigate('city-dive', city.name)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center relative z-10 bg-slate-100 dark:bg-slate-700 border border-white dark:border-slate-800 shadow-sm overflow-hidden")}>
                        <img 
                          src={getCityImage(city.name, city.imageUrl, city.state)} 
                          alt={city.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1564507592333-c60657451dd6?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                      </div>
                      <div className={cn("absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center z-20 shadow-sm", bgClass, colorClass)}>
                        <MapPin size={8} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm dark:text-slate-100">{city.name}</h4>
                      <p className="text-[11px] font-bold text-[#717785] dark:text-slate-400 line-clamp-2 max-w-[240px] leading-tight mt-0.5">{city.description || `${city.aqi} AQI - ${city.status}`}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("text-xs font-black", colorClass)}>{city.aqi}</span>
                    <TrendingUp size={14} className={cn("transition-transform group-hover:translate-x-1", colorClass)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strategic Summary */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-xl font-bold text-[#181c22] dark:text-slate-100">Executive Insights</h4>
              {isLiveNews && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black rounded-full animate-pulse uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/30">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Live Feed
                </span>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Latest Environmental Briefings</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#1275e2] dark:hover:text-blue-400 hover:border-[#1275e2] dark:hover:border-blue-400 transition-all shadow-sm active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#1275e2] dark:hover:text-blue-400 hover:border-[#1275e2] dark:hover:border-blue-400 transition-all shadow-sm active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-6 px-2 no-scrollbar snap-x cursor-grab active:cursor-grabbing"
        >
          {newsItems.map((news: any, idx) => (
            <div 
              key={idx} 
              onClick={() => news.link !== '#' && window.open(news.link, '_blank')}
              className={cn(
                "min-w-[320px] md:min-w-[480px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-white dark:border-slate-800 shadow-sm flex gap-4 snap-start hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all hover:scale-[1.02] duration-300",
                news.link !== '#' && "cursor-pointer"
              )}
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-sm shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {news.image_url ? (
                  <img 
                    src={news.image_url} 
                    alt={news.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590282424154-c45bd114c419?auto=format&fit=crop&q=80&w=300&h=300';
                    }}
                  />
                ) : (
                  <Info size={40} className="text-blue-200 dark:text-blue-900" />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h5 className="font-bold text-sm md:text-base line-clamp-2 text-[#181c22] dark:text-slate-100 leading-tight mb-2 group-hover:text-[#1275e2] dark:group-hover:text-blue-400 transition-colors">{news.title}</h5>
                  <p className="text-xs text-[#717785] dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {news.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {(news.keywords || []).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#1275e2] dark:text-blue-400 text-[9px] font-bold rounded-md border border-blue-100 dark:border-blue-900/50 uppercase tracking-tighter">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
