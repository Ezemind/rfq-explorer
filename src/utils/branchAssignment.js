// Branch Assignment Utility for Solar Agro Systems
// Enhanced to include neighboring African countries: Namibia, Botswana, Zimbabwe, Mozambique, Eswatini, and Lesotho
// Determines which branch (Cape Town, Midrand/Gauteng, or Bloemfontein) serves a customer

// Cape Town Branch Coverage Areas (includes Namibia)
const capeTownCoverage = {
  // South African Cities (Original)
  primaryCities: [
    'cape town', 'stellenbosch', 'paarl', 'george', 'knysna', 'mossel bay', 
    'hermanus', 'beaufort west', 'worcester', 'oudtshoorn', 'port elizabeth', 
    'east london', 'grahamstown', 'jeffreys bay', 'plettenberg bay'
  ],
  westernCapeCities: [
    'albertinia', 'barrydale', 'bredasdorp', 'caledon', 'ceres', 'clanwilliam', 
    'darling', 'de doorns', 'gansbaai', 'grabouw', 'ladismith', 'laingsburg', 
    'malmesbury', 'montagu', 'moorreesburg', 'napier', 'piketberg', 'prince albert', 
    'riversdale', 'robertson', 'saldanha', 'swellendam', 'tulbagh', 'vredenburg', 'wellington'
  ],
  coastalTowns: [
    'witsand', 'still bay', 'hartenbos', 'great brak river', 'little brak river', 
    'wilderness', 'keurboomstrand', 'natures valley', 'the crags', 'storms river', 
    'sedgefield', 'st francis bay'
  ],
  gardenRouteKaroo: [
    'arniston', 'baardskeerdersbos', 'bettys bay', 'birkenhead', 'botrivier', 
    'dennehof', 'de kelders', 'elgin', 'elim', 'fisherhaven', 'franskraalstrand', 
    'genadendal', 'greyton', 'hawston', 'hotagterklip', 'infanta', 'kleinbaai', 
    'kleinmond', 'klipdale', 'lagulhas', 'onrusrivier', 'papiesvlei', 'pearly beach', 
    'pringle bay', 'riviersonderend', 'rooi els', 'sandbaai', 'skipskop', 'stanford', 
    'struisbaai', 'suiderstrand', 'suurbraak', 'uilenkraalsmond', 'van dyksbaai', 
    'vermont', 'villiersdorp', 'wolvengat'
  ],
  northernCapeCities: [
    'aurora', 'bitterfontein', 'chatsworth', 'dwarskersbos', 'ebenhaeser', 
    'eendekuil', 'goedverwacht', 'jakkalsfontein', 'kalbaskraal', 'koekenaap', 
    'koringberg', 'lamberts bay', 'langebaanweg', 'redelinghuys', 'riebeek-kasteel', 
    'riebeek west', 'strandfontein', 'wupperthal', 'yzerfontein'
  ],
  wineRegions: [
    'ashton', 'bonnievale', 'de hollandsche molen', 'denneburg', 'franschhoek', 
    'gouda', 'kayamandi', 'klapmuts', 'kylemore', 'languedoc', 'mcgregor', 
    'op-die-berg', 'pniel', 'prince alfred hamlet', 'rawsonville', 'robertsvlei', 
    'rozendal', 'saron', 'wemmershoek', 'wolseley'
  ],
  easternCapeCities: [
    'uitenhage', 'despatch', 'kirkwood', 'addo', 'port alfred', 'alexandria', 
    'patensie', 'kareedouw', 'jansenville', 'steytlerville', 'willowmore', 
    'uniondale', 'heidelberg', 'muizenberg', 'noordhoek', 'somerset west', 
    'nieu-bethesda', 'hofmeyr', 'tarkastad', 'sterkstroom', 'graaff-reinet', 
    'cradock', 'somerset east', 'middelburg', 'aberdeen'
  ],
  additionalAreas: [
    'de rust', 'meiringspoort', 'leeu-gamka', 'murraysburg', 'merweville', 
    'fraserburg', 'loeriesfontein', 'calvinia', 'nieuwoudtville', 'vanrhynsdorp', 
    'klawer', 'vredendal', 'lutzville', 'doringbaai', 'elands bay', 'lambert\'s bay', 
    'citrusdal', 'graafwater', 'leipoldtville', 'porterville', 'velddrif', 
    'langebaan', 'st helena bay', 'hopefield', 'paternoster', 'jacobsbaai', 
    'stompneusbaai', 'kliprand', 'williston', 'carnarvon', 'victoria west', 
    'calitzdorp', 'zoar', 'amalienstein', 'hogsback'
  ],
  
  // NAMIBIA - Assigned to Cape Town Branch
  namibiaCities: [
    // Major Cities
    'windhoek', 'walvis bay', 'swakopmund', 'oshakati', 'rundu', 'katima mulilo',
    'ondangwa', 'ongwediva', 'okahandja', 'otjiwarongo', 'gobabis', 'keetmanshoop',
    
    // Northern Cities
    'tsumeb', 'grootfontein', 'outapi', 'opuwo', 'ruacana', 'eenhana', 'engela',
    'ohangwena', 'okahao', 'oshikango', 'omuthiya', 'oshikuku', 'onesi',
    
    // Central & Eastern Cities  
    'karibib', 'usakos', 'otavi', 'outjo', 'kamanjab', 'khorixas', 'uis',
    'henties bay', 'arandis', 'karasburg', 'mariental', 'rehoboth', 'aranos',
    
    // Southern Cities
    'luderitz', 'aus', 'bethanie', 'helmeringhausen', 'maltahohe', 'gibeon',
    'stampriet', 'gochas', 'hoachanas', 'witvlei', 'leonardville', 'epukiro',
    
    // Coastal & Western Cities
    'henties bay', 'cape cross', 'torra bay', 'terrace bay', 'rocky point',
    'sandwich harbour', 'conception bay', 'spencer bay', 'chamais bay',
    
    // Alternative spellings and variations
    'windhoek central', 'katutura', 'klein windhoek', 'pioneerspark', 'dorado park',
    'academia', 'hochland park', 'ludwigsdorf', 'auasblick'
  ]
};

