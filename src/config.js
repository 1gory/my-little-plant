// Global game settings and balance.
// Tweak the numbers here to adjust the game's pacing.

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

// How many real days to fully grow with good care.
export const GAME_DAYS = 30;

// Base growth gain (%) per hour under ideal conditions.
export const BASE_GROWTH_PER_HOUR = 0.18;

// Base water consumption (%) per hour. Modified by weather, pot, and seed.
// Tuned so a single daily watering is comfortable for every plant (the
// thirstiest, tomato, dries from a full pot to wilting in ~35h of clear weather);
// drought-tolerant plants (sunflower) can go 2-3 days.
export const WATER_DECAY_PER_HOUR = 1.0;

// How much moisture a single "Water" tap adds. A small portion to
// dose moisture more precisely (a full pot from the start is about 3-4 waterings).
export const WATER_PER_POUR = 15;

// Pot depth by repotting tier: up to what growth % the plant can reach.
export const POT_TIERS = [30, 55, 80, 100];

// Weather persists in blocks of this many hours.
export const WEATHER_BLOCK_HOURS = 14;

// How many consecutive hours at zero health = the plant has withered.
export const WITHER_HOURS = 72;

// Threshold of accumulated dried leaves after which penalties begin.
export const DRIED_LEAVES_THRESHOLD = 3;

// If water is below the seed's threshold, growth stops and health drops.
// Health fatigue/recovery multipliers.
export const HEALTH_RECOVER_PER_HOUR = 0.5;

// --- Overwatering -> root rot ---
// Above this moisture (%) the soil counts as waterlogged ("a swamp").
export const OVERWATER_THRESHOLD = 85;
// Root rot (0..100) gained per hour in waterlogged soil, scaled by seed.overwaterSens.
export const ROT_PER_HOUR = 0.9;
// Root rot lost per hour once the soil dries below the threshold (drying heals it slowly).
export const ROT_DRY_RECOVER = 0.6;
// Health lost per hour from rot, scaled by current rot (at rot=100 -> this many /h).
export const ROT_HEALTH_PENALTY = 1.5;
// Repotting into fresh soil clears this much rot at once.
export const REPOT_ROT_RELIEF = 40;

// Maximum hours we simulate in a single pass (protection against hangs
// after a very long absence).
export const MAX_CATCHUP_HOURS = 60 * 24 + 240; // headroom for the longest seed (60 days)

// Developer mode: shows time-skip buttons.
// Set to false for an "honest" month-long playthrough.
export const DEV = false;

export const STORAGE_KEY = 'mlp_state_v1';
