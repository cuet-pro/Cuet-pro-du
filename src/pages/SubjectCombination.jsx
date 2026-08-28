import React, { useMemo, useState, useEffect } from "react";

import { offerings, CATEGORIES, ROUNDS, getCutoff, getSeats, getEligibilityForProgram } from "../data/cutoffsData";
import { colleges as REAL_COLLEGES } from "../data/colleges";
import { SourceBadge } from "../components/SourceBadge";
import "./Cutoffs.css";

/* =========================================================================
   CUET Pro — Subject Combination → Course/College Finder · "Dashboard Theme"
   Pick CUET subjects → Eligible Programs / Other Programs / Eligible Colleges.
   ========================================================================= */

const STREAMS = {
  Commerce: { label: "Commerce", color: "#2563eb" },
  Humanities: { label: "Humanities", color: "#7c3aed" },
  Science: { label: "Science", color: "#059669" },
};

import rawEligibility from '../data/course_requirements.json';
import { programs as ALL_PROGRAMS } from '../data/programs';
import { getScoreBreakdown } from '../lib/scoreEngine';
import { Quota } from './Quota';

// Market ranking order — lower rank = better
const MARKET_RANK = {
  "St. Stephen's College": 1,
  "Shri Ram College of Commerce (SRCC)": 2,
  "Hindu College": 3,
  "Lady Shri Ram College (LSR)": 4,
  "Hansraj College": 5,
  "Miranda House": 6,
  "Shaheed Sukhdev College of Business Studies (SSCBS)": 7,
  "Kirori Mal College (KMC)": 8,
  "Ramjas College": 9,
  "Sri Venkateswara College": 10,
  "Jesus & Mary College (JMC)": 11,
  "Gargi College": 12,
  "ARSD College": 13,
  "Shaheed Bhagat Singh College": 14,
  "Daulat Ram College": 15,
  "Indraprastha College for Women (IP)": 16,
  "College of Vocational Studies (CVS)": 17,
  "Delhi College of Arts & Commerce (DCAC)": 18,
  "Kamala Nehru College": 19,
  "Deen Dayal Upadhyaya College (DDU)": 20,
  "Maitreyi College": 21,
  "Sri Guru Tegh Bahadur Khalsa College (SGTB)": 22,
  "Sri Guru Gobind Singh College of Commerce (SGGSCC)": 23,
  "Deshbandhu College": 24,
  "Dyal Singh College": 25,
  "Acharya Narendra Dev College": 26,
  "Shivaji College": 27,
  "Bhaskaracharya College of Applied Sciences": 28,
  "Aryabhatta College": 29,
  "Maharaja Agrasen College": 30,
  "Ram Lal Anand College": 31,
  "PGDAV College": 32,
  "Motilal Nehru College": 33,
  "Sri Aurobindo College": 34,
  "Ramanujan College": 35,
  "Keshav Mahavidyalaya": 36,
  "Shaheed Rajguru College of Applied Sciences for Women": 37,
  "Shyam Lal College": 38,
  "Satyawati College": 39,
  "Zakir Husain Delhi College": 40,
  "Rajdhani College": 41,
  "Vivekananda College": 42,
  "Janki Devi Memorial College (JDMC)": 43,
  "Kalindi College": 44,
  "Lakshmibai College": 45,
  "Shyama Prasad Mukherji College (SPM)": 46,
  "Institute of Home Economics": 47,
  "Lady Irwin College": 48,
  "Mata Sundri College for Women": 49,
  "Bharati College": 50,
  "Swami Shraddhanand College": 51,
  "Dr. Bhim Rao Ambedkar College": 52,
  "Sri Guru Nanak Dev Khalsa College": 53,
  "Bhagini Nivedita College": 54,
  "Aditi Mahavidyalaya": 55,
};

function getMarketRank(collegeName) {
  if (!collegeName) return 999;
  // Exact match pehle try karo
  if (MARKET_RANK[collegeName] !== undefined) return MARKET_RANK[collegeName];
  // Partial match — college name ke kisi bhi word se match karo
  const lower = collegeName.toLowerCase();
  for (const [key, rank] of Object.entries(MARKET_RANK)) {
    if (lower.includes(key.toLowerCase().split(' ')[0]) || 
        key.toLowerCase().includes(lower.split(' ')[0])) {
      return rank;
    }
  }
  return 999; // unlisted colleges last mein
}

const PROGRAMS = ALL_PROGRAMS.map(p => ({
  ...p,
  stream: p.subjectGroup || "Humanities"
}));

const COLLEGES = [];
const RES_CATS = [
  { id: "UR", label: "UR", delta: 0, share: 0.4 }, { id: "OBC", label: "OBC", delta: 150, share: 0.27 },
  { id: "SC", label: "SC", delta: 205, share: 0.15 }, { id: "ST", label: "ST", delta: 235, share: 0.075 },
  { id: "EWS", label: "EWS", delta: 115, share: 0.1 }, { id: "PwBD", label: "PwBD", delta: 330, share: 0.05 },
];

const LANGUAGES = ["Assamese", "Bengali", "English", "Gujarati", "Hindi", "Kannada", "Malayalam", "Marathi", "Odia", "Punjabi", "Sanskrit", "Tamil", "Telugu", "Urdu"];
const DOMAINS = ["Accountancy / Book Keeping", "Agriculture", "Anthropology", "Biology / Biological Studies / Biotechnology / Biochemistry", "Business Studies", "Chemistry", "Computer Science / Information Practices", "Economics / Business Economics", "Environmental Studies / Environmental Science", "Fine Arts / Visual Arts / Commercial Arts", "Geography / Geology", "History", "Home Science", "Knowledge Tradition - Practices in India", "Mass Media / Mass Communication", "Mathematics / Applied Mathematics", "Performing Arts (Dance, Drama, Music)", "Physical Education (Yoga, Sports)", "Physics", "Political Science", "Psychology", "Sociology"];