// Midrand/Gauteng Branch Coverage Areas (includes Botswana, Zimbabwe, Mozambique, Eswatini)  
const midrandCoverage = {
  // South African Cities (Original)
  majorMetroAreas: [
    'johannesburg', 'pretoria', 'soweto', 'sandton', 'centurion', 'midrand', 
    'boksburg', 'benoni', 'krugersdorp', 'vanderbijlpark', 'roodepoort'
  ],
  gautengCities: [
    'bronkhorstspruit', 'cullinan', 'heidelberg', 'magaliesburg', 'meyerton', 
    'nigel', 'randfontein', 'westonaria', 'alberton', 'bedfordview', 'brakpan', 
    'bapsfontein', 'clayville', 'daveyton', 'duduza', 'edenvale', 'holfontein', 
    'etwatwa', 'germiston', 'isando', 'katlehong', 'kempton park', 'kwathema', 
    'dunnottar', 'reiger park', 'springs'
  ],
  pretoriaRegion: [
    'tembisa', 'thembisa', 'tokoza', 'thokoza', 'tsakane', 'vosloorus', 'wattville', 
    'atteridgeville', 'bronberg', 'centurion', 'verwoerdburg', 'ekangala', 
    'ga-rankuwa', 'hammanskraal', 'irene', 'mabopane', 'mamelodi', 'rayton', 
    'refilwe', 'soshanguve', 'winterveld', 'zithobeni', 'akasia', 'lenasia', 
    'muldersdrift', 'orchards'
  ],
  northWestProvince: [
    'brits', 'christiana', 'coligny', 'delareyville', 'hartbeespoort', 'klerksdorp', 
    'lichtenburg', 'mahikeng', 'mmabatho', 'orkney', 'potchefstroom', 'rustenburg', 
    'schweizer-reneke', 'stilfontein', 'ventersdorp', 'vryburg', 'zeerust'
  ],
  limpopoProvince: [
    'polokwane', 'thohoyandou', 'tzaneen', 'lebowakgomo', 'mokopane', 'modimolle', 
    'musina', 'phalaborwa', 'alldays', 'bela-bela', 'dendron', 'elim', 'giyani', 
    'hoedspruit', 'louis trichardt', 'marble hall', 'mookgophong', 'northam', 
    'roedtan', 'vaalwater'
  ],
  mpumalangaProvince: [
    'mbombela', 'witbank', 'middelburg', 'secunda', 'lydenburg', 'ermelo', 
    'barberton', 'hazyview', 'bethal', 'carolina', 'delmas', 'komatipoort', 
    'malelane', 'sabie', 'white river'
  ],
  
  // BOTSWANA - Assigned to Midrand Branch
  botswanaCities: [
    // Major Cities
    'gaborone', 'francistown', 'maun', 'molepolole', 'serowe', 'kanye', 'mochudi',
    'mahalapye', 'lobatse', 'palapye', 'ramotswa', 'thamaga', 'tlokweng',
    
    // District Capitals & Major Towns
    'kasane', 'shakawe', 'ghanzi', 'gantsi', 'tsabong', 'werda', 'hukuntsi',
    'kang', 'tshane', 'lehututu', 'sekoma', 'rakops', 'letlhakane', 'orapa',
    
    // Northern Region
    'nata', 'gweta', 'masunga', 'bobonong', 'tuli', 'mapoka', 'tonota',
    'selebi-phikwe', 'phikwe', 'sua pan', 'tutume', 'dukwi',
    
    // Central & Western Region  
    'shoshong', 'borolong', 'artesia', 'machaneng', 'lentsweletau', 'mmankgodi',
    'kopong', 'goodhope', 'mmopane', 'mogoditshane', 'glen valley', 'phakalane',
    
    // Alternative spellings
    'gabs', 'gantzi', 'ghantsi', 'ghanzie', 'jwaneng mine', 'sua salt works'
  ],
  
  // ZIMBABWE - Assigned to Midrand Branch  
  zimbabweCities: [
    // Major Cities
    'harare', 'bulawayo', 'chitungwiza', 'mutare', 'gweru', 'kwekwe', 'kadoma',
    'masvingo', 'chinhoyi', 'norton', 'redcliff', 'karoi', 'bindura', 'chegutu',
    
    // Provincial Capitals & Major Towns
    'marondera', 'rusape', 'chipinge', 'chiredzi', 'triangle', 'beitbridge',
    'victoria falls', 'hwange', 'lupane', 'gokwe', 'shurugwi', 'zvishavane',
    
    // Harare Metropolitan
    'epworth', 'ruwa', 'norton', 'chitungwiza', 'mbare', 'highfield', 'budiriro',
    'glen view', 'warren park', 'tafara', 'hatcliffe', 'dzivarasekwa',
    
    // Matabeleland Region
    'plumtree', 'gwanda', 'filabusi', 'esigodini', 'kezi', 'mangwe', 'marula',
    'tsholotsho', 'nyamandlovu', 'inyathi', 'bubi', 'umguza',
    
    // Manicaland Province
    'nyanga', 'juliasdale', 'troutbeck', 'honde valley', 'cashel', 'chimanimani',
    'hot springs', 'penhalonga', 'odzi', 'domboshava',
    
    // Midlands Province  
    'mvuma', 'lalapanzi', 'que que', 'shabani', 'buchwa', 'iron duke',
    'empress', 'gwelo', 'selous', 'mberengwa',
    
    // Alternative names & historical names
    'salisbury', 'fort victoria', 'umtali', 'que que', 'gwelo', 'fort victoria',
    'rhodesia', 'southern rhodesia'
  ],
  
  // MOZAMBIQUE - Assigned to Midrand Branch
  mozambiqueCities: [
    // Major Cities  
    'maputo', 'matola', 'beira', 'nampula', 'chimoio', 'nacala', 'quelimane',
    'tete', 'xai-xai', 'inhambane', 'pemba', 'lichinga', 'cuamba', 'gurué',
    
    // Maputo Province
    'marracuene', 'manhiça', 'magude', 'moamba', 'namaacha', 'boane', 'matutuine',
    'ponta do ouro', 'ressano garcia', 'goba', 'komatipoort border',
    
    // Gaza Province
    'chibuto', 'mandlakaze', 'chókwè', 'guijá', 'massangena', 'chicualacuala',
    'massingir', 'bilene', 'praia do bilene',
    
    // Inhambane Province  
    'maxixe', 'vilanculos', 'massinga', 'morrumbene', 'zavala', 'inharrime',
    'jangamo', 'homoine', 'tofo', 'barra', 'pomene',
    
    // Sofala Province
    'dondo', 'nhamatanda', 'gorongosa', 'muanza', 'marromeu', 'caia', 'chemba',
    'machanga', 'buzi', 'nova mambone',
    
    // Manica Province
    'gondola', 'sussundenga', 'macossa', 'tambara', 'guro', 'machaze',
    'espungabera', 'penha longa',
    
    // Tete Province
    'moatize', 'angonia', 'tsangano', 'macanga', 'cahora bassa', 'zumbo',
    'mutarara', 'chiuta', 'maravia',
    
    // Zambézia Province  
    'mocuba', 'lugela', 'alto molócuè', 'namacurra', 'nicoadala', 'maganja da costa',
    'pebane', 'morrumbala', 'chinde', 'inhassunge',
    
    // Nampula Province
    'nacala-porto', 'ilha de moçambique', 'angoche', 'monapo', 'nacaroa',
    'meconta', 'murrupula', 'ribáuè', 'lalaua', 'malema',
    
    // Cabo Delgado Province  
    'montepuez', 'ancuabe', 'chiúre', 'mueda', 'mocímboa da praia', 'palma',
    'muidumbe', 'quissanga', 'ibo', 'macomia',
    
    // Niassa Province
    'mandimba', 'ngauma', 'sanga', 'lago', 'metangula', 'cobue', 'mavago',
    'muembe', 'majune', 'chimbunila',
    
    // Historical names
    'lourenço marques', 'portuguese east africa', 'beira corridor'
  ],
  
  // ESWATINI (SWAZILAND) - Assigned to Midrand Branch
  eswatiniCities: [
    // Major Cities
    'mbabane', 'manzini', 'lobamba', 'siteki', 'nhlangano', 'piggs peak',
    'big bend', 'hluti', 'mankayane', 'nsoko', 'simunye',
    
    // Regional Centers
    'matsapha', 'ezulwini', 'lobamba', 'mahamba', 'nkoyoyo', 'bulembu',
    'maguga', 'sidvokodvo', 'mahlangatsha', 'timphisini',
    
    // Industrial Areas
    'matsapha industrial', 'malkerns', 'bhunya', 'usutu', 'ngwenya',
    'oshoek border', 'mahamba border', 'lavumisa border', 'lomahasha border',
    
    // Districts & Areas
    'hhohho', 'manzini region', 'lubombo', 'shiselweni', 'motshane',
    'hlatikulu', 'kubuta', 'sicunusa', 'mahlangatsha', 'buhleni',
    
    // Alternative names
    'swaziland', 'kingdom of eswatini', 'ngwane'
  ]
};

