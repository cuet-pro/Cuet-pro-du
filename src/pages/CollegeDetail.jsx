import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { colleges } from '../data/colleges';
import { programs } from '../data/programs';
import {
  offerings,
  CATEGORIES,
  ROUNDS,
  getCutoff,
  getSeats,
  getSportsForCollege,
  getEcaForCollege,
} from '../data/cutoffsData';
import { SourceBadge } from '../components/SourceBadge';
import './CollegeDetail.css';

const getStreamGroup = (subjectGroup) => {
  if (!subjectGroup) return 'Others';
  if (subjectGroup.includes('Science')) return 'Science';
  if (subjectGroup.includes('Commerce')) return 'Commerce';
  if (subjectGroup.includes('Humanities') || subjectGroup.includes('Arts') || subjectGroup.includes('Social')) return 'Humanities';
  return 'Others';
};

const avatarColors = ['#2563eb','#059669','#7c3aed','#e11d48','#d97706','#0891b2'];
const getAvatarColor = (name) => avatarColors[name.charCodeAt(0) % avatarColors.length];
const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const CATEGORY_LABELS = {
  UR: 'UR',
  OBC: 'OBC-NCL',
  SC: 'SC',
  ST: 'ST',
  EWS: 'EWS',
  PwBD: 'PwBD',
};

