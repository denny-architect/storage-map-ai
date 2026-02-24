export default function RAGDiagram() {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 lg:p-8 overflow-x-auto">
      <svg viewBox="0 0 1100 450" className="w-full min-w-[900px]" style={{ minHeight: '400px' }}>
        <defs>
          {/* Gradients */}
          <linearGradient id="ragPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C72C48" />
            <stop offset="100%" stopColor="#E84A66" />
          </linearGradient>
          <linearGradient id="ragBufferedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>
          <linearGradient id="ragNotInPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>
          
          {/* Arrow markers */}
          <marker id="ragArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
          <marker id="ragArrowRed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#C72C48" />
          </marker>
          <marker id="ragArrowAmber" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B" />
          </marker>
        </defs>

        {/* Background Grid */}
        <pattern id="ragGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#ragGrid)" />

        {/* Title */}
        <text x="550" y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
          RAG Pipeline: Ingestion vs Query Paths
        </text>

        {/* Divider - Ingestion vs Query */}
        <line x1="550" y1="45" x2="550" y2="350" stroke="#4B5563" strokeWidth="2" strokeDasharray="8,4" />
        <text x="300" y="60" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontWeight="500">INGESTION PIPELINE (Batch)</text>
        <text x="800" y="60" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontWeight="500">QUERY PIPELINE (Real-time)</text>

        {/* Object Storage Layer (Bottom) */}
        <g>
          <rect x="50" y="360" width="1000" height="70" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <text x="550" y="395" textAnchor="middle" fill="#C72C48" fontSize="14" fontWeight="bold">
            Object Storage (S3-Compatible)
          </text>
          <text x="550" y="415" textAnchor="middle" fill="#9CA3AF" fontSize="11">
            rag-source/ • rag-processed/chunks/ • vectordb-data/
          </text>
        </g>

        {/* INGESTION SIDE */}
        
        {/* Phase 1: Document Ingestion */}
        <g>
          <rect x="70" y="90" width="150" height="90" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="90" cy="110" r="12" fill="url(#ragPrimaryGrad)" />
          <text x="90" y="114" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">1</text>
          <text x="145" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">Doc Ingestion</text>
          <text x="145" y="135" textAnchor="middle" fill="#9CA3AF" fontSize="10">PDFs, APIs, Web</text>
          <rect x="90" y="150" width="110" height="18" rx="4" fill="#C72C48" />
          <text x="145" y="162" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">PRIMARY</text>
          
          {/* Arrow to storage */}
          <path d="M 145 180 L 145 355" stroke="#C72C48" strokeWidth="3" markerEnd="url(#ragArrowRed)" />
        </g>

        {/* Phase 2: Chunking */}
        <g>
          <rect x="260" y="90" width="120" height="90" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="280" cy="110" r="12" fill="url(#ragPrimaryGrad)" />
          <text x="280" y="114" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">2</text>
          <text x="320" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">Chunking</text>
          <text x="320" y="135" textAnchor="middle" fill="#9CA3AF" fontSize="10">Split & Clean</text>
          <rect x="265" y="150" width="110" height="18" rx="4" fill="#C72C48" />
          <text x="320" y="162" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">PRIMARY</text>
          
          {/* Bidirectional arrow to storage */}
          <path d="M 320 180 L 320 355" stroke="#C72C48" strokeWidth="2" markerEnd="url(#ragArrowRed)" strokeDasharray="6,3" />
        </g>

        {/* Phase 3: Embedding */}
        <g>
          <rect x="420" y="90" width="120" height="90" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
          <circle cx="440" cy="110" r="12" fill="url(#ragPrimaryGrad)" />
          <text x="440" y="114" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">3</text>
          <text x="480" y="115" textAnchor="middle" fill="white" fontSize="12" fontWeight="600">Embedding</text>
          <text x="480" y="135" textAnchor="middle" fill="#9CA3AF" fontSize="10">Chunks → Vectors</text>
          <rect x="425" y="150" width="110" height="18" rx="4" fill="#C72C48" />
          <text x="480" y="162" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">SOURCE READ</text>
          
          {/* Arrow from storage */}
          <path d="M 480 355 L 480 180" stroke="#C72C48" strokeWidth="2" markerEnd="url(#ragArrow)" />
        </g>

        {/* Arrows between ingestion phases */}
        <path d="M 220 135 L 255 135" stroke="#6B7280" strokeWidth="2" markerEnd="url(#ragArrow)" />
        <path d="M 380 135 L 415 135" stroke="#6B7280" strokeWidth="2" markerEnd="url(#ragArrow)" />

        {/* Vector Database (Center) */}
        <g>
          <rect x="260" y="220" width="220" height="100" rx="8" fill="#1E3A5F" stroke="#3B82F6" strokeWidth="2" />
          <text x="370" y="250" textAnchor="middle" fill="#60A5FA" fontSize="13" fontWeight="bold">Vector Database</text>
          <text x="370" y="270" textAnchor="middle" fill="#93C5FD" fontSize="10">Milvus / Weaviate / Clickhouse</text>
          <text x="370" y="290" textAnchor="middle" fill="#93C5FD" fontSize="10">In-memory index + S3 backing</text>
          
          {/* Arrow from embedding to vector DB */}
          <path d="M 480 180 L 480 210 L 420 220" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#ragArrow)" fill="none" />
          
          {/* Arrow to storage (backing store) */}
          <path d="M 370 320 L 370 355" stroke="#F59E0B" strokeWidth="2" markerEnd="url(#ragArrowAmber)" strokeDasharray="4,2" />
          <text x="385" y="340" fill="#F59E0B" fontSize="9">Segments</text>
        </g>

        {/* QUERY SIDE */}

        {/* User Query */}
        <g>
          <circle cx="620" cy="120" r="30" fill="#374151" stroke="#6B7280" strokeWidth="2" />
          <text x="620" y="115" textAnchor="middle" fill="white" fontSize="10">User</text>
          <text x="620" y="128" textAnchor="middle" fill="white" fontSize="10">Query</text>
        </g>

        {/* Phase 4: Query Embedding */}
        <g>
          <rect x="680" y="90" width="120" height="70" rx="8" fill="#1F2937" stroke="#6B7280" strokeWidth="2" />
          <circle cx="700" cy="108" r="10" fill="#6B7280" />
          <text x="700" y="112" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">4</text>
          <text x="740" y="113" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Embed Query</text>
          <text x="740" y="130" textAnchor="middle" fill="#9CA3AF" fontSize="9">Single vector</text>
          <rect x="695" y="140" width="90" height="14" rx="3" fill="#6B7280" />
          <text x="740" y="150" textAnchor="middle" fill="white" fontSize="8">IN MEMORY</text>
        </g>

        {/* Phase 5: Vector Search */}
        <g>
          <rect x="830" y="90" width="120" height="70" rx="8" fill="#1F2937" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="850" cy="108" r="10" fill="url(#ragBufferedGrad)" />
          <text x="850" y="112" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">5</text>
          <text x="890" y="113" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">Vector Search</text>
          <text x="890" y="130" textAnchor="middle" fill="#9CA3AF" fontSize="9">Top-K similar</text>
          <rect x="845" y="140" width="90" height="14" rx="3" fill="#F59E0B" />
          <text x="890" y="150" textAnchor="middle" fill="white" fontSize="8">MAYBE S3</text>
        </g>

        {/* Arrows for query flow */}
        <path d="M 650 120 L 675 120" stroke="#6B7280" strokeWidth="2" markerEnd="url(#ragArrow)" />
        <path d="M 800 125 L 825 125" stroke="#6B7280" strokeWidth="2" markerEnd="url(#ragArrow)" />
        
        {/* Arrow from vector search to vector DB */}
        <path d="M 890 160 L 890 270 L 485 270" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#ragArrow)" fill="none" />
        
        {/* Maybe arrow to storage for chunk retrieval */}
        <path d="M 890 270 L 890 355" stroke="#F59E0B" strokeWidth="2" markerEnd="url(#ragArrowAmber)" strokeDasharray="6,3" />
        <text x="905" y="320" fill="#F59E0B" fontSize="9">Maybe?</text>

        {/* Phase 6: LLM Generation */}
        <g>
          <rect x="750" y="200" width="170" height="90" rx="8" fill="#065F46" stroke="#10B981" strokeWidth="2" />
          <text x="835" y="230" textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="bold">LLM GENERATION</text>
          <text x="835" y="250" textAnchor="middle" fill="#A7F3D0" fontSize="10">Context + Query → Response</text>
          <rect x="770" y="260" width="130" height="18" rx="4" fill="#1F2937" stroke="#10B981" strokeWidth="1" />
          <text x="835" y="273" textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="500">NOT IN PATH</text>
        </g>

        {/* Arrow from search to LLM */}
        <path d="M 890 160 L 890 195" stroke="#6B7280" strokeWidth="2" markerEnd="url(#ragArrow)" />
        
        {/* Response arrow */}
        <path d="M 835 290 L 835 330" stroke="#10B981" strokeWidth="2" markerEnd="url(#ragArrow)" />
        <text x="850" y="320" fill="#10B981" fontSize="10">Response</text>

        {/* Question box */}
        <g>
          <rect x="580" y="280" width="150" height="60" rx="6" fill="#78350F" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4" />
          <text x="655" y="300" textAnchor="middle" fill="#FCD34D" fontSize="9" fontWeight="bold">THE QUESTION:</text>
          <text x="655" y="315" textAnchor="middle" fill="#FCD34D" fontSize="8">Are chunks fetched from</text>
          <text x="655" y="328" textAnchor="middle" fill="#FCD34D" fontSize="8">S3 at query time?</text>
        </g>
      </svg>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-raspberry" />
          <span className="text-sm text-gray-300">Primary Storage Role</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span className="text-sm text-gray-300">Maybe In Path (Architecture Dependent)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-500" />
          <span className="text-sm text-gray-300">Not In Path</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span className="text-sm text-gray-300">GPU Compute Only</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-sm text-gray-300">Vector Database</span>
        </div>
      </div>
    </div>
  )
}
