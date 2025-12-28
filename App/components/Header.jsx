'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, History, BarChart3 } from 'lucide-react';
import './Header.css';

export function Header() {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <header className="header">
      <div className="header-content">
        <Link href="/" className="logo">
          <div className="logo-icon">
            <BarChart3 size={24} />
          </div>
          <span className="logo-text">FactCheck<span className="logo-accent">AI</span></span>
        </Link>
        
        <nav className="nav-desktop">
          <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Search size={18} />
            <span>Analyze</span>
          </Link>
          <Link href="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>
            <History size={18} />
            <span>History</span>
          </Link>
        </nav>
      </div>

      <nav className="nav-mobile">
        <Link href="/" className={`nav-mobile-link ${isActive('/') ? 'active' : ''}`}>
          <Search size={20} />
          <span>Discover</span>
        </Link>
        <Link href="/history" className={`nav-mobile-link ${isActive('/history') ? 'active' : ''}`}>
          <History size={20} />
          <span>Reports</span>
        </Link>
      </nav>
    </header>
  );
}

