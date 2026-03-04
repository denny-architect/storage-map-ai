import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// TYPES & DATA — Fine-Tuning (LoRA / QLoRA)
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
  dataVolume: string
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

// Fine-Tuning Pipeline:
// Dataset Prep → Base Model Load → GPU (Frozen Base + LoRA Adapters) → Adapter Checkpoints → Adapter Export
//
// Key difference from Training: TINY checkpoints (~100MB vs 500GB), small datasets, frozen base model
const nodes: NodeData[] = [
  {
    id: 'dataset-prep',
    name: 'Dataset Preparation',
    shortName: 'Dataset Prep',
    x: 50,
    y: 30,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'primary',
    description: 'Curated instruction/response pairs in JSONL or chat format — thousands to millions of examples, not trillions of tokens',
    details: [
      'Instruction/response pairs in JSONL or chat format',
      'Dramatically smaller than pre-training data',
      '1K–1M examples typical (vs. trillions of tokens for pre-training)',
      'Quality > quantity — curation is the real work',
      'Versioned datasets for reproducible experiments',
    ],
    s3Paths: [
      's3://finetune-data/customer-support-v2/train.jsonl',
      's3://finetune-data/customer-support-v2/eval.jsonl',
      's3://finetune-data/customer-support-v2/metadata.json',
    ],
    ioProfile: {
      pattern: 'Small-to-medium writes during curation',
      volume: 'MBs to GBs',
      throughput: 'Low — read once at training start',
      metric: 'Versioning, reproducibility',
    },
    minioFeature: 'Object versioning with delete markers — full audit trail for every dataset iteration (whitepaper: versioning + delete markers)',
    dataVolume: 'GB',
    phase: 1,
  },
  {
    id: 'base-model',
    name: 'Base Model Registry',
    shortName: 'Base Model',
    x: 50,
    y: 310,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'burst',
    description: 'Frozen foundation model (e.g., LLaMA 3 8B/70B) pulled from model registry — loaded once, never modified',
    details: [
      'Foundation model pulled from registry at training start',
      'Same burst-read pattern as inference model loading',
      '8B model ≈ 16 GB, 70B model ≈ 140 GB (FP16)',
      'Model is FROZEN — these weights never change',
      'QLoRA loads in 4-bit, reducing GPU memory needs',
    ],
    s3Paths: [
      's3://model-registry/llama-3-8b/base/model.safetensors',
      's3://model-registry/llama-3-70b/base/model.safetensors',
    ],
    ioProfile: {
      pattern: 'Large sequential read (one-time)',
      volume: '16–140 GB per model',
      throughput: 'Burst — want fast load to minimize GPU idle',
      metric: 'Read throughput (GB/s)',
    },
    minioFeature: '325 GiB/s GET (32-node) loads 140GB model in <1s at cluster scale; 46.5 GB/s GET on 8-node sufficient for fine-tuning (whitepaper benchmarks)',
    dataVolume: 'GB',
    phase: 1,
  },
  {
    id: 'gpu-training',
    name: 'GPU Training (LoRA)',
    shortName: 'GPU + LoRA',
    x: 430,
    y: 100,
    width: 260,
    height: 280,
    type: 'compute',
    role: 'not-in-path',
    description: 'Frozen base model + trainable LoRA adapters — only the tiny adapter matrices get updated during training',
    details: [
      'Base model is FROZEN in GPU memory (99%+ of params)',
      'LoRA injects small rank-decomposition matrices',
      'Only adapter parameters are trained (< 1% of model)',
      'Forward pass through full model, backprop through adapters only',
      'Hours to days of training (not weeks/months)',
      'QLoRA: base model in 4-bit, adapters in FP16',
    ],
    s3Paths: [
      '# No S3 during compute loop',
      '# Base weights frozen in VRAM',
      '# Only LoRA matrices are updated',
    ],
    ioProfile: {
      pattern: 'No storage I/O during training loop',
      volume: 'N/A — compute bound',
      throughput: 'N/A',
      metric: 'TFLOPS (compute bound)',
    },
    dataVolume: '0',
    phase: 2,
  },
  {
    id: 'adapter-checkpoint',
    name: 'Adapter Checkpoints',
    shortName: 'Adapter Ckpt',
    x: 830,
    y: 30,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'primary',
    description: 'Only adapter weights saved — ~50-500 MB per checkpoint vs. 500 GB+ for full model. 5,000x smaller.',
    details: [
      'Checkpoint ONLY the adapter weights — not the base model',
      'LoRA adapter: 50–500 MB vs. 500 GB full checkpoint',
      'That\'s a 5,000x reduction in checkpoint size',
      'Fast saves, fast restores — rapid experimentation',
      'Per-epoch or per-N-steps, same pattern as pre-training',
    ],
    s3Paths: [
      's3://finetune-checkpoints/customer-support-v2/epoch-1/adapter_model.bin',
      's3://finetune-checkpoints/customer-support-v2/epoch-3/adapter_model.bin',
      's3://finetune-checkpoints/customer-support-v2/best/adapter_model.bin',
    ],
    ioProfile: {
      pattern: 'Small sequential writes',
      volume: '50–500 MB per checkpoint',
      throughput: 'Low — tiny files',
      metric: 'Durability, fast restore',
    },
    minioFeature: 'BitRot protection via HighwayHash >10 GB/s/core; inline healing repairs corruption on read (whitepaper: SIMD-accelerated HighwayHash)',
    dataVolume: 'MB',
    phase: 3,
  },
  {
    id: 'experiment-tracking',
    name: 'Experiment Tracking',
    shortName: 'MLflow / W&B',
    x: 830,
    y: 310,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'primary',
    description: 'Hyperparameters, loss curves, eval metrics — tracking which adapter config works best for each domain',
    details: [
      'Track LoRA rank, alpha, target modules, learning rate',
      'Loss curves, eval metrics per epoch',
      'Compare adapter configs across experiments',
      'Critical for deciding which adapter to deploy',
      'Dataset version linked to each experiment run',
    ],
    s3Paths: [
      's3://mlflow-artifacts/finetune-experiments/{id}/',
      's3://training-logs/finetune/tensorboard/',
    ],
    ioProfile: {
      pattern: 'Continuous small writes',
      volume: 'MBs per run',
      throughput: 'Low but consistent',
      metric: 'Availability, search',
    },
    minioFeature: 'MinIO Catalog: GraphQL-based metadata search across billions of artifacts (whitepaper: MinIO Catalog for namespace discovery)',
    dataVolume: 'MB',
    phase: 3,
  },
  {
    id: 'adapter-export',
    name: 'Adapter Registry',
    shortName: 'Adapter Registry',
    x: 830,
    y: 570,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'primary',
    description: 'Final LoRA adapters versioned independently from the base model — same base, many domain adapters, clear lineage',
    details: [
      'Adapters versioned independently from base model',
      'Same base → multiple domain-specific adapters',
      'customer-support-v2, legal-analysis-v1, code-gen-v3',
      'Hot-swappable at inference time (vLLM, Triton)',
      'Immutable objects for audit trail',
    ],
    s3Paths: [
      's3://model-registry/llama-3-8b/adapters/customer-support-v2/',
      's3://model-registry/llama-3-8b/adapters/legal-analysis-v1/',
      's3://model-registry/llama-3-8b/adapters/code-gen-v3/',
    ],
    ioProfile: {
      pattern: 'Small sequential write (final export)',
      volume: '50–500 MB per adapter',
      throughput: 'One-time export',
      metric: 'Durability, versioning, WORM',
    },
    minioFeature: 'Object Lock (WORM): SEC 17a-4(f), FINRA 4511(c) compliant (whitepaper: retention + legal hold + governance mode)',
    dataVolume: 'MB',
    phase: 4,
  },
]

