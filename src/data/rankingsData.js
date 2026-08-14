// College market ranking (by college id) — used to sort college lists.
// Source: DU market reputation tier list (see Rankings.jsx marketRankingData).
// Colleges not listed here sort after ranked ones (alphabetically).

export const RANK_BY_ID = {
  "st-stephen-s-college": 1,
  "shri-ram-college-of-commerce": 2,
  "hindu-college": 3,
  "lady-shri-ram-college-for-women-w": 4,
  "hansraj-college": 5,
  "miranda-house-w": 6,
  "shaheed-sukhdev-college-business-studies": 7,
  "kirori-mal-college": 8,
  "ramjas-college": 9,
  "sri-venketeswara-college": 10,
  "jesus-mary-college-w": 11,
  "gargi-college-w": 12,
  "atma-ram-sanatan-dharma-college": 13,
  "shaheed-bhagat-singh-college": 14,
  "shaheed-bhagat-singh-college-evening": 14,
  "daulat-ram-college-w": 15,
  "indraprastha-college-for-women-w": 16,
  "college-of-vocational-studies": 17,
  "delhi-college-of-arts-and-commerce": 18,
  "kamala-nehru-college-w": 19,
  "deen-dayal-upadhyaya-college": 20,
  "maitreyi-college-w": 21,
  "sri-guru-tegh-bahadur-khalsa-college": 22,
  "sri-guru-gobind-singh-college-of-commerce": 23,
  "deshbandhu-college": 24,
  "dyal-singh-college": 25,
  "dyal-singh-college-evening": 25,
  "acharya-narendra-dev-college": 26,
  "shivaji-college": 27,
  "bhaskaracharya-college-of-applied-sciences": 28,
  "aryabhatta-college": 29,
  "maharaja-agrasen-college": 30,
  "ram-lal-anand-college": 31,
  "p-g-d-a-v-college": 32,
  "p-g-d-a-v-college-evening": 32,
  "motilal-nehru-college": 33,
  "motilal-nehru-college-evening": 33,
  "sri-aurobindo-college-day": 34,
  "sri-aurobindo-college-evening": 34,
  "ramanujan-college": 35,
  "keshav-mahavidyalaya": 36,
  "shaheed-rajguru-college-of-applied-sciences-for-women-w": 37,
  "shyam-lal-college": 38,
  "shyam-lal-college-evening": 38,
  "satyawati-college": 39,
  "satyawati-college-evening": 39,
  "zakir-husain-delhi-college": 40,
  "zakir-husain-delhi-college-evening": 40,
  "rajdhani-college": 41,
  "vivekananda-college-w": 42,
  "janki-devi-memorial-college-w": 43,
  "kalindi-college-w": 44,
  "lakshmibai-college-w": 45,
  "shyama-prasad-mukherji-college-for-women-w": 46,
  "institute-of-home-economics-w": 47,
  "lady-irwin-college-w": 48,
  "mata-sundri-college-for-women-w": 49,
  "bharati-college-w": 50,
  "swami-shardhanand-college": 51,
  "dr-bhim-rao-ambedkar-college": 52,
  "sri-guru-nanak-dev-khalsa-college": 53,
  "bhagini-nivedita-college-w": 54,
  "aditi-mahavidyalaya-w": 55,
};

export function getRank(collegeId) {
  return RANK_BY_ID[collegeId] ?? null;
}

// Sort colleges: ranked first (by rank), then unranked alphabetically.
export function byRanking(a, b) {
  const ra = RANK_BY_ID[a.id] ?? Number.MAX_SAFE_INTEGER;
  const rb = RANK_BY_ID[b.id] ?? Number.MAX_SAFE_INTEGER;
  if (ra !== rb) return ra - rb;
  return (a.name || '').localeCompare(b.name || '');
}
