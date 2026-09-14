import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Video, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-gradient-primary rounded-xl group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">MeetFlow</span>
            </Link>

            <nav className="flex items-center space-x-6">
              {user ? (
                <div className="flex items-center space-x-6">
                  <Link to="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-surface-lighter flex items-center justify-center border border-white/10">
                        <UserIcon className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="text-sm font-medium text-white hidden sm:block">{user.name}</span>
                    </div>
                    <button
                      onClick={signOut}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-primary rounded-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};