const flowPaths: FlowPath[] = [
  {
    id: 'dataset-to-gpu',
    from: 'dataset-prep',
    to: 'gpu-training',
    label: 'JSONL batches',
    dataVolume: 'light',
    direction: 'right',
    animated: true,
    description: 'Small dataset streamed to GPU during training',
  },
  {
    id: 'base-to-gpu',
    from: 'base-model',
    to: 'gpu-training',
    label: '16–140 GB (once)',
    dataVolume: 'heavy',
    direction: 'right',
    animated: true,
    description: 'Frozen base model loaded into GPU memory at start',
  },
  {
    id: 'gpu-to-checkpoint',
    from: 'gpu-training',
    to: 'adapter-checkpoint',
    label: '~100 MB adapters',
    dataVolume: 'light',
    direction: 'right',
    animated: true,
    description: 'Tiny adapter-only checkpoints saved periodically',
  },
  {
    id: 'gpu-to-tracking',
    from: 'gpu-training',
    to: 'experiment-tracking',
    label: 'Metrics',
    dataVolume: 'light',
    direction: 'right',
    animated: true,
    description: 'Loss, eval metrics, hyperparams logged continuously',
  },
  {
    id: 'gpu-to-export',
    from: 'gpu-training',
    to: 'adapter-export',
    label: 'Final adapter',
    dataVolume: 'light',
    direction: 'right',
    animated: false,
    description: 'Best adapter exported and versioned in registry',
  },
  {
    id: 'checkpoint-to-gpu',
    from: 'adapter-checkpoint',
    to: 'gpu-training',
    label: 'Resume',
    dataVolume: 'light',
    direction: 'left',
    animated: true,
    description: 'Resume training from adapter checkpoint',
  },
]

