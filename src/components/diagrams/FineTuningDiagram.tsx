export default function FineTuningDiagram() {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 lg:p-8 overflow-x-auto">
      <svg viewBox="0 0 1100 420" className="w-full min-w-[900px]" style={{ minHeight: '380px' }}>
        <defs>
          {/* Gradients */}
          <linearGradient id="ftPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C72C48" />
            <stop offset="100%" stopColor="#E84A66" />
          </linearGradient>
          <linearGradient id="ftBurstGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <linearGradient id="ftBufferedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          
          {/* Arrow markers */}
          <marker id="ftArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
          <marker id="ftArrowRed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#C72C48" />
          </marker>
          <marker id="ftArrowBlue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
          </marker>
        </defs>

        {/* Background Grid */}
        <pattern id="ftGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#ftGrid)" />

        {/* Title */}
        <text x="550" y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          Fine-Tuning Pipeline (LoRA/QLoRA)
        </text>

        {/* Object Storage Layer (Bottom) */}
        <g>
          <rect x="50" y="330" width="1000" height="70" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <text x="550" y="365" textAnchor="middle" fill="#C72C48" fontSize="14" fontWeight="bold">
            Object Storage (S3-Compatible)
          </text>
          <text x="550" y="385" textAnchor="middle" fill="#9CA3AF" fontSize="11">
            finetune-data/ • model-registry/ • finetune-checkpoints/
          </text>
          
          {/* Storage sections */}
          <line x1="350" y1="340" x2="350" y2="400" stroke="#4B5563" strokeWidth="1" strokeDasharray="4" />
          <line x1="650" y1="340" x2="650" y2="400" stroke="#4B5563" strokeWidth="1" strokeDasharray="4" />
          
          <text x="200" y="355" textAnchor="middle" fill="#6B7280" fontSize="10">Datasets (GB)</text>
          <text x="500" y="355" textAnchor="middle" fill="#6B7280" fontSize="10">Base Models (100s GB)</text>
          <text x="825" y="355" textAnchor="middle" fill="#6B7280" fontSize="10">Adapters (MBs)</text>
        </g>

        {/* Phase 1: Dataset Prep */}
        <g>
          <rect x="70" y="70" width="140" height="100" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="90" cy="90" r="12" fill="url(#ftPrimaryGrad)" />
          <text x="90" y="94" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">1</text>
          <text x="140" y="95" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">Dataset Prep</text>
          <text x="140" y="115" textAnchor="middle" fill="#9CA3AF" fontSize="10">JSONL, Chat format</text>
          <text x="140" y="130" textAnchor="middle" fill="#9CA3AF" fontSize="9">1K-1M examples</text>
          <rect x="85" y="140" width="110" height="18" rx="4" fill="#C72C48" />
          <text x="140" y="152" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">PRIMARY</text>
          
          {/* Arrow to storage */}
          <path d="M 140 170 L 140 325" stroke="#C72C48" strokeWidth="2" markerEnd="url(#ftArrowRed)" />
          <text x="155" y="250" fill="#C72C48" fontSize="9">GBs</text>
        </g>

        {/* Phase 2: Base Model Load */}
        <g>
          <rect x="260" y="70" width="140" height="100" rx="8" fill="#1F2937" stroke="#3B82F6" strokeWidth="2" />
          <circle cx="280" cy="90" r="12" fill="url(#ftBurstGrad)" />
          <text x="280" y="94" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">2</text>
          <text x="330" y="95" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">Load Base</text>
          <text x="330" y="115" textAnchor="middle" fill="#9CA3AF" fontSize="10">Frozen weights</text>
          <text x="330" y="130" textAnchor="middle" fill="#9CA3AF" fontSize="9">From registry</text>
          <rect x="275" y="140" width="110" height="18" rx="4" fill="#3B82F6" />
          <text x="330" y="152" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">BURST READ</text>
          
          {/* Arrow from storage */}
          <path d="M 330 325 L 330 170" stroke="#3B82F6" strokeWidth="3" markerEnd="url(#ftArrowBlue)" />
          <text x="345" y="250" fill="#3B82F6" fontSize="9">140GB</text>
        </g>

        {/* GPU Training Box */}
        <g>
          <rect x="450" y="55" width="200" height="180" rx="8" fill="#1F2937" stroke="#10B981" strokeWidth="2" />
          
          {/* Base Model (frozen) */}
          <rect x="470" y="75" width="160" height="50" rx="4" fill="#374151" stroke="#6B7280" strokeWidth="1" />
          <text x="550" y="95" textAnchor="middle" fill="#9CA3AF" fontSize="11">Base Model (FROZEN)</text>
          <text x="550" y="112" textAnchor="middle" fill="#6B7280" fontSize="9">99%+ of parameters</text>
          
          {/* LoRA Adapters (training) */}
          <rect x="470" y="135" width="160" height="50" rx="4" fill="#065F46" stroke="#10B981" strokeWidth="2" />
          <text x="550" y="155" textAnchor="middle" fill="#10B981" fontSize="11" fontWeight="bold">LoRA Adapters</text>
          <text x="550" y="172" textAnchor="middle" fill="#A7F3D0" fontSize="9">TRAINING (tiny params)</text>
          
          {/* Training label */}
          <text x="550" y="210" textAnchor="middle" fill="#10B981" fontSize="10">Forward → Backward → Update</text>
          <text x="550" y="225" textAnchor="middle" fill="#6B7280" fontSize="9">Only adapter weights change</text>
        </g>

        {/* Phase 3 indicator */}
        <g>
          <circle cx="430" cy="70" r="12" fill="url(#ftBufferedGrad)" />
          <text x="430" y="74" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">3</text>
          <text x="430" y="50" textAnchor="middle" fill="#F59E0B" fontSize="10">Training Loop</text>
        </g>

        {/* Data flow into training */}
        <path d="M 210 120 L 250 120" stroke="#6B7280" strokeWidth="2" markerEnd="url(#ftArrow)" />
        <path d="M 400 120 L 445 120" stroke="#6B7280" strokeWidth="2" markerEnd="url(#ftArrow)" />
        <path d="M 210 120 L 230 120 L 230 155 L 445 155" stroke="#F59E0B" strokeWidth="2" markerEnd="url(#ftArrow)" fill="none" strokeDasharray="4" />
        <text x="320" y="175" fill="#F59E0B" fontSize="9">Stream batches</text>

        {/* Phase 4: Checkpointing */}
        <g>
          <rect x="700" y="70" width="140" height="100" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="720" cy="90" r="12" fill="url(#ftPrimaryGrad)" />
          <text x="720" y="94" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">4</text>
          <text x="770" y="95" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">Checkpoint</text>
          <text x="770" y="115" textAnchor="middle" fill="#9CA3AF" fontSize="10">Adapters only!</text>
          <text x="770" y="130" textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="bold">~100 MB</text>
          <rect x="715" y="140" width="110" height="18" rx="4" fill="#C72C48" />
          <text x="770" y="152" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">PRIMARY (TINY)</text>
          
          {/* Arrow to storage */}
          <path d="M 770 170 L 770 325" stroke="#C72C48" strokeWidth="2" markerEnd="url(#ftArrowRed)" />
          <text x="785" y="250" fill="#C72C48" fontSize="9">MBs</text>
        </g>

        {/* Phase 5: Export */}
        <g>
          <rect x="890" y="70" width="140" height="100" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="910" cy="90" r="12" fill="url(#ftPrimaryGrad)" />
          <text x="910" y="94" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">5</text>
          <text x="960" y="95" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">Export</text>
          <text x="960" y="115" textAnchor="middle" fill="#9CA3AF" fontSize="10">Version adapter</text>
          <text x="960" y="130" textAnchor="middle" fill="#9CA3AF" fontSize="9">Independent of base</text>
          <rect x="905" y="140" width="110" height="18" rx="4" fill="#C72C48" />
          <text x="960" y="152" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">PRIMARY</text>
          
          {/* Arrow to storage */}
          <path d="M 960 170 L 960 325" stroke="#C72C48" strokeWidth="2" markerEnd="url(#ftArrowRed)" />
        </g>

        {/* Arrows between phases */}
        <path d="M 650 145 L 695 120" stroke="#6B7280" strokeWidth="2" markerEnd="url(#ftArrow)" />
        <path d="M 840 120 L 885 120" stroke="#6B7280" strokeWidth="2" markerEnd="url(#ftArrow)" />

        {/* Scale comparison callout */}
        <g>
          <rect x="700" y="260" width="180" height="55" rx="6" fill="#1F2937" stroke="#10B981" strokeWidth="1" />
          <text x="790" y="280" textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="bold">vs Full Training:</text>
          <text x="790" y="295" textAnchor="middle" fill="#A7F3D0" fontSize="9">Checkpoint: 100MB vs 500GB</text>
          <text x="790" y="308" textAnchor="middle" fill="#A7F3D0" fontSize="9">= 5,000x smaller!</text>
        </g>

        {/* Serving note */}
        <g>
          <rect x="70" y="260" width="180" height="55" rx="6" fill="#1F2937" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4" />
          <text x="160" y="280" textAnchor="middle" fill="#F59E0B" fontSize="10" fontWeight="bold">At Serving Time:</text>
          <text x="160" y="295" textAnchor="middle" fill="#FCD34D" fontSize="9">Load base once, swap adapters</text>
          <text x="160" y="308" textAnchor="middle" fill="#FCD34D" fontSize="9">per request/tenant</text>
        </g>
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-raspberry" />
          <span className="text-sm text-gray-300">Primary Storage Role</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-sm text-gray-300">Burst Read (Model Load)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span className="text-sm text-gray-300">Buffered (Data Stream)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-sm text-gray-300">Training (Adapters Only)</span>
        </div>
      </div>
    </div>
  )
}