// Bloemfontein Branch Coverage Areas (includes Lesotho)
const bloemfonteinCoverage = {
  // South African Cities (Original)
  freeStateMajorCities: [
    'bloemfontein', 'welkom', 'bethlehem', 'kroonstad', 'sasolburg', 'virginia', 
    'harrismith', 'parys'
  ],
  freeStateTowns: [
    'boshof', 'brandfort', 'clocolan', 'dewetsdorp', 'edenville', 'excelsior', 
    'fauresmith', 'frankfort', 'ficksburg', 'heilbron', 'hoopstad', 'koffiefontein', 
    'ladybrand', 'lindley', 'marquard', 'petrus steyn', 'reitz', 'reddersburg', 
    'rouxville', 'senekal', 'smithfield', 'theunissen', 'trompsburg', 'ventersburg', 
    'vrede', 'warden', 'winburg'
  ],
  mountainAreas: [
    'clarens', 'fouriesburg', 'paul roux', 'rosendal', 'ladybrandt', 'hobhouse', 
    'thaba phatchoa', 'tweespruit', 'arlington', 'memel', 'setsoto'
  ],
  northernCapeCities: [
    'kimberley', 'upington', 'springbok', 'kuruman', 'de aar', 'douglas', 
    'colesberg', 'kathu', 'alexander bay', 'carnarvon', 'fraserburg', 'hartswater', 
    'hopetown', 'kakamas', 'kenhardt', 'loeriesfontein', 'pofadder', 'postmasburg', 
    'prieska', 'richmond', 'sutherland', 'vanrhynsdorp', 'williston'
  ],
  easternCapeTowns: [
    'queenstown', 'aliwal north', 'burgersdorp', 'dordrecht', 'elliot', 
    'fort beaufort', 'maclear', 'molteno', 'mount fletcher', 'sterkstroom', 
    'steynsburg', 'stutterheim'
  ],
  
  // LESOTHO - Assigned to Bloemfontein Branch
  lesothoCities: [
    // Major Cities & District Capitals
    'maseru', 'teyateyaneng', 'mafeteng', 'hlotse', 'leribe', 'mohales hoek',
    'quthing', 'butha-buthe', 'thaba-tseka', 'mokhotlong', 'qachas nek',
    
    // Major Towns
    'roma', 'morija', 'maputsoe', 'mapoteng', 'semonkong', 'mantsonyane',
    'marakabei', 'nazareth', 'peka', 'teya-teyaneng', 'ty',
    
    // Border Towns
    'maputsoe border', 'maseru bridge', 'ficksburg border', 'caledon river',
    'mohokare', 'van rooyen gate', 'qacha', 'ramatseliso gate',
    
    // Mountain Areas
    'katse', 'mohale', 'letseng', 'sani pass', 'liphofung', 'ha lejone',
    'thaba bosiu', 'maliba', 'bokong', 'sehlabathebe',
    
    // Districts & Regions  
    'maseru district', 'berea district', 'leribe district', 'mafeteng district',
    'mohales hoek district', 'quthing district', 'qachas nek district',
    'butha-buthe district', 'thaba-tseka district', 'mokhotlong district',
    
    // Alternative spellings & names
    'basutoland', 'kingdom of lesotho', 'mountain kingdom', 'ty town',
    'hlotse town', 'leribe town', 'quthing town'
  ]
};

