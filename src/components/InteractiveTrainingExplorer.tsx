import { useState, useEffect, useCallback } from 'react'

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
  type: 'storage' | 'compute' | 'process'
  role: 'primary' | 'buffered' | 'burst' | 'not-in-path'
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
  dataVolume: string // For arrow thickness
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
    id: 'raw-data',
    name: 'Raw Data Sources',
    shortName: 'Raw Data',
    x: 80,
    y: 40,
    width: 160,
    height: 90,
    type: 'process',
    role: 'primary',
    description: 'Web scrapes, Common Crawl, domain corpora, proprietary datasets',
    details: [
      'Petabytes of unstructured data lands here first',
      'Sources: web crawls, licensed datasets, internal data',
      'Formats: text, images, audio, video, structured logs',
      'This is the gravitational center of your data lake',
    ],
    s3Paths: [
      's3://data-lake/raw/common-crawl/',
      's3://data-lake/raw/proprietary/',
      's3://data-lake/raw/web-scrapes/',
    ],
    ioProfile: {
      pattern: 'Bulk sequential writes',
      volume: 'Petabytes',
      throughput: '10-50 GB/s ingestion',
      metric: 'Write throughput',
    },
    minioFeature: 'MinIO AIStor handles PB-scale ingestion with 165 GiB/s PUT throughput on a 32-node cluster',
    dataVolume: 'PB',
    phase: 1,
  },
  {
    id: 'data-pipeline',
    name: 'Data Processing Pipeline',
    shortName: 'ETL Pipeline',
    x: 80,
    y: 160,
    width: 160,
    height: 90,
    type: 'process',
    role: 'primary',
    description: 'Clean, deduplicate, filter toxicity, tokenize into training shards',
    details: [
      'Deduplication removes redundant data (often 30-50%)',
      'Toxicity filtering for safe model behavior',
      'Quality scoring to prioritize high-value data',
      'Tokenization converts text to model-ready format',
    ],
    s3Paths: [
      's3://data-lake/cleaned/',
      's3://data-lake/deduplicated/',
      's3://data-lake/tokenized/shards/',
    ],
    ioProfile: {
      pattern: 'Read raw → Write processed',
      volume: 'TB per stage',
      throughput: '20-100 GB/s',
      metric: 'Read + Write throughput',
    },
    minioFeature: 'S3 Select with SIMD acceleration enables server-side filtering, reducing bandwidth by 80%+',
    dataVolume: 'TB',
    phase: 1,
  },
  {
    id: 'minio-datalake',
    name: 'MinIO AIStor Data Lake',
    shortName: 'Data Lake',
    x: 80,
    y: 280,
    width: 160,
    height: 100,
    type: 'storage',
    role: 'primary',
    description: 'S3-compatible object storage - the foundation of your AI data infrastructure',
    details: [
      'Training-ready shards stored as immutable objects',
      'Erasure coding (Reed-Solomon) for durability',
      'Versioning for reproducibility',
      'Lifecycle policies for cost optimization',
    ],
    s3Paths: [
      's3://training-data/tokenized/shard-{00000..99999}.tar',
      's3://training-data/metadata/manifest.json',
    ],
    ioProfile: {
      pattern: 'Sequential bulk storage',
      volume: 'Petabytes total',
      throughput: '325 GiB/s GET capacity',
      metric: 'Aggregate throughput',
    },
    minioFeature: 'Inline erasure coding written in assembly - survives loss of up to 50% of drives',
    dataVolume: 'PB',
    phase: 1,
  },
  {
    id: 'data-loader',
    name: 'Data Loader',
    shortName: 'DataLoader',
    x: 320,
    y: 160,
    width: 140,
    height: 90,
    type: 'process',
    role: 'buffered',
    description: 'PyTorch DataLoader, Mosaic StreamingDataset, or NVIDIA DALI',
    details: [
      'Prefetch buffers hide storage latency',
      'Multi-worker parallel data loading',
      'On-the-fly augmentation and transforms',
      'Shuffling for training stability',
    ],
    s3Paths: [
      '# PyTorch DataLoader with S3',
      'StreamingDataset(remote="s3://training-data/shards/")',
    ],
    ioProfile: {
      pattern: 'Sequential reads with prefetch',
      volume: 'Continuous stream',
      throughput: '10-100 GB/s sustained',
      metric: 'Read throughput (GB/s)',
    },
    minioFeature: 'MinIO Cache uses distributed DRAM to ensure GPUs are never starved - eliminates I/O bottlenecks',
    dataVolume: 'GB/s',
    phase: 2,
  },
  {
    id: 'gpu-cluster',
    name: 'GPU Cluster',
    shortName: 'GPUs',
    x: 520,
    y: 140,
    width: 160,
    height: 130,
    type: 'compute',
    role: 'not-in-path',
    description: 'Forward pass, backward pass, gradient computation - pure GPU compute',
    details: [
      'Model weights loaded into VRAM',
      'Forward pass: input → activations → loss',
      'Backward pass: gradients computed via chain rule',
      'Optimizer step: weights updated',
      'Storage is NOT in this loop',
    ],
    s3Paths: [
      '# No S3 access during compute',
      '# Weights in VRAM, gradients in VRAM',
      '# This is pure matrix math',
    ],
    ioProfile: {
      pattern: 'No storage I/O',
      volume: 'N/A',
      throughput: 'N/A',
      metric: 'TFLOPS (compute bound)',
    },
    dataVolume: '0',
    phase: 3,
  },
  {
    id: 'checkpoint-store',
    name: 'Checkpoint Store',
    shortName: 'Checkpoints',
    x: 740,
    y: 160,
    width: 150,
    height: 90,
    type: 'storage',
    role: 'primary',
    description: 'Full model state dumped every N steps for disaster recovery',
    details: [
      '70B model + Adam optimizer = 500GB-1TB per checkpoint',
      'Bursty writes every N training steps',
      'This is your disaster recovery insurance',
      'Resume from any checkpoint on failure',
    ],
    s3Paths: [
      's3://checkpoints/run-2024-03/step-50000/',
      's3://checkpoints/run-2024-03/step-100000/',
      's3://checkpoints/run-2024-03/latest/',
    ],
    ioProfile: {
      pattern: 'Bursty large sequential writes',
      volume: '500GB-1TB per checkpoint',
      throughput: 'Peak 50-100 GB/s',
      metric: 'Write throughput, durability',
    },
    minioFeature: 'BitRot protection with HighwayHash verifies every byte - over 10 GB/s per core',
    dataVolume: 'TB',
    phase: 4,
  },
  {
    id: 'experiment-tracking',
    name: 'Experiment Tracking',
    shortName: 'MLflow/W&B',
    x: 740,
    y: 280,
    width: 150,
    height: 90,
    type: 'storage',
    role: 'primary',
    description: 'MLflow, Weights & Biases - metrics, hyperparameters, artifacts',
    details: [
      'Every training run is an experiment',
      'Hyperparameters, metrics, configs stored',
      'TensorBoard logs for visualization',
      'Enables reproducibility and comparison',
    ],
    s3Paths: [
      's3://mlflow-artifacts/experiment-{id}/',
      's3://training-logs/tensorboard/',
      's3://mlflow-artifacts/run-{id}/metrics/',
    ],
    ioProfile: {
      pattern: 'Continuous small writes',
      volume: 'Gigabytes per run',
      throughput: 'Low but consistent',
      metric: 'Availability, versioning',
    },
    minioFeature: 'MinIO Catalog provides GraphQL search across billions of artifacts - find any experiment instantly',
    dataVolume: 'GB',
    phase: 4,
  },
  {
    id: 'model-registry',
    name: 'Model Registry',
    shortName: 'Registry',
    x: 520,
    y: 300,
    width: 160,
    height: 90,
    type: 'storage',
    role: 'primary',
    description: 'Final trained model exported and versioned for downstream consumption',
    details: [
      'Export formats: safetensors, GGUF, ONNX',
      'Semantic versioning (v1.0, v1.1, v2.0)',
      'This artifact feeds inference and fine-tuning',
      'Immutable objects for auditability',
    ],
    s3Paths: [
      's3://model-registry/llama-3-70b/v1.0/',
      's3://model-registry/llama-3-70b/v1.0/model.safetensors',
      's3://model-registry/llama-3-70b/v1.0/config.json',
    ],
    ioProfile: {
      pattern: 'Large sequential write (final)',
      volume: '140GB-500GB per model',
      throughput: 'One-time export',
      metric: 'Durability, versioning',
    },
    minioFeature: 'Object locking ensures model artifacts are immutable - WORM compliance for regulated industries',
    dataVolume: 'GB',
    phase: 5,
  },
]

