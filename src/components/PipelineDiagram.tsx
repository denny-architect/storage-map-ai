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
  'primary': { bg: 'bg-raspberry', border: 'border-raspberry', text: 'text-raspberry', fill: '#C72C48' },
  'buffered': { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600', fill: '#F59E0B' },
  'burst': { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600', fill: '#3B82F6' },
  'not-in-path': { bg: 'bg-gray-400', border: 'border-gray-400', text: 'text-gray-500', fill: '#9CA3AF' },
}

// Role descriptions for potential future tooltips
// const roleDescriptions = {
//   'primary': 'Object storage is the primary data source or destination',
//   'buffered': 'Data streams through storage with caching/prefetch layers',
//   'burst': 'Large sequential reads/writes at specific moments',
//   'not-in-path': 'Storage is not involved in this phase',
// }

export default function PipelineDiagram({ phases }: PipelineDiagramProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Legend */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-sm font-medium text-gray-700">Storage Role:</span>
          {Object.entries(roleColors).map(([role, colors]) => (
            <div key={role} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
              <span className="text-sm text-gray-600 capitalize">{role.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Diagram */}
      <div className="p-6 overflow-x-auto">
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
            
            // Determine arrow thickness based on data flow
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
                </defs>
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke="#D1D5DB"
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
              <g key={phase.id}>
                {/* Node Rectangle */}
                <rect
                  x={x}
                  y={y}
                  width="160"
                  height="140"
                  rx="12"
                  fill="white"
                  stroke={colors.fill}
                  strokeWidth="3"
                />
                
                {/* Role Indicator Bar */}
                <rect
                  x={x}
                  y={y}
                  width="160"
                  height="8"
                  rx="4"
                  fill={colors.fill}
                />
                
                {/* Phase Number */}
                <circle
                  cx={x + 24}
                  cy={y + 30}
                  r="12"
                  fill={colors.fill}
                />
                <text
                  x={x + 24}
                  y={y + 35}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {index + 1}
                </text>
                
                {/* Phase Name */}
                <text
                  x={x + 44}
                  y={y + 34}
                  fill="#1F2937"
                  fontSize="13"
                  fontWeight="600"
                >
                  {phase.name.length > 14 ? phase.name.slice(0, 14) + '...' : phase.name}
                </text>
                
                {/* Role Label */}
                <text
                  x={x + 80}
                  y={y + 58}
                  textAnchor="middle"
                  fill={colors.fill}
                  fontSize="10"
                  fontWeight="500"
                >
                  {phase.roleLabel}
                </text>
                
                {/* Description (truncated) */}
                <foreignObject x={x + 8} y={y + 68} width="144" height="60">
                  <div className="text-xs text-gray-500 leading-tight overflow-hidden">
                    {phase.description.length > 60 
                      ? phase.description.slice(0, 60) + '...' 
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {phases.map((phase, index) => {
            const colors = roleColors[phase.role]
            return (
              <div key={phase.id} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-6 h-6 rounded-full ${colors.bg} text-white text-xs font-bold flex items-center justify-center`}>
                    {index + 1}
                  </span>
                  <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{phase.details}</p>
                
                {phase.s3Paths && phase.s3Paths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Example S3 Paths:</p>
                    <div className="space-y-1">
                      {phase.s3Paths.map((path, i) => (
                        <code key={i} className="block text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                          {path}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
                
                {phase.ioProfile && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">I/O Profile:</span> {phase.ioProfile}
                  </p>
                )}
                
                <div className={`mt-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors.bg} text-white`}>
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
    <div className="bg-gradient-to-br from-dark via-gray-900 to-darker text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-raspberry font-medium mb-2">{subtitle}</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{title}</h1>
        <p className="text-xl text-gray-300 max-w-3xl">{description}</p>
        {children}
      </div>
    </div>
  )
}

interface BottomLineProps {
  children: ReactNode
}

export function BottomLine({ children }: BottomLineProps) {
  return (
    <div className="bg-raspberry/5 border-2 border-raspberry/20 rounded-xl p-6 mt-8">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-raspberry rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-raspberry mb-1">Bottom Line</h3>
          <p className="text-gray-700">{children}</p>
        </div>
      </div>
    </div>
  )
}