function nf(n) { return n.toLocaleString("en-IN"); }
function heatBg(v) { if (!v) return "transparent"; const t = Math.max(0, Math.min(1, (v - 650) / 300)); const hue = 145 * (1 - t); return `hsla(${hue},72%,45%,0.20)`; }
function heatBgSeats(v) { if (v === null || v === undefined) return "transparent"; const t = Math.max(0, Math.min(1, v / 40)); const hue = 145 * t; return `hsla(${hue},72%,45%,0.20)`; }
function progStats(p) { const myOffs = offerings.filter(o => o.programId === p.id); return { count: myOffs.length, totalSeats: myOffs.reduce((s, o) => s + (o.seats.total || 0), 0), topCutoff: myOffs.reduce((m, o) => Math.max(m, o.cutoffs.UR || 0), 0) }; }

function isEligibleDynamic(programName, langs, domains, gt) {
  const subjectEntries = [
    ...langs.map(l => ({ subject: l, marks: 100 })),
    ...domains.map(d => ({ subject: d, marks: 100 }))
  ];
  if (gt) subjectEntries.push({ subject: "General Aptitude Test", marks: 100 });
  
  const res = getScoreBreakdown(subjectEntries, programName, rawEligibility);
  return res ? res.isEligible : false;
}

function Ring({ value, color, max = 950 }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, (value || 0) / max));
  return (
    <svg width="52" height="52" viewBox="0 0 64 64" className="cf-ring">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border-color)" strokeWidth="5.5" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5.5"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" className="cf-ring-num">{value ? Math.round(value) : '—'}</text>
    </svg>
  );
}

function ListRow({ title, sub, accent, count, countLabel, seats, top, onOpen }) {
  return (
    <button className="cf-li" onClick={onOpen} style={{ '--rail': accent }}>
      <span className="cf-li-rail" />
      <span className="cf-li-main">
        <span className="cf-li-title">{title}</span>
        <span className="cf-li-tag" style={{ color: accent, background: accent + '14' }}>{sub}</span>
      </span>
      <span className="cf-li-right">
        <span className="cf-stat"><b>{count}</b><i>{countLabel}</i></span>
        <span className="cf-stat"><b>{seats === null ? '-' : nf(seats)}</b><i>seats</i></span>
        <span className="cf-ringwrap"><Ring value={top} color="#2563eb" /><i>highest cutoff</i></span>
      </span>
      <span className="cf-li-go">›</span>
    </button>
  );
}

