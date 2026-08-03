// ISO 3166-1 country reference data used across the app: to render the
// world-atlas topojson (keyed by numeric id) with alpha-3 codes (used in the
// DB), display names, and a coarse continent grouping for stats.

export type Continent =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania"
  | "Antarctica";

export interface CountryRef {
  numeric: string; // ISO 3166-1 numeric, matches world-atlas topojson `id`
  alpha3: string; // ISO 3166-1 alpha-3, used as the DB country code
  name: string;
  continent: Continent;
}

// Rows: numeric | alpha3 | name | continent
const RAW = `
004|AFG|Afghanistan|Asia
008|ALB|Albania|Europe
012|DZA|Algeria|Africa
024|AGO|Angola|Africa
032|ARG|Argentina|South America
051|ARM|Armenia|Asia
036|AUS|Australia|Oceania
040|AUT|Austria|Europe
031|AZE|Azerbaijan|Asia
044|BHS|Bahamas|North America
050|BGD|Bangladesh|Asia
112|BLR|Belarus|Europe
056|BEL|Belgium|Europe
084|BLZ|Belize|North America
204|BEN|Benin|Africa
064|BTN|Bhutan|Asia
068|BOL|Bolivia|South America
070|BIH|Bosnia and Herzegovina|Europe
072|BWA|Botswana|Africa
076|BRA|Brazil|South America
096|BRN|Brunei|Asia
100|BGR|Bulgaria|Europe
854|BFA|Burkina Faso|Africa
108|BDI|Burundi|Africa
116|KHM|Cambodia|Asia
120|CMR|Cameroon|Africa
124|CAN|Canada|North America
140|CAF|Central African Republic|Africa
148|TCD|Chad|Africa
152|CHL|Chile|South America
156|CHN|China|Asia
170|COL|Colombia|South America
178|COG|Congo|Africa
180|COD|Democratic Republic of the Congo|Africa
188|CRI|Costa Rica|North America
191|HRV|Croatia|Europe
192|CUB|Cuba|North America
196|CYP|Cyprus|Asia
203|CZE|Czechia|Europe
208|DNK|Denmark|Europe
262|DJI|Djibouti|Africa
214|DOM|Dominican Republic|North America
218|ECU|Ecuador|South America
818|EGY|Egypt|Africa
222|SLV|El Salvador|North America
226|GNQ|Equatorial Guinea|Africa
232|ERI|Eritrea|Africa
233|EST|Estonia|Europe
748|SWZ|Eswatini|Africa
231|ETH|Ethiopia|Africa
242|FJI|Fiji|Oceania
246|FIN|Finland|Europe
250|FRA|France|Europe
266|GAB|Gabon|Africa
270|GMB|Gambia|Africa
268|GEO|Georgia|Asia
276|DEU|Germany|Europe
288|GHA|Ghana|Africa
300|GRC|Greece|Europe
320|GTM|Guatemala|North America
324|GIN|Guinea|Africa
624|GNB|Guinea-Bissau|Africa
328|GUY|Guyana|South America
332|HTI|Haiti|North America
340|HND|Honduras|North America
348|HUN|Hungary|Europe
352|ISL|Iceland|Europe
356|IND|India|Asia
360|IDN|Indonesia|Asia
364|IRN|Iran|Asia
368|IRQ|Iraq|Asia
372|IRL|Ireland|Europe
376|ISR|Israel|Asia
380|ITA|Italy|Europe
384|CIV|Ivory Coast|Africa
388|JAM|Jamaica|North America
392|JPN|Japan|Asia
400|JOR|Jordan|Asia
398|KAZ|Kazakhstan|Asia
404|KEN|Kenya|Africa
408|PRK|North Korea|Asia
410|KOR|South Korea|Asia
414|KWT|Kuwait|Asia
417|KGZ|Kyrgyzstan|Asia
418|LAO|Laos|Asia
428|LVA|Latvia|Europe
422|LBN|Lebanon|Asia
426|LSO|Lesotho|Africa
430|LBR|Liberia|Africa
434|LBY|Libya|Africa
440|LTU|Lithuania|Europe
442|LUX|Luxembourg|Europe
450|MDG|Madagascar|Africa
454|MWI|Malawi|Africa
458|MYS|Malaysia|Asia
466|MLI|Mali|Africa
478|MRT|Mauritania|Africa
484|MEX|Mexico|North America
498|MDA|Moldova|Europe
496|MNG|Mongolia|Asia
499|MNE|Montenegro|Europe
504|MAR|Morocco|Africa
508|MOZ|Mozambique|Africa
104|MMR|Myanmar|Asia
516|NAM|Namibia|Africa
524|NPL|Nepal|Asia
528|NLD|Netherlands|Europe
554|NZL|New Zealand|Oceania
558|NIC|Nicaragua|North America
562|NER|Niger|Africa
566|NGA|Nigeria|Africa
807|MKD|North Macedonia|Europe
578|NOR|Norway|Europe
512|OMN|Oman|Asia
586|PAK|Pakistan|Asia
591|PAN|Panama|North America
598|PNG|Papua New Guinea|Oceania
600|PRY|Paraguay|South America
604|PER|Peru|South America
608|PHL|Philippines|Asia
616|POL|Poland|Europe
620|PRT|Portugal|Europe
630|PRI|Puerto Rico|North America
634|QAT|Qatar|Asia
642|ROU|Romania|Europe
643|RUS|Russia|Europe
646|RWA|Rwanda|Africa
682|SAU|Saudi Arabia|Asia
686|SEN|Senegal|Africa
688|SRB|Serbia|Europe
694|SLE|Sierra Leone|Africa
702|SGP|Singapore|Asia
703|SVK|Slovakia|Europe
705|SVN|Slovenia|Europe
090|SLB|Solomon Islands|Oceania
706|SOM|Somalia|Africa
710|ZAF|South Africa|Africa
728|SSD|South Sudan|Africa
724|ESP|Spain|Europe
144|LKA|Sri Lanka|Asia
729|SDN|Sudan|Africa
740|SUR|Suriname|South America
752|SWE|Sweden|Europe
756|CHE|Switzerland|Europe
760|SYR|Syria|Asia
158|TWN|Taiwan|Asia
762|TJK|Tajikistan|Asia
834|TZA|Tanzania|Africa
764|THA|Thailand|Asia
626|TLS|Timor-Leste|Asia
768|TGO|Togo|Africa
780|TTO|Trinidad and Tobago|North America
788|TUN|Tunisia|Africa
792|TUR|Turkey|Asia
795|TKM|Turkmenistan|Asia
800|UGA|Uganda|Africa
804|UKR|Ukraine|Europe
784|ARE|United Arab Emirates|Asia
826|GBR|United Kingdom|Europe
840|USA|United States of America|North America
858|URY|Uruguay|South America
860|UZB|Uzbekistan|Asia
548|VUT|Vanuatu|Oceania
862|VEN|Venezuela|South America
704|VNM|Vietnam|Asia
732|ESH|Western Sahara|Africa
887|YEM|Yemen|Asia
894|ZMB|Zambia|Africa
716|ZWE|Zimbabwe|Africa
010|ATA|Antarctica|Antarctica
`.trim();

export const COUNTRIES: CountryRef[] = RAW.split("\n").map((line) => {
  const [numeric, alpha3, name, continent] = line.split("|");
  return { numeric, alpha3, name, continent: continent as Continent };
});

export const COUNTRY_BY_ALPHA3 = new Map(
  COUNTRIES.map((c) => [c.alpha3, c])
);
export const COUNTRY_BY_NUMERIC = new Map(
  COUNTRIES.map((c) => [c.numeric, c])
);

export function countryName(alpha3: string): string {
  return COUNTRY_BY_ALPHA3.get(alpha3)?.name ?? alpha3;
}
