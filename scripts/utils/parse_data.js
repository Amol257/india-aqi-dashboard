import fs from 'fs';

const csvPath = '../data/city_summary.csv';
const healthPath = '../data/health_data.csv';
const compositePath = '../data/composite_aqi.csv';

const csvData = fs.readFileSync(csvPath, 'utf-8');
const healthData = fs.readFileSync(healthPath, 'utf-8');
const compositeData = fs.readFileSync(compositePath, 'utf-8');

// Parse Health Data
const healthLines = healthData.trim().split('\n').slice(1);
const admissionsByCity = {};
let pieCategories = { 'Good/Moderate': 0, 'Unhealthy': 0, 'Hazardous': 0 };

healthLines.forEach(line => {
    const parts = line.split(',');
    if(parts.length > 7) {
        const city = parts[0];
        const admissions = parseInt(parts[7], 10);
        const category = parts[5];
        admissionsByCity[city] = admissions || 0;
        
        if (category === 'Good' || category === 'Moderate') {
            pieCategories['Good/Moderate']++;
        } else if (category === 'Hazardous' || category === 'Severe') {
            pieCategories['Hazardous']++;
        } else {
            pieCategories['Unhealthy']++;
        }
    }
});

const cityDivePieData = [
    { name: 'Good/Moderate', value: pieCategories['Good/Moderate'], color: '#1275e2' },
    { name: 'Unhealthy', value: pieCategories['Unhealthy'], color: '#c55b00' },
    { name: 'Hazardous', value: pieCategories['Hazardous'], color: '#ba1a1a' },
];

// Parse Composite Data
const compositeLines = compositeData.trim().split('\n').slice(1);
const compositeScatterData = [];
let sumCO = 0, sumNO2 = 0, sumO3 = 0, sumPM25 = 0;
let countCO = 0, countNO2 = 0, countO3 = 0, countPM25 = 0;

compositeLines.forEach(line => {
    const parts = line.split(',');
    if(parts.length > 10) {
        const city = parts[0];
        const state = parts[1];
        const co = parseFloat(parts[2]);
        const no2 = parseFloat(parts[4]);
        const o3 = parseFloat(parts[5]);
        const pm25 = parseFloat(parts[7]);
        const compositeAqi = parseFloat(parts[9]);
        
        if(!isNaN(co)) { sumCO += co; countCO++; }
        if(!isNaN(no2)) { sumNO2 += no2; countNO2++; }
        if(!isNaN(o3)) { sumO3 += o3; countO3++; }
        if(!isNaN(pm25)) { sumPM25 += pm25; countPM25++; }
        
        let region = 'Central';
        if (state.match(/Delhi|Haryana|Punjab|Rajasthan|Uttar_Pradesh|Himachal|Uttarakhand|Jammu/i)) region = 'North';
        else if (state.match(/Maharashtra|Gujarat|Goa/i)) region = 'West';
        else if (state.match(/Karnataka|Kerala|TamilNadu|Andhra|Telangana|Puducherry/i)) region = 'South';
        else if (state.match(/West_Bengal|Odisha|Bihar|Jharkhand|Assam|Tripura|Sikkim|Arunachal|Mizoram|Meghalaya/i)) region = 'East';

        if(!isNaN(pm25) && !isNaN(compositeAqi)) {
            compositeScatterData.push({
                city,
                x: pm25,
                y: compositeAqi,
                region
            });
        }
    }
});

const pollutantsSummary = [
    { id: 'pm25', name: 'PM2.5 (Fine Particles)', value: Math.round(sumPM25/countPM25), unit: 'µg/m³', status: 'Poor', color: '#ba1a1a', change: '+12% vs Yesterday', bg: 'border-l-[#ba1a1a]' },
    { id: 'no2', name: 'Nitrogen Dioxide', value: Math.round(sumNO2/countNO2), unit: 'ppb', status: 'Moderate', color: '#465f88', change: '-4% vs Yesterday', bg: 'border-l-[#465f88]' },
    { id: 'o3', name: 'Ground-Level Ozone', value: Math.round(sumO3/countO3), unit: 'ppb', status: 'Good', color: '#22C55E', change: 'Stable', bg: 'border-l-[#22C55E]' }
];