/**
 * Normalize city/address text for comparison
 * @param {string} text - City or address text
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\b(cape town|ct)\b/g, 'cape town') // Normalize CT abbreviation
    .replace(/\b(johannesburg|jhb|joburg|jozi)\b/g, 'johannesburg') // Normalize JHB abbreviations
    .replace(/\b(pretoria|pta)\b/g, 'pretoria') // Normalize PTA abbreviation
    .replace(/\b(port elizabeth|pe|gqeberha)\b/g, 'port elizabeth') // Normalize PE abbreviation
    .replace(/\b(east london|el)\b/g, 'east london') // Normalize EL abbreviation
    .replace(/\b(bloemfontein|bloem)\b/g, 'bloemfontein') // Normalize Bloem abbreviation
    .replace(/\b(eswatini|swaziland)\b/g, 'eswatini') // Normalize Eswatini/Swaziland
    .replace(/\b(bela bela|bela-bela|warmbaths)\b/g, 'bela-bela') // Normalize variations
    .replace(/\b(centurion|verwoerdburg)\b/g, 'centurion') // Historical name changes
    .replace(/\b(tembisa|thembisa)\b/g, 'tembisa') // Common variations
    .replace(/\b(nelspruit|mbombela)\b/g, 'mbombela') // Name changes
    .replace(/\b(pietersburg|polokwane)\b/g, 'polokwane') // Name changes
    .replace(/\b(louis trichardt|makhado)\b/g, 'louis trichardt') // Alternative names
    .replace(/\b(tzaneen|tsaneng)\b/g, 'tzaneen') // Variations
    .replace(/\b(phalaborwa|palabora)\b/g, 'phalaborwa'); // Variations
}

/**
 * Check if a normalized city/address matches any areas in a coverage list
 * @param {string} normalizedText - Normalized city/address text
 * @param {Object} coverage - Coverage areas object
 * @returns {Object|null} - Match info or null
 */
