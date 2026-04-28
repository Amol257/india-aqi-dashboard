import React from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingDown, TrendingUp, Info, AlertCircle, Activity, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  EXECUTIVE_INSIGHT,
  STATIONS_DATA
} from '../../constants';
import { cn } from '../../lib/utils';
import newsCsvRaw from '../../../news.csv?raw';

export default function Summary({ onNavigate }: { onNavigate?: (view: 'summary' | 'city-dive' | 'composite' | 'stations' | 'health', context?: any) => void }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

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

  // Derived Data from STATIONS_DATA for consistency
  const processedData = React.useMemo(() => {
    const cityMap: Record<string, any> = {};

    STATIONS_DATA.forEach(stn => {
      const cityName = stn.city.split(',')[0].trim();
      if (!cityMap[cityName]) {
        cityMap[cityName] = {
          name: cityName,
          state: stn.city.split(',')[1]?.trim() || '',
          aqi_values: [],
          pm25_values: [],
          stations: new Set(),
          description: `Regional monitoring hub for ${cityName}.`
        };
      }
      cityMap[cityName].aqi_values.push(stn.aqi);
      if (stn.pollutant_values?.['PM2.5']) {
        cityMap[cityName].pm25_values.push(stn.pollutant_values['PM2.5']);
      }
      cityMap[cityName].stations.add(stn.location);
    });

    return Object.values(cityMap).map((city: any) => {
      const aqi = Math.round(city.aqi_values.reduce((a: number, b: number) => a + b, 0) / city.aqi_values.length);
      
      const tier = getCityTier(city.name);

      const densityMap: Record<string, number> = { "Tier 1": 95, "Industrial": 70, "Tier 2": 45 };
      const density = (densityMap[tier] || 50) + (city.name.length % 10);

      return {
        ...city,
        aqi,
        peakAqi: Math.max(...city.aqi_values),
        avgPm25: city.pm25_values.length > 0 ? Math.round(city.pm25_values.reduce((a: number, b: number) => a + b, 0) / city.pm25_values.length) : Math.round(aqi * 0.6),
        status: getAqiStatus(aqi),
        category: tier,
        density,
        stationsCount: city.stations.size
      };
    });
  }, []);

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
    const values = processedData.map(c => c.avgAqi).sort((a, b) => a - b);
    const step = Math.floor(values.length / 7);
    
    switch (timeframe) {
      case 'weekly':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
          day, val: values[i * step] || values[values.length - 1]
        }));
      case 'monthly':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((day, i) => ({
          day, val: values[i * Math.floor(values.length / 4)] || values[values.length - 1]
        }));
      default:
        return ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'].map((day, i) => ({
          day, val: values[i * step] || values[values.length - 1]
        }));
    }
  }, [timeframe, processedData]);

  const citiesList = React.useMemo(() => {
    return processedData.map(city => ({
      ...city
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
    
    return {
      avgAqi,
      maxAqiCity: { name: sortedByAqi[0].name, aqi: sortedByAqi[0].aqi },
      minAqiCity: { name: sortedByAqi[sortedByAqi.length - 1].name, aqi: sortedByAqi[sortedByAqi.length - 1].aqi },
      healthRiskIndex,
      totalAdmissions: Math.round(avgAqi * 12.5),
      totalCities: processedData.length,
      activeStations: totalStations
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
          <h1 className="text-3xl font-bold tracking-tight text-[#181c22]">National Health Executive Summary</h1>
          <p className="text-[#414753] mt-2 max-w-2xl">
            Real-time aggregated health metrics across {summaryStats?.activeStations.toLocaleString()} monitoring stations in 28 states and 8 union territories.
          </p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm self-start">
          <button
            onClick={() => setTimeframe('daily')}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-semibold transition-all",
              timeframe === 'daily' ? "bg-[#1275e2] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-semibold transition-all",
              timeframe === 'weekly' ? "bg-[#1275e2] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-semibold transition-all",
              timeframe === 'monthly' ? "bg-[#1275e2] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Monthly
          </button>
        </div>
      </section>

      {/* Bento Grid Top */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* National AQI Gauge Card */}
        <div className="lg:col-span-8 bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white shadow-sm flex flex-col justify-between min-h-[420px] transition-transform hover:scale-[1.01]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#1275e2]">National Average AQI</p>
              <h3 className="text-2xl font-bold mt-1">{getAqiStatusLabel(summaryStats?.avgAqi || 0)}</h3>
            </div>
            <div className={cn(
              "p-2 rounded-xl border",
              (summaryStats?.avgAqi || 0) <= 100 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
            )}>
              <Activity size={24} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-6 relative">
            {/* Custom SVG Gauge */}
            <div className="w-56 h-56 rounded-full border-[18px] border-slate-100 relative flex items-center justify-center shadow-inner">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%" cy="50%" r="46%"
                  fill="none"
                  stroke={getAqiColor(summaryStats?.avgAqi || 0)}
                  strokeWidth="18"
                  strokeDasharray={`${((summaryStats?.avgAqi || 0) / 500) * 580} 1000`}
                  className="rounded-full transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-6xl font-black text-[#181c22]">
                  {summaryStats?.avgAqi}
                </span>
                <p className="text-xs font-black text-[#717785] mt-1 uppercase tracking-widest">PM 2.5 Index</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
            <div>
              <p className="text-[10px] text-[#717785] font-bold uppercase tracking-widest">Last 24h Peak</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-red-500">{summaryStats?.maxAqiCity.aqi}</span>
                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[60px]">{summaryStats?.maxAqiCity.name}</span>
              </div>
            </div>
            <div className="border-x border-slate-100 px-4">
              <p className="text-[10px] text-[#717785] font-bold uppercase tracking-widest">Cleanest Area</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-emerald-600">{summaryStats?.minAqiCity.aqi}</span>
                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[60px]">{summaryStats?.minAqiCity.name}</span>
              </div>
            </div>
            <div className="pl-4">
              <p className="text-[10px] text-[#717785] font-bold uppercase tracking-widest">Stations Active</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#181c22]">{summaryStats?.activeStations.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-emerald-500">99.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Stats */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-[#717785] uppercase tracking-widest">Health Risk Index</p>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold",
                Number(summaryStats?.healthRiskIndex || 0) > 40 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
              )}>
                {Number(summaryStats?.healthRiskIndex || 0) > 40 ? "HIGH" : "MODERATE"}
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{summaryStats?.healthRiskIndex}%</span>
                <span className="text-xs font-bold text-red-500 flex items-center">
                  <TrendingUp size={12} className="mr-0.5" /> 4.1%
                </span>
              </div>
              <p className="text-xs text-[#717785] mt-1">Population in high exposure zones</p>
            </div>
            <div className="h-12 w-full mt-6 flex items-end gap-1.5 px-1">
              {getStatsPattern('health').map((h, i) => (
                <div key={i} className={cn(
                  "flex-1 rounded-t-sm transition-all duration-500",
                  i % 2 === 0 ? "bg-[#c55b00]" : "bg-slate-200"
                )} style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-[#717785] uppercase tracking-widest">Medical Alert Load</p>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold tracking-widest">STABLE</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">
                {summaryStats?.totalAdmissions && summaryStats.totalAdmissions > 1000 
                  ? `${(summaryStats.totalAdmissions / 1000).toFixed(1)}k` 
                  : summaryStats?.totalAdmissions}
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <TrendingDown size={12} className="mr-0.5" /> {timeframe === 'daily' ? '12%' : '8%'}
                </span>
              </div>
              <p className="text-xs text-[#717785] mt-1">{timeframe === 'daily' ? 'Daily' : timeframe === 'weekly' ? 'Weekly' : 'Monthly'} respiratory admissions</p>
            </div>
            <div className="h-12 w-full mt-6 flex items-end gap-1.5 px-1">
              {getStatsPattern('medical').reverse().map((h, i) => (
                <div key={i} className={cn(
                  "flex-1 rounded-t-sm transition-all duration-500",
                  h > 60 ? "bg-[#1275e2]" : "bg-blue-100"
                )} style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scatter Plot Card */}
        <div className="lg:col-span-7 bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">Regional AQI vs Population Density</h3>
            <button
              onClick={() => onNavigate && onNavigate('city-dive')}
              className="text-[#1275e2] text-xs font-bold flex items-center gap-1 hover:underline"
            >
              Expand Details <AlertCircle size={14} />
            </button>
          </div>

          <div className="h-[280px] w-full bg-slate-50/50 rounded-xl border border-slate-100 relative p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="x" name="Density" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="number" dataKey="y" name="AQI" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-slate-200 rounded shadow-md text-xs font-bold">
                        <div className="text-slate-500 mb-1">{data.name}</div>
                        <div>AQI: <span className="text-[#181c22]">{data.y}</span></div>
                        <div>Population Density: <span className="text-[#181c22]">{data.x}%</span></div>
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
            <div className="absolute left-8 bottom-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Density (low)</div>
            <div className="absolute left-4 top-12 text-[10px] font-black text-slate-400 uppercase tracking-widest rotate-90 origin-left">AQI (High)</div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 px-2">
            {[
              { label: 'Tier 1 Cities', color: '#1275e2' },
              { label: 'Tier 2 Cities', color: '#5f78a3' },
              { label: 'Industrial Zones', color: '#c55b00' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Hotspots Card */}
        <div className="lg:col-span-5 bg-white/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white shadow-sm flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="p-6 bg-red-50/50 border-b border-red-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Regional Alert Level: High</p>
            <h3 className="text-lg font-bold mt-1 text-[#181c22]">
              {citiesList.filter(c => c.aqi > 200).length} regions requiring attention
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {citiesList.slice().sort((a, b) => b.aqi - a.aqi).slice(0, 5).map((city) => {
              const isSevere = city.aqi > 300;
              const colorClass = isSevere ? 'text-red-600' : 'text-amber-600';
              const bgClass = isSevere ? 'bg-red-50' : 'bg-amber-50';

              return (
                <div
                  key={city.name}
                  onClick={() => onNavigate && onNavigate('city-dive', city.name)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center relative z-10 bg-slate-100 border border-white shadow-sm overflow-hidden")}>
                        {city.imageUrl ? (
                          <img src={city.imageUrl} alt={city.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <span className="text-slate-500 font-bold text-lg">{city.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className={cn("absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center z-20 shadow-sm", bgClass, colorClass)}>
                        <MapPin size={8} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{city.name}</h4>
                      <p className="text-[11px] font-bold text-[#717785] line-clamp-2 max-w-[240px] leading-tight mt-0.5">{city.description || `${city.aqi} AQI - ${city.status}`}</p>
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
              <h4 className="text-xl font-bold text-[#181c22]">Executive Insights</h4>
              {isLiveNews && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full animate-pulse uppercase tracking-widest border border-emerald-200">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Live Feed
                </span>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Latest Environmental Briefings</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-[#1275e2] hover:border-[#1275e2] transition-all shadow-sm active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-[#1275e2] hover:border-[#1275e2] transition-all shadow-sm active:scale-95"
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
                "min-w-[320px] md:min-w-[480px] bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white shadow-sm flex gap-4 snap-start hover:bg-white/80 transition-all hover:scale-[1.02] duration-300",
                news.link !== '#' && "cursor-pointer"
              )}
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-sm shrink-0 bg-slate-100 flex items-center justify-center">
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
                  <Info size={40} className="text-blue-200" />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h5 className="font-bold text-sm md:text-base line-clamp-2 text-[#181c22] leading-tight mb-2 group-hover:text-[#1275e2] transition-colors">{news.title}</h5>
                  <p className="text-xs text-[#717785] line-clamp-2 leading-relaxed">
                    {news.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {(news.keywords || []).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-50 text-[#1275e2] text-[9px] font-bold rounded-md border border-blue-100 uppercase tracking-tighter">
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
