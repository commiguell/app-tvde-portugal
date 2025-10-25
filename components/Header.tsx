import React from 'react';
import { ChartPieIcon, Cog6ToothIcon, DocumentTextIcon } from './Icons';

interface HeaderProps {
  activeView: 'dashboard' | 'settings' | 'reports';
  setActiveView: (view: 'dashboard' | 'settings' | 'reports') => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const NavButton: React.FC<{
    view: 'dashboard' | 'settings' | 'reports';
    children: React.ReactNode;
  }> = ({ view, children }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeView === view
          ? 'bg-brand-primary text-white'
          : 'text-text-secondary hover:bg-surface hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );

  return (
    <header className="bg-surface shadow-md sticky top-0 z-10 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-brand-secondary">
              Gestor TVDE
            </h1>
          </div>
          <nav className="flex items-center gap-2">
            <NavButton view="dashboard">
              <ChartPieIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Painel Geral</span>
            </NavButton>
            <NavButton view="reports">
              <DocumentTextIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Relatórios</span>
            </NavButton>
            <NavButton view="settings">
              <Cog6ToothIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Definições</span>
            </NavButton>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;