import { useState, useEffect, useCallback } from 'react'
import { BottomLine } from './PipelineDiagram'

// ============================================================================
// TYPES & DATA
// ============================================================================

interface NodeData {
  id: string
  name: string
  shortName: string
  x: number
  y: number
  width: number
  height: number
  type: 'storage' | 'compute' | 'process' | 'vector'
  role: 'primary' | 'source-read' | 'backing-store' | 'possibly-in-path' | 'not-in-path'
  description: string
  details: string[]
  s3Paths: string[]
  ioProfile: {
    pattern: string
    volume: string
    throughput: string
    metric: string
  }
  minioFeature?: string
  phase: number
}

interface FlowPath {
  id: string
  from: string
  to: string
  label: string
  dataVolume: 'massive' | 'heavy' | 'medium' | 'light'
  direction: 'down' | 'up' | 'right' | 'left'
  animated: boolean
  description: string
}

const nodes: NodeData[] = [
  {
    id: 'doc-sources',
    name: 'Document Sources',
    shortName: 'Documents',
    x: 60,
    y: 40,
    width: 150,
    height: 90,
    type: 'process',
    role: 'primary',
    description: 'PDFs, web pages, APIs, internal docs arriving continuously',
    details: [
      'Source documents arrive continuously',
      'Formats: PDFs, web pages, APIs, internal docs',
      'Processing pipeline chunks, cleans, prepares for embedding',
      'Object storage is the canonical source of truth',
    ],
    s3Paths: [
      's3://rag-source/documents/',
      's3://rag-source/nasa-apod/2024-03-15.md',
    ],
    ioProfile: {
      pattern: 'Continuous small-medium writes',
      volume: 'GBs to TBs',
      throughput: 'Varies (scheduled or triggered)',
      metric: 'Availability, durability',
    },
    minioFeature: 'MinIO AIStor event notifications trigger ingestion pipelines automatically on new object upload',
    phase: 1,
  },
  {
    id: 'chunking',
    name: 'Chunking Pipeline',
    shortName: 'Chunking',
    x: 60,
    y: 160,
    width: 150,
    height: 90,
    type: 'process',
    role: 'primary',
    description: 'Split documents into semantic chunks, clean and normalize',
    details: [
      'Documents split into overlapping chunks (512-2048 tokens)',
      'Semantic chunking preserves meaning boundaries',
      'Metadata extracted and attached to each chunk',
      'Cleaned chunks written back to object storage',
    ],
    s3Paths: [
      's3://rag-processed/chunks/doc-{id}-chunk-{001..N}.json',
      's3://rag-processed/metadata/',
    ],
    ioProfile: {
      pattern: 'Read source → Write chunks',
      volume: 'Millions of chunk objects',
      throughput: 'Depends on corpus size',
      metric: 'Read + Write throughput',
    },
    minioFeature: 'S3 Select enables server-side filtering to retrieve only matching chunks, reducing bandwidth by 80%+',
    phase: 1,
  },
  {
    id: 'object-storage',
    name: 'Object Storage',
    shortName: 'S3 Store',
    x: 60,
    y: 280,
    width: 150,
    height: 90,
    type: 'storage',
    role: 'primary',
    description: 'S3-compatible storage — source of truth for all documents and chunks',
    details: [
      'Canonical source of truth for the entire corpus',
      'Documents, chunks, embeddings cache, vector DB backups',
      'Versioning for reproducibility across re-embedding',
      'Lifecycle policies manage retention and cost',
    ],
    s3Paths: [
      's3://rag-source/',
      's3://rag-processed/chunks/',
      's3://vectordb-data/backups/',
    ],
    ioProfile: {
      pattern: 'Mixed read/write',
      volume: 'TBs to PBs at scale',
      throughput: 'Sustained reads during embedding',
      metric: 'Aggregate throughput, durability',
    },
    minioFeature: 'Inline erasure coding with Reed-Solomon ensures document durability — survives loss of up to 50% of drives',
    phase: 1,
  },
  {
    id: 'embedding-model',
    name: 'Embedding Model',
    shortName: 'Embedder',
    x: 280,
    y: 100,
    width: 150,
    height: 100,
    type: 'compute',
    role: 'source-read',
    description: 'Reads every chunk from storage, produces dense vector representations',
    details: [
      'Reads each chunk from object storage',
      'Produces dense vector representations (768-4096 dims)',
      'At corpus scale: millions of docs, tens of millions of chunks',
      'Sustained sequential read workload — hours to days',
      'Re-embedding happens repeatedly as models improve',
    ],
    s3Paths: [
      '# Reads from:',
      's3://rag-processed/chunks/doc-{id}-chunk-{001..N}.json',
      '# Outputs vectors to vector DB',
    ],
    ioProfile: {
      pattern: 'Sustained sequential reads',
      volume: 'Entire corpus per pass',
      throughput: 'Hours to days at scale',
      metric: 'Read throughput',
    },
    minioFeature: 'MinIO Cache with distributed DRAM accelerates repeated reads during re-embedding cycles',
    phase: 2,
  },
  {
    id: 'vector-db',
    name: 'Vector Database',
    shortName: 'Vector DB',
    x: 500,
    y: 100,
    width: 150,
    height: 100,
    type: 'vector',
    role: 'backing-store',
    description: 'Milvus, Weaviate, LanceDB — in-memory index with S3 backing store',
    details: [
      'Stores and indexes vectors for similarity search',
      'In-memory/SSD index for fast query-time search',
      'Many vector DBs use S3 as durable backing store',
      'Segment flushes, write-ahead logs go to object storage',
      'You may be using object storage without realizing it',
    ],
    s3Paths: [
      's3://vectordb-data/milvus/segments/',
      's3://vectordb-data/weaviate/backups/',
      's3://vectordb-data/lancedb/tables/',
    ],
    ioProfile: {
      pattern: 'Segment writes, WAL, backup/restore',
      volume: 'GB-scale segments',
      throughput: 'Periodic flushes',
      metric: 'Write throughput, durability',
    },
    minioFeature: 'BitRot protection with HighwayHash verifies every byte of vector data at over 10 GB/s per core',
    phase: 2,
  },
  {
    id: 'user-query',
    name: 'User Query',
    shortName: 'Query',
    x: 700,
    y: 40,
    width: 130,
    height: 80,
    type: 'process',
    role: 'not-in-path',
    description: 'User submits a natural language question',
    details: [
      'Natural language query from user',
      'Query gets embedded into the same vector space',
      'Single vector operation — fast, in-memory',
      'No storage involved in query embedding',
    ],
    s3Paths: [
      '# No S3 access',
      '# Single query embedding in memory',
    ],
    ioProfile: {
      pattern: 'None',
      volume: 'Single vector',
      throughput: 'Milliseconds',
      metric: 'Latency',
    },
    phase: 3,
  },
  {
    id: 'retrieval',
    name: 'Retrieval & Context',
    shortName: 'Retrieve',
    x: 700,
    y: 150,
    width: 130,
    height: 90,
    type: 'process',
    role: 'possibly-in-path',
    description: 'Top-K similar chunks retrieved — may or may not hit storage',
    details: [
      'Query vector compared against index',
      'Top-K most similar chunks retrieved',
      'Storage involvement depends on architecture:',
      'A) Inline: chunks stored in vector DB (no S3)',
      'B) Pointer: vector DB stores S3 references (S3 in hot path)',
      'C) Cached: Redis/app cache (S3 on cache miss)',
    ],
    s3Paths: [
      '# Depends on architecture choice',
      '# May read from s3://rag-processed/chunks/',
    ],
    ioProfile: {
      pattern: 'Zero to many small reads per query',
      volume: 'Depends on architecture',
      throughput: 'Latency-sensitive if in path',
      metric: 'Latency (if S3 in query path)',
    },
    phase: 3,
  },
  {
    id: 'llm-generation',
    name: 'LLM Generation',
    shortName: 'LLM',
    x: 700,
    y: 270,
    width: 130,
    height: 90,
    type: 'compute',
    role: 'not-in-path',
    description: 'Retrieved context assembled into prompt, LLM generates response',
    details: [
      'Retrieved chunks assembled into the LLM prompt as context',
      'LLM generates response using GPU compute',
      'Pure inference — GPU memory and compute',
      'Object storage is NOT involved in this phase',
    ],
    s3Paths: [
      '# No S3 access during generation',
      '# Context in memory, weights in VRAM',
    ],
    ioProfile: {
      pattern: 'No storage I/O',
      volume: 'N/A',
      throughput: 'N/A',
      metric: 'TFLOPS (compute bound)',
    },
    phase: 4,
  },
]

