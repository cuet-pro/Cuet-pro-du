import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { colleges } from '../data/colleges';
import { programs } from '../data/programs';
import { offerings, sportsQuota, getSportsForCollege, getEcaForCollege } from '../data/cutoffsData';
import { byRanking, getRank, NIRF_DATA, MARKET_RANKING_DATA, TOP_SCIENCE, TOP_COMMERCE, TOP_HUMANITIES } from '../data/rankingsData';
import './CollegeExplorer.css';

const TIER_COLORS = {
  'Tier 1': { color: '#b8860b', bg: 'rgba(184, 134, 11, 0.1)' },
  'Tier 2': { color: '#1e90ff', bg: 'rgba(30, 144, 255, 0.1)' },
  'Tier 3': { color: '#2e8b57', bg: 'rgba(46, 139, 87, 0.1)' },
  'Tier 4': { color: '#808080', bg: 'rgba(128, 128, 128, 0.1)' },
  'Tier 5': { color: '#a9a9a9', bg: 'rgba(169, 169, 169, 0.1)' },
};

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

function normName(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[()&,.'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function wordMatches(w, list) {
  // exact, prefix, or edit distance <= 1 (handles Venkateswara vs Venketeswara)
  return list.some(x => x === w || (w.length > 4 && (x.startsWith(w) || w.startsWith(x))) || (w.length > 4 && levenshtein(w, x) <= 1));
}

function findCollegeByName(name) {
  const target = normName(name);
  return colleges.find(col => {
    const c = normName(col.name);
    if (c === target) return true;
    const targetWords = target.split(' ');
    const cWords = c.split(' ');
    const shorter = targetWords.length <= cWords.length ? targetWords : cWords;
    const longer = targetWords.length <= cWords.length ? cWords : targetWords;
    // "lsr" is an abbreviation — allow it to match a word it abbreviates
    const abbrOk = shorter.every(w => wordMatches(w, longer) || (w.length === 3 && longer.some(l => l.startsWith(w) && l.length >= 4)));
    return shorter.length >= 2 && abbrOk;
  }) || null;
}

function RankingsStrip() {
  const [tab, setTab] = useState('market'); // 'nirf' | 'market'

  const data = tab === 'nirf' ? NIRF_DATA.slice(0, 10) : MARKET_RANKING_DATA.slice(0, 10);

  return (
    <div className="ce-rankings-strip">
      <div className="ce-rankings-head">
        <div className="ce-rankings-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#b45309' }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          Top Ranked Colleges
        </div>
        <div className="ce-rankings-tabs">
          <button className={`ce-rtab ${tab === 'market' ? 'on' : ''}`} onClick={() => setTab('market')}>Market</button>
          <button className={`ce-rtab ${tab === 'nirf' ? 'on' : ''}`} onClick={() => setTab('nirf')}>NIRF</button>
        </div>
      </div>
      <div className="ce-rankings-scroll">
        {data.map((item) => {
          const c = findCollegeByName(item.college);
          const id = c ? c.id : null;
          const tier = TIER_COLORS[item.tier?.split(' ')[0]];
          const row = (
            <div className="ce-rank-item" key={item.rank}>
              {getMedal(item.rank)}
              <CollegeImg src={`https://placehold.co/40x40?text=${encodeURIComponent(item.college.charAt(0))}`} alt={item.college} className="ce-rank-img" />
              <div className="ce-rank-info">
                <div className="ce-rank-name">{item.college.split(' (')[0]}</div>
                <div className="ce-rank-sub">
                  {tab === 'nirf' ? `#${item.indiaRank} India · ${item.score}` : item.tier}
                </div>
              </div>
            </div>
          );
          return id ? <Link key={item.rank} to={`/college/${id}`} className="ce-rank-item-link">{row}</Link> : <div key={item.rank} className="ce-rank-item-wrap">{row}</div>;
        })}
      </div>
      <div className="ce-bif-row">
        {[
          { label: 'Top Science', ids: TOP_SCIENCE, cls: 'bif-science' },
          { label: 'Top Commerce', ids: TOP_COMMERCE, cls: 'bif-commerce' },
          { label: 'Top Humanities', ids: TOP_HUMANITIES, cls: 'bif-humanities' },
        ].map(b => (
          <div className={`ce-bif-group ${b.cls}`} key={b.label}>
            <span className="ce-bif-label">{b.label}</span>
            <div className="ce-bif-chips">
              {b.ids.map(id => {
                const c = colleges.find(col => col.id === id);
                return c ? <Link key={id} to={`/college/${id}`} className="ce-bif-chip">{c.name.split(' (')[0]}</Link> : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
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

      <RankingsStrip />

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
                </button>
                <button className={`ce-view-btn ${viewMode === 'grid' ? 'on' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
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
