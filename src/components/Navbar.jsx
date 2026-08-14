import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Colleges', path: '/colleges' },
    { name: 'Cutoffs & Seats', path: '/cutoffs' },
    { name: 'Sports & ECA', path: '/quota' },
    { name: 'Rankings', path: '/rankings' },
    { name: 'Subject Combination', path: '/subject-combination' }
  ];

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="https://cuetpro.com/" className="navbar-logo" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="CuetPro Logo" style={{ height: '52px', width: 'auto', display: 'block' }} />
        </a>

        {/* Desktop Menu */}
        <div className="navbar-links">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {link.name}
              </Link>
            );
          })}
          <a
            href="https://cuetpro.com/preference-sheet/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            Preference Sheet
          </a>
        </div>

        {/* Mobile Hamburger Icon */}
        <div 
          className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              {link.name}
            </Link>
          );
        })}
        <a
          href="https://cuetpro.com/preference-sheet/"
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-nav-link"
          onClick={closeMobileMenu}
        >
          Preference Sheet
        </a>
      </div>
    </nav>
  );
}