const flowPaths: FlowPath[] = [
  {
    id: 'raw-to-pipeline',
    from: 'raw-data',
    to: 'data-pipeline',
    label: 'PB scale',
    dataVolume: 'massive',
    direction: 'down',
    animated: true,
    description: 'Raw data flows into processing pipeline',
  },
  {
    id: 'pipeline-to-lake',
    from: 'data-pipeline',
    to: 'minio-datalake',
    label: 'Cleaned shards',
    dataVolume: 'massive',
    direction: 'down',
    animated: true,
    description: 'Processed data stored in data lake',
  },
  {
    id: 'lake-to-loader',
    from: 'minio-datalake',
    to: 'data-loader',
    label: 'Stream GB/s',
    dataVolume: 'heavy',
    direction: 'right',
    animated: true,
    description: 'Data loader streams batches from storage',
  },
  {
    id: 'loader-to-gpu',
    from: 'data-loader',
    to: 'gpu-cluster',
    label: 'Batches',
    dataVolume: 'heavy',
    direction: 'right',
    animated: true,
    description: 'Prefetched batches fed to GPU memory',
  },
  {
    id: 'gpu-to-checkpoint',
    from: 'gpu-cluster',
    to: 'checkpoint-store',
    label: '500GB-1TB',
    dataVolume: 'heavy',
    direction: 'right',
    animated: true,
    description: 'Periodic checkpoint saves for disaster recovery',
  },
  {
    id: 'gpu-to-tracking',
    from: 'gpu-cluster',
    to: 'experiment-tracking',
    label: 'Metrics',
    dataVolume: 'light',
    direction: 'down',
    animated: true,
    description: 'Continuous metrics and artifact logging',
  },
  {
    id: 'gpu-to-registry',
    from: 'gpu-cluster',
    to: 'model-registry',
    label: 'Final model',
    dataVolume: 'medium',
    direction: 'down',
    animated: false,
    description: 'Final trained model exported to registry',
  },
  {
    id: 'checkpoint-to-gpu',
    from: 'checkpoint-store',
    to: 'gpu-cluster',
    label: 'Resume',
    dataVolume: 'medium',
    direction: 'left',
    animated: true,
    description: 'Resume training from checkpoint on failure',
  },
]

