const fs = require('fs');
const path = require('path');

const aqiRawPath = 'c:\\Users\\Amol\\Desktop\\Antigravity\\data\\aqi_raw.csv';
const healthDataPath = 'c:\\Users\\Amol\\Desktop\\Antigravity\\data\\health_data.csv';
const outputPath = 'c:\\Users\\Amol\\Desktop\\Antigravity\\AQI project\\public\\data\\local_aqi.json';

function parseCSV(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    return lines.slice(1).map(line => {
        const row = [];
        let col = '';
        let quoted = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
                quoted = !quoted;
            } else if (c === ',' && !quoted) {
                row.push(col.trim());
                col = '';
            } else {
                col += c;
            }
        }
        row.push(col.trim());
        return row;
    });
}

console.log('Parsing CSV files...');
const aqiRaw = parseCSV(aqiRawPath);
const healthData = parseCSV(healthDataPath);

const cityMap = {};

console.log(`Processing ${healthData.length} cities from health data...`);
healthData.forEach(row => {
    if (row.length < 8) return;
    const cityName = row[0];
    cityMap[cityName] = {
        name: cityName,
        state: row[1],
        avgPm25: parseFloat(row[2]) || 0,
        avgAqi: parseFloat(row[3]) || 0,
        peakAqi: parseFloat(row[4]) || 0,
        category: row[5],
        stationsCount: parseInt(row[6]) || 0,
        respiratoryAdmissions: parseInt(row[7]) || 0,
        pollutants: {}
    };
});

console.log(`Processing ${aqiRaw.length} records from raw AQI data...`);
aqiRaw.forEach(row => {
    if (row.length < 11) return;
    // India,State,City,Station,LastUpdate,Lat,Lon,Pollutant,Min,Max,Avg
    const cityName = row[2].replace(/_/g, ' '); // Normalize name to space
    const pollutant = row[7];
    const avgValue = parseFloat(row[10]);
    const station = row[3];
    const lastUpdate = row[4];

    if (!cityMap[cityName]) {
        cityMap[cityName] = {
            name: cityName,
            state: row[1].replace(/_/g, ' '),
            pollutants: {}
        };
    }

    // We keep the first station's data for each pollutant as a representative
    if (!cityMap[cityName].pollutants[pollutant]) {
        cityMap[cityName].pollutants[pollutant] = {
            value: avgValue || 0,
            station: station,
            lastUpdate: lastUpdate
        };
    }
});

const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(cityMap, null, 2));
console.log(`Successfully generated ${outputPath}`);
console.log(`Total cities in JSON: ${Object.keys(cityMap).length}`);