function matchesCoverage(normalizedText, coverage) {
  // Check all coverage areas
  for (const [areaType, areas] of Object.entries(coverage)) {
    for (const area of areas) {
      const normalizedArea = normalizeText(area);
      
      // Exact match
      if (normalizedText === normalizedArea) {
        return { area, areaType, matchType: 'exact' };
      }
      
      // Partial match (city contained in address)
      if (normalizedText.includes(normalizedArea) && normalizedArea.length > 3) {
        return { area, areaType, matchType: 'partial' };
      }
      
      // Reverse partial match (area contains the search text)
      if (normalizedArea.includes(normalizedText) && normalizedText.length > 3) {
        return { area, areaType, matchType: 'contains' };
      }
    }
  }
  
  return null;
}

/**
 * Determine branch assignment based on customer address/city
 * @param {string} address - Customer address or city
 * @returns {Object} - Branch assignment info
 */
export function assignBranch(address) {
  if (!address || typeof address !== 'string') {
    return {
      branch: 'Unknown',
      branchCode: 'UNK',
      confidence: 'low',
      matchedArea: null,
      color: 'gray',
      country: null
    };
  }
  
  const normalized = normalizeText(address);
  
  // Check Cape Town coverage (includes Namibia)
  const capeTownMatch = matchesCoverage(normalized, capeTownCoverage);
  if (capeTownMatch) {
    const isNamibia = capeTownMatch.areaType === 'namibiaCities';
    return {
      branch: 'Cape Town',
      branchCode: 'CPT',
      confidence: capeTownMatch.matchType === 'exact' ? 'high' : 'medium',
      matchedArea: capeTownMatch.area,
      color: 'blue',
      description: isNamibia 
        ? 'Namibia (serviced by Cape Town branch)'
        : 'Western Cape, Eastern Cape coastal areas, Garden Route',
      country: isNamibia ? 'Namibia' : 'South Africa'
    };
  }
  
  // Check Midrand/Gauteng coverage (includes Botswana, Zimbabwe, Mozambique, Eswatini)
  const midrandMatch = matchesCoverage(normalized, midrandCoverage);
  if (midrandMatch) {
    let country = 'South Africa';
    let description = 'Gauteng, North West, Limpopo, Mpumalanga';
    
    if (midrandMatch.areaType === 'botswanaCities') {
      country = 'Botswana';
      description = 'Botswana (serviced by Midrand branch)';
    } else if (midrandMatch.areaType === 'zimbabweCities') {
      country = 'Zimbabwe';
      description = 'Zimbabwe (serviced by Midrand branch)';
    } else if (midrandMatch.areaType === 'mozambiqueCities') {
      country = 'Mozambique';
      description = 'Mozambique (serviced by Midrand branch)';
    } else if (midrandMatch.areaType === 'eswatiniCities') {
      country = 'Eswatini';
      description = 'Eswatini (serviced by Midrand branch)';
    }
    
    return {
      branch: 'Midrand (Gauteng)',
      branchCode: 'GTG',
      confidence: midrandMatch.matchType === 'exact' ? 'high' : 'medium',
      matchedArea: midrandMatch.area,
      color: 'green',
      description: description,
      country: country
    };
  }
  
  // Check Bloemfontein coverage (includes Lesotho)
  const bloemfonteinMatch = matchesCoverage(normalized, bloemfonteinCoverage);
  if (bloemfonteinMatch) {
    const isLesotho = bloemfonteinMatch.areaType === 'lesothoCities';
    return {
      branch: 'Bloemfontein',
      branchCode: 'BFN',
      confidence: bloemfonteinMatch.matchType === 'exact' ? 'high' : 'medium',
      matchedArea: bloemfonteinMatch.area,
      color: 'orange',
      description: isLesotho 
        ? 'Lesotho (serviced by Bloemfontein branch)'
        : 'Free State, Northern Cape, Eastern Cape inland',
      country: isLesotho ? 'Lesotho' : 'South Africa'
    };
  }
  
  // No match found - try to make educated guess based on country/province keywords
  const countryGuess = guessFromCountryKeywords(normalized);
  if (countryGuess) {
    return {
      ...countryGuess,
      confidence: 'medium'
    };
  }
  
  // Default assignment for any other African countries or unmatched locations
  return {
    branch: 'Cape Town',
    branchCode: 'CPT',
    confidence: 'low',
    matchedArea: 'Default assignment',
    color: 'blue',
    description: 'Default assignment for unmatched locations (All Others → Cape Town)',
    country: 'Other'
  };
}

