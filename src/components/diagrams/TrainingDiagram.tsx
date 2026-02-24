export default function TrainingDiagram() {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 lg:p-8 overflow-x-auto">
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
          
          {/* Arrow marker */}
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
          <marker id="arrowheadRed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#C72C48" />
          </marker>
          
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background Grid */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Object Storage Layer (Bottom) */}
        <g>
          <rect x="50" y="300" width="1000" height="80" rx="8" fill="url(#storageGrad)" stroke="#C72C48" strokeWidth="2" />
          <text x="550" y="345" textAnchor="middle" fill="#C72C48" fontSize="16" fontWeight="bold">
            Object Storage (S3-Compatible)
          </text>
          <text x="550" y="365" textAnchor="middle" fill="#9CA3AF" fontSize="12">
            Data Lake • Checkpoint Store • Artifact Registry • Model Registry
          </text>
          
          {/* Storage sections */}
          <line x1="280" y1="310" x2="280" y2="380" stroke="#4B5563" strokeWidth="1" strokeDasharray="4" />
          <line x1="510" y1="310" x2="510" y2="380" stroke="#4B5563" strokeWidth="1" strokeDasharray="4" />
          <line x1="740" y1="310" x2="740" y2="380" stroke="#4B5563" strokeWidth="1" strokeDasharray="4" />
          
          <text x="165" y="325" textAnchor="middle" fill="#6B7280" fontSize="10">training-data/</text>
          <text x="395" y="325" textAnchor="middle" fill="#6B7280" fontSize="10">checkpoints/</text>
          <text x="625" y="325" textAnchor="middle" fill="#6B7280" fontSize="10">mlflow-artifacts/</text>
          <text x="870" y="325" textAnchor="middle" fill="#6B7280" fontSize="10">model-registry/</text>
        </g>

        {/* Phase 1: Data Collection */}
        <g>
          <rect x="80" y="50" width="140" height="100" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="100" cy="70" r="12" fill="url(#primaryGrad)" />
          <text x="100" y="74" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">1</text>
          <text x="150" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Data Collection</text>
          <text x="150" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="10">Raw → Clean → Tokenize</text>
          <rect x="95" y="110" width="110" height="20" rx="4" fill="#C72C48" />
          <text x="150" y="124" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">PRIMARY</text>
          
          {/* Arrow to storage */}
          <path d="M 150 150 L 150 295" stroke="#C72C48" strokeWidth="3" markerEnd="url(#arrowheadRed)" strokeDasharray="8,4" />
          <text x="165" y="220" fill="#C72C48" fontSize="9" fontWeight="500">PB scale</text>
        </g>

        {/* Phase 2: Data Loading */}
        <g>
          <rect x="280" y="50" width="140" height="100" rx="8" fill="#1F2937" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="300" cy="70" r="12" fill="url(#bufferedGrad)" />
          <text x="300" y="74" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">2</text>
          <text x="350" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Data Loading</text>
          <text x="350" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="10">Prefetch → GPU</text>
          <rect x="295" y="110" width="110" height="20" rx="4" fill="#F59E0B" />
          <text x="350" y="124" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">BUFFERED</text>
          
          {/* Arrow from storage */}
          <path d="M 350 295 L 350 150" stroke="#F59E0B" strokeWidth="3" markerEnd="url(#arrowhead)" />
          <text x="365" y="220" fill="#F59E0B" fontSize="9" fontWeight="500">Stream GB/s</text>
        </g>

        {/* GPU Cluster (Center) */}
        <g>
          <rect x="480" y="80" width="140" height="130" rx="8" fill="#065F46" stroke="#10B981" strokeWidth="2" filter="url(#glow)" />
          <text x="550" y="110" textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="bold">GPU CLUSTER</text>
          <text x="550" y="130" textAnchor="middle" fill="#A7F3D0" fontSize="10">Forward Pass</text>
          <text x="550" y="145" textAnchor="middle" fill="#A7F3D0" fontSize="10">Backward Pass</text>
          <text x="550" y="160" textAnchor="middle" fill="#A7F3D0" fontSize="10">Gradient Update</text>
          
          {/* Storage NOT in this box indicator */}
          <rect x="495" y="175" width="110" height="22" rx="4" fill="#1F2937" stroke="#4B5563" strokeWidth="1" />
          <text x="550" y="190" textAnchor="middle" fill="#6B7280" fontSize="8">Compute Only</text>
        </g>

        {/* Phase 3: Checkpointing */}
        <g>
          <rect x="680" y="50" width="140" height="100" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="700" cy="70" r="12" fill="url(#primaryGrad)" />
          <text x="700" y="74" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">3</text>
          <text x="750" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Checkpointing</text>
          <text x="750" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="10">Every N steps</text>
          <rect x="695" y="110" width="110" height="20" rx="4" fill="#C72C48" />
          <text x="750" y="124" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">PRIMARY</text>
          
          {/* Arrow to storage */}
          <path d="M 750 150 L 750 295" stroke="#C72C48" strokeWidth="4" markerEnd="url(#arrowheadRed)" />
          <text x="765" y="220" fill="#C72C48" fontSize="9" fontWeight="500">500GB-1TB</text>
        </g>

        {/* Phase 4: Artifacts & Export */}
        <g>
          <rect x="880" y="50" width="140" height="100" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="900" cy="70" r="12" fill="url(#primaryGrad)" />
          <text x="900" y="74" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">4</text>
          <text x="950" y="75" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Export & Track</text>
          <text x="950" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="10">MLflow, Registry</text>
          <rect x="895" y="110" width="110" height="20" rx="4" fill="#C72C48" />
          <text x="950" y="124" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">PRIMARY</text>
          
          {/* Arrow to storage */}
          <path d="M 950 150 L 950 295" stroke="#C72C48" strokeWidth="3" markerEnd="url(#arrowheadRed)" strokeDasharray="8,4" />
        </g>

        {/* Flow arrows between phases */}
        <path d="M 220 100 L 275 100" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M 420 100 L 475 130" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M 620 130 L 675 100" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <path d="M 820 100 L 875 100" stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
        
        {/* Cycle arrow from checkpointing back to GPU */}
        <path d="M 680 160 Q 630 200 580 210 L 580 200" stroke="#10B981" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="4" />
        <text x="610" y="245" fill="#10B981" fontSize="9">Resume from checkpoint</text>

        {/* Title */}
        <text x="550" y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          Model Training Pipeline
        </text>
      </svg>
      
      {/* Legend below SVG */}
      <div className="flex flex-wrap justify-center gap-6 mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-raspberry" />
          <span className="text-sm text-gray-300">Primary Storage Role</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span className="text-sm text-gray-300">Buffered Read</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-sm text-gray-300">GPU Compute (No Storage)</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-8 h-4">
            <line x1="0" y1="8" x2="32" y2="8" stroke="#C72C48" strokeWidth="3" />
          </svg>
          <span className="text-sm text-gray-300">Heavy Data Flow</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-8 h-4">
            <line x1="0" y1="8" x2="32" y2="8" stroke="#C72C48" strokeWidth="2" strokeDasharray="4" />
          </svg>
          <span className="text-sm text-gray-300">Periodic Data Flow</span>
        </div>
      </div>
    </div>
  )
}