function Modal({ open, onClose, payload }) {
  const [view, setView] = useState("cutoffs");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState("");
  const [profile, setProfile] = useState(null); // { category, gender }
  const [profileSkipped, setProfileSkipped] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profCategory, setProfCategory] = useState("UR");
  const [profGender, setProfGender] = useState("Female");
  useEffect(() => { function k(e) { if (e.key === "Escape") onClose(); } if (open) document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [open, onClose]);
  if (!open || !payload) return null;
  const { mode, item, eligibleIds } = payload;
  const numScore = score === "" ? null : Math.max(0, Math.min(1000, Number(score) || 0));
  let title, accent, rows;
  const eligCombinations = mode === "program" ? (getEligibilityForProgram(item.name) || []) : [];
  if (mode === "program") {
    const p = item; accent = STREAMS[p.stream].color; title = "Colleges offering " + p.name;
    const myOffs = offerings.filter(o => o.programId === p.id);
    rows = myOffs.map((o) => ({ key: o.collegeId, name: o.college?.short || o.collegeName, campus: o.college?.campus, women: o.college?.type === "Women" || o.gender === "Women" || o.gender === "Female", top: getCutoff(o, "UR", 1) || 0, cutoffs: CATEGORIES.map((cat) => getCutoff(o, cat, round)), seats: CATEGORIES.map((cat) => getSeats(o, cat)) }));
  } else {
    const c = item; accent = "#2563eb"; title = "Your courses at " + c.name;
    const myOffs = offerings.filter(o => o.collegeId === c.id);
    rows = myOffs.filter((o) => !eligibleIds || eligibleIds.has(o.programId)).map(o => {
      const p = PROGRAMS.find(px => px.id === o.programId);
      if (!p) return null;
      return { key: p.id, name: p.name, stream: p.stream, top: getCutoff(o, "UR", 1) || 0, cutoffs: CATEGORIES.map((cat) => getCutoff(o, cat, round)), seats: CATEGORIES.map((cat) => getSeats(o, cat)) };
    }).filter(Boolean);
  }
  // Order stays stable across rounds: rank by the round-1 UR cutoff so colleges
  // that never reached a later round (e.g. SRCC in round 3) stay visible instead
  // of sinking out of view; their cells render as "- -".
  rows.sort((a, b) => (b.top || 0) - (a.top || 0));

  const colStats = CATEGORIES.map((_, ci) => {
    const vals = rows.map(r => r.cutoffs[ci]).filter(v => v !== null && v !== undefined);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  });

  const seatColStats = CATEGORIES.map((_, ci) => {
    const vals = rows.map(r => r.seats[ci]).filter(v => v !== null && v !== undefined);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  });

  function heatClass(v, ci, isCut) {
    if (v === null || v === undefined) return '';
    const { min, max } = isCut ? colStats[ci] : seatColStats[ci];
    if (max === min) return 'cf-heat-5';
    // Cutoffs: lower score = easier to get in = green. Higher score = harder = red.
    // Seats: more seats = better odds = green. Fewer seats = red.
    const pct = isCut ? (max - v) / (max - min) : (v - min) / (max - min);
    if (pct >= 0.8) return 'cf-heat-5';
    if (pct >= 0.6) return 'cf-heat-4';
    if (pct >= 0.4) return 'cf-heat-3';
    if (pct >= 0.2) return 'cf-heat-2';
    return 'cf-heat-1';
  }

  return (
    <div className="cf-overlay" onClick={onClose}>
      <div className="cf-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ "--maccent": accent }}>
        <div className="cf-modal-head">
          <div className="cf-modal-title">{title}</div>
          <div className="cf-modal-head-right">
            <div className="cf-diff-range" aria-hidden="true">
              <span className="cf-diff-label">{view === "cutoffs" ? "Low" : "More"}</span>
              <div className="cf-diff-track">
                <span className="cf-diff-seg cf-heat-5" />
                <span className="cf-diff-seg cf-heat-4" />
                <span className="cf-diff-seg cf-heat-3" />
                <span className="cf-diff-seg cf-heat-2" />
                <span className="cf-diff-seg cf-heat-1" />
              </div>
              <span className="cf-diff-label">{view === "cutoffs" ? "High" : "Less"}</span>
            </div>
            <button className="cf-x" onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>
        {eligCombinations.length > 0 && (
          <div className="cf-elig-card">
            <div className="cf-elig-card-head">
              <span className="cf-elig-icon">📋</span>
              <span className="cf-elig-card-title">Subject Combinations</span>
            </div>
            <ul className="cf-elig-bullets">
              {eligCombinations.map((combo, i) => (
                <React.Fragment key={i}>
                  <li>{combo}</li>
                  {i < eligCombinations.length - 1 && (
                    <li style={{ listStyle: 'none', textAlign: 'center', margin: '0.1rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>OR</li>
                  )}
                </React.Fragment>
              ))}
            </ul>
          </div>
        )}

        <div className="cf-modal-tools">
          <div className="cf-tabs"><span className="cf-tabs-label">View</span>
            <button className={"cf-tab " + (view === "seats" ? "on" : "")} onClick={() => setView("seats")}>Seats</button>
            <button className={"cf-tab " + (view === "cutoffs" ? "on" : "")} onClick={() => setView("cutoffs")}>Cutoffs</button>
          </div>
          {view === "cutoffs" && (
            <div className="cf-rounds" role="group" aria-label="Cutoff round">
              <span className="cf-tabs-label">Cutoff</span>
              <select className="cf-round-select" value={round} onChange={(e) => setRound(Number(e.target.value))}>
                {ROUNDS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
          {view === "cutoffs" && (
            <div className="cf-score-wrap">
              <svg className="cf-score-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="cf-scorein" type="number" inputMode="numeric" placeholder="Enter your CUET score (0–1000)" value={score} onChange={(e) => setScore(e.target.value)} onWheel={(e) => e.target.blur()} max={1000} min={0} />
              {!profile && !profileSkipped && (
                <button
                  className="cf-profile-pers"
                  onClick={() => setShowProfile(true)}
                  title="Filter results by your category & gender"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M3 21v-2a7 7 0 0 1 14 0v2"></path></svg>
                  Personalize
                </button>
              )}
            </div>
          )}
          {view === "cutoffs" && profile && (
            <div className="cf-profile-mini">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M3 21v-2a7 7 0 0 1 14 0v2"></path></svg>
              {profile.category} · {profile.gender}
              <span
                className="cf-profile-mini-x"
                role="button"
                aria-label="Edit category / gender"
                onClick={(e) => { e.stopPropagation(); setShowProfile(true); }}
              >✎</span>
            </div>
          )}
        </div>
        <div className="cf-tablewrap">
          <table className="cf-table">
            <thead><tr><th className="cf-th-sr">Sr No</th><th className="cf-th-name">{mode === "program" ? "College" : "Program"}</th>{CATEGORIES.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, idx) => {
                const vals = view === "cutoffs" ? r.cutoffs : r.seats;
                const dimWomen = profile?.gender === "Male" && r.women;
                return (
                  <tr key={r.key} className={dimWomen ? "cf-row-dim" : ""}>
                    <td className="cf-td-sr">{idx + 1}</td>
                    <td className="cf-td-name">
                      <div className="cf-td-name-inner">
                        <span className="cf-td-name-text">{r.name}</span>
                        {(r.women || (r.campus && r.campus !== "Off") || r.stream) && (
                          <span className="cf-td-badges">
                            {r.women && <span className="cf-badge-w">Women</span>}
                            {r.campus && r.campus !== "Off" && (
                              <span className="cf-badge-campus">{r.campus} Campus</span>
                            )}
                            {r.stream && (
                              <span className="cf-badge-s" style={{ color: STREAMS[r.stream].color, background: STREAMS[r.stream].color + "14" }}>
                                {STREAMS[r.stream].label.split(" ")[0]}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    {vals.map((v, i) => {
                      const isCut = view === "cutoffs";
                      const catOk = !profile || CATEGORIES[i] === profile.category;
                      const genderOk = !profile || profile.gender === "Female" || !r.women;
                      const q = isCut && numScore !== null && v !== null && numScore >= v && catOk && genderOk;
                      const heat = isCut && !q ? heatClass(v, i, true) : !isCut && v !== null ? heatClass(v, i, false) : '';
                      return (
                        <td key={i} className={"cf-num-cell " + heat + (q ? " cf-q" : "")}>{v === null || v === undefined ? <span className="cf-dash">- -</span> : (isCut ? v.toFixed(1) : v)}{q && <i className="cf-tick">✓</i>}</td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category + gender popup */}
      {showProfile && (
        <div className="cf-overlay cf-profile-overlay" onClick={() => setShowProfile(false)}>
          <div className="cf-profile-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="cf-profile-title">Personalize your chances 🎯</div>
            <p className="cf-profile-sub">
              Add your <b>category</b> and <b>gender</b> for a more accurate result.
              Green ✓ sirf aapki category aur gender ke hisaab se dikhega.
            </p>
            <label className="cf-profile-label" htmlFor="cf-prof-cat">Your category</label>
            <select id="cf-prof-cat" className="cf-profile-select" value={profCategory} onChange={(e) => setProfCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="cf-profile-label" htmlFor="cf-prof-gender">Your gender</label>
            <select id="cf-prof-gender" className="cf-profile-select" value={profGender} onChange={(e) => setProfGender(e.target.value)}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
            <div className="cf-profile-actions">
              <button className="cf-profile-apply" onClick={() => { setProfile({ category: profCategory, gender: profGender }); setProfileSkipped(false); setShowProfile(false); }}>
                Show my chances ✓
              </button>
              <button className="cf-profile-skip" onClick={() => { setProfileSkipped(true); setShowProfile(false); }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SubjectCombination() {
  const [langs, setLangs] = useState([]);
  const [domains, setDomains] = useState([]);
  const [gt, setGt] = useState(false);
  const [subjQuery, setSubjQuery] = useState("");
  const [shown, setShown] = useState(false);
  const [selectionChanged, setSelectionChanged] = useState(false);
  const [tab, setTab] = useState("eligible");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [campus, setCampus] = useState("all");
  const [sort, setSort] = useState("market");
  const [showQuota, setShowQuota] = useState(false);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setQuery("");
    setGroup("all");
    setCampus("all");
  };

  const domainGtPicked = domains.length + (gt ? 1 : 0);
  const totalPicked = langs.length + domainGtPicked;

  const toggleLang = (v) => {
    if (shown) setSelectionChanged(true);
    setShown(false);
    if (langs.includes(v)) setLangs([]);
    else setLangs([v]);
  };

  const toggleDomain = (v) => {
    if (shown) setSelectionChanged(true);
    setShown(false);
    if (domains.includes(v)) setDomains(domains.filter((x) => x !== v));
    else {
      if (domainGtPicked >= 4) return alert("You can select a maximum of 4 subjects across Domains and General Test.");
      setDomains([...domains, v]);
    }
  };

  const toggleGt = () => {
    if (shown) setSelectionChanged(true);
    setShown(false);
    if (gt) setGt(false);
    else {
      if (domainGtPicked >= 4) return alert("You can select a maximum of 4 subjects across Domains and General Test.");
      setGt(true);
    }
  };

  const reset = () => { setLangs([]); setDomains([]); setGt(false); setShown(false); setSelectionChanged(false); };

  const evaluated = useMemo(() => PROGRAMS.map((p) => ({ p, ok: isEligibleDynamic(p.name, langs, domains, gt) })), [langs, domains, gt]);
  const eligible = useMemo(() => evaluated.filter((x) => x.ok).map((x) => x.p), [evaluated]);
  const eligibleIds = useMemo(() => new Set(eligible.map((p) => p.id)), [eligible]);
  const openColleges = useMemo(() => {
    return REAL_COLLEGES.map(c => {
      const myOfferings = offerings.filter(o => o.collegeId === c.id);
      const eProgs = myOfferings.map(o => PROGRAMS.find(p => p.id === o.programId)).filter(Boolean).filter(p => eligibleIds.has(p.id));
      return { c, eProgs: Array.from(new Set(eProgs)) };
    }).filter(x => x.eProgs.length > 0);
  }, [eligibleIds]);

  const campusOptions = useMemo(() => {
    const set = new Set(REAL_COLLEGES.map((c) => c.campus));
    return Array.from(set).filter((c) => c !== 'Various').sort();
  }, []);

  const eligShown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = eligible
      .filter((p) => (group === 'all' || p.stream === group) && (!q || p.name.toLowerCase().includes(q)))
      .map((p) => ({
        ...p,
        ...progStats(p)
      }));
    
    list.sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'cutoff') return b.topCutoff - a.topCutoff;
      if (sort === 'colleges') return b.count - a.count;
      return (b.totalSeats || 0) - (a.totalSeats || 0);
    });
    return list;
  }, [eligible, query, group, sort]);

  const collegesShown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = openColleges
      .filter(({ c }) => (campus === 'all' || (campus === 'women' ? c.type === 'Women' : c.campus === campus)) && (!q || c.name.toLowerCase().includes(q)))
      .map(({ c, eProgs }) => {
        const myOffs = offerings.filter(o => o.collegeId === c.id && eProgs.some(p => p.id === o.programId));
        const totalSeats = myOffs.reduce((s, o) => s + (o.seats.total || 0), 0);
        const topCutoff = myOffs.reduce((m, o) => Math.max(m, o.cutoffs.UR || 0), 0);
        return {
          c,
          eProgs,
          count: eProgs.length,
          totalSeats,
          topCutoff
        };
      });

    list.sort((a, b) => {
      if (sort === 'az') return a.c.name.localeCompare(b.c.name);
      if (sort === 'cutoff') return b.topCutoff - a.topCutoff;
      if (sort === 'colleges') return b.count - a.count;
      if (sort === 'seats') return (b.totalSeats || 0) - (a.totalSeats || 0);
      // Default: market ranking
      return getMarketRank(a.c.name) - getMarketRank(b.c.name);
    });
    return list;
  }, [openColleges, query, campus, sort]);

  return (
    <div className="cp-wrap">
      <style>{CSS}</style>
      <section className="cp-herowrap cp-hero-new">
        <div className="cp-hero-bg" aria-hidden="true">
          <div className="cp-hero-blob cp-hero-blob-1" />
          <div className="cp-hero-blob cp-hero-blob-2" />
          <div className="cp-hero-blob cp-hero-blob-3" />
          <div className="cp-hero-grid" />
        </div>
        <div className="cp-hero-content">
          <span className="cp-herobadge-new">CUET 2026 · Eligibility Engine</span>
          <h1>Subject Combination &amp;<br />Course Explorer</h1>
          <p>Pick the CUET subjects you appeared for. We'll show every program you're eligible for and the colleges open to you.</p>
        </div>
        <div className="cp-hero-illustration" aria-hidden="true">
          <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="120" cy="100" r="80" fill="url(#hero-grad-bg)" opacity="0.15" />
            <circle cx="160" cy="70" r="50" fill="url(#hero-grad-glow)" opacity="0.2" filter="blur(10px)" />
            
            <g filter="url(#card-shadow)">
              <rect x="20" y="30" width="160" height="90" rx="16" fill="white" fillOpacity="0.12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" style={{ backdropFilter: 'blur(8px)' }} />
              <rect x="36" y="46" width="48" height="8" rx="4" fill="white" opacity="0.8" />
              <circle cx="156" cy="50" r="6" fill="#10b981" />
              <rect x="36" y="66" width="100" height="5" rx="2.5" fill="white" opacity="0.4" />
              <rect x="36" y="78" width="112" height="5" rx="2.5" fill="white" opacity="0.4" />
              <rect x="36" y="90" width="76" height="5" rx="2.5" fill="white" opacity="0.4" />
            </g>

            <g filter="url(#card-shadow-large)">
              <rect x="80" y="100" width="140" height="64" rx="16" fill="white" fillOpacity="0.95" />
              <circle cx="106" cy="132" r="14" fill="#eff6ff" />
              <path d="M101 132l3 3 7-7" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              
              <rect x="132" y="122" width="72" height="7" rx="3.5" fill="#1e293b" />
              <rect x="132" y="135" width="48" height="5" rx="2.5" fill="#64748b" />
            </g>
            
            <defs>
              <linearGradient id="hero-grad-bg" x1="40" y1="20" x2="200" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="hero-grad-glow" x1="110" y1="20" x2="210" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <filter id="card-shadow" x="10" y="24" width="180" height="110" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.15" />
              </filter>
              <filter id="card-shadow-large" x="70" y="94" width="160" height="84" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.25" />
              </filter>
            </defs>
          </svg>
        </div>
      </section>


      <input className="cp-subjsearch" placeholder="Search for a subject…" value={subjQuery} onChange={(e) => setSubjQuery(e.target.value)} />

      <div className="cp-picker">
        <div className="cp-col">
          <div className="cp-col-head">Languages <small>(List A)</small></div>
          <div className="cp-col-body">{LANGUAGES.filter((l) => l.toLowerCase().includes(subjQuery.toLowerCase())).map((l) => <button key={l} className="cp-pick" onClick={() => toggleLang(l)} style={langs.includes(l) ? { borderColor: "#2563eb", background: "#eff6ff", color: "#2563eb" } : {}}>{langs.includes(l) ? "✓ " : ""}{l}</button>)}</div>
        </div>
        <div className="cp-col cp-col-wide">
          <div className="cp-col-head">Domain Subjects <small>(List B)</small></div>
          <div className="cp-col-body cp-col-grid">{DOMAINS.filter((d) => d.toLowerCase().includes(subjQuery.toLowerCase())).map((d) => <button key={d} className="cp-pick" onClick={() => toggleDomain(d)} style={domains.includes(d) ? { borderColor: "#059669", background: "#ecfdf5", color: "#047857" } : {}}>{domains.includes(d) ? "✓ " : ""}{d}</button>)}</div>
        </div>
        <div className="cp-col">
          <div className="cp-col-head">General Test</div>
          <div className="cp-col-body"><button className="cp-pick" onClick={toggleGt} style={gt ? { borderColor: "#7c3aed", background: "#f5f3ff", color: "#7c3aed" } : {}}>{gt ? "✓ " : ""}General Aptitude Test</button></div>
        </div>
      </div>

      <div className="cp-cta-wrap">
        <button className="cp-cta" disabled={langs.length < 1} onClick={() => { setShown(true); setSelectionChanged(false); }}>
          {langs.length === 0 ? "Select at least 1 Language to proceed" : selectionChanged ? `Selection changed — click to update results (${totalPicked}/5 selected)` : `See my eligible programs (${totalPicked}/5 selected)`}
        </button>
        {totalPicked > 0 && <button className="cp-reset" onClick={reset}>Clear all</button>}
      </div>

      {/* Sports & ECA Quota — always accessible without picking subjects */}
      <div className="cp-quota-section">
        <button className="cp-quota-toggle" onClick={() => setShowQuota(!showQuota)} aria-expanded={showQuota}>
          <span className="cp-quota-toggle-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><line x1="2" y1="12" x2="22" y2="12"></line></svg>
          </span>
          <span className="cp-quota-toggle-label">Sports & ECA Quota</span>
          <span className="cp-quota-toggle-arrow">{showQuota ? '▲' : '▼'}</span>
        </button>
        {showQuota && (
          <div className="cp-quota-body">
            <Quota />
          </div>
        )}
      </div>

      {shown && totalPicked > 0 && (
        <div className="cf-results" style={{ marginTop: "2rem" }}>
          <div className="cf-seg" data-on={tab === "eligible" ? "program" : "college"}>
            <button className={tab === "eligible" ? "on" : ""} onClick={() => handleTabChange("eligible")}>Browse by Program</button>
            <button className={tab === "colleges" ? "on" : ""} onClick={() => handleTabChange("colleges")}>Browse by College</button>
            <span className="cf-seg-knob" />
          </div>

          <div className="cf-controls">
            <input
              className="cf-search"
              placeholder={tab === 'eligible' ? 'Search programs…' : 'Search colleges…'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select className="cf-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="market">Market Ranking</option>
              <option value="seats">Most seats</option>
              <option value="cutoff">Highest cutoff</option>
              <option value="colleges">{tab === 'eligible' ? 'Most colleges' : 'Most programs'}</option>
              <option value="az">A–Z</option>
            </select>
          </div>

          <div className="cf-filters">
            {tab === 'eligible' ? (
              <>
                <button className={'cf-chip ' + (group === 'all' ? 'on' : '')} onClick={() => setGroup('all')}>All</button>
                {Object.entries(STREAMS).map(([k, v]) => (
                  <button
                    key={k}
                    className={'cf-chip ' + (group === k ? 'on' : '')}
                    onClick={() => setGroup(k)}
                    style={group === k ? { borderColor: v.color, color: '#fff', background: v.color } : {}}
                  >
                    {v.label}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button className={'cf-chip ' + (campus === 'all' ? 'on' : '')} onClick={() => setCampus('all')}>All</button>
                {campusOptions.map((c) => (
                  <button key={c} className={'cf-chip ' + (campus === c ? 'on' : '')} onClick={() => setCampus(c)}>{c} Campus</button>
                ))}
                <button className={'cf-chip ' + (campus === 'women' ? 'on' : '')} onClick={() => setCampus('women')}>Women's</button>
              </>
            )}
          </div>

          <div className="cf-table-badge-row">
            <div className="cf-count">
              Showing {tab === 'eligible' ? `${eligShown.length} programs` : `${collegesShown.length} colleges`}
            </div>
            <SourceBadge date="CSAS 2026" />
          </div>

          <main className="cf-list">
            {tab === 'eligible'
              ? (eligShown.length ? eligShown.map((p) => {
                  return (
                    <ListRow
                      key={p.id}
                      title={p.name}
                      sub={STREAMS[p.stream].label}
                      accent={STREAMS[p.stream].color}
                      count={p.count}
                      countLabel="colleges"
                      seats={p.totalSeats}
                      top={p.topCutoff}
                      onOpen={() => setSelected({ mode: 'program', item: p })}
                    />
                  );
                }) : <div className="cf-empty">No eligible programs match the criteria.</div>)
              : (collegesShown.length ? collegesShown.map((item) => {
                  return (
                    <ListRow
                      key={item.c.id}
                      title={item.c.name}
                      sub={item.c.campus + ' Campus · ' + item.c.type}
                      accent="#2563eb"
                      count={item.count}
                      countLabel="courses"
                      seats={item.totalSeats}
                      top={item.topCutoff}
                      onOpen={() => setSelected({ mode: 'college', item: item.c, eligibleIds })}
                    />
                  );
                }) : <div className="cf-empty">No open colleges match the criteria.</div>)}
          </main>
        </div>
      )}

      {selected && (
        <Modal
          key={selected.item.id}
          open
          onClose={() => setSelected(null)}
          payload={selected}
        />
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
.cp-wrap{--bg:#FFFFFF;--card:#f8fafc;--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--mari:#2563eb;--ok:#059669;font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--bg);max-width:1200px;margin:20px auto 100px;padding:32px 32px 48px;border-radius:24px;box-shadow:0 10px 30px -10px rgba(0,0,0,0.1);-webkit-font-smoothing:antialiased}
.cp-wrap *{box-sizing:border-box}
.cp-stat b,.cp-num-cell,.cp-scorein,.cp-ring-num{font-variant-numeric:tabular-nums}
.cp-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.cp-brand{display:flex;align-items:center;gap:11px}
.cp-logo{width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#3b82f6,#7c3aed);color:#fff;display:grid;place-items:center;font-family:'Figtree';font-weight:800;font-size:17px}
.cp-brand-name{font-family:'Figtree';font-weight:800;font-size:17px;line-height:1}.cp-brand-sub{font-size:11.5px;color:var(--muted);margin-top:3px}
.cp-demo{font-size:11px;font-weight:600;color:var(--mari);background:#eff6ff;padding:5px 11px;border-radius:20px;border:1px solid #bfdbfe}
.cp-hero-new { position:relative; background:linear-gradient(125deg,#1e3a8a 0%,#1d4ed8 45%,#2563eb 70%,#3b82f6 100%); border-radius:18px; padding:2.5rem 2rem 2.25rem 2.5rem; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; gap:1.5rem; overflow:hidden; min-height:200px; box-shadow:0 8px 32px rgba(37,99,235,0.3),0 2px 8px rgba(37,99,235,0.2) }
.cp-hero-bg { position:absolute; inset:0; pointer-events:none; z-index:0 }
.cp-hero-blob { position:absolute; border-radius:50%; filter:blur(40px) }
.cp-hero-blob-1 { width:260px; height:260px; background:rgba(99,179,237,0.25); top:-80px; right:160px }
.cp-hero-blob-2 { width:200px; height:200px; background:rgba(167,139,250,0.2); bottom:-60px; right:60px }
.cp-hero-blob-3 { width:140px; height:140px; background:rgba(52,211,153,0.15); top:20px; left:40%; filter:blur(30px) }
.cp-hero-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px); background-size:32px 32px }
.cp-hero-content { flex:1; min-width:0; position:relative; z-index:1 }
.cp-herobadge-new { display:inline-block; background:rgba(255,255,255,0.18); color:#fff; font-size:11.5px; font-weight:700; padding:4.5px 11px; border-radius:6px; letter-spacing:0.4px; margin-bottom:13px; border:1px solid rgba(255,255,255,0.25); backdrop-filter:blur(4px) }
.cp-hero-new h1 { font-family:'Figtree'; font-size:38px; font-weight:800; letter-spacing:-1px; margin:0 0 10px; color:#ffffff; line-height:1.1; text-shadow:0 1px 4px rgba(0,0,0,0.15) }
.cp-hero-new p { font-size:15px; line-height:1.55; color:rgba(255,255,255,0.8); margin:0; max-width:44ch }
.cp-hero-illustration { flex-shrink:0; width:220px; position:relative; z-index:1; filter:drop-shadow(0 8px 24px rgba(0,0,0,0.2)) }
.cp-hero-illustration svg { width:100%; height:auto; display:block }
@media(max-width:640px){ .cp-hero-new { padding: 1.75rem 1.25rem; min-height:auto; flex-direction: column; } .cp-hero-illustration { display:none } .cp-hero-new h1 { font-size:1.85rem; } }
.cp-banner{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-size:13px;font-weight:600;padding:12px 15px;border-radius:12px;margin-bottom:14px;text-align:center}
.cp-how{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin-bottom:16px}
.cp-how-head{font-family:'Figtree';font-weight:700;font-size:14px;margin-bottom:10px}
.cp-how ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:7px}
.cp-how li{font-size:13px;color:var(--muted);line-height:1.5}.cp-how b{color:var(--ink)}
.cp-subjsearch{width:100%;border:1px solid var(--line);background:#fff;border-radius:12px;padding:13px 15px;font-size:14px;font-family:inherit;color:var(--ink);margin-bottom:14px}
.cp-subjsearch:focus{outline:2px solid var(--mari);outline-offset:1px;border-color:transparent}.cp-subjsearch::placeholder{color:#94a3b8}
.cp-picker{display:grid;grid-template-columns:1fr 1.6fr 0.9fr;gap:12px;margin-bottom:16px}
.cp-col{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:15px}
.cp-col-head{font-family:'Figtree';font-weight:700;font-size:14px;margin-bottom:12px}.cp-col-head small{font-weight:500;color:var(--muted);font-size:12px}
.cp-col-body{display:flex;flex-direction:column;gap:7px}
.cp-col-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.cp-pick{border:1px solid var(--line);background:#ffffff;color:#334155;border-radius:9px;padding:9px 11px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:.14s;text-align:center;line-height:1.3}
.cp-pick:hover{border-color:#94a3b8;background-color:#f8fafc;color:#0f172a;transform:none;box-shadow:none}
.cp-cta-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:24px}
.cp-cta{border:0;background:var(--mari);color:#fff;font-family:'Figtree';font-weight:700;font-size:15px;padding:14px 28px;border-radius:13px;cursor:pointer;box-shadow:0 6px 16px rgba(37,99,235,.28);transition:.16s}
.cp-cta:hover:not(:disabled){background-color:#1d4ed8;transform:translateY(-2px);box-shadow:0 9px 22px rgba(37,99,235,.34)}
.cp-cta:disabled{background:#e2e8f0;color:#94a3b8;cursor:not-allowed;box-shadow:none}
.cp-reset{border:0;background:none;color:var(--mari);font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit}
.cp-reset:hover{background-color:transparent;color:#1d4ed8;box-shadow:none;transform:none}
.cp-quota-section{background:var(--card);border:1px solid var(--line);border-radius:16px;margin-bottom:20px;overflow:hidden}
.cp-quota-toggle{display:flex;align-items:center;gap:10px;width:100%;border:0;background:linear-gradient(135deg,#fefce8,#fffbeb);color:#78350f;font-family:'Figtree';font-weight:800;font-size:14.5px;padding:15px 18px;cursor:pointer;text-align:left;transition:background .15s ease}
.cp-quota-toggle:hover{background:linear-gradient(135deg,#fef9c3,#fef3c7)}
.cp-quota-toggle-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#fef3c7;color:#ca8a04;flex-shrink:0}
.cp-quota-toggle-label{flex:1}
.cp-quota-toggle-arrow{font-size:11px;color:#a16207}
.cp-quota-body{padding:18px;border-top:1px solid var(--line)}
.cp-selected-summary{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin-bottom:20px}
.cp-selected-head{font-family:'Figtree';font-weight:700;font-size:14px;margin-bottom:12px;color:var(--ink)}
.cp-selected-chips{display:flex;flex-wrap:wrap;gap:8px}
.cp-chip-sel{font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px}
.cp-chip-lang{background:#eff6ff;color:#2563eb}
.cp-chip-dom{background:#ecfdf5;color:#059669}
.cp-chip-gt{background:#f5f3ff;color:#7c3aed}
.cp-results{margin-bottom:8px}
.cp-filters3{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:10px;margin-bottom:16px}
.cp-field{display:flex;flex-direction:column;gap:5px;min-width:0}
.cp-field label{font-size:10.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--muted)}
.cp-field select{appearance:none;-webkit-appearance:none;border:1px solid var(--line);background:#fff url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 14px center;background-size:14px;border-radius:11px;padding:11px 36px 11px 14px;font-size:13.5px;font-weight:500;font-family:inherit;color:var(--ink);cursor:pointer;width:100%;transition:all .2s ease;box-shadow:0 1px 2px rgba(0,0,0,0.02)}
.cp-field select:hover:not(:disabled){border-color:#94a3b8;box-shadow:0 2px 5px rgba(0,0,0,0.05)}
.cp-field select:focus{outline:none;border-color:var(--mari);box-shadow:0 0 0 3px rgba(37,99,235,0.15)}
.cp-field select:disabled{background-color:#f8fafc;color:#94a3b8;cursor:not-allowed;opacity:0.8}
.cp-chip{border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:20px;padding:7px 13px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:.15s}.cp-chip.on{border-color:var(--mari);color:#fff;background:var(--mari)}
.cp-restabs{display:flex;gap:22px;border-bottom:1px solid var(--line);margin-bottom:16px;overflow-x:auto}
.cp-restabs button{border:0;background:transparent;cursor:pointer;font-family:'Figtree';font-weight:700;font-size:14px;color:var(--muted);padding:0 0 12px;position:relative;white-space:nowrap;transition:color .18s}
.cp-restabs button:hover{background-color:transparent;color:var(--ink);box-shadow:none;transform:none}
.cp-restabs button.on{color:var(--mari)}
.cp-restabs button.on::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2.5px;background:var(--mari);border-radius:2px}
.cp-reslist{display:flex;flex-direction:column;gap:10px}
.cp-li{position:relative;display:flex;align-items:center;gap:14px;width:100%;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:15px 14px 15px 19px;cursor:pointer;font-family:inherit;transition:.16s}
.cp-li:hover{border-color:var(--rail);background-color:var(--card);color:var(--ink);box-shadow:0 8px 22px rgba(37,99,235,.10);transform:translateY(-2px)}.cp-li:focus-visible{outline:2px solid var(--rail);outline-offset:2px}
.cp-li-rail{position:absolute;left:0;top:13px;bottom:13px;width:4px;border-radius:4px;background:var(--rail)}
.cp-li-main{flex:1;min-width:0}
.cp-li-title{display:block;font-family:'Figtree';font-weight:700;font-size:16px;color:var(--ink);line-height:1.2}
.cp-li-tag{display:inline-block;margin-top:7px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px}
.cp-li-right{display:flex;align-items:center;gap:16px}
.cp-stat{display:flex;flex-direction:column;align-items:center;text-align:center;white-space:nowrap}
.cp-stat b{font-family:'Figtree';font-weight:800;font-size:16px;color:var(--ink);line-height:1}.cp-stat i{font-style:normal;font-size:10px;color:var(--muted);margin-top:4px}
.cp-ringwrap{display:flex;flex-direction:column;align-items:center;gap:3px}.cp-ringwrap i{font-style:normal;font-size:9.5px;color:var(--muted)}
.cp-ring-num{font-family:'Figtree';font-weight:800;font-size:13px;fill:var(--ink)}
.cp-li-go{font-size:23px;color:#cbd5e1;line-height:1;flex-shrink:0}
.cp-empty{text-align:center;color:var(--muted);font-size:14px;padding:30px 20px;border:1px dashed var(--line);border-radius:14px;background:#fff}
.cp-foot{margin-top:24px;padding-top:16px;border-top:1px solid var(--line)}.cp-foot p{font-size:12px;line-height:1.55;color:var(--muted);margin:0 0 8px}.cp-foot b{color:var(--ink)}.cp-foot-by{font-size:11px;color:#94a3b8}
.cp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;z-index:9999;animation:f .18s ease}
.cp-modal{background:#fff;width:100%;max-width:700px;max-height:92vh;border-radius:22px 22px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -10px 50px rgba(15,23,42,.3);animation:u .26s cubic-bezier(.2,.8,.2,1);border-top:4px solid var(--maccent)}
@keyframes f{from{opacity:0}to{opacity:1}}@keyframes u{from{transform:translateY(40px)}to{transform:none}}
.cp-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:24px 30px 16px}
.cp-modal-title{font-family:'Figtree';font-weight:800;font-size:19px;line-height:1.2;color:var(--ink)}
.cp-x{border:0;background:#f1f5f9;width:32px;height:32px;border-radius:50%;font-size:20px;color:var(--ink);cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;line-height:1}
.cp-x:hover{background-color:#e2e8f0;color:var(--ink);box-shadow:none;transform:none}
.cp-eligbox{margin:0 30px 18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:16px 20px}
.cp-eligbox-head{font-family:'Figtree';font-weight:700;font-size:13px;color:#1e40af;margin-bottom:10px}.cp-eligbox-head span{font-weight:500;color:#3b82f6;font-size:11.5px}
.cp-combos{display:flex;flex-direction:column;gap:9px}
.cp-combo{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.cp-combo-name{font-size:11px;font-weight:700;color:var(--mari);background:#dbeafe;padding:3px 9px;border-radius:7px;white-space:nowrap}
.cp-combo-reqs{display:flex;gap:6px;flex-wrap:wrap}
.cp-req{font-size:12px;font-weight:600;color:#1e3a8a;background:#fff;border:1px solid #bfdbfe;padding:3px 9px;border-radius:7px}
.cp-modal-tools{padding:0 30px 16px;display:flex;flex-direction:column;gap:10px}
.cp-tabs{display:flex;align-items:center;gap:8px}.cp-tabs-label{font-size:13px;font-weight:600;color:var(--muted);margin-right:2px}
.cp-tab{border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:9px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:.15s}
.cp-tab:hover{background-color:#f8fafc;color:var(--ink);box-shadow:none;transform:none}
.cp-tab.on{background:var(--maccent);color:#fff;border-color:var(--maccent)}
.cp-tab.on:hover{background-color:var(--maccent);color:#fff}
.cp-scorein{border:1px solid var(--line);background:#f8fafc;border-radius:11px;padding:10px 13px;font-size:13px;font-family:inherit;color:var(--ink)}.cp-scorein:focus{outline:2px solid var(--maccent);outline-offset:1px;border-color:transparent}.cp-scorein::placeholder{color:#94a3b8}
.cp-tablewrap{overflow:auto;flex:1;border-top:1px solid var(--line);-ms-overflow-style:none;scrollbar-width:none}
.cp-tablewrap::-webkit-scrollbar{display:none}
.cp-table{width:100%;min-width:540px;border-collapse:collapse;font-size:13.5px}
.cp-table thead th{position:sticky;top:0;z-index:2;background:#f8fafc;color:var(--muted);font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.3px;text-align:right;padding:11px 30px 11px 14px;border-bottom:1px solid var(--line);white-space:nowrap}
.cp-table thead th.cp-th-name{text-align:left;padding-left:30px;left:0;z-index:3}
.cp-table td{padding:11px 30px 11px 14px;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap}
.cp-table td:first-child{padding-left:30px}
.cp-td-name{text-align:left;font-weight:600;position:sticky;left:0;z-index:1;background:#fff;display:flex;align-items:center;gap:7px;max-width:240px}.cp-td-name>span:first-child{white-space:normal}
.cp-badge-w{font-size:10px;font-weight:700;color:#be185d;background:#fce7f3;padding:2px 7px;border-radius:20px;white-space:nowrap}
.cp-badge-s{font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap}
.cp-num-cell{font-weight:600;position:relative}.cp-num-cell.cp-q{outline:2px solid var(--ok);outline-offset:-2px;font-weight:800;border-radius:7px}
.cp-tick{font-style:normal;color:var(--ok);font-size:10px;margin-left:3px;font-weight:800}.cp-dash{color:#cbd5e1}
.cp-legend{display:flex;align-items:center;gap:8px;justify-content:flex-end;padding:9px 30px;font-size:10.5px;color:var(--muted)}
.cp-legend-bar{width:90px;height:7px;border-radius:5px;background:linear-gradient(90deg,hsla(145,72%,45%,.6),hsla(60,72%,45%,.6),hsla(0,72%,45%,.6))}
.cp-modal-foot{padding:13px 30px;font-size:11.5px;color:#1e40af;background:#eff6ff;border-top:1px solid #bfdbfe;line-height:1.5}
@media (min-width:560px){.cp-overlay{align-items:center;padding:24px}.cp-modal{border-radius:22px;border:1px solid var(--line);border-top:4px solid var(--maccent)}}
@media (max-width:720px){.cp-picker{grid-template-columns:1fr}.cp-col-grid{grid-template-columns:1fr 1fr}.cp-filters3{grid-template-columns:1fr}}
@media (max-width:480px){.cp-herowrap h1{font-size:24px}.cp-col-grid{grid-template-columns:1fr}.cp-li-right{gap:11px}.cp-stat i{font-size:9px}}
@media (prefers-reduced-motion:reduce){.cp-cta,.cp-pick,.cp-chip,.cp-tab,.cp-li{transition:none}.cp-overlay,.cp-modal{animation:none}}
`;
