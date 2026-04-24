const COUNTRY_CONFIG = {
  BE: { label: 'Belgium',        windOptions: [23, 24, 25, 26] },
  NL: { label: 'Netherlands',    windOptions: [24, 25, 26, 27] },
  LU: { label: 'Luxembourg',     windOptions: [23, 24, 25] },
  DE: { label: 'Germany',        windOptions: [22, 23, 24, 25, 26, 27, 28] },
  AT: { label: 'Austria',        windOptions: [24, 25, 26, 27, 28, 30] },
  CH: { label: 'Switzerland',    windOptions: [23, 24, 25, 26, 27, 28] },
  FR: { label: 'France',         windOptions: [24, 25, 26, 27, 28] },
  GB: { label: 'United Kingdom', windOptions: [21, 23, 25, 27, 29, 31] },
  IE: { label: 'Ireland',        windOptions: [24, 26, 27, 28, 29] },
  ES: { label: 'Spain',          windOptions: [26, 27, 29] },
  PT: { label: 'Portugal',       windOptions: [27, 30, 35] },
  IT: { label: 'Italy',          windOptions: [25, 27, 28, 30, 31] },
  DK: { label: 'Denmark',        windOptions: [24, 27] },
  SE: { label: 'Sweden',         windOptions: [23, 24, 25, 26] },
  FI: { label: 'Finland',        windOptions: [21, 23, 25, 26] },
  NO: { label: 'Norway',         windOptions: [22, 24, 26, 28, 30] },
  PL: { label: 'Poland',         windOptions: [22, 24, 26] },
  CZ: { label: 'Czech Republic', windOptions: [22, 25, 27, 30] },
  SK: { label: 'Slovakia',       windOptions: [24, 26, 28, 30] },
  HU: { label: 'Hungary',        windOptions: [23, 25, 27] },
  SI: { label: 'Slovenia',       windOptions: [20, 25, 30] },
  RO: { label: 'Romania',        windOptions: [30, 35, 40, 45] },
}

const DEFAULT_CONFIG = {
  windOptions: [23, 24, 25, 26],
}

export default function useCountry(countryCode) {
  const config = COUNTRY_CONFIG[countryCode] ?? DEFAULT_CONFIG
  return {
    windOptions: config.windOptions,
  }
}

export { COUNTRY_CONFIG }