const phases = [
  { id: 1, name: 'Data Ingestion', description: 'Raw data lands in object storage' },
  { id: 2, name: 'Data Loading', description: 'Streaming batches to GPU memory' },
  { id: 3, name: 'GPU Compute', description: 'Forward/backward pass (no storage)' },
  { id: 4, name: 'Checkpointing', description: 'Saving state for disaster recovery' },
  { id: 5, name: 'Model Export', description: 'Final model to registry' },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const roleColors = {
  'primary': { 
    fill: '#C72C48', 
    stroke: '#E84A66',
    bg: 'bg-gradient-to-r from-raspberry to-raspberry-dark',
    text: 'text-raspberry',
    glow: 'rgba(199, 44, 72, 0.4)',
  },
  'buffered': { 
    fill: '#F59E0B', 
    stroke: '#FBBF24',
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-amber-500',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  'burst': { 
    fill: '#3B82F6', 
    stroke: '#60A5FA',
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    text: 'text-blue-500',
    glow: 'rgba(59, 130, 246, 0.4)',
  },
  'not-in-path': { 
    fill: '#10B981', 
    stroke: '#34D399',
    bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
    text: 'text-emerald-500',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
}

const dataVolumeWidth = {
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
  
  // Calculate edge points based on direction
  let x1, y1, x2, y2
  
  if (direction === 'down') {
    x1 = fromCenter.x
    y1 = from.y + from.height
    x2 = toCenter.x
    y2 = to.y
  } else if (direction === 'up') {
    x1 = fromCenter.x
    y1 = from.y
    x2 = toCenter.x
    y2 = to.y + to.height
  } else if (direction === 'right') {
    x1 = from.x + from.width
    y1 = fromCenter.y
    x2 = to.x
    y2 = toCenter.y
  } else {
    x1 = from.x
    y1 = fromCenter.y
    x2 = to.x + to.width
    y2 = toCenter.y
  }
  
  // Create a curved path
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  
  if (direction === 'down' || direction === 'up') {
    return `M ${x1} ${y1} Q ${x1} ${midY} ${midX} ${midY} Q ${x2} ${midY} ${x2} ${y2}`
  } else {
    return `M ${x1} ${y1} Q ${midX} ${y1} ${midX} ${midY} Q ${midX} ${y2} ${x2} ${y2}`
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InteractiveTrainingExplorer() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentPhase, setCurrentPhase] = useState(1)
  const [speed, setSpeed] = useState(1)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  // Auto-advance phases when playing
  useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      setCurrentPhase(prev => prev >= 5 ? 1 : prev + 1)
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
    setCurrentPhase(prev => prev >= 5 ? 1 : prev + 1)
  }, [])

  const stepBackward = useCallback(() => {
    setCurrentPhase(prev => prev <= 1 ? 5 : prev - 1)
  }, [])

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-white/10 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-raspberry animate-pulse" />
              Interactive Training Pipeline
            </h3>
            <p className="text-sm text-gray-400 mt-1">Click any node to explore details</p>
          </div>
          
          {/* Playback Controls */}
          <div className="flex items-center gap-3">
            {/* Step Back */}
            <button
              onClick={stepBackward}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Previous phase"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-3 rounded-xl transition-all ${
                isPlaying 
                  ? 'bg-raspberry text-white shadow-lg shadow-raspberry/30' 
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
            
            {/* Step Forward */}
            <button
              onClick={stepForward}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Next phase"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Speed Control */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-700">
              <span className="text-xs text-gray-500">Speed:</span>
              {[0.5, 1, 2].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    speed === s
                      ? 'bg-raspberry text-white'
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
              onClick={() => { setCurrentPhase(phase.id); setIsPlaying(false); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                currentPhase === phase.id
                  ? 'bg-raspberry text-white shadow-lg shadow-raspberry/20'
                  : currentPhase > phase.id
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-800 text-gray-500'
              }`}
            >
              <span className="block font-bold">{phase.id}. {phase.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Diagram */}
      <div className="relative p-6 overflow-x-auto" style={{ minHeight: '480px' }}>
        <svg viewBox="0 0 950 420" className="w-full min-w-[900px]">
          <defs>
            {/* Gradients */}
            <linearGradient id="storageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#1F2937" />
            </linearGradient>
            <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C72C48" />
              <stop offset="100%" stopColor="#E84A66" />
            </linearGradient>
            <linearGradient id="bufferedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
            <linearGradient id="computeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#065F46" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            
            {/* Arrow markers */}
            <marker id="arrowPrimary" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#C72C48" />
            </marker>
            <marker id="arrowBuffered" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B" />
            </marker>
            <marker id="arrowGreen" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#10B981" />
            </marker>
            <marker id="arrowGray" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
            </marker>
            
            {/* Glow filters */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glowStrong">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Animated dash pattern */}
            <pattern id="flowPattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <circle cx="10" cy="10" r="2" fill="#C72C48">
                <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
              </circle>
            </pattern>
          </defs>

          {/* Background Grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

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
                {/* Glow effect for active paths */}
                {isActive && flow.animated && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={fromColors.fill}
                    strokeWidth={strokeWidth + 4}
                    opacity={0.2}
                    filter="url(#glow)"
                  />
                )}
                
                {/* Main path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={fromColors.fill}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  markerEnd={`url(#arrow${fromNode.role === 'primary' ? 'Primary' : fromNode.role === 'buffered' ? 'Buffered' : 'Green'})`}
                  strokeDasharray={flow.animated && isActive ? "10,5" : "none"}
                >
                  {flow.animated && isActive && (
                    <animate 
                      attributeName="stroke-dashoffset" 
                      values="30;0" 
                      dur={`${1 / speed}s`} 
                      repeatCount="indefinite" 
                    />
                  )}
                </path>
                
                {/* Flow label */}
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
                {/* Glow effect for active/hovered nodes */}
                {(isActive && (isHovered || isSelected)) && (
                  <rect
                    x={node.x - 4}
                    y={node.y - 4}
                    width={node.width + 8}
                    height={node.height + 8}
                    rx="16"
                    fill={colors.fill}
                    opacity={0.2}
                    filter="url(#glowStrong)"
                  />
                )}
                
                {/* Node background */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx="12"
                  fill={node.type === 'compute' ? 'url(#computeGrad)' : 'url(#storageGrad)'}
                  stroke={colors.fill}
                  strokeWidth={isSelected ? 3 : 2}
                />
                
                {/* Phase badge */}
                <circle
                  cx={node.x + 20}
                  cy={node.y + 20}
                  r="12"
                  fill={colors.fill}
                />
                <text
                  x={node.x + 20}
                  y={node.y + 24}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {node.phase}
                </text>
                
                {/* Node title */}
                <text
                  x={node.x + node.width / 2}
                  y={node.y + 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="600"
                  dx="10"
                >
                  {node.shortName}
                </text>
                
                {/* Role label */}
                <rect
                  x={node.x + 10}
                  y={node.y + node.height - 30}
                  width={node.width - 20}
                  height="20"
                  rx="4"
                  fill={colors.fill}
                  opacity={0.9}
                />
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height - 16}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="600"
                  letterSpacing="0.05em"
                >
                  {node.role === 'not-in-path' ? 'COMPUTE ONLY' : node.role.toUpperCase()}
                </text>
                
                {/* Description snippet */}
                <foreignObject 
                  x={node.x + 8} 
                  y={node.y + 32} 
                  width={node.width - 16} 
                  height={node.height - 70}
                >
                  <div className="text-[10px] text-gray-400 leading-tight overflow-hidden">
                    {node.description.slice(0, 60)}...
                  </div>
                </foreignObject>
                
                {/* Click indicator */}
                {isHovered && (
                  <g>
                    <circle
                      cx={node.x + node.width - 15}
                      cy={node.y + 15}
                      r="8"
                      fill={colors.fill}
                      opacity={0.8}
                    >
                      <animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite" />
                    </circle>
                    <text
                      x={node.x + node.width - 15}
                      y={node.y + 18}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      +
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Current Phase Indicator */}
          <text
            x="475"
            y="410"
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="12"
            fontWeight="500"
          >
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
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-2 ${roleColors[selectedNode.role].bg} text-white`}>
                    {selectedNode.role === 'not-in-path' ? 'COMPUTE ONLY' : selectedNode.role.toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold text-white">{selectedNode.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{selectedNode.description}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Details */}
              <div className="space-y-6">
                {/* Key Points */}
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
                
                {/* S3 Paths */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">S3 Paths</h4>
                  <div className="space-y-2">
                    {selectedNode.s3Paths.map((path, i) => (
                      <code 
                        key={i} 
                        className={`block text-xs px-3 py-2 rounded-lg font-mono ${
                          path.startsWith('#') 
                            ? 'bg-gray-800 text-gray-500 italic' 
                            : 'bg-gray-800 text-raspberry-light'
                        }`}
                      >
                        {path}
                      </code>
                    ))}
                  </div>
                </div>
                
                {/* I/O Profile */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">I/O Profile</h4>
                  <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Pattern</span>
                      <span className="text-xs text-white font-medium">{selectedNode.ioProfile.pattern}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Volume</span>
                      <span className="text-xs text-white font-medium">{selectedNode.ioProfile.volume}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Throughput</span>
                      <span className="text-xs text-white font-medium">{selectedNode.ioProfile.throughput}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Key Metric</span>
                      <span className={`text-xs font-medium ${roleColors[selectedNode.role].text}`}>{selectedNode.ioProfile.metric}</span>
                    </div>
                  </div>
                </div>
                
                {/* MinIO Feature Callout */}
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
            <span className="text-xs text-gray-400">Primary Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-500 to-orange-500" />
            <span className="text-xs text-gray-400">Buffered Read</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-green-500" />
            <span className="text-xs text-gray-400">Compute Only (No Storage)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-8 h-3">
              <line x1="0" y1="6" x2="32" y2="6" stroke="#C72C48" strokeWidth="4" />
            </svg>
            <span className="text-xs text-gray-400">Heavy Data Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-8 h-3">
              <line x1="0" y1="6" x2="32" y2="6" stroke="#C72C48" strokeWidth="2" strokeDasharray="4" />
            </svg>
            <span className="text-xs text-gray-400">Streaming</span>
          </div>
        </div>
      </div>
    </div>
  )
}