const flowPaths: FlowPath[] = [
  {
    id: 'docs-to-chunking',
    from: 'doc-sources',
    to: 'chunking',
    label: 'Raw docs',
    dataVolume: 'medium',
    direction: 'down',
    animated: true,
    description: 'Documents flow into chunking pipeline',
  },
  {
    id: 'chunking-to-storage',
    from: 'chunking',
    to: 'object-storage',
    label: 'Chunks',
    dataVolume: 'heavy',
    direction: 'down',
    animated: true,
    description: 'Processed chunks written to object storage',
  },
  {
    id: 'storage-to-embedder',
    from: 'object-storage',
    to: 'embedding-model',
    label: 'Full corpus read',
    dataVolume: 'massive',
    direction: 'right',
    animated: true,
    description: 'Embedding model reads entire corpus from storage',
  },
  {
    id: 'embedder-to-vectordb',
    from: 'embedding-model',
    to: 'vector-db',
    label: 'Vectors',
    dataVolume: 'heavy',
    direction: 'right',
    animated: true,
    description: 'Generated vectors inserted into vector database',
  },
  {
    id: 'vectordb-to-storage',
    from: 'vector-db',
    to: 'object-storage',
    label: 'Segments',
    dataVolume: 'medium',
    direction: 'down',
    animated: true,
    description: 'Vector DB flushes segments to S3 backing store',
  },
  {
    id: 'query-to-retrieval',
    from: 'user-query',
    to: 'retrieval',
    label: 'Embed + Search',
    dataVolume: 'light',
    direction: 'down',
    animated: true,
    description: 'Query embedded and searched against vector index',
  },
  {
    id: 'retrieval-to-llm',
    from: 'retrieval',
    to: 'llm-generation',
    label: 'Context',
    dataVolume: 'light',
    direction: 'down',
    animated: true,
    description: 'Retrieved chunks assembled as context for LLM',
  },
  {
    id: 'vectordb-to-retrieval',
    from: 'vector-db',
    to: 'retrieval',
    label: 'Top-K',
    dataVolume: 'light',
    direction: 'right',
    animated: true,
    description: 'Vector search returns top-K matching chunks',
  },
]

