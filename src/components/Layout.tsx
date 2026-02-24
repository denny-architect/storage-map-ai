import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'

const navLinks = [
  { path: '/', label: 'Overview' },
  { path: '/training', label: 'Training' },
  { path: '/rag', label: 'RAG' },
  { path: '/fine-tuning', label: 'Fine-Tuning' },
  { path: '/inference', label: 'Inference' },
  { path: '/compare', label: 'Compare' },
  { path: '/paths', label: 'S3 Paths' },
  { path: '/glossary', label: 'Glossary' },
]

export default function Layout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-dark text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-raspberry rounded flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">
                <span className="text-raspberry">AI</span> Storage Map
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-raspberry text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-raspberry text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">AI Storage Map</h3>
              <p className="text-sm">
                An educational resource for understanding where object storage fits 
                in AI/ML pipelines. Built with technical accuracy in mind.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Workloads</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/training" className="hover:text-white transition-colors">Model Training</Link></li>
                <li><Link to="/rag" className="hover:text-white transition-colors">RAG Pipelines</Link></li>
                <li><Link to="/fine-tuning" className="hover:text-white transition-colors">Fine-Tuning (LoRA)</Link></li>
                <li><Link to="/inference" className="hover:text-white transition-colors">Inference</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/compare" className="hover:text-white transition-colors">Comparison Matrix</Link></li>
                <li><Link to="/paths" className="hover:text-white transition-colors">S3 Path Reference</Link></li>
                <li><Link to="/glossary" className="hover:text-white transition-colors">Glossary</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>
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
          </div>
        </div>
      </footer>
    </div>
  )
}