/**
 * Make educated guess based on country/province keywords
 * @param {string} normalizedText - Normalized input text
 * @returns {Object|null} - Branch guess or null
 */
function guessFromCountryKeywords(normalizedText) {
  // Namibia indicators → Cape Town
  if (normalizedText.includes('namibia') || 
      normalizedText.includes('windhoek') ||
      normalizedText.includes('walvis bay') ||
      normalizedText.includes('swakopmund')) {
    return {
      branch: 'Cape Town',
      branchCode: 'CPT',
      matchedArea: 'Namibia (estimated)',
      color: 'blue',
      description: 'Namibia (serviced by Cape Town branch)',
      country: 'Namibia'
    };
  }
  
  // Botswana indicators → Midrand
  if (normalizedText.includes('botswana') ||
      normalizedText.includes('gaborone') ||
      normalizedText.includes('francistown') ||
      normalizedText.includes('maun')) {
    return {
      branch: 'Midrand (Gauteng)',
      branchCode: 'GTG', 
      matchedArea: 'Botswana (estimated)',
      color: 'green',
      description: 'Botswana (serviced by Midrand branch)',
      country: 'Botswana'
    };
  }
  
  // Zimbabwe indicators → Midrand
  if (normalizedText.includes('zimbabwe') ||
      normalizedText.includes('harare') ||
      normalizedText.includes('bulawayo') ||
      normalizedText.includes('mutare')) {
    return {
      branch: 'Midrand (Gauteng)',
      branchCode: 'GTG',
      matchedArea: 'Zimbabwe (estimated)',
      color: 'green', 
      description: 'Zimbabwe (serviced by Midrand branch)',
      country: 'Zimbabwe'
    };
  }
  
  // Mozambique indicators → Midrand
  if (normalizedText.includes('mozambique') ||
      normalizedText.includes('maputo') ||
      normalizedText.includes('beira') ||
      normalizedText.includes('nampula')) {
    return {
      branch: 'Midrand (Gauteng)',
      branchCode: 'GTG',
      matchedArea: 'Mozambique (estimated)', 
      color: 'green',
      description: 'Mozambique (serviced by Midrand branch)',
      country: 'Mozambique'
    };
  }
  
  // Eswatini indicators → Midrand
  if (normalizedText.includes('eswatini') ||
      normalizedText.includes('swaziland') ||
      normalizedText.includes('mbabane') ||
      normalizedText.includes('manzini')) {
    return {
      branch: 'Midrand (Gauteng)',
      branchCode: 'GTG',
      matchedArea: 'Eswatini (estimated)',
      color: 'green',
      description: 'Eswatini (serviced by Midrand branch)',
      country: 'Eswatini'
    };
  }
  
  // Lesotho indicators → Bloemfontein
  if (normalizedText.includes('lesotho') ||
      normalizedText.includes('maseru') ||
      normalizedText.includes('basutoland') ||
      normalizedText.includes('mountain kingdom')) {
    return {
      branch: 'Bloemfontein',
      branchCode: 'BFN',
      matchedArea: 'Lesotho (estimated)',
      color: 'orange',
      description: 'Lesotho (serviced by Bloemfontein branch)',
      country: 'Lesotho'
    };
  }
  
  // South African province indicators
  if (normalizedText.includes('western cape') || 
      normalizedText.includes('eastern cape') ||
      normalizedText.includes('garden route') ||
      (normalizedText.includes('cape') && !normalizedText.includes('northern cape'))) {
    return {
      branch: 'Cape Town',
      branchCode: 'CPT',
      matchedArea: 'Cape region (estimated)',
      color: 'blue',
      description: 'Western Cape, Eastern Cape coastal areas, Garden Route',
      country: 'South Africa'
    };
  }
  
  if (normalizedText.includes('gauteng') || 
      normalizedText.includes('north west') ||
      normalizedText.includes('limpopo') ||
      normalizedText.includes('mpumalanga') ||
      normalizedText.includes('joburg') ||
      normalizedText.includes('pretoria')) {
    return {
      branch: 'Midrand (Gauteng)',
      branchCode: 'GTG',
      matchedArea: 'Gauteng region (estimated)',
      color: 'green',
      description: 'Gauteng, North West, Limpopo, Mpumalanga',
      country: 'South Africa'
    };
  }
  
  if (normalizedText.includes('free state') || 
      normalizedText.includes('northern cape') ||
      normalizedText.includes('bloemfontein') ||
      normalizedText.includes('kimberley')) {
    return {
      branch: 'Bloemfontein',
      branchCode: 'BFN',
      matchedArea: 'Free State region (estimated)',
      color: 'orange',
      description: 'Free State, Northern Cape, Eastern Cape inland',
      country: 'South Africa'
    };
  }
  
  return null;
}

