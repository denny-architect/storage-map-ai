import type { ReactNode } from 'react'

export interface Phase {
  id: string
  name: string
  description: string
  role: 'primary' | 'buffered' | 'burst' | 'not-in-path'
  roleLabel: string
  s3Paths?: string[]
  details: string
  ioProfile?: string
}

interface PipelineDiagramProps {
  phases: Phase[]
  title: string
}

const roleColors = {
  'primary': { 
    bg: 'bg-gradient-to-r from-raspberry to-raspberry-dark', 
    border: 'border-raspberry', 
    text: 'text-raspberry', 
    fill: '#C72C48',
    light: 'bg-raspberry/10',
    shadow: 'shadow-raspberry/20'
  },
  'buffered': { 
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500', 
    border: 'border-amber-500', 
    text: 'text-amber-600', 
    fill: '#F59E0B',
    light: 'bg-amber-500/10',
    shadow: 'shadow-amber-500/20'
  },
  'burst': { 
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600', 
    border: 'border-blue-500', 
    text: 'text-blue-600', 
    fill: '#3B82F6',
    light: 'bg-blue-500/10',
    shadow: 'shadow-blue-500/20'
  },
  'not-in-path': { 
    bg: 'bg-gradient-to-r from-gray-400 to-gray-500', 
    border: 'border-gray-400', 
    text: 'text-gray-500', 
    fill: '#9CA3AF',
    light: 'bg-gray-400/10',
    shadow: 'shadow-gray-400/20'
  },
}

export default function PipelineDiagram({ phases }: PipelineDiagramProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Legend */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-sm font-semibold text-gray-700">Storage Role:</span>
          {Object.entries(roleColors).map(([role, colors]) => (
            <div key={role} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
              <span className="text-sm text-gray-600 capitalize font-medium">{role.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Diagram */}
      <div className="p-6 lg:p-8 overflow-x-auto bg-gradient-to-b from-gray-50/50 to-white">
        <svg 
          viewBox={`0 0 ${phases.length * 220 + 40} 200`} 
          className="min-w-full h-48"
          style={{ minWidth: `${phases.length * 200}px` }}
        >
          {/* Connection Lines */}
          {phases.map((phase, index) => {
            if (index === phases.length - 1) return null
            const x1 = index * 220 + 180
            const x2 = (index + 1) * 220 + 20
            const y = 100
            const currentRole = phase.role
            const nextRole = phases[index + 1].role
            
            const strokeWidth = currentRole === 'not-in-path' || nextRole === 'not-in-path' ? 2 : 4
            
            return (
              <g key={`arrow-${index}`}>
                <defs>
                  <marker
                    id={`arrowhead-${index}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#9CA3AF"
                    />
                  </marker>
                  <linearGradient id={`lineGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={roleColors[currentRole].fill} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={roleColors[nextRole].fill} stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={`url(#lineGrad-${index})`}
                  strokeWidth={strokeWidth}
                  markerEnd={`url(#arrowhead-${index})`}
                />
              </g>
            )
          })}

          {/* Phase Nodes */}
          {phases.map((phase, index) => {
            const x = index * 220 + 20
            const y = 30
            const colors = roleColors[phase.role]
            
            return (
              <g key={phase.id} className="transition-transform hover:scale-105" style={{ transformOrigin: `${x + 80}px ${y + 70}px` }}>
                {/* Shadow */}
                <rect
                  x={x + 4}
                  y={y + 4}
                  width="160"
                  height="140"
                  rx="16"
                  fill="rgba(0,0,0,0.05)"
                />
                
                {/* Node Rectangle */}
                <rect
                  x={x}
                  y={y}
                  width="160"
                  height="140"
                  rx="16"
                  fill="white"
                  stroke={colors.fill}
                  strokeWidth="2"
                />
                
                {/* Role Indicator Bar */}
                <defs>
                  <linearGradient id={`roleGrad-${phase.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.fill} />
                    <stop offset="100%" stopColor={colors.fill} stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <rect
                  x={x}
                  y={y}
                  width="160"
                  height="10"
                  rx="8"
                  fill={`url(#roleGrad-${phase.id})`}
                />
                
                {/* Phase Number */}
                <circle
                  cx={x + 26}
                  cy={y + 34}
                  r="14"
                  fill={colors.fill}
                />
                <text
                  x={x + 26}
                  y={y + 39}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {index + 1}
                </text>
                
                {/* Phase Name */}
                <text
                  x={x + 48}
                  y={y + 38}
                  fill="#1F2937"
                  fontSize="13"
                  fontWeight="600"
                >
                  {phase.name.length > 13 ? phase.name.slice(0, 13) + '...' : phase.name}
                </text>
                
                {/* Role Label */}
                <text
                  x={x + 80}
                  y={y + 60}
                  textAnchor="middle"
                  fill={colors.fill}
                  fontSize="9"
                  fontWeight="600"
                  letterSpacing="0.05em"
                >
                  {phase.roleLabel}
                </text>
                
                {/* Description (truncated) */}
                <foreignObject x={x + 10} y={y + 70} width="140" height="55">
                  <div className="text-xs text-gray-500 leading-tight overflow-hidden">
                    {phase.description.length > 55 
                      ? phase.description.slice(0, 55) + '...' 
                      : phase.description}
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Phase Details */}
      <div className="border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {phases.map((phase, index) => {
            const colors = roleColors[phase.role]
            return (
              <div key={phase.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`w-8 h-8 rounded-xl ${colors.bg} text-white text-sm font-bold flex items-center justify-center shadow-lg ${colors.shadow}`}>
                    {index + 1}
                  </span>
                  <h4 className="font-bold text-gray-900">{phase.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{phase.details}</p>
                
                {phase.s3Paths && phase.s3Paths.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Example S3 Paths</p>
                    <div className="space-y-1.5">
                      {phase.s3Paths.map((path, i) => (
                        <code key={i} className="block text-xs bg-gray-900 text-gray-300 px-3 py-2 rounded-lg font-mono overflow-x-auto">
                          {path}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
                
                {phase.ioProfile && (
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold">I/O Profile:</span> {phase.ioProfile}
                  </p>
                )}
                
                <div className={`mt-4 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${colors.bg} text-white shadow-sm ${colors.shadow}`}>
                  {phase.roleLabel}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle: string
  description: string
  children?: ReactNode
}

export function PageHeader({ title, subtitle, description, children }: PageHeaderProps) {
  return (
    <div className="relative bg-dark text-white py-20 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 animated-gradient opacity-50" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-raspberry/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 pattern-grid opacity-30" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-block px-4 py-2 rounded-full bg-raspberry/20 text-raspberry-light font-semibold text-sm mb-6 border border-raspberry/30">
            {subtitle}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">{title}</h1>
          <p className="text-xl text-gray-300 leading-relaxed">{description}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

interface BottomLineProps {
  children: ReactNode
}

export function BottomLine({ children }: BottomLineProps) {
  return (
    <div className="relative bg-gradient-to-r from-raspberry/5 via-raspberry/10 to-raspberry/5 border-2 border-raspberry/20 rounded-2xl p-8 mt-12 overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-raspberry/10 rounded-full blur-2xl" />
      
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-raspberry to-raspberry-dark rounded-xl flex items-center justify-center shadow-lg shadow-raspberry/30">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-raspberry text-lg mb-2">The Bottom Line</h3>
          <p className="text-gray-700 leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  )
}
