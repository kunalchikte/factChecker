'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, History, BarChart3, LogOut, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import './Header.css';

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
        
        <div className="header-right">
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

          {user && (
            <div className="user-menu">
              <div className="user-avatar">
                {user.photoURL ? (
                  <Image 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    width={32} 
                    height={32}
                    unoptimized
                  />
                ) : (
                  <User size={18} />
                )}
              </div>
              <button className="logout-btn" onClick={logout} title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
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