/**
 * Get all coverage areas for a specific branch
 * @param {string} branchCode - Branch code (CPT, GTG, BFN)
 * @returns {Object|null} - Coverage areas object
 */
export function getBranchCoverage(branchCode) {
  switch (branchCode) {
    case 'CPT':
      return capeTownCoverage;
    case 'GTG':
      return midrandCoverage;
    case 'BFN':
      return bloemfonteinCoverage;
    default:
      return null;
  }
}

/**
 * Get all branches info with country assignments
 * @returns {Array} - Array of branch information
 */
export function getAllBranches() {
  return [
    {
      name: 'Cape Town',
      code: 'CPT',
      color: 'blue',
      description: 'Western Cape, Eastern Cape coastal areas, Garden Route',
      countries: ['South Africa (Western/Eastern Cape)', 'Namibia', 'All Others'],
      coverage: capeTownCoverage
    },
    {
      name: 'Midrand (Gauteng)',
      code: 'GTG', 
      color: 'green',
      description: 'Gauteng, North West, Limpopo, Mpumalanga',
      countries: ['South Africa (Gauteng/North West/Limpopo/Mpumalanga)', 'Botswana', 'Zimbabwe', 'Mozambique', 'Eswatini'],
      coverage: midrandCoverage
    },
    {
      name: 'Bloemfontein',
      code: 'BFN',
      color: 'orange', 
      description: 'Free State, Northern Cape, Eastern Cape inland',
      countries: ['South Africa (Free State/Northern Cape)', 'Lesotho'],
      coverage: bloemfonteinCoverage
    }
  ];
}