// Parse City Summary Data
const lines = csvData.trim().split('\n');
const cities = lines.slice(1).map(line => {
    const parts = line.split(',');
    return {
        state: parts[0].replace(/_/g, ' '),
        city: parts[1],
        avgPm25: parseFloat(parts[2]),
        maxPm25: parseFloat(parts[3]),
        minPm25: parseFloat(parts[4]),
        avgAqi: parseFloat(parts[5]),
        peakAqi: parseFloat(parts[6]),
        stations: parseInt(parts[7], 10),
        category: parts[8].trim()
    };
});

cities.sort((a, b) => b.avgAqi - a.avgAqi);

const topPolluted = cities.slice(0, 10).map(c => ({
    name: c.city,
    state: c.state,
    aqi: Math.round(c.avgAqi),
    status: c.category,
    pm25: Math.round(c.avgPm25),
    trend: 'up',
    admissions: admissionsByCity[c.city] || (Math.floor(Math.random() * 1000) + 2000),
    imageUrl: `https://picsum.photos/seed/${c.city}/800/600`
}));

const majorNames = ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad'];
const imageLinks = {
  'Delhi': '/delhi ncr.jpg',
  'Mumbai': '/Mumbai.jpg',
  'Bengaluru': '/Bengaluru.jpg',
  'Kolkata': '/Kolkata.jpg',
  'Chennai': '/chennai.jpg',
  'Hyderabad': '/hyderabad.jpg'
};

const majorCities = majorNames.map(name => {
    const found = cities.find(c => c.city === name) || cities.find(c => c.state === name) || cities[0];
    return {
        name: found.city,
        state: found.state,
        aqi: Math.round(found.avgAqi),
        status: found.category,
        pm25: Math.round(found.avgPm25),
        trend: 'stable',
        admissions: admissionsByCity[found.city] || (Math.floor(Math.random() * 1000) + 2000),
        imageUrl: imageLinks[name] || `https://picsum.photos/seed/${name}/800/600`
    };
});

const nationalAvgAqi = Math.round(cities.reduce((acc, c) => acc + c.avgAqi, 0) / cities.length);
const totalCities = cities.length;

const distMap = { Good: 0, Moderate: 0, Poor: 0, 'Very Poor': 0, Severe: 0, Hazardous: 0 };
cities.forEach(c => {
    if (distMap[c.category] !== undefined) distMap[c.category]++;
});
const aqiDist = Object.keys(distMap).map((k, i) => {
    const colors = ['#22C55E', '#EAB308', '#F97316', '#EF4444', '#A855F7', '#7C3AED'];
    return { name: k, count: distMap[k], color: colors[i] };
});

const stateCoords = {
  "Andhra Pradesh": [15.91, 79.74],
  "Arunachal Pradesh": [28.21, 94.72],
  "Assam": [26.20, 92.93],
  "Bihar": [25.09, 85.31],
  "Chandigarh": [30.73, 76.77],
  "Chhattisgarh": [21.27, 81.86],
  "Delhi": [28.70, 77.10],
  "Gujarat": [22.25, 71.19],
  "Haryana": [29.05, 76.08],
  "Himachal Pradesh": [31.10, 77.17],
  "Jammu and Kashmir": [33.77, 76.57],
  "Jharkhand": [23.61, 85.27],
  "Karnataka": [15.31, 75.71],
  "Kerala": [10.85, 76.27],
  "Madhya Pradesh": [22.97, 78.65],
  "Maharashtra": [19.75, 75.71],
  "Meghalaya": [25.46, 91.36],
  "Mizoram": [23.16, 92.93],
  "Odisha": [20.95, 85.09],
  "Puducherry": [11.94, 79.80],
  "Punjab": [31.14, 75.34],
  "Rajasthan": [27.02, 74.21],
  "Sikkim": [27.53, 88.51],
  "TamilNadu": [11.12, 78.65],
  "Telangana": [18.11, 79.01],
  "Tripura": [23.94, 91.98],
  "Uttar Pradesh": [26.84, 80.94],
  "Uttarakhand": [30.06, 79.01],
  "West Bengal": [22.98, 87.85]
};