const phases = [
  { id: 1, name: 'Ingestion', description: 'Documents land in object storage, get chunked' },
  { id: 2, name: 'Embedding', description: 'Full corpus read + vectorized' },
  { id: 3, name: 'Query & Retrieve', description: 'User query → vector search → chunks' },
  { id: 4, name: 'Generation', description: 'LLM generates response (no storage)' },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const roleColors: Record<string, { fill: string; stroke: string; bg: string; text: string; glow: string }> = {
  'primary': {
    fill: '#C72C48',
    stroke: '#E84A66',
    bg: 'bg-gradient-to-r from-raspberry to-raspberry-dark',
    text: 'text-raspberry',
    glow: 'rgba(199, 44, 72, 0.4)',
  },
  'source-read': {
    fill: '#C72C48',
    stroke: '#E84A66',
    bg: 'bg-gradient-to-r from-raspberry to-raspberry-dark',
    text: 'text-raspberry',
    glow: 'rgba(199, 44, 72, 0.4)',
  },
  'backing-store': {
    fill: '#F59E0B',
    stroke: '#FBBF24',
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-amber-500',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  'possibly-in-path': {
    fill: '#F59E0B',
    stroke: '#FBBF24',
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-amber-500',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  'not-in-path': {
    fill: '#10B981',
    stroke: '#34D399',
    bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
    text: 'text-emerald-500',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
}

const dataVolumeWidth: Record<string, number> = {
  'massive': 8,
  'heavy': 5,
  'medium': 3,
  'light': 2,
}

function getNodeCenter(node: NodeData): { x: number; y: number } {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }
}

function getPathPoints(from: NodeData, to: NodeData, direction: FlowPath['direction']): string {
  const fromCenter = getNodeCenter(from)
  const toCenter = getNodeCenter(to)

  let x1: number, y1: number, x2: number, y2: number

  if (direction === 'down') {
    x1 = fromCenter.x; y1 = from.y + from.height
    x2 = toCenter.x; y2 = to.y
  } else if (direction === 'up') {
    x1 = fromCenter.x; y1 = from.y
    x2 = toCenter.x; y2 = to.y + to.height
  } else if (direction === 'right') {
    x1 = from.x + from.width; y1 = fromCenter.y
    x2 = to.x; y2 = toCenter.y
  } else {
    x1 = from.x; y1 = fromCenter.y
    x2 = to.x + to.width; y2 = toCenter.y
  }

  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  if (direction === 'down' || direction === 'up') {
    return `M ${x1} ${y1} Q ${x1} ${midY} ${midX} ${midY} Q ${x2} ${midY} ${x2} ${y2}`
  } else {
    return `M ${x1} ${y1} Q ${midX} ${y1} ${midX} ${midY} Q ${midX} ${y2} ${x2} ${y2}`
  }
}

const roleLabel: Record<string, string> = {
  'primary': 'PRIMARY',
  'source-read': 'SOURCE READ',
  'backing-store': 'BACKING STORE',
  'possibly-in-path': 'MAYBE IN PATH',
  'not-in-path': 'COMPUTE ONLY',
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InteractiveRAGExplorer() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentPhase, setCurrentPhase] = useState(1)
  const [speed, setSpeed] = useState(1)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentPhase(prev => prev >= 4 ? 1 : prev + 1)
    }, 3000 / speed)
    return () => clearInterval(interval)
  }, [isPlaying, speed])

  const handleNodeClick = useCallback((node: NodeData) => {
    setSelectedNode(node)
    setIsPlaying(false)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const stepForward = useCallback(() => {
    setCurrentPhase(prev => prev >= 4 ? 1 : prev + 1)
  }, [])

  const stepBackward = useCallback(() => {
    setCurrentPhase(prev => prev <= 1 ? 4 : prev - 1)
  }, [])

  return (
    <div>
      {/* Interactive Diagram */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Header with Controls */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-white/10 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Interactive RAG Pipeline
              </h3>
              <p className="text-sm text-gray-400 mt-1">Click any node to explore details — Ingestion vs Query paths</p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={stepBackward}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                title="Previous phase"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-3 rounded-xl transition-all ${
                  isPlaying
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={stepForward}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                title="Next phase"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-700">
                <span className="text-xs text-gray-500">Speed:</span>
                {[0.5, 1, 2].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      speed === s
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Phase Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {phases.map(phase => (
              <button
                key={phase.id}
                onClick={() => { setCurrentPhase(phase.id); setIsPlaying(false) }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  currentPhase === phase.id
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : currentPhase > phase.id
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-800 text-gray-500'
                }`}
              >
                <span className="block font-bold">{phase.id}. {phase.name}</span>
              </button>
            ))}
          </div>

          {/* Ingestion vs Query label */}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-raspberry/30 border border-raspberry/50" />
              <span className="text-gray-400">Ingestion Pipeline (Batch)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
              <span className="text-gray-400">Query Pipeline (Real-time)</span>
            </div>
          </div>
        </div>

        {/* Main Diagram */}
        <div className="relative p-6 overflow-x-auto" style={{ minHeight: '460px' }}>
          <svg viewBox="0 0 900 400" className="w-full min-w-[850px]">
            <defs>
              <linearGradient id="ragStorageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="100%" stopColor="#1F2937" />
              </linearGradient>
              <linearGradient id="ragPrimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C72C48" />
                <stop offset="100%" stopColor="#E84A66" />
              </linearGradient>
              <linearGradient id="ragAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
              <linearGradient id="ragComputeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#065F46" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="ragVectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E3A5F" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <marker id="ragArrowPrimary" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#C72C48" />
              </marker>
              <marker id="ragArrowAmber" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B" />
              </marker>
              <marker id="ragArrowGreen" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#10B981" />
              </marker>
              <filter id="ragGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="ragGlowStrong">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Background Grid */}
            <pattern id="ragGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#ragGrid)" />

            {/* Divider line between ingestion and query side */}
            <line x1="650" y1="20" x2="650" y2="380" stroke="#4B5563" strokeWidth="1" strokeDasharray="8,4" opacity="0.5" />
            <text x="350" y="395" textAnchor="middle" fill="#6B7280" fontSize="10">INGESTION (Batch)</text>
            <text x="775" y="395" textAnchor="middle" fill="#6B7280" fontSize="10">QUERY (Real-time)</text>

            {/* Flow Paths */}
            {flowPaths.map(flow => {
              const fromNode = nodes.find(n => n.id === flow.from)
              const toNode = nodes.find(n => n.id === flow.to)
              if (!fromNode || !toNode) return null

              const pathD = getPathPoints(fromNode, toNode, flow.direction)
              const strokeWidth = dataVolumeWidth[flow.dataVolume]
              const isActive = fromNode.phase <= currentPhase && toNode.phase <= currentPhase
              const fromColors = roleColors[fromNode.role]

              return (
                <g key={flow.id} opacity={isActive ? 1 : 0.3}>
                  {isActive && flow.animated && (
                    <path d={pathD} fill="none" stroke={fromColors.fill} strokeWidth={strokeWidth + 4} opacity={0.2} filter="url(#ragGlow)" />
                  )}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={fromColors.fill}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    markerEnd={`url(#ragArrow${fromNode.role === 'not-in-path' ? 'Green' : fromNode.role === 'backing-store' || fromNode.role === 'possibly-in-path' ? 'Amber' : 'Primary'})`}
                    strokeDasharray={flow.animated && isActive ? '10,5' : 'none'}
                  >
                    {flow.animated && isActive && (
                      <animate attributeName="stroke-dashoffset" values="30;0" dur={`${1 / speed}s`} repeatCount="indefinite" />
                    )}
                  </path>
                  {isActive && (
                    <text
                      x={(fromNode.x + fromNode.width / 2 + toNode.x + toNode.width / 2) / 2}
                      y={(fromNode.y + fromNode.height + toNode.y) / 2 - 5}
                      textAnchor="middle"
                      fill={fromColors.fill}
                      fontSize="10"
                      fontWeight="600"
                      className="pointer-events-none"
                    >
                      {flow.label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const colors = roleColors[node.role]
              const isActive = node.phase <= currentPhase
              const isHovered = hoveredNode === node.id
              const isSelected = selectedNode?.id === node.id

              const fillGrad = node.type === 'compute' ? 'url(#ragComputeGrad)'
                : node.type === 'vector' ? 'url(#ragVectorGrad)'
                : 'url(#ragStorageGrad)'

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition-all"
                  style={{
                    opacity: isActive ? 1 : 0.4,
                    transform: isHovered || isSelected ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: `${node.x + node.width / 2}px ${node.y + node.height / 2}px`,
                  }}
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {(isActive && (isHovered || isSelected)) && (
                    <rect x={node.x - 4} y={node.y - 4} width={node.width + 8} height={node.height + 8} rx="16" fill={colors.fill} opacity={0.2} filter="url(#ragGlowStrong)" />
                  )}
                  <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="12" fill={fillGrad} stroke={colors.fill} strokeWidth={isSelected ? 3 : 2} />
                  <circle cx={node.x + 20} cy={node.y + 20} r="12" fill={colors.fill} />
                  <text x={node.x + 20} y={node.y + 24} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{node.phase}</text>
                  <text x={node.x + node.width / 2} y={node.y + 20} textAnchor="middle" fill="white" fontSize="12" fontWeight="600" dx="10">{node.shortName}</text>
                  <rect x={node.x + 10} y={node.y + node.height - 30} width={node.width - 20} height="20" rx="4" fill={colors.fill} opacity={0.9} />
                  <text x={node.x + node.width / 2} y={node.y + node.height - 16} textAnchor="middle" fill="white" fontSize="9" fontWeight="600" letterSpacing="0.05em">
                    {roleLabel[node.role]}
                  </text>
                  <foreignObject x={node.x + 8} y={node.y + 32} width={node.width - 16} height={node.height - 70}>
                    <div className="text-[10px] text-gray-400 leading-tight overflow-hidden">
                      {node.description.slice(0, 55)}...
                    </div>
                  </foreignObject>
                  {isHovered && (
                    <g>
                      <circle cx={node.x + node.width - 15} cy={node.y + 15} r="8" fill={colors.fill} opacity={0.8}>
                        <animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <text x={node.x + node.width - 15} y={node.y + 18} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">+</text>
                    </g>
                  )}
                </g>
              )
            })}

            {/* Current Phase Indicator */}
            <text x="450" y="385" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontWeight="500">
              Phase {currentPhase}: {phases[currentPhase - 1]?.name}
            </text>
          </svg>

          {/* Detail Panel (Slide-in) */}
          {selectedNode && (
            <div
              className="absolute top-0 right-0 w-96 h-full bg-gray-900/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto animate-slide-in-left"
              style={{ animationDuration: '0.3s' }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-2 ${roleColors[selectedNode.role].bg} text-white`}>
                      {roleLabel[selectedNode.role]}
                    </div>
                    <h3 className="text-xl font-bold text-white">{selectedNode.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{selectedNode.description}</p>
                  </div>
                  <button onClick={handleClose} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Key Points</h4>
                    <ul className="space-y-2">
                      {selectedNode.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${roleColors[selectedNode.role].bg} flex-shrink-0`} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">S3 Paths</h4>
                    <div className="space-y-2">
                      {selectedNode.s3Paths.map((path, i) => (
                        <code key={i} className={`block text-xs px-3 py-2 rounded-lg font-mono ${path.startsWith('#') ? 'bg-gray-800 text-gray-500 italic' : 'bg-gray-800 text-raspberry-light'}`}>
                          {path}
                        </code>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">I/O Profile</h4>
                    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between"><span className="text-xs text-gray-500">Pattern</span><span className="text-xs text-white font-medium">{selectedNode.ioProfile.pattern}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-gray-500">Volume</span><span className="text-xs text-white font-medium">{selectedNode.ioProfile.volume}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-gray-500">Throughput</span><span className="text-xs text-white font-medium">{selectedNode.ioProfile.throughput}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-gray-500">Key Metric</span><span className={`text-xs font-medium ${roleColors[selectedNode.role].text}`}>{selectedNode.ioProfile.metric}</span></div>
                    </div>
                  </div>

                  {selectedNode.minioFeature && (
                    <div className="bg-gradient-to-r from-raspberry/10 to-raspberry/5 border border-raspberry/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-raspberry/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-raspberry mb-1">MinIO AIStor</h5>
                          <p className="text-xs text-gray-400 leading-relaxed">{selectedNode.minioFeature}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-gray-800/50 border-t border-white/10 px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-raspberry to-raspberry-dark" />
              <span className="text-xs text-gray-400">Primary / Source Read</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-500 to-orange-500" />
              <span className="text-xs text-gray-400">Backing Store / Maybe In Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-green-500" />
              <span className="text-xs text-gray-400">Compute Only (No Storage)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to right, #1E3A5F, #2563EB)' }} />
              <span className="text-xs text-gray-400">Vector Database</span>
            </div>
          </div>
        </div>
      </div>

      {/* The Critical Architecture Question — migrated from RAG tab */}
      <section className="mt-12 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">The Critical Architecture Question</h2>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-4">Where do retrieved chunks come from at query time?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-amber-200">
              <div className="font-medium text-gray-900 mb-2">Option A: Inline Storage</div>
              <p className="text-sm text-gray-600 mb-2">Vector DB stores chunk text inline with the vector</p>
              <div className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-600">
                Storage: <span className="font-semibold text-green-600">NOT in query path</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-amber-200">
              <div className="font-medium text-gray-900 mb-2">Option B: Pointer Storage</div>
              <p className="text-sm text-gray-600 mb-2">Vector DB stores pointers back to S3 chunks</p>
              <div className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-600">
                Storage: <span className="font-semibold text-raspberry">IN query hot path</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-amber-200">
              <div className="font-medium text-gray-900 mb-2">Option C: Cached</div>
              <p className="text-sm text-gray-600 mb-2">Chunks cached in Redis/app memory after first retrieval</p>
              <div className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-600">
                Storage: <span className="font-semibold text-amber-600">Warm path (cache miss)</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-amber-700">
            Your architecture choice determines whether object storage latency affects query response time. 
            Know which pattern you're using.
          </p>
        </div>
      </section>

      {/* Key Technical Insights — migrated from RAG tab */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Technical Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
              Continuous Ingestion
            </h3>
            <p className="text-gray-600">
              RAG is not a one-time setup. New documents arrive continuously. Your ingestion pipeline 
              (ingest → chunk → embed → upsert) runs on a schedule or trigger. Object storage is always 
              the durable source of truth.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </span>
              Corpus-Scale Embedding
            </h3>
            <p className="text-gray-600">
              Embedding isn't a one-time setup. Millions of documents, tens of millions of chunks, each 
              read from object storage and passed through an embedding model. At enterprise scale this 
              runs for hours or days — a sustained storage read workload. When you upgrade your embedding 
              model or change chunk sizes, you do it all again.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
              Vector DB Backing Store
            </h3>
            <p className="text-gray-600">
              Many vector databases use S3-compatible storage as their durable layer. Milvus, LanceDB, 
              and others flush segments to object storage. You might be using object storage in the 
              vector DB tier without realizing it.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              RAG ≠ Inference
            </h3>
            <p className="text-gray-600">
              RAG is a retrieval + generation pipeline. The retrieval phase has distinct storage patterns 
              from pure inference. Don't conflate "RAG performance" with "LLM inference performance" — 
              they're measuring different things.
            </p>
          </div>
        </div>
      </section>

      {/* I/O Profile Summary — migrated from RAG tab */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">I/O Profile Summary</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority Metric</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Document Ingestion</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Small-medium writes</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Continuous / scheduled</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Availability, durability</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Embedding Pass</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sustained sequential reads</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Entire corpus per pass (hours-days)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Read throughput</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Vector DB Flush</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Segment writes</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Periodic</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Write throughput, durability</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Chunk Retrieval</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Small random reads</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Per query (if in path)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Latency (if in query path)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <BottomLine>
        Object storage is the document store, embedding source, and often the vector DB backing store. 
        You're always in the ingestion pipeline. Whether you're in the query path depends on your 
        architecture — know which pattern you're using and plan accordingly.
      </BottomLine>
    </div>
  )
}
