import React, { useState } from 'react';
import { ChartPieIcon, Cog6ToothIcon, DocumentTextIcon, Bars3Icon, XMarkIcon, BanknotesIcon } from './Icons';

interface HeaderProps {
  activeView: 'dashboard' | 'settings' | 'reports' | 'taxes';
  setActiveView: (view: 'dashboard' | 'settings' | 'reports' | 'taxes') => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (view: 'dashboard' | 'settings' | 'reports' | 'taxes') => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const NavButton: React.FC<{
    view: 'dashboard' | 'settings' | 'reports' | 'taxes';
    children: React.ReactNode;
    isMobile?: boolean;
  }> = ({ view, children, isMobile = false }) => (
    <button
      onClick={() => handleNavClick(view)}
      className={`flex items-center gap-2 rounded-md font-medium transition-colors ${
        isMobile
          ? 'w-full text-left px-3 py-3 text-base' // Mobile styles
          : 'px-4 py-2 text-sm' // Desktop styles
      } ${
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
            <h1 className="text-xl sm:text-2xl font-bold text-brand-secondary">
              Gestor TVDE
            </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-2">
            <NavButton view="dashboard">
              <ChartPieIcon className="h-5 w-5" />
              <span>Painel Geral</span>
            </NavButton>
            <NavButton view="taxes">
                <BanknotesIcon className="h-5 w-5" />
                <span>Impostos</span>
            </NavButton>
            <NavButton view="reports">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Relatórios</span>
            </NavButton>
            <NavButton view="settings">
              <Cog6ToothIcon className="h-5 w-5" />
              <span>Definições</span>
            </NavButton>
          </nav>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Abrir menu principal</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden border-t border-background`} id="mobile-menu">
        <nav className="px-2 pt-2 pb-3 space-y-1">
          <NavButton view="dashboard" isMobile={true}>
            <ChartPieIcon className="h-6 w-6" />
            <span>Painel Geral</span>
          </NavButton>
          <NavButton view="taxes" isMobile={true}>
            <BanknotesIcon className="h-6 w-6" />
            <span>Impostos</span>
          </NavButton>
          <NavButton view="reports" isMobile={true}>
            <DocumentTextIcon className="h-6 w-6" />
            <span>Relatórios</span>
          </NavButton>
          <NavButton view="settings" isMobile={true}>
            <Cog6ToothIcon className="h-6 w-6" />
            <span>Definições</span>
          </NavButton>
        </nav>
      </div>
    </header>
  );
};

export default Header;