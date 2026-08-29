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
  const [sport, setSport] = useState('');
  const [activity, setActivity] = useState('');
  const [search, setSearch] = useState('');
  const [expandedCollege, setExpandedCollege] = useState(null);

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

  // Colleges that have sports OR ECA quota — shown as an expandable list
  const quotaColleges = useMemo(() => {
    const ids = new Set([
      ...sportsQuota.map((s) => s.collegeId),
      ...ecaQuota.map((e) => e.collegeId),
    ]);
    return colleges
      .filter((c) => ids.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const totalSportsSeats = useMemo(
    () => sportsQuota.reduce((s, r) => s + r.men + r.women, 0),
    []
  );
  const totalEcaSeats = useMemo(() => ecaQuota.reduce((s, r) => s + r.seats, 0), []);

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
        <div className="q-kpi"><b>{nf(totalSportsSeats)}</b><span>Sports seats</span></div>
        <div className="q-kpi"><b>{nf(totalEcaSeats)}</b><span>ECA seats</span></div>
      </div>

      {/* Tabs */}
      <div className="q-tabs" data-on={tab}>
        <button className={tab === 'college' ? 'on' : ''} onClick={() => setTab('college')}>By College</button>
        <button className={tab === 'sport' ? 'on' : ''} onClick={() => setTab('sport')}>By Sport</button>
        <button className={tab === 'eca' ? 'on' : ''} onClick={() => setTab('eca')}>By ECA Activity</button>
        <span className="q-tabs-knob" />
      </div>

      {/* Tab: By College — expandable list of colleges with sports/ECA quota */}
      {tab === 'college' && (
        <div className="q-panel">
          <div className="q-list-search">
            <div className="q-search-wrap">
              <svg className="q-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                className="q-search"
                placeholder="Search college by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="q-list">
            {quotaColleges
              .filter((c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase()))
              .map((c) => {
                const sp = getSportsForCollege(c.id);
                const ec = getEcaForCollege(c.id);
                const open = expandedCollege === c.id;
                const spTotal = sp.reduce((s, r) => s + r.men + r.women, 0);
                const ecTotal = ec.reduce((s, r) => s + r.seats, 0);
                return (
                  <div key={c.id} className={`q-list-item ${open ? 'open' : ''}`}>
                    <div
                      className="q-list-head"
                      onClick={() => setExpandedCollege(open ? null : c.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={open}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedCollege(open ? null : c.id); } }}
                    >
                      <div className="q-list-name-wrap">
                        <span className="q-list-name">{c.name}</span>
                        <span className="q-list-meta">{c.campus} Campus · {c.type}</span>
                      </div>
                      <div className="q-list-tags">
                        {sp.length > 0 && <span className="q-tag q-tag-sports">🏅 {nf(spTotal)} sports seats</span>}
                        {ec.length > 0 && <span className="q-tag q-tag-eca">🎭 {nf(ecTotal)} ECA seats</span>}
                      </div>
                      <span className="q-list-arrow">{open ? '▲' : '▼'}</span>
                    </div>

                    {open && (
                      <div className="q-list-body">
                        {sp.length > 0 ? (
                          <div className="q-table-card">
                            <div className="q-table-head">
                              <h3>🏅 Sports Quota <SourceBadge date="06 Jul 2026" /></h3>
                              <span className="q-total">{nf(spTotal)} seats</span>
                            </div>
                            <div className="q-table-wrap">
                              <table className="q-table">
                                <thead>
                                  <tr><th>Sport</th><th>Men</th><th>Women</th><th>Total</th></tr>
                                </thead>
                                <tbody>
                                  {sp.map((r) => (
                                    <tr key={r.sport}>
                                      <td>{r.sport}</td>
                                      <td>{r.men}</td>
                                      <td>{r.women}</td>
                                      <td><b>{r.men + r.women}</b></td>
                                    </tr>
                                  ))}
                                  <tr className="q-total-row">
                                    <td><b>Total</b></td>
                                    <td><b>{sp.reduce((s, r) => s + r.men, 0)}</b></td>
                                    <td><b>{sp.reduce((s, r) => s + r.women, 0)}</b></td>
                                    <td><b>{spTotal}</b></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="q-empty">No sports quota data for this college.</div>
                        )}

                        {ec.length > 0 ? (
                          <div className="q-table-card">
                            <div className="q-table-head">
                              <h3>🎭 ECA Quota <SourceBadge date="27 Jun 2026" /></h3>
                              <span className="q-total">{nf(ecTotal)} seats</span>
                            </div>
                            <div className="q-table-wrap">
                              <table className="q-table">
                                <thead>
                                  <tr><th>Activity</th><th>Seats</th></tr>
                                </thead>
                                <tbody>
                                  {ec.map((r) => (
                                    <tr key={r.activity}>
                                      <td>{r.activity}</td>
                                      <td>{r.seats}</td>
                                    </tr>
                                  ))}
                                  <tr className="q-total-row">
                                    <td><b>Total</b></td>
                                    <td><b>{ecTotal}</b></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="q-empty">No ECA quota data for this college.</div>
                        )}

                        <Link to={`/college/${c.id}`} className="q-view-link">View full college →</Link>
                      </div>
                    )}
                  </div>
                );
              })}

            {quotaColleges.filter((c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase())).length === 0 && (
              <div className="q-empty">No colleges match that search.</div>
            )}
          </div>
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
