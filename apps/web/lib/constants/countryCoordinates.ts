// Country coordinates for map visualization (capital cities)
export const countryCoordinates: Record<string, [number, number]> = {
  AF: [69.17, 34.53], // Kabul
  AL: [19.82, 41.33], // Tirana
  DZ: [3.04, 36.75], // Algiers
  AR: [-58.38, -34.60], // Buenos Aires
  AU: [149.13, -35.28], // Canberra
  AT: [16.37, 48.21], // Vienna
  BD: [90.41, 23.81], // Dhaka
  BE: [4.35, 50.85], // Brussels
  BR: [-47.93, -15.78], // Brasilia
  CA: [-75.70, 45.42], // Ottawa
  CL: [-70.65, -33.45], // Santiago
  CN: [116.41, 39.90], // Beijing
  CO: [-74.08, 4.71], // Bogota
  CR: [-84.09, 9.93], // San Jose
  HR: [15.98, 45.81], // Zagreb
  CU: [-82.37, 23.12], // Havana
  CZ: [14.42, 50.08], // Prague
  DK: [12.57, 55.68], // Copenhagen
  DO: [-69.90, 18.47], // Santo Domingo
  EC: [-78.47, -0.18], // Quito
  EG: [31.24, 30.04], // Cairo
  SV: [-89.19, 13.69], // San Salvador
  ET: [38.75, 9.02], // Addis Ababa
  FI: [24.94, 60.17], // Helsinki
  FR: [2.35, 48.86], // Paris
  DE: [13.41, 52.52], // Berlin
  GH: [-0.19, 5.56], // Accra
  GR: [23.73, 37.98], // Athens
  GT: [-90.51, 14.62], // Guatemala City
  HT: [-72.34, 18.54], // Port-au-Prince
  HN: [-87.21, 14.08], // Tegucigalpa
  HK: [114.17, 22.28], // Hong Kong
  HU: [19.04, 47.50], // Budapest
  IN: [77.21, 28.61], // New Delhi
  ID: [106.85, -6.21], // Jakarta
  IR: [51.42, 35.69], // Tehran
  IQ: [44.37, 33.31], // Baghdad
  IE: [-6.26, 53.35], // Dublin
  IL: [35.22, 31.77], // Jerusalem
  IT: [12.50, 41.90], // Rome
  JM: [-76.79, 18.00], // Kingston
  JP: [139.69, 35.69], // Tokyo
  JO: [35.93, 31.95], // Amman
  KE: [36.82, -1.29], // Nairobi
  KR: [126.98, 37.57], // Seoul
  KW: [47.98, 29.37], // Kuwait City
  LB: [35.51, 33.89], // Beirut
  MY: [101.69, 3.14], // Kuala Lumpur
  MX: [-99.13, 19.43], // Mexico City
  MA: [-6.85, 34.02], // Rabat
  NP: [85.32, 27.72], // Kathmandu
  NL: [4.90, 52.37], // Amsterdam
  NZ: [174.78, -41.29], // Wellington
  NG: [7.49, 9.06], // Abuja
  NO: [10.75, 59.91], // Oslo
  PK: [73.04, 33.69], // Islamabad
  PA: [-79.52, 8.98], // Panama City
  PE: [-77.03, -12.05], // Lima
  PH: [120.98, 14.60], // Manila
  PL: [21.01, 52.23], // Warsaw
  PT: [-9.14, 38.72], // Lisbon
  PR: [-66.11, 18.47], // San Juan
  QA: [51.53, 25.29], // Doha
  RO: [26.10, 44.43], // Bucharest
  RU: [37.62, 55.75], // Moscow
  SA: [46.72, 24.71], // Riyadh
  SN: [-17.44, 14.69], // Dakar
  SG: [103.85, 1.29], // Singapore
  ZA: [28.19, -25.75], // Pretoria
  ES: [-3.70, 40.42], // Madrid
  LK: [79.86, 6.93], // Colombo
  SD: [32.53, 15.59], // Khartoum
  SE: [18.07, 59.33], // Stockholm
  CH: [7.45, 46.95], // Bern
  SY: [36.29, 33.51], // Damascus
  TW: [121.52, 25.03], // Taipei
  TH: [100.50, 13.76], // Bangkok
  TT: [-61.52, 10.65], // Port of Spain
  TN: [10.18, 36.80], // Tunis
  TR: [32.86, 39.93], // Ankara
  UA: [30.52, 50.45], // Kyiv
  AE: [54.37, 24.45], // Abu Dhabi
  GB: [-0.13, 51.51], // London
  US: [-77.04, 38.91], // Washington DC
  UY: [-56.17, -34.90], // Montevideo
  VE: [-66.92, 10.48], // Caracas
  VN: [105.85, 21.03], // Hanoi
  YE: [44.21, 15.35], // Sanaa
  ZW: [31.05, -17.83], // Harare
};