/**
 * Get country assignment summary
 * @returns {Object} - Country to branch mapping
 */
export function getCountryAssignments() {
  return {
    'South Africa': {
      'Western Cape': 'CPT',
      'Eastern Cape': 'CPT', 
      'Northern Cape': 'BFN',
      'Gauteng': 'GTG',
      'North West': 'GTG',
      'Limpopo': 'GTG',
      'Mpumalanga': 'GTG',
      'Free State': 'BFN',
      'KwaZulu-Natal': 'GTG' // Added for completeness
    },
    'Namibia': 'CPT',
    'Botswana': 'GTG',
    'Zimbabwe': 'GTG', 
    'Mozambique': 'GTG',
    'Eswatini': 'GTG',
    'Lesotho': 'BFN',
    'All Others': 'CPT'
  };
}

/**
 * Validate city assignment
 * @param {string} city - City name
 * @returns {Array} - Array of possible matches with confidence scores
 */
export function validateCityAssignment(city) {
  const normalized = normalizeText(city);
  const results = [];
  
  // Check all branches
  const branches = [
    { code: 'CPT', coverage: capeTownCoverage, name: 'Cape Town' },
    { code: 'GTG', coverage: midrandCoverage, name: 'Midrand' },
    { code: 'BFN', coverage: bloemfonteinCoverage, name: 'Bloemfontein' }
  ];
  
  branches.forEach(branch => {
    const match = matchesCoverage(normalized, branch.coverage);
    if (match) {
      results.push({
        branch: branch.name,
        branchCode: branch.code,
        matchedArea: match.area,
        matchType: match.matchType,
        areaType: match.areaType,
        confidence: match.matchType === 'exact' ? 'high' : 'medium'
      });
    }
  });
  
  return results;
}