import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const navLinks = [
  { path: '/', label: 'Overview' },
  { path: '/explorer', label: 'Explorer', highlight: true },
  { path: '/training', label: 'Training' },
  { path: '/rag', label: 'RAG' },
  { path: '/fine-tuning', label: 'Fine-Tuning' },
  { path: '/inference', label: 'Inference' },
  { path: '/compare', label: 'Compare' },
  { path: '/demo-stack', label: 'Demo Stack' },
  { path: '/paths', label: 'S3 Paths' },
  { path: '/glossary', label: 'Glossary' },
]

export default function Layout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-dark/95 backdrop-blur-lg shadow-lg shadow-black/20' 
            : 'bg-dark'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 bg-gradient-to-br from-raspberry to-raspberry-dark rounded-xl flex items-center justify-center shadow-lg shadow-raspberry/30 group-hover:shadow-raspberry/50 transition-all duration-300 group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight leading-tight text-white">
                  <span className="gradient-text">AI</span> Storage Map
                </span>
                <span className="text-[10px] text-gray-500 tracking-wide uppercase">Technical Reference</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                const isHighlight = 'highlight' in link && link.highlight
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-white'
                        : isHighlight
                          ? 'text-raspberry-light hover:text-white hover:bg-raspberry/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 bg-gradient-to-r from-raspberry to-raspberry-dark rounded-lg -z-10" />
                    )}
                    {isHighlight && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-raspberry rounded-full animate-pulse" />
                    )}
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col items-center justify-center gap-1.5">
                <span className={`block w-5 h-0.5 bg-current transform transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-current transform transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-[500px] pb-4' : 'max-h-0'}`}>
            <nav className="space-y-1 pt-2">
              {navLinks.map((link, index) => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      mobileMenuOpen ? 'animate-slide-up opacity-0' : ''
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-raspberry to-raspberry-dark text-white shadow-lg shadow-raspberry/20'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-dark to-darker text-gray-400 pt-16 pb-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pattern-dots opacity-30" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-raspberry/30 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-raspberry to-raspberry-dark rounded-xl flex items-center justify-center shadow-lg shadow-raspberry/20">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <span className="font-bold text-white text-lg">AI Storage Map</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                An educational resource for understanding where object storage fits in AI/ML pipelines. Built with technical accuracy in mind.
              </p>
            </div>

            {/* Workloads Column */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-raspberry rounded-full" />
                Workloads
              </h3>
              <ul className="space-y-3">
                {[
                  { to: '/training', label: 'Model Training' },
                  { to: '/rag', label: 'RAG Pipelines' },
                  { to: '/fine-tuning', label: 'Fine-Tuning (LoRA)' },
                  { to: '/inference', label: 'Inference' },
                ].map((item) => (
                  <li key={item.to}>
                    <Link 
                      to={item.to} 
                      className="text-sm hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-raspberry transition-all duration-200" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Resources
              </h3>
              <ul className="space-y-3">
                {[
                  { to: '/compare', label: 'Comparison Matrix' },
                  { to: '/demo-stack', label: 'Demo Stack' },
                  { to: '/paths', label: 'S3 Path Reference' },
                  { to: '/glossary', label: 'Glossary' },
                ].map((item) => (
                  <li key={item.to}>
                    <Link 
                      to={item.to} 
                      className="text-sm hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-blue-500 transition-all duration-200" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Storage Column */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Enterprise Storage
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Examples reference S3-compatible object storage patterns for AI workloads.
              </p>
              <a 
                href="https://min.io/product/aistor" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all duration-200 hover:border-raspberry/50 group"
              >
                <span>Learn about MinIO AIStor</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500 text-center md:text-left">
                Storage examples reference{' '}
                <a 
                  href="https://min.io/product/aistor" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-raspberry hover:text-raspberry-light transition-colors"
                >
                  MinIO AIStor
                </a>
                {' '}— the S3-compatible object store built for AI workloads.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600">Built for engineers who want accuracy over hand-waving.</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
