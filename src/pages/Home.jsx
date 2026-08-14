import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { colleges } from '../data/colleges';
import { programs } from '../data/programs';
import { offerings } from '../data/cutoffsData';
import './Home.css';

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Search logic
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    
    const matchedColleges = colleges
      .filter(c => c.name.toLowerCase().includes(query))
      .map(c => ({ ...c, searchType: 'college' }));
      
    const matchedPrograms = programs
      .filter(p => p.name.toLowerCase().includes(query))
      .map(p => ({ ...p, searchType: 'program' }));
      
    return [...matchedColleges, ...matchedPrograms].slice(0, 8); // top 8 suggestions
  }, [searchQuery]);

  const handleSuggestionClick = (item) => {
    if (item.searchType === 'college') {
      navigate(`/college/${item.id}`);
    } else {
      navigate(`/cutoffs?program=${item.id}`);
    }
  };

  // Stats calculation
  const totalColleges = colleges.length;
  const totalCourses = programs.length;
  const totalSeats = offerings.reduce((sum, off) => sum + (off.seats?.total || 0), 0);
  const dataYear = '2026';

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1>DU Admissions <span className="highlight-blue">Explorer</span></h1>
        <p>The definitive guide to Delhi University's academic ecosystem. Access accurate data on colleges, programs, and admissions requirements.</p>
        
        <div className="search-container">
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input 
            type="text" 
            className="search-input"
            placeholder="Search colleges or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((item) => (
                <div 
                  key={`${item.searchType}-${item.id}`} 
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <span className="suggestion-title">{item.name}</span>
                  <span className="suggestion-type">
                    {item.searchType === 'college' ? 'College' : 'Course'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-searches">
          <span className="quick-search-label">OFFICIAL RESOURCES:</span>
          <div className="quick-search-buttons">
            <a href="https://admission.uod.ac.in/" target="_blank" rel="noopener noreferrer" className="quick-search-pill">DU CSAS Portal</a>
            <a href="https://cuetug.ntaonline.in/" target="_blank" rel="noopener noreferrer" className="quick-search-pill">NTA CUET Portal</a>
            <a href="https://du.ac.in/" target="_blank" rel="noopener noreferrer" className="quick-search-pill">DU Official Site</a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="home-stats-bar">
        <div className="stat-item">
          <span className="stat-value">{totalColleges}</span>
          <span className="stat-label">Colleges</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalCourses}+</span>
          <span className="stat-label">Programs</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{dataYear}</span>
          <span className="stat-label">Academic Data</span>
        </div>
      </div>

      <div className="home-container">
        {/* Main Navigation Grid */}
        <section className="nav-tile-grid">
          <a href="https://cuetpro.com/preference-sheet/" target="_blank" rel="noopener noreferrer" className="nav-tile tile-preference">
          <div className="nav-tile-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </div>
          <div className="nav-tile-content">
            <h3>Preference Sheet Maker</h3>
            <p>Create and order your CSAS preference list</p>
          </div>
        </a>

        <Link to="/cutoffs" className="nav-tile tile-cutoffs">
          <div className="nav-tile-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <div className="nav-tile-content">
            <h3>Seats & Cutoffs</h3>
            <p>Check official seat matrix and previous year cutoffs</p>
          </div>
        </Link>

        <Link to="/subject-combination" className="nav-tile tile-combinations">
          <div className="nav-tile-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><path d="M9 10h6"></path><path d="M12 7v6"></path></svg>
          </div>
          <div className="nav-tile-content">
            <h3>Subject Combinations</h3>
            <p>Check CUET subject requirements for various courses</p>
          </div>
        </Link>

        <Link to="/colleges" className="nav-tile tile-colleges">
          <div className="nav-tile-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 22 7 12 2"></polygon><polyline points="2 17 2 22 22 22 22 17"></polyline><line x1="6" y1="12" x2="6" y2="17"></line><line x1="10" y1="12" x2="10" y2="17"></line><line x1="14" y1="12" x2="14" y2="17"></line><line x1="18" y1="12" x2="18" y2="17"></line></svg>
          </div>
          <div className="nav-tile-content">
            <h3>Explore Colleges</h3>
            <p>Browse all DU colleges, facilities, and offered courses</p>
          </div>
        </Link>

        <Link to="/quota" className="nav-tile tile-quota">
          <div className="nav-tile-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><line x1="2" y1="12" x2="22" y2="12"></line><path d="M5 5l14 14"></path></svg>
          </div>
          <div className="nav-tile-content">
            <h3>Sports & ECA Quota</h3>
            <p>Sports & extra-curricular seats college-wise — no CUET score needed</p>
          </div>
        </Link>

        <Link to="/documents" className="nav-tile tile-documents">
          <div className="nav-tile-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div className="nav-tile-content">
            <h3>Documents Guide</h3>
            <p>Know which documents are required for admission</p>
          </div>
        </Link>

      </section>

    </div>
    </div>
  );
}
