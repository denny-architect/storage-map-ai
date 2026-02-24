export default function TrainingDiagram() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 lg:p-8 overflow-x-auto shadow-2xl border border-white/5">
      <svg viewBox="0 0 1100 400" className="w-full min-w-[900px]" style={{ minHeight: '350px' }}>
        <defs>
          {/* Gradients */}
          <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C72C48" />
            <stop offset="100%" stopColor="#E84A66" />
          </linearGradient>
          <linearGradient id="bufferedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <linearGradient id="storageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>
          <linearGradient id="gpuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#065F46" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          
          {/* Arrow markers */}
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
          <marker id="arrowheadRed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#C72C48" />
          </marker>
          <marker id="arrowheadGreen" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10B981" />
          </marker>
          
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="glowStrong">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Animated pulse */}
          <radialGradient id="pulseGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C72C48" stopOpacity="0.6">
              <animate attributeName="stop-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#C72C48" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background Grid */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Object Storage Layer (Bottom) */}
        <g>
          {/* Storage glow */}
          <rect x="50" y="300" width="1000" height="80" rx="12" fill="#C72C48" opacity="0.1" filter="url(#glowStrong)" />
          
          <rect x="50" y="300" width="1000" height="80" rx="12" fill="url(#storageGrad)" stroke="#C72C48" strokeWidth="2" />
          
          {/* Animated pulse lines */}
          <rect x="50" y="300" width="1000" height="2" fill="url(#pulseGrad)" rx="1">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
          </rect>
          
          <text x="550" y="340" textAnchor="middle" fill="#C72C48" fontSize="16" fontWeight="bold" fontFamily="Inter, system-ui">
            Object Storage (S3-Compatible)
          </text>
          <text x="550" y="362" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontFamily="Inter, system-ui">
            Data Lake • Checkpoint Store • Artifact Registry • Model Registry
          </text>
          
          {/* Storage section dividers */}
          <line x1="280" y1="310" x2="280" y2="380" stroke="#4B5563" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
          <line x1="510" y1="310" x2="510" y2="380" stroke="#4B5563" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
          <line x1="740" y1="310" x2="740" y2="380" stroke="#4B5563" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
          
          <text x="165" y="325" textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="JetBrains Mono">training-data/</text>
          <text x="395" y="325" textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="JetBrains Mono">checkpoints/</text>
          <text x="625" y="325" textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="JetBrains Mono">mlflow-artifacts/</text>
          <text x="870" y="325" textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="JetBrains Mono">model-registry/</text>
        </g>

        {/* Phase 1: Data Collection */}
        <g className="transition-transform hover:scale-105" style={{ transformOrigin: '150px 100px' }}>
          <rect x="80" y="50" width="140" height="100" rx="12" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="100" cy="70" r="14" fill="url(#primaryGrad)" filter="url(#glow)" />
          <text x="100" y="75" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">1</text>
          <text x="150" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="Inter, system-ui">Data Collection</text>
          <text x="150" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="10">Raw → Clean → Tokenize</text>
          <rect x="95" y="110" width="110" height="22" rx="6" fill="url(#primaryGrad)" />
          <text x="150" y="125" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">PRIMARY</text>
          
          {/* Animated data flow arrow */}
          <path d="M 150 150 L 150 295" stroke="#C72C48" strokeWidth="3" markerEnd="url(#arrowheadRed)" strokeDasharray="8,4">
            <animate attributeName="stroke-dashoffset" values="24;0" dur="1s" repeatCount="indefinite" />
          </path>
          <text x="165" y="220" fill="#C72C48" fontSize="10" fontWeight="600">PB scale</text>
        </g>

        {/* Phase 2: Data Loading */}
        <g className="transition-transform hover:scale-105" style={{ transformOrigin: '350px 100px' }}>
          <rect x="280" y="50" width="140" height="100" rx="12" fill="#1F2937" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="300" cy="70" r="14" fill="url(#bufferedGrad)" filter="url(#glow)" />
          <text x="300" y="75" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">2</text>
          <text x="350" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="Inter, system-ui">Data Loading</text>
          <text x="350" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="10">Prefetch → GPU</text>
          <rect x="295" y="110" width="110" height="22" rx="6" fill="url(#bufferedGrad)" />
          <text x="350" y="125" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">BUFFERED</text>
          
          {/* Animated stream arrow */}
          <path d="M 350 295 L 350 150" stroke="#F59E0B" strokeWidth="3" markerEnd="url(#arrowhead)">
            <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="2s" repeatCount="indefinite" />
          </path>
          <text x="365" y="220" fill="#F59E0B" fontSize="10" fontWeight="600">Stream GB/s</text>
        </g>

        {/* GPU Cluster (Center) */}
        <g>
          {/* GPU glow effect */}
          <rect x="480" y="80" width="140" height="130" rx="12" fill="#10B981" opacity="0.2" filter="url(#glowStrong)" />
          
          <rect x="480" y="80" width="140" height="130" rx="12" fill="url(#gpuGrad)" stroke="#10B981" strokeWidth="2" />
          
          {/* Animated border */}
          <rect x="480" y="80" width="140" height="130" rx="12" fill="none" stroke="#34D399" strokeWidth="1" strokeDasharray="10,5" opacity="0.5">
            <animate attributeName="stroke-dashoffset" values="30;0" dur="2s" repeatCount="indefinite" />
          </rect>
          
          <text x="550" y="108" textAnchor="middle" fill="#10B981" fontSize="13" fontWeight="bold" fontFamily="Inter, system-ui">GPU CLUSTER</text>
          <text x="550" y="128" textAnchor="middle" fill="#A7F3D0" fontSize="10">Forward Pass</text>
          <text x="550" y="143" textAnchor="middle" fill="#A7F3D0" fontSize="10">Backward Pass</text>
          <text x="550" y="158" textAnchor="middle" fill="#A7F3D0" fontSize="10">Gradient Update</text>
          
          {/* No storage indicator */}
          <rect x="495" y="170" width="110" height="24" rx="6" fill="#1F2937" stroke="#4B5563" strokeWidth="1" />
          <text x="550" y="186" textAnchor="middle" fill="#6B7280" fontSize="9" fontWeight="500">Compute Only</text>
        </g>

        {/* Phase 3: Checkpointing */}
        <g className="transition-transform hover:scale-105" style={{ transformOrigin: '750px 100px' }}>
          <rect x="680" y="50" width="140" height="100" rx="12" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="700" cy="70" r="14" fill="url(#primaryGrad)" filter="url(#glow)" />
          <text x="700" y="75" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">3</text>
          <text x="750" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="Inter, system-ui">Checkpointing</text>
          <text x="750" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="10">Every N steps</text>
          <rect x="695" y="110" width="110" height="22" rx="6" fill="url(#primaryGrad)" />
          <text x="750" y="125" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">PRIMARY</text>
          
          {/* Heavy data flow */}
          <path d="M 750 150 L 750 295" stroke="#C72C48" strokeWidth="4" markerEnd="url(#arrowheadRed)" />
          <text x="765" y="220" fill="#C72C48" fontSize="10" fontWeight="600">500GB-1TB</text>
        </g>

        {/* Phase 4: Artifacts & Export */}
        <g className="transition-transform hover:scale-105" style={{ transformOrigin: '950px 100px' }}>
          <rect x="880" y="50" width="140" height="100" rx="12" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="900" cy="70" r="14" fill="url(#primaryGrad)" filter="url(#glow)" />
          <text x="900" y="75" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">4</text>
          <text x="950" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="Inter, system-ui">Export & Track</text>
          <text x="950" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="10">MLflow, Registry</text>
          <rect x="895" y="110" width="110" height="22" rx="6" fill="url(#primaryGrad)" />
          <text x="950" y="125" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">PRIMARY</text>
          
          {/* Export arrow */}
          <path d="M 950 150 L 950 295" stroke="#C72C48" strokeWidth="3" markerEnd="url(#arrowheadRed)" strokeDasharray="8,4" />
        </g>

        {/* Flow arrows between phases */}
        <path d="M 220 100 L 275 100" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M 420 100 L 475 130" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M 620 130 L 675 100" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M 820 100 L 875 100" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        {/* Cycle arrow from checkpointing back to GPU */}
        <path d="M 680 160 Q 630 200 580 210" stroke="#10B981" strokeWidth="2" fill="none" markerEnd="url(#arrowheadGreen)" strokeDasharray="4">
          <animate attributeName="stroke-dashoffset" values="8;0" dur="1s" repeatCount="indefinite" />
        </path>
        <text x="610" y="245" fill="#10B981" fontSize="9" fontWeight="500">Resume from checkpoint</text>

        {/* Title with underline */}
        <text x="550" y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Inter, system-ui">
          Model Training Pipeline
        </text>
        <line x1="400" y1="32" x2="700" y2="32" stroke="#C72C48" strokeWidth="2" opacity="0.3" />
      </svg>
      
      {/* Legend below SVG */}
      <div className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-gradient-to-r from-raspberry to-raspberry-dark shadow-lg shadow-raspberry/30" />
          <span className="text-sm text-gray-300 font-medium">Primary Storage Role</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30" />
          <span className="text-sm text-gray-300 font-medium">Buffered Read</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/30" />
          <span className="text-sm text-gray-300 font-medium">GPU Compute (No Storage)</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-8 h-4">
            <line x1="0" y1="8" x2="32" y2="8" stroke="#C72C48" strokeWidth="3" />
          </svg>
          <span className="text-sm text-gray-300 font-medium">Heavy Data Flow</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-8 h-4">
            <line x1="0" y1="8" x2="32" y2="8" stroke="#C72C48" strokeWidth="2" strokeDasharray="4" />
          </svg>
          <span className="text-sm text-gray-300 font-medium">Periodic Data Flow</span>
        </div>
      </div>
    </div>
  )
}