const phases = [
  { id: 1, name: 'Data + Model Load', description: 'Dataset prep + frozen base model' },
  { id: 2, name: 'LoRA Training', description: 'Only adapter weights update' },
  { id: 3, name: 'Checkpointing', description: 'Tiny adapter saves (~100 MB)' },
  { id: 4, name: 'Adapter Export', description: 'Version and publish adapter' },
]

// ============================================================================
// UTILITY FUNCTIONS (same pattern as Training/RAG)
// ============================================================================

const roleColors = {
  'primary': { fill: '#C72C48', stroke: '#E84A66', text: 'text-raspberry', bg: 'bg-gradient-to-r from-raspberry to-raspberry-dark', glow: 'rgba(199, 44, 72, 0.4)' },
  'buffered': { fill: '#F59E0B', stroke: '#FBBF24', text: 'text-amber-500', bg: 'bg-gradient-to-r from-amber-500 to-orange-500', glow: 'rgba(245, 158, 11, 0.4)' },
  'burst': { fill: '#3B82F6', stroke: '#60A5FA', text: 'text-blue-500', bg: 'bg-gradient-to-r from-blue-500 to-blue-600', glow: 'rgba(59, 130, 246, 0.4)' },
  'not-in-path': { fill: '#10B981', stroke: '#34D399', text: 'text-emerald-500', bg: 'bg-gradient-to-r from-emerald-500 to-green-500', glow: 'rgba(16, 185, 129, 0.4)' },
}

const dataVolumeWidth = { 'massive': 8, 'heavy': 5, 'medium': 3, 'light': 2 }

function getNodeCenter(node: NodeData) {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 }
}

