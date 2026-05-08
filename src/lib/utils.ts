import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves a high-quality image for any Indian city.
 * Prioritizes local database paths, fallbacks to deterministic Unsplash placeholders.
 */
export function getCityImage(cityName: string, currentUrl?: string, stateName?: string) {
  // If we already have a valid non-placeholder URL, use it
  if (currentUrl && currentUrl.trim() !== "" && !currentUrl.includes('placeholder')) {
    // Support GitHub Pages subdirectories by using the base URL
    if (currentUrl.includes('db/')) {
      const baseUrl = ((import.meta as any).env?.BASE_URL || '/').replace(/\/$/, '');
      const cleanPath = currentUrl.replace(/^(\.|\/)?\/?db\//, 'db/');
      return `${baseUrl}/${cleanPath}`;
    }
    return currentUrl;
  }
  
  const state = (stateName || '').toLowerCase();
  const city = cityName.toLowerCase();
  
  // Categorical imagery based on region/type
  let category = 'india-city';
  
  if (state.includes('himachal') || state.includes('uttarakhand') || state.includes('jammu') || state.includes('ladakh')) {
    category = 'himalayas-mountains';
  } else if (state.includes('kerala') || state.includes('goa') || state.includes('tamil nadu') || state.includes('andaman')) {
    category = 'india-coastal-beach';
  } else if (state.includes('rajasthan') || city.includes('jaipur') || city.includes('jodhpur')) {
    category = 'rajasthan-fort-architecture';
  } else if (state.includes('industrial') || city.includes('baddi') || city.includes('vapi') || city.includes('mandi')) {
    category = 'industrial-factory-smoke';
  } else if (city.includes('varanasi') || city.includes('rishikesh') || city.includes('haridwar')) {
    category = 'ganges-river-india';
  } else if (city.includes('noida') || city.includes('gurugram') || city.includes('bangalore') || city.includes('hyderabad')) {
    category = 'india-skyscraper-tech';
  }
  
  const placeholders = [
    "https://images.unsplash.com/photo-1587474260584-1f20d4296ca4", // Delhi
    "https://images.unsplash.com/photo-1566580967019-f1b004058a83", // Mumbai
    "https://images.unsplash.com/photo-1599939575322-792a12b2f409", // Bangalore
    "https://images.unsplash.com/photo-1558430489-3e39d796596e", // Kolkata
    "https://images.unsplash.com/photo-1582510003544-4d00b7f7405a", // Chennai
    "https://images.unsplash.com/photo-1626014303757-0402e3b2e549", // Hyderabad
    "https://images.unsplash.com/photo-1548013146-72479768bbaa", // Jaipur
    "https://images.unsplash.com/photo-1524492707947-2f85a6e5a315", // Agra
    "https://images.unsplash.com/photo-1590282424154-c45bd114c419", // Varanasi
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739", // Nature/Mountains
    "https://images.unsplash.com/photo-1570160897040-3a2b587b12c3", // Coastal
    "https://images.unsplash.com/photo-1564507592333-c60657451dd6"  // Generic India
  ];
  
  // Deterministic hash to keep the same image for the same city
  let hash = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash = cityName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % placeholders.length;
  
  return `${placeholders[index]}?auto=format&fit=crop&q=80&w=800&sig=${hash}`;
}
