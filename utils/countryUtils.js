// utils/countryUtils.js
const countries = require('i18n-iso-countries');

// Register English locale (you can add others if needed)
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

function getCountryInfo(code) {
  // Handle both 2-letter and 3-letter codes
  const alpha2 = code.length === 2 ? code : countries.alpha3ToAlpha2(code);
  const alpha3 = code.length === 3 ? code : countries.alpha2ToAlpha3(code);
  
  return {
    code2: alpha2 || code, // Fallback to original if conversion fails
    code3: alpha3 || code, // Fallback to original if conversion fails
    name: countries.getName(code, 'en') || code // Fallback to code if name not found
  };
}

module.exports = {
  getCountryInfo
};