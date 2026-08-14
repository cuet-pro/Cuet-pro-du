import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { colleges } from '../data/colleges';
import { sportsQuota, ecaQuota, getSportsForCollege, getEcaForCollege } from '../data/cutoffsData';
import { SourceBadge } from '../components/SourceBadge';
import './Quota.css';

function nf(n) {
  return (n || 0).toLocaleString('en-IN');
}

/* =========================================================================
   Sports & ECA Quota Explorer
   By College — pick a college, see its sports + ECA quota tables.
   By Sport / By Activity — pick a sport/activity, see which colleges
   offer it and how many seats.
   ========================================================================= */

export function Quota() {
  const [tab, setTab] = useState('college');
  const [collegeId, setCollegeId] = useState(colleges[0]?.id || '');
  const [sport, setSport] = useState('');
  const [activity, setActivity] = useState('');
  const [search, setSearch] = useState('');

  const college = colleges.find((c) => c.id === collegeId);

  const sportsList = useMemo(() => {
    const set = new Set(sportsQuota.map((s) => s.sport));
    return Array.from(set).sort();
  }, []);

  const activityList = useMemo(() => {
    const set = new Set(ecaQuota.map((e) => e.activity));
    return Array.from(set).sort();
  }, []);

  const collegesWithSports = useMemo(() => {
    const ids = new Set(sportsQuota.map((s) => s.collegeId));
    return colleges.filter((c) => ids.has(c.id));
  }, []);

  const collegesWithEca = useMemo(() => {
    const ids = new Set(ecaQuota.map((e) => e.collegeId));
    return colleges.filter((c) => ids.has(c.id));
  }, []);

  const filteredColleges = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  const totalSportsSeats = useMemo(
    () => sportsQuota.reduce((s, r) => s + r.men + r.women, 0),
    []
  );
  const totalEcaSeats = useMemo(() => ecaQuota.reduce((s, r) => s + r.seats, 0), []);

  // By-college view
  const sportsRows = college ? getSportsForCollege(college.id) : [];
  const ecaRows = college ? getEcaForCollege(college.id) : [];

  // By-sport view
  const sportRows = useMemo(() => {
    if (!sport) return [];
    return sportsQuota
      .filter((r) => r.sport === sport)
      .map((r) => ({ ...r, college: colleges.find((c) => c.id === r.collegeId) || null }))
      .sort((a, b) => (b.men + b.women) - (a.men + a.women));
  }, [sport]);

  // By-activity view
  const activityRows = useMemo(() => {
    if (!activity) return [];
    return ecaQuota
      .filter((r) => r.activity === activity)
      .map((r) => ({ ...r, college: colleges.find((c) => c.id === r.collegeId) || null }))
      .sort((a, b) => b.seats - a.seats);
  }, [activity]);

  return (
    <div className="q-wrap">
      {/* Hero */}
      <section className="q-hero">
        <div className="q-hero-content">
          <span className="q-hero-badge">DU Admissions 2026-27 · Supernumerary Quota</span>
          <h1>Sports &amp; ECA <span className="q-hero-accent">Quota</span></h1>
          <p>
            Supernumerary seats reserved under DU Sports and Extra-Curricular Activities (ECA)
            admissions — college-wise and sport-wise. No CUET score needed for these seats.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <div className="q-stats">
        <div className="q-kpi"><b>{collegesWithSports.length}</b><span>Colleges with Sports quota</span></div>
        <div className="q-kpi"><b>{sportsList.length}</b><span>Sports</span></div>
        <div className="q-kpi"><b>{nf(totalSportsSeats)}</b><span>Sports seats</span></div>
        <div className="q-kpi"><b>{collegesWithEca.length}</b><span>Colleges with ECA quota</span></div>
        <div className="q-kpi"><b>{activityList.length}</b><span>ECA activities</span></div>
        <div className="q-kpi"><b>{nf(totalEcaSeats)}</b><span>ECA seats</span></div>
      </div>

      {/* Tabs */}
      <div className="q-tabs" data-on={tab}>
        <button className={tab === 'college' ? 'on' : ''} onClick={() => setTab('college')}>By College</button>
        <button className={tab === 'sport' ? 'on' : ''} onClick={() => setTab('sport')}>By Sport</button>
        <button className={tab === 'eca' ? 'on' : ''} onClick={() => setTab('eca')}>By ECA Activity</button>
        <span className="q-tabs-knob" />
      </div>

      {/* Tab: By College */}
      {tab === 'college' && (
        <div className="q-panel">
          <div className="q-controls">
            <div className="q-search-wrap">
              <svg className="q-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                className="q-search"
                placeholder="Search college by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="q-select" value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
              {filteredColleges.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {college && (
            <>
              <div className="q-college-head">
                <h2>{college.name}</h2>
                <div className="q-college-meta">
                  <span>{college.campus} Campus</span>
                  <span>{college.type}</span>
                  <Link to={`/college/${college.id}`} className="q-view-link">View full college →</Link>
                </div>
              </div>

              {sportsRows.length > 0 ? (
                <div className="q-table-card">
                  <div className="q-table-head">
                    <h3>🏅 Sports Quota <SourceBadge date="06 Jul 2026" /></h3>
                    <span className="q-total">{nf(sportsRows.reduce((s, r) => s + r.men + r.women, 0))} seats</span>
                  </div>
                  <div className="q-table-wrap">
                    <table className="q-table">
                      <thead>
                        <tr><th>Sport</th><th>Men</th><th>Women</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {sportsRows.map((r) => (
                          <tr key={r.sport}>
                            <td>{r.sport}</td>
                            <td>{r.men}</td>
                            <td>{r.women}</td>
                            <td><b>{r.men + r.women}</b></td>
                          </tr>
                        ))}
                        <tr className="q-total-row">
                          <td><b>Total</b></td>
                          <td><b>{sportsRows.reduce((s, r) => s + r.men, 0)}</b></td>
                          <td><b>{sportsRows.reduce((s, r) => s + r.women, 0)}</b></td>
                          <td><b>{sportsRows.reduce((s, r) => s + r.men + r.women, 0)}</b></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="q-empty">No sports quota data for this college.</div>
              )}

              {ecaRows.length > 0 ? (
                <div className="q-table-card">
                  <div className="q-table-head">
                    <h3>🎭 ECA Quota <SourceBadge date="27 Jun 2026" /></h3>
                    <span className="q-total">{nf(ecaRows.reduce((s, r) => s + r.seats, 0))} seats</span>
                  </div>
                  <div className="q-table-wrap">
                    <table className="q-table">
                      <thead>
                        <tr><th>Activity</th><th>Seats</th></tr>
                      </thead>
                      <tbody>
                        {ecaRows.map((r) => (
                          <tr key={r.activity}>
                            <td>{r.activity}</td>
                            <td>{r.seats}</td>
                          </tr>
                        ))}
                        <tr className="q-total-row">
                          <td><b>Total</b></td>
                          <td><b>{ecaRows.reduce((s, r) => s + r.seats, 0)}</b></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="q-empty">No ECA quota data for this college.</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: By Sport */}
      {tab === 'sport' && (
        <div className="q-panel">
          <div className="q-controls">
            <select className="q-select q-select-wide" value={sport} onChange={(e) => setSport(e.target.value)}>
              <option value="">Select a sport…</option>
              {sportsList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {sport && (
            sportRows.length > 0 ? (
              <div className="q-table-card">
                <div className="q-table-head">
                  <h3>🏅 {sport} — colleges offering seats</h3>
                  <span className="q-total">{nf(sportRows.reduce((s, r) => s + r.men + r.women, 0))} seats across {sportRows.length} colleges</span>
                </div>
                <div className="q-table-wrap">
                  <table className="q-table">
                    <thead>
                      <tr><th>College</th><th>Campus</th><th>Men</th><th>Women</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {sportRows.map((r) => (
                        <tr key={r.collegeId}>
                          <td>
                            {r.college
                              ? <Link to={`/college/${r.college.id}`} className="q-college-link">{r.college.name}</Link>
                              : r.collegeName}
                          </td>
                          <td>{r.college?.campus || '—'}</td>
                          <td>{r.men}</td>
                          <td>{r.women}</td>
                          <td><b>{r.men + r.women}</b></td>
                        </tr>
                      ))}
                      <tr className="q-total-row">
                        <td><b>Total</b></td>
                        <td>—</td>
                        <td><b>{sportRows.reduce((s, r) => s + r.men, 0)}</b></td>
                        <td><b>{sportRows.reduce((s, r) => s + r.women, 0)}</b></td>
                        <td><b>{sportRows.reduce((s, r) => s + r.men + r.women, 0)}</b></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="q-empty">No colleges offer this sport in the quota data.</div>
            )
          )}
        </div>
      )}

      {/* Tab: By ECA Activity */}
      {tab === 'eca' && (
        <div className="q-panel">
          <div className="q-controls">
            <select className="q-select q-select-wide" value={activity} onChange={(e) => setActivity(e.target.value)}>
              <option value="">Select an activity…</option>
              {activityList.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          {activity && (
            activityRows.length > 0 ? (
              <div className="q-table-card">
                <div className="q-table-head">
                  <h3>🎭 {activity} — colleges offering seats</h3>
                  <span className="q-total">{nf(activityRows.reduce((s, r) => s + r.seats, 0))} seats across {activityRows.length} colleges</span>
                </div>
                <div className="q-table-wrap">
                  <table className="q-table">
                    <thead>
                      <tr><th>College</th><th>Campus</th><th>Seats</th></tr>
                    </thead>
                    <tbody>
                      {activityRows.map((r) => (
                        <tr key={r.collegeId}>
                          <td>
                            {r.college
                              ? <Link to={`/college/${r.college.id}`} className="q-college-link">{r.college.name}</Link>
                              : r.collegeName}
                          </td>
                          <td>{r.college?.campus || '—'}</td>
                          <td><b>{r.seats}</b></td>
                        </tr>
                      ))}
                      <tr className="q-total-row">
                        <td><b>Total</b></td>
                        <td>—</td>
                        <td><b>{activityRows.reduce((s, r) => s + r.seats, 0)}</b></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="q-empty">No colleges offer this activity in the quota data.</div>
            )
          )}
        </div>
      )}

      <footer className="q-foot">
        <p>Sports and ECA seats are supernumerary — they are <b>additional</b> to the regular academic seats and are filled through DU's separate Sports/ECA admission trial process, not through CUET scores. Source: DU CSAS 2026 official seat matrix.</p>
      </footer>
    </div>
  );
}
