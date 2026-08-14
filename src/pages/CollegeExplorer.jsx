import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { colleges } from '../data/colleges';
import { programs } from '../data/programs';
import { offerings, sportsQuota, getSportsForCollege } from '../data/cutoffsData';
import { byRanking, getRank } from '../data/rankingsData';
import './CollegeExplorer.css';

export function CollegeExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [streamFilter, setStreamFilter] = useState('All');
  const [sportFilter, setSportFilter] = useState('All');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const [visibleCount, setVisibleCount] = useState(12);
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

  const topPicks = {
    Science: ["miranda-house-w", "hindu-college", "hansraj-college", "sri-venketeswara-college"],
    Commerce: ["shri-ram-college-of-commerce", "sri-guru-gobind-singh-college-of-commerce", "shaheed-sukhdev-college-business-studies", "hansraj-college"],
    Humanities: ["lady-shri-ram-college-for-women-w", "miranda-house-w", "indraprastha-college-for-women-w", "ramjas-college"]
  };

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
    // Ranking-wise sort: ranked colleges first (by market rank), rest alphabetical
    return list.slice().sort(byRanking);
  }, [searchQuery, campusFilter, typeFilter, streamFilter, sportFilter, collegeStreams]);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, campusFilter, typeFilter, streamFilter, sportFilter]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 300) {
        if (!isLoadingMore && visibleCount < filteredColleges.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + 12);
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
      <div className="ce-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="ce-hero" style={{ textAlign: 'left', marginBottom: 0 }}>
          <h1 className="ce-title" style={{ fontSize: '2rem' }}>Explore DU Colleges</h1>
          <p className="ce-subtitle" style={{ margin: 0, maxWidth: '100%' }}>Discover all affiliated colleges, check facilities, and explore their campuses.</p>
        </div>

        <div className="ce-search-wrapper" style={{ flex: '1', minWidth: '300px', maxWidth: '450px' }}>
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
          <div className={`ce-filters-header ${isFiltersOpen ? 'open' : ''}`} onClick={() => setIsFiltersOpen(!isFiltersOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span style={{ fontWeight: 600 }}>Filter Colleges</span>
            </div>
            <svg 
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: isFiltersOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
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
          {streamFilter !== 'All' && (
            <div className="ce-top-picks-banner">
              <h2 className="ce-top-picks-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#b45309' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                Top Picks for {streamFilter}
              </h2>
              <div className="ce-top-picks-scroll">
                {(topPicks[streamFilter] || []).map(id => {
                  const coll = colleges.find(c => c.id === id);
                  if (!coll) return null;
                  return (
                    <Link to={`/college/${coll.id}`} key={coll.id} className="ce-top-pick-card">
                      <img src={coll.imageUrl || `https://placehold.co/48x48?text=${encodeURIComponent(coll.name)}`} alt={coll.name} className="ce-top-pick-img" />
                      <span className="ce-top-pick-name">{coll.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          <div className="ce-grid">
            {filteredColleges.slice(0, visibleCount).map(college => (
              <div key={college.id} className="ce-card">
                <div 
                  className="ce-card-image" 
                  style={{ backgroundImage: `url(${college.imageUrl ? college.imageUrl : 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop'})` }}
                >
                  <div className="ce-card-image-overlay"></div>
                  <div className="ce-card-badges-top">
                    {getRank(college.id) && <span className="ce-badge ce-badge-rank">#{getRank(college.id)} Ranked</span>}
                    <span className="ce-badge ce-badge-campus">{college.campus} Campus</span>
                  </div>
                </div>
                
                <div className="ce-card-content">
                  <div className="ce-card-header">
                    <h2 className="ce-card-title">{college.name}</h2>
                    <div className="ce-card-badges">
                      <span className="ce-badge ce-badge-type">{college.type}</span>
                    </div>
                  </div>
                  
                  <p className="ce-card-intro">
                    {college.intro ? (college.intro.length > 130 ? college.intro.substring(0, 130) + '...' : college.intro) : 'No description available.'}
                  </p>

                  <div className="ce-card-facilities">
                    {college.facilities && college.facilities.length > 0 && (
                      college.facilities.slice(0, 3).map(f => (
                        <span key={f} className="ce-facility-tag">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          {f}
                        </span>
                      ))
                    )}
                  </div>

                  {(() => {
                    const sp = getSportsForCollege(college.id);
                    const seats = sp.reduce((s, r) => s + r.men + r.women, 0);
                    if (!seats) return null;
                    return (
                      <div className="ce-card-sports">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><line x1="2" y1="12" x2="22" y2="12"></line></svg>
                        <span><b>{seats}</b> sports quota seats · <b>{sp.length}</b> sports</span>
                      </div>
                    );
                  })()}

                  <div className="ce-card-actions">
                    <Link to={`/college/${college.id}`} className="ce-btn ce-btn-primary">
                      View Details
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"></path>
                      </svg>
                    </Link>
                    {college.officialWebsite && (
                      <a href={college.officialWebsite} target="_blank" rel="noopener noreferrer" className="ce-btn ce-btn-secondary">
                        Visit Website
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
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
