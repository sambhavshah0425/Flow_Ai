import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Cpu, LayoutDashboard, Key, LogOut, PlusCircle, Sparkles } from 'lucide-react';

export function Navbar({ onOpenSecrets }) {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  return (
    <nav className="h-16 bg-dark-800/80 border-b border-dark-700/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Logo */}
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              FlowForge <span className="text-brand-500 text-xs px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 font-mono">OS</span>
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1 pl-4 border-l border-dark-700">
          <Link
            to="/dashboard"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              location.pathname === '/dashboard'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-dark-700/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <button
            onClick={() => navigate('/builder')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              location.pathname === '/builder'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-dark-700/50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Workflow Studio
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSecrets}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700/60 hover:bg-dark-700 text-slate-300 hover:text-white border border-slate-700/50 flex items-center gap-2 transition-all"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          Secrets Vault
        </button>

        <div className="h-4 w-px bg-dark-700" />

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user?.name || 'Developer'}</div>
            <div className="text-[10px] text-slate-400 font-mono">{user?.email || 'user@flowforge.ai'}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