function getPathPoints(from: NodeData, to: NodeData, direction: FlowPath['direction']): string {
  const fromCenter = getNodeCenter(from)
  const toCenter = getNodeCenter(to)
  let x1: number, y1: number, x2: number, y2: number

  if (direction === 'down') { x1 = fromCenter.x; y1 = from.y + from.height; x2 = toCenter.x; y2 = to.y }
  else if (direction === 'up') { x1 = fromCenter.x; y1 = from.y; x2 = toCenter.x; y2 = to.y + to.height }
  else if (direction === 'right') { x1 = from.x + from.width; y1 = fromCenter.y; x2 = to.x; y2 = toCenter.y }
  else { x1 = from.x; y1 = fromCenter.y; x2 = to.x + to.width; y2 = toCenter.y }

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

export default function InteractiveFineTuningExplorer() {
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

  const handleNodeClick = useCallback((node: NodeData) => { setSelectedNode(node); setIsPlaying(false) }, [])
  const handleClose = useCallback(() => setSelectedNode(null), [])
  const stepForward = useCallback(() => setCurrentPhase(prev => prev >= 4 ? 1 : prev + 1), [])
  const stepBackward = useCallback(() => setCurrentPhase(prev => prev <= 1 ? 4 : prev - 1), [])

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Header with Controls */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-white/10 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Interactive Fine-Tuning Pipeline
              <span className="text-sm font-normal text-gray-400">— LoRA / QLoRA</span>
            </h3>
            <p className="text-sm text-gray-400 mt-1">Click any node to explore details</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={stepBackward} className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Previous phase">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className={`p-3 rounded-xl transition-all ${isPlaying ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" /></svg>) : (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>)}
            </button>
            <button onClick={stepForward} className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Next phase">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-700">
              <span className="text-xs text-gray-500">Speed:</span>
              {[0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${speed === s ? 'bg-blue-500 text-white' : 'bg-gray-700/50 text-gray-400 hover:text-white'}`}>{s}x</button>
              ))}
            </div>
          </div>
        </div>
        {/* Phase Indicator */}
        <div className="flex items-center gap-2 mt-4">
          {phases.map(phase => (
            <button key={phase.id} onClick={() => { setCurrentPhase(phase.id); setIsPlaying(false) }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${currentPhase === phase.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : currentPhase > phase.id ? 'bg-gray-700 text-gray-400' : 'bg-gray-800 text-gray-500'}`}>
              <span className="block font-bold">{phase.id}. {phase.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main SVG Diagram */}
      <div className="relative p-6 overflow-x-auto" style={{ minHeight: '820px' }}>
        <svg viewBox="0 0 1120 800" className="w-full min-w-[1000px]">
          <defs>
            <linearGradient id="ftStorageGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#374151" /><stop offset="100%" stopColor="#1F2937" /></linearGradient>
            <linearGradient id="ftComputeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#065F46" /><stop offset="100%" stopColor="#047857" /></linearGradient>
            <marker id="ftArrowPrimary" markerWidth="22" markerHeight="16" refX="20" refY="8" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 0, 22 8, 0 16" fill="#C72C48" /></marker>
            <marker id="ftArrowBurst" markerWidth="22" markerHeight="16" refX="20" refY="8" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 0, 22 8, 0 16" fill="#3B82F6" /></marker>
            <marker id="ftArrowGreen" markerWidth="22" markerHeight="16" refX="20" refY="8" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 0, 22 8, 0 16" fill="#10B981" /></marker>
            <marker id="ftArrowGray" markerWidth="22" markerHeight="16" refX="20" refY="8" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 0, 22 8, 0 16" fill="#6B7280" /></marker>
            <filter id="ftGlow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="ftGlowStrong"><feGaussianBlur stdDeviation="6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {/* Background Grid */}
          <pattern id="ftGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/></pattern>
          <rect width="100%" height="100%" fill="url(#ftGrid)" />

          {/* Scale comparison callout */}
          <g>
            <rect x="430" y="430" width="260" height="65" rx="8" fill="#1F2937" stroke="#10B981" strokeWidth="1.5" />
            <text x="560" y="455" textAnchor="middle" fill="#10B981" fontSize="12" fontWeight="bold">vs Full Training Checkpoints:</text>
            <text x="560" y="475" textAnchor="middle" fill="#A7F3D0" fontSize="11">LoRA ~100 MB vs Full ~500 GB = 5,000x smaller</text>
          </g>

          {/* GPU Training — Frozen Base + LoRA sub-boxes */}
          {(() => {
            const gpuNode = nodes.find(n => n.id === 'gpu-training')!
            const isActive = gpuNode.phase <= currentPhase
            return (
              <g opacity={isActive ? 1 : 0.4}>
                <rect x={gpuNode.x} y={gpuNode.y} width={gpuNode.width} height={gpuNode.height} rx="12" fill="url(#ftComputeGrad)" stroke="#10B981" strokeWidth={2} />
                {/* Phase badge */}
                <circle cx={gpuNode.x + 20} cy={gpuNode.y + 20} r="12" fill="#10B981" />
                <text x={gpuNode.x + 20} y={gpuNode.y + 24} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{gpuNode.phase}</text>
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 22} textAnchor="middle" fill="white" fontSize="13" fontWeight="600" dx="10">GPU + LoRA</text>

                {/* Frozen base model sub-box */}
                <rect x={gpuNode.x + 15} y={gpuNode.y + 42} width={gpuNode.width - 30} height={55} rx="6" fill="#374151" stroke="#6B7280" strokeWidth="1" />
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 65} textAnchor="middle" fill="#9CA3AF" fontSize="11" fontWeight="600">Base Model (FROZEN)</text>
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 82} textAnchor="middle" fill="#6B7280" fontSize="9">99%+ of parameters — never changes</text>

                {/* LoRA adapters sub-box */}
                <rect x={gpuNode.x + 15} y={gpuNode.y + 108} width={gpuNode.width - 30} height={55} rx="6" fill="#065F46" stroke="#10B981" strokeWidth="2" />
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 131} textAnchor="middle" fill="#10B981" fontSize="11" fontWeight="bold">LoRA Adapters (TRAINING)</text>
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 148} textAnchor="middle" fill="#A7F3D0" fontSize="9">{'< 1% of params — only these update'}</text>

                {/* Training description */}
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 185} textAnchor="middle" fill="#10B981" fontSize="10">Forward → Backward → Update adapters</text>
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 200} textAnchor="middle" fill="#6B7280" fontSize="9">Hours to days (not weeks/months)</text>

                {/* Role badge */}
                <rect x={gpuNode.x + 10} y={gpuNode.y + gpuNode.height - 35} width={gpuNode.width - 20} height="22" rx="4" fill="#10B981" opacity={0.9} />
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + gpuNode.height - 19} textAnchor="middle" fill="white" fontSize="10" fontWeight="600">COMPUTE ONLY</text>
              </g>
            )
          })()}

          {/* Flow Paths */}
          {flowPaths.map(flow => {
            const fromNode = nodes.find(n => n.id === flow.from)
            const toNode = nodes.find(n => n.id === flow.to)
            if (!fromNode || !toNode) return null
            const pathD = getPathPoints(fromNode, toNode, flow.direction)
            const strokeWidth = dataVolumeWidth[flow.dataVolume]
            const isActive = fromNode.phase <= currentPhase && toNode.phase <= currentPhase
            const fromColors = roleColors[fromNode.role]
            const markerKey = fromNode.role === 'primary' ? 'Primary' : fromNode.role === 'burst' ? 'Burst' : fromNode.role === 'not-in-path' ? 'Green' : 'Gray'
            return (
              <g key={flow.id} opacity={isActive ? 1 : 0.3}>
                {isActive && flow.animated && (<path d={pathD} fill="none" stroke={fromColors.fill} strokeWidth={strokeWidth + 4} opacity={0.2} filter="url(#ftGlow)" />)}
                <path d={pathD} fill="none" stroke={fromColors.fill} strokeWidth={strokeWidth} strokeLinecap="round" markerEnd={`url(#ftArrow${markerKey})`} strokeDasharray={flow.animated && isActive ? "10,5" : "none"}>
                  {flow.animated && isActive && (<animate attributeName="stroke-dashoffset" values="30;0" dur={`${1 / speed}s`} repeatCount="indefinite" />)}
                </path>
                {isActive && (() => {
                  const fromCx = fromNode.x + fromNode.width / 2
                  const toCx = toNode.x + toNode.width / 2
                  const midX = (fromCx + toCx) / 2
                  const fromCy = fromNode.y + fromNode.height / 2
                  const toCy = toNode.y + toNode.height / 2
                  const midY = (fromCy + toCy) / 2
                  const isVert = flow.direction === 'down' || flow.direction === 'up'
                  const labelX = isVert ? midX + 55 : midX
                  const labelY = isVert ? midY : midY - 18
                  const pillW = flow.label.length * 7 + 18
                  return (
                    <g className="pointer-events-none">
                      <rect x={labelX - pillW / 2} y={labelY - 12} width={pillW} height="20" rx="6" fill="#111827" stroke={fromColors.fill} strokeWidth="1" opacity={0.95} />
                      <text x={labelX} y={labelY + 2} textAnchor="middle" fill={fromColors.fill} fontSize="10" fontWeight="600">{flow.label}</text>
                    </g>
                  )
                })()}
              </g>
            )
          })}

          {/* Non-GPU Nodes */}
          {nodes.filter(n => n.id !== 'gpu-training').map(node => {
            const colors = roleColors[node.role]
            const isActive = node.phase <= currentPhase
            const isHovered = hoveredNode === node.id
            const isSelected = selectedNode?.id === node.id
            return (
              <g key={node.id} className="cursor-pointer" style={{ opacity: isActive ? 1 : 0.4 }}
                onClick={() => handleNodeClick(node)} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}>
                {(isActive && (isHovered || isSelected)) && (<rect x={node.x - 4} y={node.y - 4} width={node.width + 8} height={node.height + 8} rx="16" fill={colors.fill} opacity={0.2} filter="url(#ftGlowStrong)" />)}
                <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="12" fill="url(#ftStorageGrad)" stroke={colors.fill} strokeWidth={isSelected ? 3 : 2} />
                <circle cx={node.x + 20} cy={node.y + 20} r="12" fill={colors.fill} />
                <text x={node.x + 20} y={node.y + 24} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{node.phase}</text>
                <text x={node.x + node.width / 2} y={node.y + 22} textAnchor="middle" fill="white" fontSize="13" fontWeight="600" dx="10">{node.shortName}</text>
                <rect x={node.x + 10} y={node.y + node.height - 35} width={node.width - 20} height="22" rx="4" fill={colors.fill} opacity={0.9} />
                <text x={node.x + node.width / 2} y={node.y + node.height - 19} textAnchor="middle" fill="white" fontSize="10" fontWeight="600" letterSpacing="0.05em">
                  {node.role === 'burst' ? 'BURST READ' : node.role.toUpperCase()}
                </text>
                <foreignObject x={node.x + 10} y={node.y + 36} width={node.width - 20} height={node.height - 80}>
                  <div className="text-[11px] text-gray-400 leading-snug overflow-hidden">{node.description.slice(0, 100)}...</div>
                </foreignObject>
                {isHovered && (<g>
                  <circle cx={node.x + node.width - 15} cy={node.y + 15} r="8" fill={colors.fill} opacity={0.8}><animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite" /></circle>
                  <text x={node.x + node.width - 15} y={node.y + 18} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">+</text>
                </g>)}
              </g>
            )
          })}

          {/* Phase label */}
          <text x="560" y="785" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontWeight="500">
            Phase {currentPhase}: {phases[currentPhase - 1]?.name}
          </text>
        </svg>

        {/* Detail Panel */}
        {selectedNode && (
          <div className="absolute top-0 right-0 w-96 h-full bg-gray-900/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-2 ${roleColors[selectedNode.role].bg} text-white`}>
                    {selectedNode.role === 'not-in-path' ? 'COMPUTE ONLY' : selectedNode.role === 'burst' ? 'BURST READ' : selectedNode.role.toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold text-white">{selectedNode.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{selectedNode.description}</p>
                </div>
                <button onClick={handleClose} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Key Points</h4>
                  <ul className="space-y-2">{selectedNode.details.map((d, i) => (<li key={i} className="flex items-start gap-2 text-sm text-gray-400"><span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${roleColors[selectedNode.role].bg} flex-shrink-0`} />{d}</li>))}</ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">S3 Paths</h4>
                  <div className="space-y-2">{selectedNode.s3Paths.map((p, i) => (<code key={i} className={`block text-xs px-3 py-2 rounded-lg font-mono ${p.startsWith('#') ? 'bg-gray-800 text-gray-500 italic' : 'bg-gray-800 text-raspberry-light'}`}>{p}</code>))}</div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">I/O Profile</h4>
                  <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                    {Object.entries(selectedNode.ioProfile).map(([k, v]) => (<div key={k} className="flex justify-between"><span className="text-xs text-gray-500 capitalize">{k}</span><span className={`text-xs font-medium ${k === 'metric' ? roleColors[selectedNode.role].text : 'text-white'}`}>{v}</span></div>))}
                  </div>
                </div>
                {selectedNode.minioFeature && (
                  <div className="bg-gradient-to-r from-raspberry/10 to-raspberry/5 border border-raspberry/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-raspberry/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div><h5 className="text-sm font-semibold text-raspberry mb-1">MinIO AIStor</h5><p className="text-xs text-gray-400 leading-relaxed">{selectedNode.minioFeature}</p></div>
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
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gradient-to-r from-raspberry to-raspberry-dark" /><span className="text-xs text-gray-400">Primary Storage</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600" /><span className="text-xs text-gray-400">Burst Read (Model Load)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-green-500" /><span className="text-xs text-gray-400">Compute Only (Adapters Train)</span></div>
          <div className="flex items-center gap-2 pl-4 border-l border-gray-700"><span className="text-xs text-emerald-400 font-semibold">Key:</span><span className="text-xs text-gray-400">Adapter checkpoints are ~5,000x smaller than full training checkpoints</span></div>
        </div>
      </div>
    </div>
  )
}