export function getCountryCoordinates(countryName: string): [number, number] | null {
  // First try direct lookup by code
  if (countryCoordinates[countryName]) {
    return countryCoordinates[countryName];
  }

  // Try to find by name
  const nameToCode: Record<string, string> = {
    "Afghanistan": "AF",
    "Albania": "AL",
    "Algeria": "DZ",
    "Argentina": "AR",
    "Australia": "AU",
    "Austria": "AT",
    "Bangladesh": "BD",
    "Belgium": "BE",
    "Brazil": "BR",
    "Canada": "CA",
    "Chile": "CL",
    "China": "CN",
    "Colombia": "CO",
    "Costa Rica": "CR",
    "Croatia": "HR",
    "Cuba": "CU",
    "Czech Republic": "CZ",
    "Denmark": "DK",
    "Dominican Republic": "DO",
    "Ecuador": "EC",
    "Egypt": "EG",
    "El Salvador": "SV",
    "Ethiopia": "ET",
    "Finland": "FI",
    "France": "FR",
    "Germany": "DE",
    "Ghana": "GH",
    "Greece": "GR",
    "Guatemala": "GT",
    "Haiti": "HT",
    "Honduras": "HN",
    "Hong Kong": "HK",
    "Hungary": "HU",
    "India": "IN",
    "Indonesia": "ID",
    "Iran": "IR",
    "Iraq": "IQ",
    "Ireland": "IE",
    "Israel": "IL",
    "Italy": "IT",
    "Jamaica": "JM",
    "Japan": "JP",
    "Jordan": "JO",
    "Kenya": "KE",
    "South Korea": "KR",
    "Kuwait": "KW",
    "Lebanon": "LB",
    "Malaysia": "MY",
    "Mexico": "MX",
    "Morocco": "MA",
    "Nepal": "NP",
    "Netherlands": "NL",
    "New Zealand": "NZ",
    "Nigeria": "NG",
    "Norway": "NO",
    "Pakistan": "PK",
    "Panama": "PA",
    "Peru": "PE",
    "Philippines": "PH",
    "Poland": "PL",
    "Portugal": "PT",
    "Puerto Rico": "PR",
    "Qatar": "QA",
    "Romania": "RO",
    "Russia": "RU",
    "Saudi Arabia": "SA",
    "Senegal": "SN",
    "Singapore": "SG",
    "South Africa": "ZA",
    "Spain": "ES",
    "Sri Lanka": "LK",
    "Sudan": "SD",
    "Sweden": "SE",
    "Switzerland": "CH",
    "Syria": "SY",
    "Taiwan": "TW",
    "Thailand": "TH",
    "Trinidad and Tobago": "TT",
    "Tunisia": "TN",
    "Turkey": "TR",
    "Ukraine": "UA",
    "United Arab Emirates": "AE",
    "United Kingdom": "GB",
    "United States": "US",
    "Uruguay": "UY",
    "Venezuela": "VE",
    "Vietnam": "VN",
    "Yemen": "YE",
    "Zimbabwe": "ZW",
  };

  const code = nameToCode[countryName];
  if (code && countryCoordinates[code]) {
    return countryCoordinates[code];
  }

  return null;
}
