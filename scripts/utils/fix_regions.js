import fs from 'fs';

const path = './src/constants.ts';
let content = fs.readFileSync(path, 'utf8');

const northStates = ['Delhi', 'Haryana', 'Punjab', 'Uttar Pradesh', 'Chandigarh', 'Himachal Pradesh', 'Jammu', 'Kashmir', 'Uttarakhand'];
const southStates = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Puducherry'];
const westStates = ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa'];
const eastStates = ['Bihar', 'West Bengal', 'Odisha', 'Jharkhand', 'Assam', 'Meghalaya', 'Tripura', 'Mizoram', 'Manipur', 'Nagaland', 'Arunachal Pradesh', 'Sikkim'];
const centralStates = ['Madhya Pradesh', 'Chhattisgarh'];

function getRegion(city) {
  for (const s of northStates) if (city.includes(s)) return 'North India';
  for (const s of southStates) if (city.includes(s)) return 'South India';
  for (const s of westStates) if (city.includes(s)) return 'West India';
  for (const s of eastStates) if (city.includes(s)) return 'East India';
  for (const s of centralStates) if (city.includes(s)) return 'Central India';
  return 'All India'; // fallback
}

// STATIONS_DATA is an array of objects.
// We can parse the STATIONS_DATA part.
const prefixRegex = /(export const STATIONS_DATA = )(\[[\s\S]*?\])(;\n\n|;\n|;$)/;
const match = content.match(prefixRegex);

if (match) {
  try {
    let stations = JSON.parse(match[2]);
    stations = stations.map(s => {
      let region = getRegion(s.city || '');
      s.region = region;
      return s;
    });
    
    // Stringify with formatting
    const newStationsStr = JSON.stringify(stations, null, 2);
    content = content.replace(prefixRegex, `$1${newStationsStr}$3`);
    fs.writeFileSync(path, content, 'utf8');
    console.log('constants.ts updated successfully');
  } catch (e) {
    console.error('Error parsing JSON:', e);
  }
} else {
  console.log('Could not find STATIONS_DATA array in constants.ts');
}
