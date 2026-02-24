export default function InferenceDiagram() {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 lg:p-8 overflow-x-auto">
      <svg viewBox="0 0 1100 500" className="w-full min-w-[900px]" style={{ minHeight: '450px' }}>
        <defs>
          {/* Gradients */}
          <linearGradient id="infPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C72C48" />
            <stop offset="100%" stopColor="#E84A66" />
          </linearGradient>
          <linearGradient id="infBurstGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <linearGradient id="infNotInPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          
          {/* Arrow markers */}
          <marker id="infArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
          <marker id="infArrowRed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#C72C48" />
          </marker>
          <marker id="infArrowBlue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
          </marker>
          <marker id="infArrowGreen" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10B981" />
          </marker>
          
          {/* Glow effect */}
          <filter id="infGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background Grid */}
        <pattern id="infGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#infGrid)" />

        {/* Title */}
        <text x="550" y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          Inference Pipeline: Where Storage Lives (and Doesn't)
        </text>

        {/* Object Storage Layer (Bottom) */}
        <g>
          <rect x="50" y="410" width="1000" height="70" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <text x="550" y="445" textAnchor="middle" fill="#C72C48" fontSize="14" fontWeight="bold">
            Object Storage (S3-Compatible)
          </text>
          <text x="550" y="465" textAnchor="middle" fill="#9CA3AF" fontSize="11">
            model-registry/ • inference-logs/ • feedback-data/
          </text>
        </g>

        {/* Model Loading (Left side) */}
        <g>
          <rect x="70" y="60" width="160" height="120" rx="8" fill="#1F2937" stroke="#3B82F6" strokeWidth="2" />
          <circle cx="95" cy="85" r="14" fill="url(#infBurstGrad)" />
          <text x="95" y="90" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">1</text>
          <text x="150" y="90" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Model Load</text>
          <text x="150" y="110" textAnchor="middle" fill="#9CA3AF" fontSize="10">Cold start / Scale-out</text>
          <text x="150" y="125" textAnchor="middle" fill="#9CA3AF" fontSize="9">Model update / Recovery</text>
          <rect x="90" y="140" width="120" height="22" rx="4" fill="#3B82F6" />
          <text x="150" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="500">BURST READ</text>
          
          {/* Arrow from storage */}
          <path d="M 150 405 L 150 185" stroke="#3B82F6" strokeWidth="4" markerEnd="url(#infArrowBlue)" />
          <text x="165" y="300" fill="#3B82F6" fontSize="10" fontWeight="bold">140GB</text>
          <text x="165" y="315" fill="#3B82F6" fontSize="9">(70B model)</text>
        </g>

        {/* THE INFERENCE BOX - The Critical Part */}
        <g filter="url(#infGlow)">
          <rect x="300" y="50" width="500" height="220" rx="12" fill="#064E3B" stroke="#10B981" strokeWidth="3" />
          
          {/* Big label */}
          <text x="550" y="85" textAnchor="middle" fill="#10B981" fontSize="16" fontWeight="bold">
            THE INFERENCE LOOP
          </text>
          
          {/* NOT IN PATH banner */}
          <rect x="440" y="95" width="220" height="28" rx="6" fill="#10B981" />
          <text x="550" y="114" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
            STORAGE NOT IN PATH
          </text>
          
          {/* GPU Memory box */}
          <rect x="330" y="135" width="440" height="110" rx="8" fill="#1F2937" stroke="#34D399" strokeWidth="1" />
          <text x="550" y="158" textAnchor="middle" fill="#34D399" fontSize="12" fontWeight="600">GPU MEMORY (VRAM)</text>
          
          {/* Components in GPU */}
          <rect x="350" y="170" width="130" height="55" rx="4" fill="#374151" />
          <text x="415" y="192" textAnchor="middle" fill="#9CA3AF" fontSize="10">Model Weights</text>
          <text x="415" y="208" textAnchor="middle" fill="#6B7280" fontSize="9">(already loaded)</text>
          
          <rect x="500" y="170" width="130" height="55" rx="4" fill="#374151" />
          <text x="565" y="192" textAnchor="middle" fill="#9CA3AF" fontSize="10">KV Cache</text>
          <text x="565" y="208" textAnchor="middle" fill="#6B7280" fontSize="9">(attention state)</text>
          
          <rect x="650" y="170" width="100" height="55" rx="4" fill="#374151" />
          <text x="700" y="192" textAnchor="middle" fill="#9CA3AF" fontSize="10">Compute</text>
          <text x="700" y="208" textAnchor="middle" fill="#6B7280" fontSize="9">(matrix ops)</text>
          
          {/* Arrow from model load to GPU */}
          <path d="M 230 120 L 295 120" stroke="#3B82F6" strokeWidth="3" markerEnd="url(#infArrowBlue)" />
          <text x="260" y="110" fill="#3B82F6" fontSize="9">Once</text>
        </g>

        {/* User Request Flow */}
        <g>
          {/* User */}
          <circle cx="320" y="320" r="25" fill="#374151" stroke="#6B7280" strokeWidth="2" />
          <text x="320" y="315" textAnchor="middle" fill="white" fontSize="9">User</text>
          <text x="320" y="328" textAnchor="middle" fill="white" fontSize="9">Request</text>
          
          {/* Arrow into inference */}
          <path d="M 345 320 L 400 320 L 400 275" stroke="#6B7280" strokeWidth="2" markerEnd="url(#infArrow)" />
          <text x="370" y="310" fill="#6B7280" fontSize="9">Prompt</text>
          
          {/* Arrow out of inference */}
          <path d="M 700 275 L 700 320 L 755 320" stroke="#10B981" strokeWidth="2" markerEnd="url(#infArrowGreen)" />
          <text x="725" y="310" fill="#10B981" fontSize="9">Response</text>
          
          {/* Response */}
          <circle cx="780" cy="320" r="25" fill="#065F46" stroke="#10B981" strokeWidth="2" />
          <text x="780" y="315" textAnchor="middle" fill="#10B981" fontSize="9">Generated</text>
          <text x="780" y="328" textAnchor="middle" fill="#10B981" fontSize="9">Output</text>
        </g>

        {/* Logging (Right side) */}
        <g>
          <rect x="870" y="60" width="160" height="120" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="895" cy="85" r="14" fill="url(#infPrimaryGrad)" />
          <text x="895" y="90" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">2</text>
          <text x="950" y="90" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Logging</text>
          <text x="950" y="110" textAnchor="middle" fill="#9CA3AF" fontSize="10">Request/Response</text>
          <text x="950" y="125" textAnchor="middle" fill="#9CA3AF" fontSize="9">Metrics, Compliance</text>
          <rect x="890" y="140" width="120" height="22" rx="4" fill="#C72C48" />
          <text x="950" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="500">PRIMARY</text>
          
          {/* Arrow to storage */}
          <path d="M 950 185 L 950 405" stroke="#C72C48" strokeWidth="3" markerEnd="url(#infArrowRed)" />
          <text x="965" y="300" fill="#C72C48" fontSize="9">TBs over time</text>
        </g>

        {/* Feedback */}
        <g>
          <rect x="870" y="220" width="160" height="100" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="895" cy="245" r="14" fill="url(#infPrimaryGrad)" />
          <text x="895" y="250" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">3</text>
          <text x="950" y="250" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">Feedback</text>
          <text x="950" y="270" textAnchor="middle" fill="#9CA3AF" fontSize="10">User preferences</text>
          <text x="950" y="285" textAnchor="middle" fill="#9CA3AF" fontSize="9">→ Fine-tuning data</text>
          <rect x="890" y="295" width="120" height="18" rx="4" fill="#C72C48" />
          <text x="950" y="307" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">PRIMARY</text>
        </g>

        {/* Arrow from response to feedback */}
        <path d="M 805 320 L 840 320 L 840 270 L 865 270" stroke="#6B7280" strokeWidth="2" markerEnd="url(#infArrow)" strokeDasharray="4" />
        
        {/* Arrow from feedback to storage */}
        <path d="M 950 320 L 950 365 L 900 405" stroke="#C72C48" strokeWidth="2" markerEnd="url(#infArrowRed)" strokeDasharray="4" />

        {/* THE KEY CALLOUT */}
        <g>
          <rect x="350" y="355" width="400" height="45" rx="6" fill="#7F1D1D" stroke="#FCA5A5" strokeWidth="2" />
          <text x="550" y="377" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
            Storage is at the BOOKENDS — not in the generation loop
          </text>
          <text x="550" y="392" textAnchor="middle" fill="#FCA5A5" fontSize="10">
            Model load (start) → Logging (after) — but NOT during token generation
          </text>
        </g>
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-sm text-gray-300">Burst Read (Model Load)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-raspberry" />
          <span className="text-sm text-gray-300">Primary Storage Role</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-sm text-gray-300">NOT IN PATH (GPU Only)</span>
        </div>
      </div>
    </div>
  )
}