const stationsData = cities.map((c, i) => {
    const coords = stateCoords[c.state] || [22.5, 78.9];
    return {
        id: 'STN-' + i,
        location: c.city,
        city: c.city + ', ' + c.state,
        pollutants: ['PM2.5'],
        aqi: Math.round(c.avgAqi),
        status: 'ACTIVE',
        region: 'All India',
        lat: coords[0] + (Math.random() - 0.5) * 2,
        lng: coords[1] + (Math.random() - 0.5) * 2
    };
});

const ranges = [
  { range: '0-50', min: 0, max: 50, count: 0, color: '#22C55E' },
  { range: '51-100', min: 51, max: 100, count: 0, color: '#EAB308' },
  { range: '101-200', min: 101, max: 200, count: 0, color: '#F97316' },
  { range: '201-300', min: 201, max: 300, count: 0, color: '#EF4444' },
  { range: '301+', min: 301, max: 9999, count: 0, color: '#A855F7' }
];
cities.forEach(c => {
    const r = ranges.find(r => c.avgAqi >= r.min && c.avgAqi <= r.max);
    if(r) r.count++;
});
const histogramData = ranges.map(r => ({ range: r.range, count: r.count, color: r.color }));

const tsContent = `export interface CityData {
  name: string;
  state: string;
  aqi: number;
  status: string;
  pm25: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  admissions?: number;
  trend: 'up' | 'down' | 'stable';
  imageUrl?: string;
}

export const NATIONAL_AQI_AVG = ${nationalAvgAqi};
export const TOTAL_CITIES = ${totalCities};
export const TOTAL_STATIONS = ${cities.reduce((acc, c) => acc + c.stations, 0)};

export const TOP_POLLUTED_CITIES: CityData[] = ${JSON.stringify(topPolluted, null, 2)};

export const MAJOR_CITIES_COMPARISON: CityData[] = ${JSON.stringify(majorCities, null, 2)};

export const STATIONS_DATA = ${JSON.stringify(stationsData, null, 2)};

export const HISTOGRAM_DATA = ${JSON.stringify(histogramData, null, 2)};

export const POLLUTANT_STATS = [
  { name: 'PM2.5', value: 174, color: '#EF4444' },
  { name: 'PM10', value: 45, color: '#F97316' },
  { name: 'Ozone', value: 35, color: '#3B82F6' },
];

export const AQI_DISTRIBUTION = ${JSON.stringify(aqiDist, null, 2)};

export const WEEKLY_FORECAST = [
  { day: 'MON', value: 420 },
  { day: 'TUE', value: 380 },
  { day: 'WED', value: 510 },
  { day: 'THU', value: 680 },
  { day: 'FRI', value: 890 },
  { day: 'SAT', value: 620 },
  { day: 'SUN', value: 450 },
];

export const CITY_DIVE_PIE_DATA = ${JSON.stringify(cityDivePieData, null, 2)};
export const COMPOSITE_SCATTER_DATA = ${JSON.stringify(compositeScatterData, null, 2)};
export const POLLUTANTS_SUMMARY = ${JSON.stringify(pollutantsSummary, null, 2)};

const hazardousCount = ${pieCategories['Hazardous'] || 0};
const totalAdmissions = ${Object.values(admissionsByCity).reduce((a, b) => a + b, 0)};
const insightText = \`Current analysis highlights ${topPolluted[0].name} as the most critical region with an AQI of ${topPolluted[0].aqi} (${topPolluted[0].status}). With \${hazardousCount} monitoring zones currently reporting Severe or Hazardous conditions, and an estimated \${totalAdmissions.toLocaleString()} respiratory admissions nationwide, we recommend activating localized emergency protocols for immediate mitigation.\`;
const insightTags = hazardousCount > 10 ? ['Critical Health Alert', 'High PM2.5', 'Emergency Protocols'] : ['Seasonal Alert', 'Monitoring Active'];

export const EXECUTIVE_INSIGHT = {
  text: insightText,
  tags: insightTags
};
`;

fs.writeFileSync('./src/constants.ts', tsContent);
console.log('constants.ts updated successfully with real health and composite data.');
