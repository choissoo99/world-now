export type CountryInfo = {
  code: string;
  nameKo: string;
  nameEn: string;
  flag: string;
};

const countries: Array<CountryInfo & { minLat: number; maxLat: number; minLng: number; maxLng: number }> = [
  { code: "KR", nameKo: "대한민국", nameEn: "South Korea", flag: "🇰🇷", minLat: 33, maxLat: 39.5, minLng: 124, maxLng: 132 },
  { code: "JP", nameKo: "일본", nameEn: "Japan", flag: "🇯🇵", minLat: 24, maxLat: 46, minLng: 122, maxLng: 146 },
  { code: "PH", nameKo: "필리핀", nameEn: "Philippines", flag: "🇵🇭", minLat: 4, maxLat: 22, minLng: 116, maxLng: 127 },
  { code: "ID", nameKo: "인도네시아", nameEn: "Indonesia", flag: "🇮🇩", minLat: -11, maxLat: 6, minLng: 95, maxLng: 141 },
  { code: "NZ", nameKo: "뉴질랜드", nameEn: "New Zealand", flag: "🇳🇿", minLat: -48, maxLat: -33, minLng: 165, maxLng: 180 },
  { code: "AU", nameKo: "호주", nameEn: "Australia", flag: "🇦🇺", minLat: -44, maxLat: -10, minLng: 112, maxLng: 154 },
  { code: "TR", nameKo: "튀르키예", nameEn: "Turkey", flag: "🇹🇷", minLat: 35, maxLat: 43, minLng: 25, maxLng: 45 },
  { code: "CL", nameKo: "칠레", nameEn: "Chile", flag: "🇨🇱", minLat: -56, maxLat: -17, minLng: -76, maxLng: -66 },
  { code: "AR", nameKo: "아르헨티나", nameEn: "Argentina", flag: "🇦🇷", minLat: -56, maxLat: -21, minLng: -74, maxLng: -53 },
  { code: "MX", nameKo: "멕시코", nameEn: "Mexico", flag: "🇲🇽", minLat: 14, maxLat: 33, minLng: -118, maxLng: -86 },
  { code: "CA", nameKo: "캐나다", nameEn: "Canada", flag: "🇨🇦", minLat: 42, maxLat: 84, minLng: -141, maxLng: -52 },
  { code: "US", nameKo: "미국", nameEn: "United States", flag: "🇺🇸", minLat: 18, maxLat: 72, minLng: -170, maxLng: -60 },
  { code: "CN", nameKo: "중국", nameEn: "China", flag: "🇨🇳", minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 }
];

export function getCountryFromCoordinates(lat: number, lng: number): CountryInfo | null {
  const country = countries.find(
    (item) => lat >= item.minLat && lat <= item.maxLat && lng >= item.minLng && lng <= item.maxLng
  );
  if (!country) return null;
  const { code, nameKo, nameEn, flag } = country;
  return { code, nameKo, nameEn, flag };
}
