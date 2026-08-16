'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Signal, BookOpen, Award, Menu, X, Code, GraduationCap,
  School, Sun, Moon, LogOut, ChevronDown, Settings
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface HeaderProps {
  lang?: string;
  onLangChange?: (lang: string) => void;
}

export function Header({ }: HeaderProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname || '';
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { dict } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide header completely on the Auth Login Page and Distraction-Free Learning Player
  if (pathname === '/auth' || pathname.startsWith('/learn/')) {
    return null;
  }

  const isLight = theme === 'light';
  const role = user?.role || 'student';

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const dashboardPath =
    role === 'instructor'
      ? '/instructor/dashboard'
      : role === 'admin'
        ? '/admin/dashboard'
        : '/student/dashboard';

  // Helper function to get clean nav link styles
  const getNavLinkClass = (path: string) => {
    const active = pathname === path || (path !== '/' && pathname.startsWith(path));
    if (active) {
      return isLight
        ? 'text-black font-black border-b-2 border-black'
        : 'text-white font-black border-b-2 border-white';
    }
    return isLight
      ? 'text-zinc-600 hover:text-black font-bold'
      : 'text-zinc-400 hover:text-white font-bold';
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-200 border-b ${isLight
      ? 'bg-white border-zinc-200 text-black shadow-none'
      : 'bg-black border-zinc-800 text-white shadow-none'
      }`}>
      {/* FULL WIDTH HEADER BAR - MONOCHROME BLACK & WHITE */}
      <div className="w-full pl-4 sm:pl-6 lg:pl-8 pr-0 h-16 flex items-center justify-between">

        {/* BRAND LOGO */}
        <div className="flex items-center space-x-10">
          <Link href={dashboardPath} className="flex items-center space-x-3 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 text-black dark:text-white flex items-center justify-center shadow-sm">
              <Signal className="w-5 h-5 text-black dark:text-white" />
            </div>
            <span className={`text-xl sm:text-2xl font-black tracking-tight font-sans ${isLight ? 'text-black' : 'text-white'
              }`}>
              Telecom Guruji
            </span>
          </Link>

          {/* CENTER NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center space-x-8 text-sm sm:text-base font-bold">
            {role === 'student' && (
              <>
                <Link
                  href="/student/dashboard"
                  className={`transition-colors py-1.5 ${getNavLinkClass('/student/dashboard')}`}
                >
                  {dict.studentDashboard || 'Dashboard'}
                </Link>

                <Link
                  href="/courses"
                  className={`transition-colors py-1.5 ${getNavLinkClass('/courses')}`}
                >
                  {dict.browseCourses || 'Courses'}
                </Link>

                <Link
                  href="/certificates"
                  className={`transition-colors py-1.5 ${getNavLinkClass('/certificates')}`}
                >
                  {dict.certificate || 'Certificates'}
                </Link>

                <Link
                  href="/about"
                  className={`transition-colors py-1.5 ${getNavLinkClass('/about')}`}
                >
                  About Us
                </Link>
              </>
            )}

            {role === 'instructor' && (
              <>
                <Link
                  href="/instructor/dashboard"
                  className={`transition-colors py-1.5 ${getNavLinkClass('/instructor/dashboard')}`}
                >
                  Instructor Studio
                </Link>

                <Link
                  href="/courses"
                  className={`transition-colors py-1.5 ${getNavLinkClass('/courses')}`}
                >
                  Course Catalog
                </Link>

                <Link
                  href="/instructor/course/create"
                  className={`transition-colors py-1.5 ${getNavLinkClass('/instructor/course/create')}`}
                >
                  + Create Course
                </Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`transition-colors py-1.5 ${getNavLinkClass('/admin/dashboard')}`}
                >
                  Developer Metrics
                </Link>

                <Link
                  href="/admin/users"
                  className={`transition-colors py-1.5 ${getNavLinkClass('/admin/users')}`}
                >
                  Governance
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* RIGHT ACTION BAR: SOLID BLACK / WHITE PROFILE BLOCK FULL FLUSH TO RIGHT */}
        <div className="hidden md:flex items-center h-16">
          {/* DESKTOP THEME TOGGLE BUTTON */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`h-full px-5 flex items-center justify-center transition-colors border-l cursor-pointer ${
              isLight
                ? 'border-zinc-200 text-black hover:bg-zinc-100'
                : 'border-zinc-800 text-white hover:bg-zinc-900'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon className="w-5 h-5 text-black" /> : <Sun className="w-5 h-5 text-white" />}
          </button>

          {user ? (
            <div className="relative h-full" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`h-full px-7 font-bold text-sm sm:text-base tracking-wide font-sans flex items-center space-x-3 transition-all shadow-sm border-l ${
                  isLight
                    ? 'bg-black hover:bg-zinc-900 text-white border-black'
                    : 'bg-white hover:bg-zinc-200 text-black border-white'
                }`}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className={`w-8 h-8 rounded-full object-cover shrink-0 border-2 ${isLight ? 'border-white' : 'border-black'}`} />
                ) : (
                  <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                    isLight ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-black'
                  }`}>
                    {initials}
                  </div>
                )}
                {/* PROFILE NAME DISPLAY */}
                <span className="font-extrabold text-sm sm:text-base max-w-[150px] truncate">
                  {user.fullName || 'User Profile'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* PROFILE DROPDOWN LIST */}
              {profileDropdownOpen && (
                <div className={`absolute right-2 mt-2 w-64 rounded-xl border shadow-2xl p-2 z-50 space-y-1 ${
                  isLight ? 'bg-white border-zinc-200 text-black' : 'bg-black border-zinc-800 text-white'
                }`}>
                  <div className={`p-3 rounded-lg ${isLight ? 'bg-zinc-100' : 'bg-zinc-900'} space-y-1`}>
                    <div className="flex items-center space-x-2.5">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                          isLight ? 'bg-black text-white' : 'bg-white text-black'
                        }`}>
                          {initials}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-sm font-black truncate">{user.fullName}</p>
                        <p className="text-xs text-zinc-500 truncate font-mono">{user.email}</p>
                      </div>
                    </div>
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className={`text-[10px] font-bold font-mono uppercase px-2.5 py-0.5 rounded ${
                        isLight ? 'bg-black text-white' : 'bg-white text-black'
                      }`}>
                        {role}
                      </span>
                    </div>
                  </div>

                  {/* 1. MY COURSES */}
                  <Link
                    href="/student/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-extrabold flex items-center space-x-3 transition-colors ${
                      isLight ? 'hover:bg-zinc-100 text-black' : 'hover:bg-zinc-900 text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>My Courses</span>
                  </Link>

                  {/* 2. SETTINGS */}
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-extrabold flex items-center space-x-3 transition-colors ${
                      isLight ? 'hover:bg-zinc-100 text-black' : 'hover:bg-zinc-900 text-white'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>

                  {/* 3. CERTIFICATES */}
                  <Link
                    href="/certificates"
                    onClick={() => setProfileDropdownOpen(false)}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-extrabold flex items-center space-x-3 transition-colors ${
                      isLight ? 'hover:bg-zinc-100 text-black' : 'hover:bg-zinc-900 text-white'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>{dict.certificate || 'My Certificates'}</span>
                  </Link>

                  {/* 4. SIGN OUT */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    type="button"
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm font-extrabold text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center space-x-3 transition-colors mt-1 border-t border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className={`h-full px-8 font-bold text-sm sm:text-base tracking-wider font-mono flex items-center justify-center transition-all shadow-sm ${
                isLight
                  ? 'bg-black hover:bg-zinc-900 text-white'
                  : 'bg-white hover:bg-zinc-200 text-black'
              }`}
            >
              Sign In
            </Link>
          )}
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <div className="flex items-center space-x-2 md:hidden pr-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="p-2 text-zinc-500 hover:text-black dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE RESPONSIVE DRAWER */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-b p-4 space-y-3 ${isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-800'
          }`}>
          {user && (
            <div className="flex items-center space-x-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold flex items-center justify-center">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-black text-black dark:text-white">{user.fullName}</p>
                <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
              </div>
            </div>
          )}

          <Link
            href="/student/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2.5 text-base font-bold py-2 text-black dark:text-white"
          >
            <BookOpen className="w-5 h-5 text-black dark:text-white" />
            <span>My Courses</span>
          </Link>

          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2.5 text-base font-bold py-2 text-black dark:text-white"
          >
            <Settings className="w-5 h-5 text-black dark:text-white" />
            <span>Settings</span>
          </Link>

          <Link
            href="/certificates"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2.5 text-base font-bold py-2 text-black dark:text-white"
          >
            <Award className="w-5 h-5 text-black dark:text-white" />
            <span>{dict.certificate || 'My Certificates'}</span>
          </Link>

          <div className="pt-2 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={toggleTheme}
              className="text-xs font-bold flex items-center space-x-2 text-zinc-500"
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>Toggle Theme</span>
            </button>
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="text-xs font-bold text-red-500"
              >
                Sign Out
              </button>
            ) : (
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="text-xs font-bold text-black dark:text-white">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
