const fs = require('fs');
const content = fs.readFileSync('src/constants.ts', 'utf8');

const citiesWithImagesMatch = content.match(/const CITIES_WITH_IMAGES = \[(.*?)\];/s);
if (citiesWithImagesMatch) {
    const list = citiesWithImagesMatch[1].replace(/'/g, '').split(',').map(s => s.trim()).filter(s => s.length > 0);
    console.log(`Total cities with images in constants.ts: ${list.length}`);
    console.log(`Sample: ${list.slice(0, 5).join(', ')}`);
} else {
    console.log("CITIES_WITH_IMAGES not found!");
}

if (content.includes('imageUrl: CITIES_WITH_IMAGES.includes(cityName)')) {
    console.log("getAllCities is correctly using CITIES_WITH_IMAGES for imageUrl mapping.");
} else {
    console.log("getAllCities mapping is missing!");
}
