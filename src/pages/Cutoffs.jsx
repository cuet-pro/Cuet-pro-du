import React, { useState, useMemo, useEffect } from 'react';
import { colleges } from '../data/colleges';
import { programs } from '../data/programs';
import {
  offerings,
  CATEGORIES,
  ROUNDS,
  buildIndices,
  getCutoff,
  getSeats,
  getEligibilityForProgram,
} from '../data/cutoffsData';
import { SourceBadge } from '../components/SourceBadge';
import './Cutoffs.css';

const SUBJECT_GROUPS = {
  Commerce: { label: 'Commerce', color: '#2563eb' },
  Humanities: { label: 'Humanities', color: '#7c3aed' },
  Science: { label: 'Science', color: '#059669' },
};

function nf(n) {
  return (n || 0).toLocaleString('en-IN');
}

function groupColor(group) {
  return SUBJECT_GROUPS[group]?.color || '#64748b';
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

function DetailModal({ open, onClose, mode, item, indices }) {
  const [view, setView] = useState('cutoffs');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState('');
  const [profile, setProfile] = useState(null); // { category, gender }
  const [profileSkipped, setProfileSkipped] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profCategory, setProfCategory] = useState('UR');
  const [profGender, setProfGender] = useState('Female');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  const numScore = score === '' ? null : Math.max(0, Math.min(1000, Number(score) || 0));
  let title, accent, rows;

  if (mode === 'program') {
    const p = item;
    accent = groupColor(p.subjectGroup);
    title = 'Colleges offering ' + p.name;
    const offs = indices.byProgram.get(p.id) || [];
    rows = offs.map((o) => ({
      key: o.collegeId,
      name: o.college ? o.college.name : o.collegeName,
      campus: o.college?.campus,
      women: o.college?.type === 'Women' || o.gender === 'Female',
      cutoffs: CATEGORIES.map((cat) => getCutoff(o, cat, round)),
      seats: CATEGORIES.map((cat) => (cat === 'PwBD' ? null : getSeats(o, cat))),
    }));
  } else {
    const c = item;
    accent = '#2563eb';
    title = 'Programs at ' + c.name;
    const offs = indices.byCollege.get(c.id) || [];
    rows = offs.map((o) => ({
      key: o.programId,
      name: o.program ? o.program.name : o.programName,
      group: o.program?.subjectGroup,
      cutoffs: CATEGORIES.map((cat) => getCutoff(o, cat, round)),
      seats: CATEGORIES.map((cat) => (cat === 'PwBD' ? null : getSeats(o, cat))),
    }));
  }

  const eligCombinations = mode === 'program' ? (getEligibilityForProgram(item.name) || []) : [];

  rows.sort((a, b) => (b.cutoffs[0] || 0) - (a.cutoffs[0] || 0));

  // Heatmap: compute min/max per column for cutoffs and seats view
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
      <div className="cf-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ '--maccent': accent }}>
        <div className="cf-modal-head">
          <div className="cf-modal-title">{title}</div>
          <button className="cf-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="cf-diff-range" aria-hidden="true">
          <span className="cf-diff-label">{view === 'cutoffs' ? 'Easy' : 'More'}</span>
          <div className="cf-diff-track">
            <span className="cf-diff-seg cf-heat-5" />
            <span className="cf-diff-seg cf-heat-4" />
            <span className="cf-diff-seg cf-heat-3" />
            <span className="cf-diff-seg cf-heat-2" />
            <span className="cf-diff-seg cf-heat-1" />
          </div>
          <span className="cf-diff-label">{view === 'cutoffs' ? 'Hard' : 'Less'}</span>
        </div>
        {eligCombinations.length > 0 && (
          <div className="cf-elig-card">
            <div className="cf-elig-card-head">
              <span className="cf-elig-icon">📋</span>
              <span className="cf-elig-card-title">Eligibility</span>
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
          <div className="cf-tabs">
            <span className="cf-tabs-label">View</span>
            <button className={'cf-tab ' + (view === 'seats' ? 'on' : '')} onClick={() => setView('seats')}>Seats</button>
            <button className={'cf-tab ' + (view === 'cutoffs' ? 'on' : '')} onClick={() => setView('cutoffs')}>Cutoffs</button>
          </div>
          {view === 'cutoffs' && (
            <div className="cf-rounds" role="group" aria-label="Cutoff round">
              <span className="cf-tabs-label">Cutoff</span>
              <select className="cf-round-select" value={round} onChange={(e) => setRound(Number(e.target.value))}>
                {ROUNDS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
          {view === 'cutoffs' && (
            <div className="cf-score-wrap">
              <svg className="cf-score-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="cf-scorein"
                type="number"
                inputMode="numeric"
                placeholder="Enter your CUET score (0–1000)"
                value={score}
                onChange={(e) => {
                  setScore(e.target.value);
                  if (e.target.value && !profile && !profileSkipped) setShowProfile(true);
                }}
                onFocus={() => { if (!profile && !profileSkipped) setShowProfile(true); }}
                onWheel={(e) => e.target.blur()}
                max={1000}
                min={0}
              />
            </div>
          )}
          {view === 'cutoffs' && profile && (
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
            <thead>
              <tr>
                <th className="cf-th-sr">Sr No</th>
                <th className="cf-th-name">{mode === 'program' ? 'College' : 'Program'}</th>
                {CATEGORIES.map((c) => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={CATEGORIES.length + 2} style={{ textAlign: 'center', padding: '2rem' }}>No data available.</td></tr>
              )}
              {rows.map((r, idx) => {
                const vals = view === 'cutoffs' ? r.cutoffs : r.seats;
                const dimWomen = profile?.gender === 'Male' && r.women;
                return (
                  <tr key={r.key} className={dimWomen ? 'cf-row-dim' : ''}>
                    <td className="cf-td-sr">{idx + 1}</td>
                    <td className="cf-td-name">
                      <div className="cf-td-name-inner">
                        <span className="cf-td-name-text">{r.name}</span>
                        {(r.women || (r.campus && r.campus !== 'Off') || r.group) && (
                          <span className="cf-td-badges">
                            {r.women && <span className="cf-badge-w">Women</span>}
                            {r.campus && r.campus !== 'Off' && (
                              <span className="cf-badge-campus">{r.campus} Campus</span>
                            )}
                            {r.group && (
                              <span className="cf-badge-s" style={{ color: groupColor(r.group), background: groupColor(r.group) + '14' }}>
                                {r.group}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    {vals.map((v, i) => {
                      const isCut = view === 'cutoffs';
                      const catOk = !profile || CATEGORIES[i] === profile.category;
                      const genderOk = !profile || profile.gender === 'Female' || !r.women;
                      const q = isCut && numScore !== null && v !== null && numScore >= v && catOk && genderOk;
                      const heat = isCut && !q ? heatClass(v, i, true) : !isCut && v !== null ? heatClass(v, i, false) : '';
                      return (
                        <td key={i} className={'cf-num-cell ' + heat + (q ? ' cf-q' : '')}>
                          {v === null || v === undefined ? <span className="cf-dash">-</span> : (isCut ? v.toFixed(1) : v)}
                          {q && <i className="cf-tick">✓</i>}
                        </td>
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

export function Cutoffs() {
  const [mode, setMode] = useState('program');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [campus, setCampus] = useState('all');
  const [sort, setSort] = useState('seats');
  const [selected, setSelected] = useState(null);

  const indices = useMemo(() => buildIndices(offerings), []);

  const programAgg = useMemo(() => {
    const map = new Map();
    programs.forEach((p) => {
      const offs = indices.byProgram.get(p.id) || [];
      let totalSeats = null;
      let topCutoff = 0;
      offs.forEach((o) => {
        const s = getSeats(o, 'total');
        if (s !== null) totalSeats = (totalSeats || 0) + s;
        const c = getCutoff(o, 'UR', 1);
        if (c && c > topCutoff) topCutoff = c;
      });
      map.set(p.id, { count: offs.length, totalSeats, topCutoff });
    });
    return map;
  }, [indices]);

  const collegeAgg = useMemo(() => {
    const map = new Map();
    colleges.forEach((c) => {
      const offs = indices.byCollege.get(c.id) || [];
      let totalSeats = null;
      let topCutoff = 0;
      offs.forEach((o) => {
        const s = getSeats(o, 'total');
        if (s !== null) totalSeats = (totalSeats || 0) + s;
        const cut = getCutoff(o, 'UR', 1);
        if (cut && cut > topCutoff) topCutoff = cut;
      });
      map.set(c.id, { count: offs.length, totalSeats, topCutoff });
    });
    return map;
  }, [indices]);

  const totalSeatsAll = useMemo(() => {
    let sum = 0;
    collegeAgg.forEach((v) => { sum += v.totalSeats || 0; });
    return sum;
  }, [collegeAgg]);

  const totalProgramsCount = useMemo(() => {
    let count = 0;
    programs.forEach((p) => {
      const agg = programAgg.get(p.id);
      if (agg && agg.count > 0) count++;
    });
    return count;
  }, [programAgg]);

  const totalCollegesCount = useMemo(() => {
    let count = 0;
    colleges.forEach((c) => {
      const agg = collegeAgg.get(c.id);
      if (agg && agg.count > 0) count++;
    });
    return count;
  }, [collegeAgg]);

  const programList = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = programs
      .filter((p) => (group === 'all' || p.subjectGroup === group) && (!q || p.name.toLowerCase().includes(q)))
      .map((p) => ({
        ...p,
        ...(programAgg.get(p.id) || { count: 0, totalSeats: null, topCutoff: 0 }),
        eligibility: p.eligibility || getEligibilityForProgram(p.name),
      }))
      .filter((p) => p.count > 0);
    list.sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'cutoff') return b.topCutoff - a.topCutoff;
      if (sort === 'colleges') return b.count - a.count;
      return (b.totalSeats || 0) - (a.totalSeats || 0);
    });
    return list;
  }, [query, group, sort, programAgg]);

  const collegeList = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = colleges
      .filter((c) => (campus === 'all' || (campus === 'women' ? c.type === 'Women' : c.campus === campus)) && (!q || c.name.toLowerCase().includes(q)))
      .map((c) => ({ ...c, ...(collegeAgg.get(c.id) || { count: 0, totalSeats: null, topCutoff: 0 }) }))
      .filter((c) => c.count > 0);
    list.sort((a, b) => {
      const pa = a.campus === 'North' ? 1 : (a.campus === 'South' ? 2 : 3);
      const pb = b.campus === 'North' ? 1 : (b.campus === 'South' ? 2 : 3);
      if (pa !== pb) return pa - pb;
      if (sort === 'az') return a.name.localeCompare(b.name);
      if (sort === 'cutoff') return b.topCutoff - a.topCutoff;
      if (sort === 'colleges') return b.count - a.count;
      return (b.totalSeats || 0) - (a.totalSeats || 0);
    });
    return list;
  }, [query, campus, sort, collegeAgg]);

  const campusOptions = useMemo(() => {
    const set = new Set(colleges.map((c) => c.campus));
    return Array.from(set).filter((c) => c !== 'Various').sort();
  }, []);

  return (
    <div className="cf-wrap">
      <section className="cf-herowrap">
        {/* Background decoration */}
        <div className="cf-hero-bg" aria-hidden="true">
          <div className="cf-hero-blob cf-hero-blob-1" />
          <div className="cf-hero-blob cf-hero-blob-2" />
          <div className="cf-hero-blob cf-hero-blob-3" />
          <div className="cf-hero-grid" />
        </div>

        <div className="cf-hero-content">
          <span className="cf-herobadge">CSAS 2026 · Official seat matrix</span>
          <h1>DU Cutoff &amp;<br />Seat Explorer</h1>
          <p>Browse every Delhi University program and college. Tap a row for category-wise seats and cutoffs.</p>

        </div>
        <div className="cf-hero-illustration" aria-hidden="true">
          <svg viewBox="0 0 260 195" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer glow */}
            <ellipse cx="140" cy="100" rx="110" ry="90" fill="rgba(255,255,255,0.04)" />

            {/* Main card */}
            <rect x="10" y="15" width="175" height="130" rx="14" fill="white" fillOpacity="0.97" />
            <rect x="10" y="15" width="175" height="38" rx="14" fill="#2563eb" />
            <rect x="10" y="39" width="175" height="14" fill="#2563eb" />

            {/* Header text */}
            <rect x="24" y="26" width="72" height="7" rx="3.5" fill="white" fillOpacity="0.95" />
            <rect x="24" y="39" width="44" height="4.5" rx="2" fill="white" fillOpacity="0.45" />

            {/* Score ring */}
            <circle cx="168" cy="36" r="15" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
            <path d="M168 21 a15 15 0 0 1 13 7.5" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <text x="168" y="40" textAnchor="middle" fill="white" fontSize="8" fontWeight="800">917</text>

            {/* Separator */}
            <line x1="24" y1="66" x2="172" y2="66" stroke="#e2e8f0" strokeWidth="1" />

            {/* Row 1 */}
            <rect x="24" y="74" width="82" height="5.5" rx="2.75" fill="#1e3a8a" fillOpacity="0.14" />
            <rect x="116" y="74" width="20" height="5.5" rx="2.75" fill="#2563eb" fillOpacity="0.28" />
            <rect x="142" y="74" width="20" height="5.5" rx="2.75" fill="#2563eb" fillOpacity="0.18" />

            {/* Row 2 */}
            <rect x="24" y="88" width="68" height="5.5" rx="2.75" fill="#1e3a8a" fillOpacity="0.1" />
            <rect x="116" y="88" width="20" height="5.5" rx="2.75" fill="#7c3aed" fillOpacity="0.28" />
            <rect x="142" y="88" width="20" height="5.5" rx="2.75" fill="#7c3aed" fillOpacity="0.18" />

            {/* Row 3 — highlighted green */}
            <rect x="12" y="100" width="171" height="16" rx="0" fill="#f0fdf4" />
            <rect x="24" y="104" width="76" height="5.5" rx="2.75" fill="#16a34a" fillOpacity="0.35" />
            <rect x="116" y="104" width="20" height="5.5" rx="2.75" fill="#16a34a" fillOpacity="0.65" />
            <rect x="142" y="104" width="20" height="5.5" rx="2.75" fill="#16a34a" fillOpacity="0.45" />
            <text x="168" y="109" textAnchor="middle" fill="#16a34a" fontSize="8" fontWeight="800">✓</text>

            {/* Row 4 */}
            <rect x="24" y="124" width="58" height="5.5" rx="2.75" fill="#1e3a8a" fillOpacity="0.1" />
            <rect x="116" y="124" width="20" height="5.5" rx="2.75" fill="#2563eb" fillOpacity="0.22" />
            <rect x="142" y="124" width="20" height="5.5" rx="2.75" fill="#2563eb" fillOpacity="0.14" />

            {/* Score pill */}
            <rect x="30" y="154" width="118" height="22" rx="11" fill="white" fillOpacity="0.95" stroke="#2563eb" strokeWidth="1.5" />
            <text x="70" y="169" fill="#94a3b8" fontSize="7" fontWeight="500">Your CUET score…</text>
            <rect x="136" y="158" width="5" height="14" rx="1.5" fill="#2563eb" fillOpacity="0.6" />

            {/* Floating badges */}
            <rect x="192" y="22" width="58" height="26" rx="9" fill="white" fillOpacity="0.97" />
            <text x="221" y="33" textAnchor="middle" fill="#059669" fontSize="9" fontWeight="800">67</text>
            <text x="221" y="43" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="600">Colleges</text>

            <rect x="188" y="58" width="64" height="28" rx="9" fill="white" fillOpacity="0.97" />
            <text x="220" y="70" textAnchor="middle" fill="#2563eb" fontSize="9" fontWeight="800">66,333</text>
            <text x="220" y="80" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="600">Total Seats</text>

            <rect x="192" y="96" width="58" height="26" rx="9" fill="white" fillOpacity="0.97" />
            <text x="221" y="107" textAnchor="middle" fill="#7c3aed" fontSize="9" fontWeight="800">262</text>
            <text x="221" y="116" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="600">Programs</text>
          </svg>
        </div>
      </section>

      <div className="cf-statstrip">
        <div className="cf-kpi"><b>{totalProgramsCount}</b><span>Programs</span></div>
        <div className="cf-divider" />
        <div className="cf-kpi"><b>{totalCollegesCount}</b><span>Colleges</span></div>
        <div className="cf-divider" />
        <div className="cf-kpi"><b>{nf(totalSeatsAll)}</b><span>Seats</span></div>
        <div className="cf-divider" />
        <div className="cf-kpi"><b>{CATEGORIES.length}</b><span>Categories</span></div>
      </div>

      <div className="cf-seg" data-on={mode}>
        <button className={mode === 'program' ? 'on' : ''} onClick={() => { setMode('program'); setQuery(''); }}>Browse by Program</button>
        <button className={mode === 'college' ? 'on' : ''} onClick={() => { setMode('college'); setQuery(''); }}>Browse by College</button>
        <span className="cf-seg-knob" />
      </div>

      <div className="cf-controls">
        <input
          className="cf-search"
          placeholder={mode === 'program' ? 'Search programs…' : 'Search colleges…'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="cf-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="seats">Most seats</option>
          <option value="cutoff">Highest cutoff</option>
          <option value="colleges">{mode === 'program' ? 'Most colleges' : 'Most programs'}</option>
          <option value="az">A–Z</option>
        </select>
      </div>

      <div className="cf-filters">
        {mode === 'program' ? (
          <>
            <button className={'cf-chip ' + (group === 'all' ? 'on' : '')} onClick={() => setGroup('all')}>All</button>
            {Object.entries(SUBJECT_GROUPS).map(([k, v]) => (
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
        <div className="cf-count">Showing {mode === 'program' ? programList.length + ' programs' : collegeList.length + ' colleges'}</div>
        <SourceBadge date="CSAS 2026" />
      </div>

      <main className="cf-list">
        {mode === 'program'
          ? programList.map((p) => (
            <ListRow
              key={p.id}
              title={p.name}
              sub={p.subjectGroup}
              accent={groupColor(p.subjectGroup)}
              count={p.count}
              countLabel="colleges"
              seats={p.totalSeats}
              top={p.topCutoff}
              onOpen={() => setSelected({ mode: 'program', item: p })}
            />
          ))
          : collegeList.map((c) => (
            <ListRow
              key={c.id}
              title={c.name}
              sub={c.campus + ' · ' + c.type}
              accent="#2563eb"
              count={c.count}
              countLabel="programs"
              seats={c.totalSeats}
              top={c.topCutoff}
              onOpen={() => setSelected({ mode: 'college', item: c })}
            />
          ))}
        {((mode === 'program' && !programList.length) || (mode === 'college' && !collegeList.length)) && (
          <div className="cf-empty">Nothing matches that search.</div>
        )}
      </main>

      <footer className="cf-foot">
        <p>Official CSAS 2026 seat matrix and cutoff scores (Round 1-3 allocation, selectable in the detail view). "Highest cutoff" shown on each row is the UR (Unreserved) category cutoff at the toughest college or program in that group — tap a row to see every category and college. A "-" means that figure wasn't reported in the official data.</p>
      </footer>

      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        mode={selected?.mode}
        item={selected?.item}
        indices={indices}
      />
    </div>
  );
}
