import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User as UserIcon, Home, ArrowRight, ChevronDown, Settings, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ExpandableTabs, type TabItem } from './ui/expandable-tabs';

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Remove direct logout button from header navigation tabs
  const loggedInTabs: TabItem[] = [
    { title: "Dashboard", icon: Home },
  ];

  const loggedOutTabs: TabItem[] = [
    { title: "Sign In", icon: UserIcon },
    { title: "Get Started", icon: ArrowRight },
  ];

  const tabs = user ? loggedInTabs : loggedOutTabs;

  const handleTabChange = (index: number | null) => {
    if (index === null) return;
    const tab = tabs[index];
    
    if ('title' in tab && tab.title) {
      if (tab.title === "Dashboard") navigate('/dashboard');
      else if (tab.title === "Sign In") navigate('/login');
      else if (tab.title === "Get Started") navigate('/register');
    }
  };

  const getSelectedIndex = () => {
    if (user) {
      if (location.pathname === '/dashboard') return 0;
      return null;
    } else {
      if (location.pathname === '/login') return 0;
      if (location.pathname === '/register') return 1;
      return null;
    }
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    setIsProfileMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-20 relative">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group z-10 w-1/3">
              <div className="p-1.5 bg-white rounded-xl group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <img src="/favicon.svg" alt="MeetFlow" className="w-7 h-7" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight hidden sm:block">MeetFlow</span>
            </Link>

            {/* Centered Navigation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <ExpandableTabs 
                  tabs={tabs} 
                  onChange={handleTabChange} 
                  defaultSelected={getSelectedIndex()}
                  activeColor="text-white"
                />
              </div>
            </div>

            {/* User Profile / Menu Dropdown (Right side) */}
            <div className="w-1/3 flex justify-end z-10 relative" ref={profileMenuRef}>
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 sm:space-x-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 backdrop-blur-md transition-all cursor-pointer group"
                    aria-expanded={isProfileMenuOpen}
                    aria-label="User profile menu"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/20 text-white font-semibold text-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm font-medium text-white hidden sm:block max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 hidden sm:block ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown Menu */}
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-surface-lighter/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                      >
                        {/* Profile Header */}
                        <div className="px-4 py-2.5 border-b border-white/5">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profile</p>
                          <p className="text-sm font-medium text-white truncate mt-0.5">{user.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              navigate('/dashboard');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                          >
                            <UserIcon className="w-4 h-4 text-slate-400" />
                            <span>My Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              navigate('/dashboard');
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                            <span>Settings</span>
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/5 my-1" />

                        {/* Log out item */}
                        <div className="px-1">
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              setIsLogoutModalOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Log out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-card w-full max-w-sm relative z-10 overflow-hidden border border-white/10 p-6 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Are you sure you want to log out?
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                You will be signed out of your account and will need to log back in to access your meetings.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  Log out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};
