/**
 * Language Data
 *
 * Mapping of countries to their official/primary languages.
 * Used for language inference when Accept-Language header is not available.
 */
/**
 * Country to official languages mapping (ISO 639-1 codes)
 * First language in array is the primary/most common
 */
export const COUNTRY_LANGUAGES = {
    // A
    AD: ['ca'], // Andorra - Catalan
    AE: ['ar', 'en'], // UAE - Arabic, English
    AF: ['ps', 'fa'], // Afghanistan - Pashto, Dari
    AG: ['en'], // Antigua and Barbuda
    AI: ['en'], // Anguilla
    AL: ['sq'], // Albania - Albanian
    AM: ['hy'], // Armenia - Armenian
    AO: ['pt'], // Angola - Portuguese
    AR: ['es'], // Argentina - Spanish
    AS: ['en', 'sm'], // American Samoa
    AT: ['de'], // Austria - German
    AU: ['en'], // Australia
    AW: ['nl', 'pap'], // Aruba - Dutch, Papiamento
    AZ: ['az'], // Azerbaijan - Azerbaijani
    // B
    BA: ['bs', 'hr', 'sr'], // Bosnia - Bosnian, Croatian, Serbian
    BB: ['en'], // Barbados
    BD: ['bn'], // Bangladesh - Bengali
    BE: ['nl', 'fr', 'de'], // Belgium - Dutch, French, German
    BF: ['fr'], // Burkina Faso - French
    BG: ['bg'], // Bulgaria - Bulgarian
    BH: ['ar'], // Bahrain - Arabic
    BI: ['fr', 'rn'], // Burundi - French, Kirundi
    BJ: ['fr'], // Benin - French
    BM: ['en'], // Bermuda
    BN: ['ms'], // Brunei - Malay
    BO: ['es', 'qu', 'ay'], // Bolivia - Spanish, Quechua, Aymara
    BR: ['pt'], // Brazil - Portuguese
    BS: ['en'], // Bahamas
    BT: ['dz'], // Bhutan - Dzongkha
    BW: ['en', 'tn'], // Botswana - English, Tswana
    BY: ['be', 'ru'], // Belarus - Belarusian, Russian
    BZ: ['en', 'es'], // Belize - English, Spanish
    // C
    CA: ['en', 'fr'], // Canada - English, French
    CD: ['fr'], // DR Congo - French
    CF: ['fr', 'sg'], // Central African Republic - French, Sango
    CG: ['fr'], // Congo - French
    CH: ['de', 'fr', 'it', 'rm'], // Switzerland - German, French, Italian, Romansh
    CI: ['fr'], // Cote d'Ivoire - French
    CL: ['es'], // Chile - Spanish
    CM: ['fr', 'en'], // Cameroon - French, English
    CN: ['zh'], // China - Chinese
    CO: ['es'], // Colombia - Spanish
    CR: ['es'], // Costa Rica - Spanish
    CU: ['es'], // Cuba - Spanish
    CV: ['pt'], // Cape Verde - Portuguese
    CW: ['nl', 'pap'], // Curacao - Dutch, Papiamento
    CY: ['el', 'tr'], // Cyprus - Greek, Turkish
    CZ: ['cs'], // Czech Republic - Czech
    // D
    DE: ['de'], // Germany - German
    DJ: ['fr', 'ar'], // Djibouti - French, Arabic
    DK: ['da'], // Denmark - Danish
    DM: ['en'], // Dominica
    DO: ['es'], // Dominican Republic - Spanish
    DZ: ['ar', 'fr'], // Algeria - Arabic, French
    // E
    EC: ['es'], // Ecuador - Spanish
    EE: ['et'], // Estonia - Estonian
    EG: ['ar'], // Egypt - Arabic
    ER: ['ti', 'ar', 'en'], // Eritrea - Tigrinya, Arabic, English
    ES: ['es', 'ca', 'gl', 'eu'], // Spain - Spanish, Catalan, Galician, Basque
    ET: ['am'], // Ethiopia - Amharic
    // F
    FI: ['fi', 'sv'], // Finland - Finnish, Swedish
    FJ: ['en', 'fj', 'hi'], // Fiji - English, Fijian, Hindi
    FK: ['en'], // Falkland Islands
    FM: ['en'], // Micronesia
    FO: ['fo', 'da'], // Faroe Islands - Faroese, Danish
    FR: ['fr'], // France - French
    // G
    GA: ['fr'], // Gabon - French
    GB: ['en'], // United Kingdom
    GD: ['en'], // Grenada
    GE: ['ka'], // Georgia - Georgian
    GF: ['fr'], // French Guiana - French
    GH: ['en'], // Ghana
    GI: ['en'], // Gibraltar
    GL: ['kl', 'da'], // Greenland - Greenlandic, Danish
    GM: ['en'], // Gambia
    GN: ['fr'], // Guinea - French
    GP: ['fr'], // Guadeloupe - French
    GQ: ['es', 'fr', 'pt'], // Equatorial Guinea
    GR: ['el'], // Greece - Greek
    GT: ['es'], // Guatemala - Spanish
    GU: ['en', 'ch'], // Guam - English, Chamorro
    GW: ['pt'], // Guinea-Bissau - Portuguese
    GY: ['en'], // Guyana
    // H
    HK: ['zh', 'en'], // Hong Kong - Chinese, English
    HN: ['es'], // Honduras - Spanish
    HR: ['hr'], // Croatia - Croatian
    HT: ['fr', 'ht'], // Haiti - French, Haitian Creole
    HU: ['hu'], // Hungary - Hungarian
    // I
    ID: ['id'], // Indonesia - Indonesian
    IE: ['en', 'ga'], // Ireland - English, Irish
    IL: ['he', 'ar'], // Israel - Hebrew, Arabic
    IM: ['en'], // Isle of Man
    IN: ['hi', 'en'], // India - Hindi, English
    IQ: ['ar', 'ku'], // Iraq - Arabic, Kurdish
    IR: ['fa'], // Iran - Persian/Farsi
    IS: ['is'], // Iceland - Icelandic
    IT: ['it'], // Italy - Italian
    // J
    JE: ['en'], // Jersey
    JM: ['en'], // Jamaica
    JO: ['ar'], // Jordan - Arabic
    JP: ['ja'], // Japan - Japanese
    // K
    KE: ['en', 'sw'], // Kenya - English, Swahili
    KG: ['ky', 'ru'], // Kyrgyzstan - Kyrgyz, Russian
    KH: ['km'], // Cambodia - Khmer
    KI: ['en'], // Kiribati
    KM: ['ar', 'fr'], // Comoros - Arabic, French
    KN: ['en'], // Saint Kitts and Nevis
    KP: ['ko'], // North Korea - Korean
    KR: ['ko'], // South Korea - Korean
    KW: ['ar'], // Kuwait - Arabic
    KY: ['en'], // Cayman Islands
    KZ: ['kk', 'ru'], // Kazakhstan - Kazakh, Russian
    // L
    LA: ['lo'], // Laos - Lao
    LB: ['ar', 'fr'], // Lebanon - Arabic, French
    LC: ['en'], // Saint Lucia
    LI: ['de'], // Liechtenstein - German
    LK: ['si', 'ta'], // Sri Lanka - Sinhala, Tamil
    LR: ['en'], // Liberia
    LS: ['en', 'st'], // Lesotho - English, Sesotho
    LT: ['lt'], // Lithuania - Lithuanian
    LU: ['lb', 'fr', 'de'], // Luxembourg - Luxembourgish, French, German
    LV: ['lv'], // Latvia - Latvian
    LY: ['ar'], // Libya - Arabic
    // M
    MA: ['ar', 'fr'], // Morocco - Arabic, French
    MC: ['fr'], // Monaco - French
    MD: ['ro'], // Moldova - Romanian
    ME: ['sr'], // Montenegro - Serbian
    MG: ['fr', 'mg'], // Madagascar - French, Malagasy
    MH: ['en', 'mh'], // Marshall Islands
    MK: ['mk'], // North Macedonia - Macedonian
    ML: ['fr'], // Mali - French
    MM: ['my'], // Myanmar - Burmese
    MN: ['mn'], // Mongolia - Mongolian
    MO: ['zh', 'pt'], // Macao - Chinese, Portuguese
    MP: ['en', 'ch'], // Northern Mariana Islands
    MQ: ['fr'], // Martinique - French
    MR: ['ar'], // Mauritania - Arabic
    MS: ['en'], // Montserrat
    MT: ['mt', 'en'], // Malta - Maltese, English
    MU: ['en', 'fr'], // Mauritius - English, French
    MV: ['dv'], // Maldives - Dhivehi
    MW: ['en', 'ny'], // Malawi - English, Chichewa
    MX: ['es'], // Mexico - Spanish
    MY: ['ms', 'en', 'zh'], // Malaysia - Malay, English, Chinese
    MZ: ['pt'], // Mozambique - Portuguese
    // N
    NA: ['en', 'af'], // Namibia - English, Afrikaans
    NC: ['fr'], // New Caledonia - French
    NE: ['fr'], // Niger - French
    NF: ['en'], // Norfolk Island
    NG: ['en'], // Nigeria
    NI: ['es'], // Nicaragua - Spanish
    NL: ['nl'], // Netherlands - Dutch
    NO: ['no', 'nb', 'nn'], // Norway - Norwegian (Bokmal, Nynorsk)
    NP: ['ne'], // Nepal - Nepali
    NR: ['en', 'na'], // Nauru
    NU: ['en'], // Niue
    NZ: ['en', 'mi'], // New Zealand - English, Maori
    // O
    OM: ['ar'], // Oman - Arabic
    // P
    PA: ['es'], // Panama - Spanish
    PE: ['es', 'qu'], // Peru - Spanish, Quechua
    PF: ['fr'], // French Polynesia - French
    PG: ['en', 'ho', 'tpi'], // Papua New Guinea
    PH: ['tl', 'en'], // Philippines - Filipino/Tagalog, English
    PK: ['ur', 'en'], // Pakistan - Urdu, English
    PL: ['pl'], // Poland - Polish
    PM: ['fr'], // Saint Pierre and Miquelon - French
    PR: ['es', 'en'], // Puerto Rico - Spanish, English
    PS: ['ar'], // Palestine - Arabic
    PT: ['pt'], // Portugal - Portuguese
    PW: ['en', 'pau'], // Palau
    PY: ['es', 'gn'], // Paraguay - Spanish, Guarani
    // Q
    QA: ['ar'], // Qatar - Arabic
    // R
    RE: ['fr'], // Reunion - French
    RO: ['ro'], // Romania - Romanian
    RS: ['sr'], // Serbia - Serbian
    RU: ['ru'], // Russia - Russian
    RW: ['rw', 'en', 'fr'], // Rwanda - Kinyarwanda, English, French
    // S
    SA: ['ar'], // Saudi Arabia - Arabic
    SB: ['en'], // Solomon Islands
    SC: ['fr', 'en'], // Seychelles - French, English
    SD: ['ar', 'en'], // Sudan - Arabic, English
    SE: ['sv'], // Sweden - Swedish
    SG: ['en', 'zh', 'ms', 'ta'], // Singapore - English, Chinese, Malay, Tamil
    SH: ['en'], // Saint Helena
    SI: ['sl'], // Slovenia - Slovenian
    SK: ['sk'], // Slovakia - Slovak
    SL: ['en'], // Sierra Leone
    SM: ['it'], // San Marino - Italian
    SN: ['fr'], // Senegal - French
    SO: ['so', 'ar'], // Somalia - Somali, Arabic
    SR: ['nl'], // Suriname - Dutch
    SS: ['en'], // South Sudan
    ST: ['pt'], // Sao Tome and Principe - Portuguese
    SV: ['es'], // El Salvador - Spanish
    SX: ['nl', 'en'], // Sint Maarten
    SY: ['ar'], // Syria - Arabic
    SZ: ['en', 'ss'], // Eswatini - English, Swazi
    // T
    TC: ['en'], // Turks and Caicos
    TD: ['fr', 'ar'], // Chad - French, Arabic
    TG: ['fr'], // Togo - French
    TH: ['th'], // Thailand - Thai
    TJ: ['tg', 'ru'], // Tajikistan - Tajik, Russian
    TK: ['en'], // Tokelau
    TL: ['pt', 'tet'], // Timor-Leste - Portuguese, Tetum
    TM: ['tk', 'ru'], // Turkmenistan - Turkmen, Russian
    TN: ['ar', 'fr'], // Tunisia - Arabic, French
    TO: ['en', 'to'], // Tonga
    TR: ['tr'], // Turkey - Turkish
    TT: ['en'], // Trinidad and Tobago
    TV: ['en', 'tvl'], // Tuvalu
    TW: ['zh'], // Taiwan - Chinese
    TZ: ['sw', 'en'], // Tanzania - Swahili, English
    // U
    UA: ['uk'], // Ukraine - Ukrainian
    UG: ['en', 'sw'], // Uganda - English, Swahili
    US: ['en', 'es'], // United States - English, Spanish
    UY: ['es'], // Uruguay - Spanish
    UZ: ['uz', 'ru'], // Uzbekistan - Uzbek, Russian
    // V
    VA: ['it', 'la'], // Vatican City - Italian, Latin
    VC: ['en'], // Saint Vincent and the Grenadines
    VE: ['es'], // Venezuela - Spanish
    VG: ['en'], // British Virgin Islands
    VI: ['en'], // U.S. Virgin Islands
    VN: ['vi'], // Vietnam - Vietnamese
    VU: ['en', 'fr', 'bi'], // Vanuatu - English, French, Bislama
    // W
    WF: ['fr'], // Wallis and Futuna - French
    WS: ['sm', 'en'], // Samoa - Samoan, English
    // X
    XK: ['sq', 'sr'], // Kosovo - Albanian, Serbian
    // Y
    YE: ['ar'], // Yemen - Arabic
    YT: ['fr'], // Mayotte - French
    // Z
    ZA: ['zu', 'xh', 'af', 'en'], // South Africa - Zulu, Xhosa, Afrikaans, English
    ZM: ['en'], // Zambia
    ZW: ['en', 'sn', 'nd'], // Zimbabwe - English, Shona, Ndebele
};
/**
 * Get the primary language for a country
 */
export function getPrimaryLanguage(country) {
    const langs = COUNTRY_LANGUAGES[country?.toUpperCase()];
    return langs?.[0] || 'en';
}
/**
 * Get all official languages for a country
 */
export function getCountryLanguages(country) {
    return COUNTRY_LANGUAGES[country?.toUpperCase()] || ['en'];
}
