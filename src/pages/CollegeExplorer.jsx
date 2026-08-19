import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { colleges } from '../data/colleges';
import { programs } from '../data/programs';
import { offerings, sportsQuota, getSportsForCollege, getEcaForCollege } from '../data/cutoffsData';
import { byRanking, getRank } from '../data/rankingsData';
import './CollegeExplorer.css';

function getMedal(rank) {
  if (rank === 1) return <div className="rank-number rank-1">1</div>;
  if (rank === 2) return <div className="rank-number rank-2">2</div>;
  if (rank === 3) return <div className="rank-number rank-3">3</div>;
  return <div className="rank-number">{rank}</div>;
}

// Renders a college image with a letter-avatar fallback if the URL is broken/missing.
function CollegeImg({ src, alt, className }) {
  const fallback = `https://placehold.co/96x96?text=${encodeURIComponent((alt || '?').charAt(0).toUpperCase())}`;
  return (
    <img
      src={src && src.trim() ? src : fallback}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
      }}
    />
  );
}

export function CollegeExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [streamFilter, setStreamFilter] = useState('All');
  const [sportFilter, setSportFilter] = useState('All');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const [visibleCount, setVisibleCount] = useState(15);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const collegeStreams = useMemo(() => {
    const map = {};
    offerings.forEach(o => {
      const prog = programs.find(p => p.id === o.programId);
      if (prog && prog.subjectGroup) {
        if (!map[o.collegeId]) map[o.collegeId] = new Set();
        map[o.collegeId].add(prog.subjectGroup);
      }
    });
    return map;
  }, []);

  const filteredColleges = useMemo(() => {
    const list = colleges.filter(college => {
      if (searchQuery.trim() && !college.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (campusFilter !== 'All' && college.campus !== campusFilter) {
        return false;
      }
      if (typeFilter !== 'All' && college.type !== typeFilter) {
        return false;
      }
      if (streamFilter !== 'All') {
        const streams = collegeStreams[college.id];
        if (!streams || !streams.has(streamFilter)) return false;
      }
      if (sportFilter !== 'All') {
        const has = sportsQuota.some(s => s.collegeId === college.id && s.sport === sportFilter);
        if (!has) return false;
      }
      return true;
    });
    return list.slice().sort(byRanking);
  }, [searchQuery, campusFilter, typeFilter, streamFilter, sportFilter, collegeStreams]);

  useEffect(() => {
    setVisibleCount(15);
  }, [searchQuery, campusFilter, typeFilter, streamFilter, sportFilter]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 300) {
        if (!isLoadingMore && visibleCount < filteredColleges.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + 15);
            setIsLoadingMore(false);
          }, 2000);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredColleges.length, isLoadingMore, visibleCount]);

  const clearFilters = () => {
    setSearchQuery('');
    setCampusFilter('All');
    setTypeFilter('All');
    setStreamFilter('All');
    setSportFilter('All');
  };

  return (
    <div className="ce-container">
      <div className="ce-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="ce-hero" style={{ textAlign: 'left', marginBottom: 0 }}>
          <h1 className="ce-title" style={{ fontSize: '2rem' }}>Colleges &amp; Rankings</h1>
          <p className="ce-subtitle" style={{ margin: 0, maxWidth: '100%' }}>All DU colleges with market/NIRF rankings, quota seats and campus info. Tap any college for full details.</p>
        </div>

        <div className="ce-search-wrapper" style={{ flex: '1', minWidth: '280px', maxWidth: '420px' }}>
          <svg className="ce-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className="ce-search-input" 
            placeholder="Search colleges by name (e.g. Hindu)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ce-controls-container" style={{ padding: '1rem 1.5rem' }}>

        <div className="ce-filters-section">
          <div className="ce-filters-header" onClick={() => setIsFiltersOpen(!isFiltersOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span style={{ fontWeight: 600 }}>Filter Colleges</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="ce-view-toggle" onClick={(e) => e.stopPropagation()}>
                <button className={`ce-view-btn ${viewMode === 'list' ? 'on' : ''}`} onClick={() => setViewMode('list')} title="List view">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                  <span className="ce-view-label">List</span>
                </button>
                <button className={`ce-view-btn ${viewMode === 'grid' ? 'on' : ''}`} onClick={() => setViewMode('grid')} title="Thumbnail view">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  <span className="ce-view-label">Thumbnail</span>
                </button>
              </div>
              <svg 
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isFiltersOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          
          {isFiltersOpen && (
            <div className="ce-filters-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eaeaea' }}>
            <div className="ce-filter-group">
              <span className="ce-filter-label">Campus</span>
              <div className="ce-filter-chips">
                {['All', 'North', 'South', 'East', 'West', 'Central', 'Various'].map(c => (
                  <button key={c} className={`ce-chip ${campusFilter === c ? 'active' : ''}`} onClick={() => setCampusFilter(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="ce-filter-group">
              <span className="ce-filter-label">Type</span>
              <div className="ce-filter-chips">
                {['All', 'Co-ed', 'Women'].map(t => (
                  <button key={t} className={`ce-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="ce-filter-group">
              <span className="ce-filter-label">Stream</span>
              <div className="ce-filter-chips">
                {['All', 'Science', 'Commerce', 'Humanities'].map(s => (
                  <button key={s} className={`ce-chip ${streamFilter === s ? 'active' : ''}`} onClick={() => setStreamFilter(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="ce-filter-group">
              <span className="ce-filter-label">Sport (quota)</span>
              <select className="ce-sport-select" value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}>
                <option value="All">All sports</option>
                {Array.from(new Set(sportsQuota.map(s => s.sport))).sort().map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>
            </div>
          )}
        </div>
      </div>


      {filteredColleges.length > 0 ? (
        <>
          {viewMode === 'list' ? (
            <div className="ce-list">
              {filteredColleges.slice(0, visibleCount).map(college => {
                const rank = getRank(college.id);
                const sp = getSportsForCollege(college.id);
                const ec = getEcaForCollege(college.id);
                const sportsSeats = sp.reduce((s, r) => s + r.men + r.women, 0);
                const ecaSeats = ec.reduce((s, e) => s + e.seats, 0);
                return (
                  <Link to={`/college/${college.id}`} key={college.id} className="ce-row">
                    {rank ? <div className="ce-row-rank">{getMedal(rank)}</div> : <div className="ce-row-rank ce-row-rank-none">—</div>}
                    <CollegeImg src={college.imageUrl} alt={college.name} className="ce-row-img" />
                    <div className="ce-row-main">
                      <div className="ce-row-name">
                        {college.name}
                        <span className="ce-badge ce-badge-type">{college.type}</span>
                        <span className="ce-badge ce-badge-campus">{college.campus} Campus</span>
                      </div>
                      <div className="ce-row-sub">
                        {college.intro ? (college.intro.length > 90 ? college.intro.substring(0, 90) + '...' : college.intro) : '—'}
                      </div>
                    </div>
                    <div className="ce-row-stats">
                      {(sportsSeats > 0 || ecaSeats > 0) && (
                        <span className="ce-row-seats">🏅 {sportsSeats} · 🎭 {ecaSeats}</span>
                      )}
                    </div>
                    <div className="ce-row-go">›</div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="ce-grid ce-grid-compact">
              {filteredColleges.slice(0, visibleCount).map(college => {
                const rank = getRank(college.id);
                const sp = getSportsForCollege(college.id);
                const ec = getEcaForCollege(college.id);
                const sportsSeats = sp.reduce((s, r) => s + r.men + r.women, 0);
                const ecaSeats = ec.reduce((s, e) => s + e.seats, 0);
                return (
                  <Link to={`/college/${college.id}`} key={college.id} className="ce-card ce-card-compact">
                    <div className="ce-card-top">
                      <CollegeImg src={college.imageUrl} alt={college.name} className="ce-card-logo" />
                      {rank && <span className="ce-badge ce-badge-rank">#{rank}</span>}
                    </div>
                    <h3 className="ce-card-cname">{college.name.split(' (')[0]}</h3>
                    <div className="ce-card-meta">{college.campus} · {college.type}</div>
                    {(sportsSeats > 0 || ecaSeats > 0) && (
                      <div className="ce-card-seats">🏅 {sportsSeats} · 🎭 {ecaSeats}</div>
                    )}
                    <span className="ce-card-link">View Details ›</span>
                  </Link>
                );
              })}
            </div>
          )}
          
          {isLoadingMore && (
            <div className="ce-loading-spinner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0', gap: '1rem' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #38D990', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Loading more colleges...</span>
            </div>
          )}
        </>
      ) : (
        <div className="ce-empty-state">
          <div className="ce-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <p className="ce-empty-text">No colleges found matching your criteria.</p>
          <button className="ce-clear-btn" onClick={clearFilters}>Clear all filters</button>
        </div>
      )}
    </div>
  );
}
