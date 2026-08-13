// Loads and normalizes the CSAS 2026 cutoff/seat data (DU_cutoffs_seats_2026.json),
// sports quota (DU_sports_2026.json) and ECA quota (DU_eca_2026.json), joining
// them to the colleges.js / programs.js records by normalized name.
//
// Cutoffs are stored per category as { round1, round2, round3 } so the UI can
// switch between allocation rounds. Numeric fields are coerced to numbers; null
// means "no data" so the UI can render a "-" consistently.

import rawCutoffs from './DU_cutoffs_seats_2026.json';
import rawSports from './DU_sports_2026.json';
import rawEca from './DU_eca_2026.json';
import rawEligibility from './course_requirements.json';
import { colleges } from './colleges';
import { programs } from './programs';

// Categories shown in the UI (2026 CSAS also includes SIKH, KM, SGC, ORPHAN —
// present in the data, surfaced via the UI when enabled).
export const CATEGORIES = ['UR', 'OBC', 'SC', 'ST', 'EWS', 'PwBD'];
export const ROUNDS = [1, 2, 3];

function norm(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

// A handful of names differ between the 2026 JSON and colleges.js
// (PDF-extraction wording differences, not typos in either file).
const COLLEGE_NAME_ALIASES = {
  'Shaheed Sukhdev College of Business Studies': 'Shaheed Sukhdev College Business Studies',
};

function toNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (s === '' || s === '_' || s === '-') return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

// --- Build name -> record lookups for colleges.js / programs.js ---

const collegeByName = new Map();
colleges.forEach((c) => collegeByName.set(norm(c.name), c));

const programByName = new Map();
programs.forEach((p) => programByName.set(norm(p.name), p));

function resolveCollege(rawName) {
  const n = norm(rawName);
  const aliased = COLLEGE_NAME_ALIASES[n];
  return collegeByName.get(aliased ? norm(aliased) : n) || null;
}

function resolveProgram(rawName) {
  return programByName.get(norm(rawName)) || null;
}

// --- Normalize every cutoff/seats record into a flat "offering" shape ---
// { collegeId, collegeName, programId, programName, college, program,
//   cutoffs: { UR: {round1,round2,round3}, ... }, seats: { total, UR, OBC, SC, ST, EWS },
//   rank }

const SEAT_CATS = ['total', 'UR', 'OBC', 'SC', 'ST', 'EWS'];

export const offerings = rawCutoffs.map((r) => {
  const college = resolveCollege(r.college);
  const program = resolveProgram(r.program);
  const cutoffs = {};
  CATEGORIES.concat(['SIKH', 'KM', 'SGC', 'ORPHAN_FEMALE', 'ORPHAN_MALE']).forEach((cat) => {
    const rd = r.cutoffs?.[cat] || {};
    cutoffs[cat] = {
      round1: toNum(rd.round1),
      round2: toNum(rd.round2),
      round3: toNum(rd.round3),
    };
  });
  const seats = {};
  SEAT_CATS.forEach((cat) => { seats[cat] = toNum(r.seats?.[cat]); });

  return {
    collegeId: college?.id || null,
    collegeName: norm(r.college),
    programId: program?.id || null,
    programName: norm(r.program),
    college,
    program,
    campus: college?.campus || null,
    gender: college?.type || null,
    cutoffs,
    seats,
    rank: null,
  };
});

// Offerings where we couldn't resolve a matching college or program record.
// Surfaced here so data-quality gaps are visible rather than silently dropped.
export const unmatchedOfferings = offerings.filter((o) => !o.collegeId || !o.programId);

// --- Sports quota (college-wise, men/women) ---
export const sportsQuota = rawSports.map((r) => ({
  collegeId: r.collegeId,
  collegeName: r.collegeName,
  sport: r.sport,
  men: toNum(r.men) || 0,
  women: toNum(r.women) || 0,
}));

export function getSportsForCollege(collegeId) {
  return sportsQuota.filter((s) => s.collegeId === collegeId);
}

// --- ECA quota (college-wise, activity-wise) ---
export const ecaQuota = rawEca.map((r) => ({
  collegeId: r.collegeId,
  collegeName: r.collegeName,
  activity: r.activity,
  seats: toNum(r.seats) || 0,
}));

export function getEcaForCollege(collegeId) {
  return ecaQuota.filter((e) => e.collegeId === collegeId);
}

// --- Eligibility text, normalized and keyed by program name ---
function looseNorm(s) {
  return norm(s).toLowerCase().replace(/[.()]/g, '').replace(/\s+/g, ' ').trim();
}

const eligibilityByLooseName = new Map();
rawEligibility.forEach((r) => {
  eligibilityByLooseName.set(looseNorm(r.course), r.combinations || []);
});

export function getEligibilityForProgram(programName) {
  return eligibilityByLooseName.get(looseNorm(programName)) || null;
}

// --- Indices used by the Cutoffs page ---

export function buildIndices(offeringsList) {
  const byProgram = new Map();
  const byCollege = new Map();
  offeringsList.forEach((o) => {
    if (o.programId) {
      if (!byProgram.has(o.programId)) byProgram.set(o.programId, []);
      byProgram.get(o.programId).push(o);
    }
    if (o.collegeId) {
      if (!byCollege.has(o.collegeId)) byCollege.set(o.collegeId, []);
      byCollege.get(o.collegeId).push(o);
    }
  });
  return { byProgram, byCollege };
}

// Returns the cutoff for a category in a given round (1|2|3), or null.
export function getCutoff(offering, category, round = 1) {
  const rd = offering.cutoffs?.[category];
  if (!rd) return null;
  const v = rd['round' + round];
  return v === null || v === undefined ? null : v;
}

// Returns a number, or null if no data is available for this category.
export function getSeats(offering, category) {
  return offering.seats?.[category] ?? null;
}