export function CollegeDetail() {
  const { id } = useParams();
  const college = useMemo(() => colleges.find(c => c.id === id), [id]);

  const collegeOfferings = useMemo(() => {
    if (!college) return [];
    return offerings
      .filter(o => o.collegeId === id)
      .map(o => {
        const program = programs.find(p => p.id === o.programId);
        return {
          ...o,
          programDetails: program || {}
        };
      });
  }, [id, college]);

  const sports = useMemo(() => (college ? getSportsForCollege(college.id) : []), [college]);
  const eca = useMemo(() => (college ? getEcaForCollege(college.id) : []), [college]);

  const groupedOfferings = useMemo(() => {
    const groups = { Science: [], Commerce: [], Humanities: [], Others: [] };
    collegeOfferings.forEach(off => {
      const stream = getStreamGroup(off.programDetails.subjectGroup);
      groups[stream].push(off);
    });
    return groups;
  }, [collegeOfferings]);

  const [expandedCourseIds, setExpandedCourseIds] = useState({});
  const [round, setRound] = useState(1);

  const toggleAccordion = (courseId) => {
    setExpandedCourseIds(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  if (!college) {
    return (
      <div className="container cd-not-found">
        <h2>College not found</h2>
        <Link to="/colleges" className="cd-back-link">Back to Colleges</Link>
      </div>
    );
  }

  const totalCollegeSeats = collegeOfferings.reduce((sum, o) => {
    const t = getSeats(o, 'total');
    return sum + (t || 0);
  }, 0);
  const totalCourses = collegeOfferings.length;
  const heroImageUrl = college.imageUrl || `https://placehold.co/1200x500?text=${encodeURIComponent(college.name)}`;
  const sportsTotal = sports.reduce((sum, s) => sum + s.men + s.women, 0);
  const ecaTotal = eca.reduce((sum, e) => sum + e.seats, 0);

  return (
    <div className="college-detail-container">
      {/* 1. Dynamic Hero Section */}
      <section className="cd-hero-section" style={{ backgroundImage: `url(${heroImageUrl})` }}>
        <div className="cd-hero-overlay"></div>
        <div className="cd-hero-content">
          <Link to="/colleges" className="cd-back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Explore
          </Link>
          <h1 className="cd-hero-title">{college.name}</h1>
          <div className="cd-hero-meta">
            <span className="cd-meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {college.campus} Campus
            </span>
            <span className="cd-meta-divider">•</span>
            <span className="cd-meta-item">{college.type}</span>
          </div>
        </div>
      </section>

      <div className="cd-main-content">
        {/* 2. Premium Quick Stats */}
        <section className="cd-stats-row">
          <div className="cd-stat-card">
            <div className="cd-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div className="cd-stat-info">
              <span className="cd-stat-value">{totalCollegeSeats.toLocaleString('en-IN')}</span>
              <span className="cd-stat-label">Total Seats</span>
            </div>
          </div>

          <div className="cd-stat-card">
            <div className="cd-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            </div>
            <div className="cd-stat-info">
              <span className="cd-stat-value">{totalCourses}</span>
              <span className="cd-stat-label">Courses Offered</span>
            </div>
          </div>

          {sports.length > 0 && (
            <div className="cd-stat-card">
              <div className="cd-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><line x1="2" y1="12" x2="22" y2="12"></line></svg>
              </div>
              <div className="cd-stat-info">
                <span className="cd-stat-value">{sportsTotal}</span>
                <span className="cd-stat-label">Sports Seats</span>
              </div>
            </div>
          )}

          {eca.length > 0 && (
            <div className="cd-stat-card">
              <div className="cd-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v10"></path><path d="M5 8h14"></path><path d="M5 13h14"></path><circle cx="12" cy="16" r="5"></circle></svg>
              </div>
              <div className="cd-stat-info">
                <span className="cd-stat-value">{ecaTotal}</span>
                <span className="cd-stat-label">ECA Seats</span>
              </div>
            </div>
          )}

          <a href={college.officialWebsite} target="_blank" rel="noopener noreferrer" className="cd-stat-card cd-website-card">
            <div className="cd-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            </div>
            <div className="cd-stat-info">
              <span className="cd-stat-value">Official Website</span>
              <span className="cd-stat-label">Visit portal ↗</span>
            </div>
          </a>
        </section>

        {/* Introduction */}
        <section className="cd-intro-section">
          <h2 className="cd-section-title">About College</h2>
          <p className="cd-intro-text">{college.intro}</p>

          {college.facilities && college.facilities.length > 0 && (
            <div className="cd-facilities-container">
              <h3 className="cd-facilities-title">Key Facilities</h3>
              <div className="cd-facilities-list">
                {college.facilities.map(facility => (
                  <span key={facility} className="cd-facility-pill">
                    {facility === 'Hostel' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>}
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 3. Courses Accordion */}
        <section className="cd-courses-section">
          <h2 className="cd-section-title">Programs &amp; Cutoffs</h2>

          {['Science', 'Commerce', 'Humanities', 'Others'].map(stream => {
            const courses = groupedOfferings[stream];
            if (courses.length === 0) return null;

            return (
              <div key={stream} className="cd-stream-group">
                <h3 className="cd-stream-title">{stream} Programs</h3>

                <div className="cd-accordion-container">
                  {courses.map(offering => {
                    const isExpanded = !!expandedCourseIds[offering.programId];
                    const hasAnyRound = ROUNDS.some(r => CATEGORIES.some(cat => getCutoff(offering, cat, r) !== null));

                    return (
                      <div key={offering.programId} className={`cd-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                        <div className="cd-accordion-header" onClick={() => toggleAccordion(offering.programId)}>
                          <div className="cd-course-title-wrapper">
                            <span className="cd-course-name">{offering.programDetails.name}</span>
                            <span className="cd-course-seats-badge">{getSeats(offering, 'total') ?? 0} Seats</span>
                          </div>
                          <div className={`cd-accordion-icon ${isExpanded ? 'rotated' : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="cd-accordion-body">
                            <div className="cd-details-grid">
                              <div className="cd-detail-card">
                                <h4>Seat Matrix <SourceBadge date="CSAS 2026" /></h4>
                                <div className="cd-matrix-tags">
                                  {Object.entries(offering.seats || {}).map(([category, seats]) => {
                                    if (seats === null || seats === undefined) return null;
                                    return (
                                      <div key={category} className="cd-matrix-tag">
                                        <span className="cat">{category === 'total' ? 'Total' : category}</span>
                                        <span className="val">{seats}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="cd-detail-card cd-eligibility-card">
                                <h4>Eligibility Criteria</h4>
                                <p>{offering.programDetails.eligibility || 'See CSAS Bulletin of Information.'}</p>
                              </div>
                            </div>

                            {hasAnyRound && (
                              <div className="cd-detail-card cd-cutoffs-card">
                                <div className="cd-cutoffs-head">
                                  <h4>Category-wise Cutoffs <SourceBadge date="CSAS 2026" /></h4>
                                  <div className="cd-rounds" role="group" aria-label="Allocation round">
                                    {ROUNDS.map(r => (
                                      <button key={r} className={`cd-round ${round === r ? 'on' : ''}`} onClick={() => setRound(r)}>
                                        Round {r}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="cd-table-responsive">
                                  <table className="cd-premium-table">
                                    <thead>
                                      <tr>
                                        {CATEGORIES.map(cat => <th key={cat}>{CATEGORY_LABELS[cat] || cat}</th>)}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        {CATEGORIES.map(cat => {
                                          const v = getCutoff(offering, cat, round);
                                          return <td key={cat}>{v !== null ? v.toFixed(1) : '-'}</td>;
                                        })}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* Sports Quota */}
        {sports.length > 0 && (
          <section className="cd-sports-section">
            <h2 className="cd-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-blue)' }}><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><line x1="2" y1="12" x2="22" y2="12"></line></svg>
              Sports Quota <SourceBadge date="06 Jul 2026" />
            </h2>
            <p className="cd-sports-sub">Supernumerary sports seats under DU Sports Admissions 2026-27</p>
            <div className="cd-table-responsive">
              <table className="cd-premium-table">
                <thead>
                  <tr>
                    <th>Sport</th>
                    <th>Men</th>
                    <th>Women</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sports.map(s => (
                    <tr key={s.sport}>
                      <td>{s.sport}</td>
                      <td>{s.men}</td>
                      <td>{s.women}</td>
                      <td>{s.men + s.women}</td>
                    </tr>
                  ))}
                  <tr className="cd-quota-total">
                    <td><strong>Total</strong></td>
                    <td><strong>{sports.reduce((x, s) => x + s.men, 0)}</strong></td>
                    <td><strong>{sports.reduce((x, s) => x + s.women, 0)}</strong></td>
                    <td><strong>{sportsTotal}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ECA Quota */}
        {eca.length > 0 && (
          <section className="cd-eca-section">
            <h2 className="cd-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-blue)' }}><path d="M12 3v10"></path><path d="M5 8h14"></path><path d="M5 13h14"></path><circle cx="12" cy="16" r="5"></circle></svg>
              ECA Quota <SourceBadge date="27 Jun 2026" />
            </h2>
            <p className="cd-eca-sub">Extra-Curricular Activities seats under DU ECA Admissions 2026-27</p>
            <div className="cd-table-responsive">
              <table className="cd-premium-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Seats</th>
                  </tr>
                </thead>
                <tbody>
                  {eca.map(e => (
                    <tr key={e.activity}>
                      <td>{e.activity}</td>
                      <td>{e.seats}</td>
                    </tr>
                  ))}
                  <tr className="cd-quota-total">
                    <td><strong>Total</strong></td>
                    <td><strong>{ecaTotal}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 4. Subject Combination */}
        <section className="cd-subject-combination-section">
          <h2 className="cd-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-blue)' }}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            Subject Combinations
          </h2>
          <div className="cd-subject-combo-grid">
            <div className="cd-subject-card">
              <div className="cd-subject-icon science">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <div className="cd-subject-content">
                <h3>Science Programs</h3>
                <p><strong>Option 1:</strong> 1 Language + Physics + Chemistry + Mathematics</p>
                <p><strong>Option 2:</strong> 1 Language + Physics + Chemistry + Biology</p>
              </div>
            </div>

            <div className="cd-subject-card">
              <div className="cd-subject-icon commerce">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
              <div className="cd-subject-content">
                <h3>Commerce Programs</h3>
                <p><strong>Option 1:</strong> 1 Language + Accountancy + Any 2 Subjects</p>
                <p><strong>Option 2:</strong> 1 Language + Mathematics + Any 2 Subjects</p>
              </div>
            </div>

            <div className="cd-subject-card">
              <div className="cd-subject-icon humanities">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="5"></circle><path d="M3 21v-2a7 7 0 0 1 14 0v2"></path></svg>
              </div>
              <div className="cd-subject-content">
                <h3>Humanities Programs</h3>
                <p><strong>Option 1:</strong> 1 Language + Any 3 Subjects from Section II</p>
                <p><strong>Option 2:</strong> 1 Language + 1 Subject from Section II + General Test</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section A - Notable Alumni */}
        <section className="cd-alumni-section">
          <h2 className="cd-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-blue)' }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            Notable Alumni
          </h2>
          <div className="cd-alumni-scroll">
            {(!college.notableAlumni || college.notableAlumni.length === 0) ? (
              <div className="cd-alumni-card cd-alumni-placeholder">
                Alumni data being compiled
              </div>
            ) : (
              college.notableAlumni.map((alumni, idx) => (
                <div key={idx} className="cd-alumni-card">
                  <div className="cd-alumni-avatar" style={{ backgroundColor: getAvatarColor(alumni.name) }}>
                    {getInitials(alumni.name)}
                  </div>
                  <div className="cd-alumni-name">{alumni.name}</div>
                  <div className="cd-alumni-field">{alumni.field}</div>
                  <div className="cd-alumni-year">{alumni.year}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section B - Societies & Clubs */}
        <section className="cd-societies-section">
          <h2 className="cd-section-title">Societies &amp; Clubs</h2>
          <div className="cd-societies-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(!college.societies || college.societies.length === 0) ? (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Society info coming soon</span>
            ) : (
              college.societies.map((soc, idx) => (
                <span key={idx} className="cd-society-pill">
                  {soc}
                </span>
              ))
            )}
          </div>
        </section>

        {/* Section C - Annual Fests */}
        <section className="cd-fests-section">
          <h2 className="cd-section-title">Annual Fests</h2>
          <div className="cd-fests-grid">
            {(!college.fests || college.fests.length === 0) ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1rem', color: '#94a3b8' }}>Fest data being updated</div>
            ) : (
              college.fests.map((fest, idx) => {
                let badgeBg = '#f1f5f9';
                let badgeColor = '#475569';
                if (fest.type === 'Cultural') { badgeBg = '#f5f3ff'; badgeColor = '#7c3aed'; }
                else if (fest.type === 'Literary') { badgeBg = '#ecfdf5'; badgeColor = '#059669'; }
                else if (fest.type === 'Sports') { badgeBg = '#fff1f2'; badgeColor = '#e11d48'; }
                else if (fest.type === 'Commerce & Management') { badgeBg = '#fffbeb'; badgeColor = '#d97706'; }
                else if (fest.type === 'Music' || fest.type === 'Debate' || fest.type === 'Social' || fest.type === 'Humanities') { badgeBg = '#eff6ff'; badgeColor = '#2563eb'; }

                return (
                  <div key={idx} className="cd-fest-card">
                    <div className="cd-fest-name">{fest.name}</div>
                    <div className="cd-fest-meta">
                      <span className="cd-fest-type-badge" style={{ backgroundColor: badgeBg, color: badgeColor }}>{fest.type}</span>
                      <span className="cd-fest-month">{fest.month}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Section D - Nearest Metro */}
        <section className="cd-metro-section" style={{ marginBottom: '2rem' }}>
          <h2 className="cd-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}><rect x="4" y="3" width="16" height="16" rx="2" ry="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="M8 19l-2 3"></path><path d="M18 22l-2-3"></path><path d="M8 15h.01"></path><path d="M16 15h.01"></path></svg>
            Getting There
          </h2>
          <div className="cd-metro-card">
            {(!college.nearestMetro || college.nearestMetro.station === "Check college website") ? (
              <div style={{ color: 'var(--text-muted)' }}>Metro info not available — check Google Maps</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="cd-metro-station">{college.nearestMetro.station}</div>
                <div className="cd-metro-details">
                  <span className="cd-metro-line-pill" style={{ backgroundColor: `${college.nearestMetro.lineColor}15`, color: college.nearestMetro.lineColor, border: `1px solid ${college.nearestMetro.lineColor}40` }}>
                    {college.nearestMetro.line}
                  </span>
                  <span className="cd-metro-walk">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    {college.nearestMetro.walkTime}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
