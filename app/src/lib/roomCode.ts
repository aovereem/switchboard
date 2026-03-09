// 256-word list: NATO alphabet, animals, colors, celestial objects, compass/elements
export const WORDS: string[] = [
  // NATO phonetic alphabet (26)
  'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL',
  'INDIA', 'JULIET', 'KILO', 'LIMA', 'MIKE', 'NOVEMBER', 'OSCAR', 'PAPA',
  'QUEBEC', 'ROMEO', 'SIERRA', 'TANGO', 'UNIFORM', 'VICTOR', 'WHISKEY',
  'XRAY', 'YANKEE', 'ZULU',
  // Animals (40)
  'BEAR', 'BISON', 'COBRA', 'CRANE', 'DINGO', 'EAGLE', 'FALCON', 'FINCH',
  'GECKO', 'GOOSE', 'HERON', 'HIPPO', 'HYENA', 'IBIS', 'JAGUAR', 'LEMUR',
  'LYNX', 'MANTA', 'MINK', 'MOOSE', 'NARWHAL', 'NEWT', 'OTTER', 'PANDA',
  'PANTHER', 'PARROT', 'PHOENIX', 'PUMA', 'QUAIL', 'RAVEN', 'RHINO',
  'ROBIN', 'SHARK', 'SLOTH', 'SQUID', 'STORK', 'SWIFT', 'TIGER', 'VIPER',
  'WHALE',
  // Colors (30)
  'AMBER', 'AZURE', 'BEIGE', 'BLACK', 'BLUE', 'BRONZE', 'BROWN', 'CORAL',
  'CREAM', 'CRIMSON', 'CYAN', 'FAWN', 'GOLD', 'GREEN', 'INDIGO', 'IVORY',
  'JADE', 'LILAC', 'MAGENTA', 'MAROON', 'NAVY', 'OLIVE', 'ORANGE', 'PINK',
  'PLUM', 'ROSE', 'RUST', 'SILVER', 'TEAL', 'VIOLET',
  // Celestial (30)
  'ANTARES', 'AQUILA', 'ARIES', 'ATLAS', 'AURIGA', 'BOOTES', 'CALLISTO',
  'CARINA', 'CASTOR', 'CERES', 'COMET', 'COSMOS', 'CYGNUS', 'DENEB',
  'DRACO', 'GEMINI', 'HALLEY', 'HYDRA', 'IO', 'KRONOS', 'LUNA', 'LYRA',
  'MARS', 'NEBULA', 'NEXUS', 'NOVA', 'OBERON', 'ORION', 'PEGASUS', 'PHOEBE',
  // Compass / Nature / Elements (30)
  'APEX', 'ARCTIC', 'BASALT', 'BLAZE', 'BOLT', 'CAIRN', 'CLIFF', 'CROWN',
  'DUNE', 'FLINT', 'FORGE', 'FROST', 'GALE', 'GLEN', 'GROVE', 'HAVEN',
  'HOLT', 'KESTREL', 'MESA', 'PEAK', 'PRISM', 'QUARTZ', 'RIDGE', 'RIVER',
  'SOLAR', 'SPARK', 'STONE', 'TEMPEST', 'ZENITH', 'ZEPHYR',
  // Extra to reach 256 (100)
  'ABYSS', 'ACORN', 'AEON', 'AGILE', 'ALIGHT', 'ALLOY', 'ANCHOR', 'ANVIL',
  'ARCADE', 'ARDENT', 'ARGON', 'ARMOR', 'ARROW', 'ASTRAL', 'AXLE', 'AZURE',
  'BADGE', 'BARGE', 'BARON', 'BATCH', 'BEAM', 'BEACON', 'BELLE', 'BERTH',
  'BIRCH', 'BLADE', 'BLUFF', 'BOARD', 'BRACE', 'BRAND', 'BRINE', 'BROOK',
  'BULWARK', 'BUOY', 'CACHE', 'CADENCE', 'CANVAS', 'CAPSTONE', 'CARBON',
  'CARGO', 'CEDAR', 'CHAIN', 'CHALK', 'CIPHER', 'CITADEL', 'CLAW', 'CLAY',
  'CLOUD', 'CLOVER', 'COAL', 'COBALT', 'CODEX', 'COIL', 'COLUMN', 'COMPASS',
  'CONCORD', 'CONDOR', 'COPPER', 'CORE', 'CRANE', 'CREST', 'CRYPT', 'CRYSTAL',
  'CULVERT', 'CURVE', 'DATUM', 'DAWN', 'DEPTH', 'DIESEL', 'DIGIT', 'DISK',
  'DOME', 'DRAFT', 'DRIFT', 'DRIVE', 'DRONE', 'DUSK', 'EDDY', 'ELDER',
  'EMBER', 'ENGINE', 'EPOCH', 'EQUINOX', 'FERRITE', 'FIELD', 'FJORD',
  'FLARE', 'FLEET', 'FLUX', 'FRAME', 'FULCRUM', 'FUSE', 'GLYPH', 'GRAIN',
  'GRAPH', 'GRAVEL', 'GRID', 'GRIT', 'HARBOR', 'HAWK',
];

// Trim to exactly 256, dedup
const WORD_LIST = [...new Set(WORDS)].slice(0, 256);

export const ROOM_CODE_REGEX = /^[A-Z]{2,8}-[A-Z]{2,8}-\d{4}$/;

export function generateRoomCode(): string {
  const w1 = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  const w2 = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  const pin = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${w1}-${w2}-${pin}`;
}

export function isValidRoomCode(code: string): boolean {
  return ROOM_CODE_REGEX.test(code.toUpperCase().trim());
}

export function formatRoomCode(code: string): string {
  return code.toUpperCase().trim();
}
