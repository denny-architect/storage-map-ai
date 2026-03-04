import { useState, useEffect, useCallback } from 'react'

// ============================================================================
// TYPES & DATA — Inference (Model Serving & Generation)
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

// Inference Pipeline:
// Model Registry → Model Loading → GPU Inference Loop → Logging → Feedback → (back to Fine-Tuning)
//
// Key insight: storage is only at the BOOKENDS — not in the token generation loop.
// The generation loop (forward pass, KV cache, sampling) is 100% GPU VRAM.
const nodes: NodeData[] = [
  {
    id: 'model-registry',
    name: 'Model Registry',
    shortName: 'Model Registry',
    x: 50,
    y: 30,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'burst',
    description: 'Versioned model artifacts (safetensors, config, tokenizer) in S3 — source of truth for what gets served',
    details: [
      'Foundation models + LoRA adapters stored as versioned objects',
      'Formats: safetensors, GGUF, ONNX + config.json, tokenizer.json',
      'Semantic versioning: v1.0, v1.1, v2.0-beta',
      'Same registry Training and Fine-Tuning export to',
      'Model cards and metadata for governance',
    ],
    s3Paths: [
      's3://model-registry/llama-3-70b/v1.0/model.safetensors',
      's3://model-registry/llama-3-70b/v1.0/config.json',
      's3://model-registry/llama-3-8b/adapters/customer-support-v2/',
    ],
    ioProfile: {
      pattern: 'Large sequential read on cold start',
      volume: '16-140 GB per model load',
      throughput: 'Burst — want 10+ GB/s for fast cold start',
      metric: 'Read throughput (time-to-first-token)',
    },
    minioFeature: '325 GiB/s GET (32-node benchmark): 140GB model loads in <1s at cluster scale. Whitepaper: 2.5 TiB/s aggregate on 300-server deployment',
    dataVolume: 'GB',
    phase: 1,
  },
  {
    id: 'adapter-store',
    name: 'LoRA Adapter Store',
    shortName: 'LoRA Adapters',
    x: 50,
    y: 310,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'burst',
    description: 'Domain-specific LoRA adapters hot-swapped per request or tenant — same base model, many adapters',
    details: [
      'Tiny adapters (~50-500 MB) loaded dynamically',
      'vLLM and Triton support multi-adapter serving',
      'Load base model ONCE, swap adapter per request/tenant',
      'customer-support-v2, legal-analysis-v1, code-gen-v3',
      'Object storage in the hot path for adapter swaps',
    ],
    s3Paths: [
      's3://model-registry/llama-3-8b/adapters/customer-support-v2/',
      's3://model-registry/llama-3-8b/adapters/legal-analysis-v1/',
      's3://model-registry/llama-3-8b/adapters/code-gen-v3/',
    ],
    ioProfile: {
      pattern: 'Small sequential reads (per adapter swap)',
      volume: '50-500 MB per adapter',
      throughput: 'Fast — sub-second swap target',
      metric: 'Read latency (adapter swap time)',
    },
    minioFeature: 'MinIO Cache: distributed shared DRAM cache for sub-second adapter swaps — no cold disk reads (whitepaper: ultra-high-performance AI workloads)',
    dataVolume: 'MB',
    phase: 1,
  },
  {
    id: 'inference-engine',
    name: 'Inference Engine (vLLM / Triton)',
    shortName: 'vLLM / Triton',
    x: 420,
    y: 80,
    width: 280,
    height: 340,
    type: 'compute',
    role: 'not-in-path',
    description: 'The generation loop — prompt in, tokens out. Forward pass, KV cache, sampling all in GPU VRAM. Storage is NOT here.',
    details: [
      'Model weights loaded into VRAM at startup (one-time)',
      'KV cache lives entirely in GPU memory',
      'Forward pass: attention + FFN layers = matrix math',
      'Sampling: temperature, top-p, top-k — pure compute',
      'Autoregressive: generate one token at a time',
      'Continuous batching: multiple requests share GPU time',
      'STORAGE IS NOT IN THIS LOOP. Period.',
    ],
    s3Paths: [
      '# No S3 during token generation',
      '# Weights already in VRAM',
      '# KV cache in VRAM',
      '# This is pure GPU compute',
    ],
    ioProfile: {
      pattern: 'No storage I/O during generation',
      volume: 'N/A — compute bound',
      throughput: 'N/A',
      metric: 'Tokens/second (compute bound)',
    },
    dataVolume: '0',
    phase: 2,
  },
  {
    id: 'observability',
    name: 'Observability & Logging',
    shortName: 'Logging',
    x: 840,
    y: 30,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'primary',
    description: 'Every request/response logged — token counts, latency, model version, error codes. Compliance-mandatory in enterprise.',
    details: [
      'Request/response pairs logged (prompt + completion)',
      'Token counts, latency percentiles, model version',
      'Error codes, rate limiting events',
      'Parquet format for efficient analytics',
      'Feeds Clickhouse + Grafana observability stack',
      'Compliance and audit: non-optional in enterprise',
    ],
    s3Paths: [
      's3://inference-logs/2024-03/15/requests.parquet',
      's3://inference-logs/metrics/model-latency/',
      's3://inference-logs/errors/timeouts/',
    ],
    ioProfile: {
      pattern: 'Continuous small-to-medium writes (append-heavy)',
      volume: 'TBs over time',
      throughput: 'Sustained — proportional to request rate',
      metric: 'Write durability, query speed',
    },
    minioFeature: 'S3 Select with SIMD acceleration on Parquet/CSV/JSON — 80%+ bandwidth reduction for log analytics (whitepaper: SIMD-accelerated S3 Select)',
    dataVolume: 'TB',
    phase: 3,
  },
  {
    id: 'feedback',
    name: 'Feedback Collection',
    shortName: 'Feedback / RLHF',
    x: 840,
    y: 310,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'primary',
    description: 'User feedback (thumbs up/down, corrections, preferences) stored for RLHF — closes the loop back to fine-tuning',
    details: [
      'User preferences: thumbs up/down, corrections',
      'Human preference pairs for RLHF/DPO training',
      'Stored as JSONL with prompt + chosen + rejected',
      'Closes the loop: inference feedback → fine-tuning data',
      'The model lifecycle is circular, not linear',
    ],
    s3Paths: [
      's3://feedback-data/rlhf/preference-pairs/batch-2024-03.jsonl',
      's3://feedback-data/corrections/user-edits/',
      's3://feedback-data/ratings/thumbs/',
    ],
    ioProfile: {
      pattern: 'Continuous small writes',
      volume: 'GBs (proportional to traffic)',
      throughput: 'Low but consistent',
      metric: 'Durability, versioning for audit',
    },
    minioFeature: 'Object versioning with delete markers + batch replication for DR (whitepaper: Active-Active, Active-Passive, Batch replication modes)',
    dataVolume: 'GB',
    phase: 3,
  },
  {
    id: 'model-updates',
    name: 'Model Updates & Rollback',
    shortName: 'Model Updates',
    x: 840,
    y: 570,
    width: 230,
    height: 160,
    type: 'storage',
    role: 'burst',
    description: 'New model versions, A/B tests, canary rollouts, rollbacks — every swap is another burst read from object storage',
    details: [
      'A/B testing: v1.0 vs v1.1 on split traffic',
      'Canary rollout: 5% → 25% → 100% of traffic',
      'Instant rollback to previous version on regression',
      'Every model swap = another burst read from S3',
      'In a large serving fleet, this happens regularly',
    ],
    s3Paths: [
      's3://model-registry/llama-3-70b/v1.1/model.safetensors',
      's3://model-registry/llama-3-70b/v1.0/ (rollback)',
      's3://deployment-config/canary/traffic-split.json',
    ],
    ioProfile: {
      pattern: 'Large sequential reads (model swap)',
      volume: '16-140 GB per swap',
      throughput: 'Burst — cadence depends on deployment',
      metric: 'Read throughput, rollback speed',
    },
    minioFeature: 'Object Lock (WORM): SEC 17a-4(f), FINRA 4511(c) compliant — immutable model versions for rollback certainty (whitepaper)',
    dataVolume: 'GB',
    phase: 4,
  },
]

const flowPaths: FlowPath[] = [
  {
    id: 'registry-to-engine',
    from: 'model-registry',
    to: 'inference-engine',
    label: '140 GB (cold start)',
    dataVolume: 'heavy',
    direction: 'right',
    animated: true,
    description: 'Model weights loaded from S3 into GPU VRAM on cold start',
  },
  {
    id: 'adapter-to-engine',
    from: 'adapter-store',
    to: 'inference-engine',
    label: '~100 MB (swap)',
    dataVolume: 'light',
    direction: 'right',
    animated: true,
    description: 'LoRA adapter hot-swapped per request or tenant',
  },
  {
    id: 'engine-to-logging',
    from: 'inference-engine',
    to: 'observability',
    label: 'Every request',
    dataVolume: 'medium',
    direction: 'right',
    animated: true,
    description: 'Request/response logged for compliance and analytics',
  },
  {
    id: 'engine-to-feedback',
    from: 'inference-engine',
    to: 'feedback',
    label: 'User feedback',
    dataVolume: 'light',
    direction: 'right',
    animated: true,
    description: 'User preference data collected for RLHF/DPO',
  },
  {
    id: 'updates-to-engine',
    from: 'model-updates',
    to: 'inference-engine',
    label: 'New version',
    dataVolume: 'heavy',
    direction: 'left',
    animated: false,
    description: 'Model update, A/B test, or rollback loads new weights',
  },
  {
    id: 'feedback-to-finetune',
    from: 'feedback',
    to: 'adapter-store',
    label: 'RLHF loop',
    dataVolume: 'light',
    direction: 'left',
    animated: false,
    description: 'Feedback data feeds next fine-tuning round — circular lifecycle',
  },
]

const phases = [
  { id: 1, name: 'Model Loading', description: 'Weights + adapters from S3 → GPU VRAM' },
  { id: 2, name: 'Inference Loop', description: 'Token generation (NO storage I/O)' },
  { id: 3, name: 'Logging & Feedback', description: 'Every request logged + user feedback stored' },
  { id: 4, name: 'Model Updates', description: 'A/B tests, canary rollouts, rollbacks' },
]

// ============================================================================
// UTILITY FUNCTIONS (same pattern as Training/RAG/Fine-Tuning)
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

export default function InteractiveInferenceExplorer() {
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Interactive Inference Pipeline
              <span className="text-sm font-normal text-gray-400">— Model Serving</span>
            </h3>
            <p className="text-sm text-gray-400 mt-1">Click any node to explore details</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={stepBackward} className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Previous phase">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className={`p-3 rounded-xl transition-all ${isPlaying ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" /></svg>) : (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>)}
            </button>
            <button onClick={stepForward} className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors" title="Next phase">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-700">
              <span className="text-xs text-gray-500">Speed:</span>
              {[0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${speed === s ? 'bg-emerald-500 text-white' : 'bg-gray-700/50 text-gray-400 hover:text-white'}`}>{s}x</button>
              ))}
            </div>
          </div>
        </div>
        {/* Phase Indicator */}
        <div className="flex items-center gap-2 mt-4">
          {phases.map(phase => (
            <button key={phase.id} onClick={() => { setCurrentPhase(phase.id); setIsPlaying(false) }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${currentPhase === phase.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : currentPhase > phase.id ? 'bg-gray-700 text-gray-400' : 'bg-gray-800 text-gray-500'}`}>
              <span className="block font-bold">{phase.id}. {phase.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main SVG Diagram */}
      <div className="relative p-6 overflow-x-auto" style={{ minHeight: '820px' }}>
        <svg viewBox="0 0 1120 800" className="w-full min-w-[1000px]">
          <defs>
            <linearGradient id="infStorageGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#374151" /><stop offset="100%" stopColor="#1F2937" /></linearGradient>
            <linearGradient id="infComputeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#065F46" /><stop offset="100%" stopColor="#047857" /></linearGradient>
            <marker id="infArrowPrimary" markerWidth="22" markerHeight="16" refX="20" refY="8" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 0, 22 8, 0 16" fill="#C72C48" /></marker>
            <marker id="infArrowBurst" markerWidth="22" markerHeight="16" refX="20" refY="8" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 0, 22 8, 0 16" fill="#3B82F6" /></marker>
            <marker id="infArrowGreen" markerWidth="22" markerHeight="16" refX="20" refY="8" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 0, 22 8, 0 16" fill="#10B981" /></marker>
            <marker id="infArrowGray" markerWidth="22" markerHeight="16" refX="20" refY="8" orient="auto" markerUnits="userSpaceOnUse"><polygon points="0 0, 22 8, 0 16" fill="#6B7280" /></marker>
            <filter id="infGlow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="infGlowStrong"><feGaussianBlur stdDeviation="6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {/* Background Grid */}
          <pattern id="infGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/></pattern>
          <rect width="100%" height="100%" fill="url(#infGrid)" />

          {/* THE KEY CALLOUT — storage bookends */}
          <g>
            <rect x="420" y="470" width="280" height="55" rx="8" fill="#7F1D1D" stroke="#FCA5A5" strokeWidth="2" />
            <text x="560" y="495" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              Storage is at the BOOKENDS only
            </text>
            <text x="560" y="512" textAnchor="middle" fill="#FCA5A5" fontSize="10">
              Model load (before) + Logging (after) — NOT during generation
            </text>
          </g>

          {/* Inference Engine — custom GPU render with sub-boxes */}
          {(() => {
            const gpuNode = nodes.find(n => n.id === 'inference-engine')!
            const isActive = gpuNode.phase <= currentPhase
            return (
              <g opacity={isActive ? 1 : 0.4} className="cursor-pointer"
                onClick={() => handleNodeClick(gpuNode)}
                onMouseEnter={() => setHoveredNode(gpuNode.id)}
                onMouseLeave={() => setHoveredNode(null)}>
                {(isActive && (hoveredNode === gpuNode.id || selectedNode?.id === gpuNode.id)) && (
                  <rect x={gpuNode.x - 4} y={gpuNode.y - 4} width={gpuNode.width + 8} height={gpuNode.height + 8} rx="16" fill="#10B981" opacity={0.2} filter="url(#infGlowStrong)" />
                )}
                <rect x={gpuNode.x} y={gpuNode.y} width={gpuNode.width} height={gpuNode.height} rx="12" fill="url(#infComputeGrad)" stroke="#10B981" strokeWidth={selectedNode?.id === gpuNode.id ? 3 : 2} />
                {/* Phase badge */}
                <circle cx={gpuNode.x + 20} cy={gpuNode.y + 20} r="12" fill="#10B981" />
                <text x={gpuNode.x + 20} y={gpuNode.y + 24} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{gpuNode.phase}</text>
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 22} textAnchor="middle" fill="white" fontSize="13" fontWeight="600" dx="10">vLLM / Triton</text>

                {/* NOT IN PATH banner */}
                <rect x={gpuNode.x + 25} y={gpuNode.y + 40} width={gpuNode.width - 50} height="26" rx="6" fill="#10B981" />
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 57} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">STORAGE NOT IN PATH</text>

                {/* GPU VRAM sub-box */}
                <rect x={gpuNode.x + 15} y={gpuNode.y + 78} width={gpuNode.width - 30} height="130" rx="8" fill="#1F2937" stroke="#34D399" strokeWidth="1" />
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 97} textAnchor="middle" fill="#34D399" fontSize="11" fontWeight="600">GPU MEMORY (VRAM)</text>

                {/* Components in GPU */}
                <rect x={gpuNode.x + 25} y={gpuNode.y + 107} width={115} height="40" rx="4" fill="#374151" />
                <text x={gpuNode.x + 82} y={gpuNode.y + 125} textAnchor="middle" fill="#9CA3AF" fontSize="9">Model Weights</text>
                <text x={gpuNode.x + 82} y={gpuNode.y + 138} textAnchor="middle" fill="#6B7280" fontSize="8">(already loaded)</text>

                <rect x={gpuNode.x + 150} y={gpuNode.y + 107} width={115} height="40" rx="4" fill="#374151" />
                <text x={gpuNode.x + 207} y={gpuNode.y + 125} textAnchor="middle" fill="#9CA3AF" fontSize="9">KV Cache</text>
                <text x={gpuNode.x + 207} y={gpuNode.y + 138} textAnchor="middle" fill="#6B7280" fontSize="8">(attention state)</text>

                <rect x={gpuNode.x + 25} y={gpuNode.y + 155} width={240} height="30" rx="4" fill="#374151" />
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 174} textAnchor="middle" fill="#9CA3AF" fontSize="9">Compute: Attention + FFN + Sampling</text>

                {/* User Request/Response flow */}
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 225} textAnchor="middle" fill="#10B981" fontSize="10">Prompt In → Forward Pass → Token Out</text>
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + 242} textAnchor="middle" fill="#6B7280" fontSize="9">Autoregressive: repeat until stop</text>

                {/* User request/response labels */}
                <g>
                  <rect x={gpuNode.x + 15} y={gpuNode.y + 265} width={115} height="35" rx="6" fill="#374151" stroke="#6B7280" strokeWidth="1" />
                  <text x={gpuNode.x + 72} y={gpuNode.y + 280} textAnchor="middle" fill="#9CA3AF" fontSize="9">User Prompt</text>
                  <text x={gpuNode.x + 72} y={gpuNode.y + 293} textAnchor="middle" fill="#6B7280" fontSize="8">Network I/O</text>
                </g>
                <g>
                  <rect x={gpuNode.x + 150} y={gpuNode.y + 265} width={115} height="35" rx="6" fill="#065F46" stroke="#10B981" strokeWidth="1" />
                  <text x={gpuNode.x + 207} y={gpuNode.y + 280} textAnchor="middle" fill="#10B981" fontSize="9">Generated Output</text>
                  <text x={gpuNode.x + 207} y={gpuNode.y + 293} textAnchor="middle" fill="#6B7280" fontSize="8">Network I/O</text>
                </g>

                {/* Role badge */}
                <rect x={gpuNode.x + 10} y={gpuNode.y + gpuNode.height - 30} width={gpuNode.width - 20} height="22" rx="4" fill="#10B981" opacity={0.9} />
                <text x={gpuNode.x + gpuNode.width / 2} y={gpuNode.y + gpuNode.height - 14} textAnchor="middle" fill="white" fontSize="10" fontWeight="600">COMPUTE ONLY — NO STORAGE I/O</text>

                {/* Click indicator */}
                {hoveredNode === gpuNode.id && (
                  <g>
                    <circle cx={gpuNode.x + gpuNode.width - 15} cy={gpuNode.y + 15} r="8" fill="#10B981" opacity={0.8}><animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite" /></circle>
                    <text x={gpuNode.x + gpuNode.width - 15} y={gpuNode.y + 18} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">+</text>
                  </g>
                )}
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
                {isActive && flow.animated && (<path d={pathD} fill="none" stroke={fromColors.fill} strokeWidth={strokeWidth + 4} opacity={0.2} filter="url(#infGlow)" />)}
                <path d={pathD} fill="none" stroke={fromColors.fill} strokeWidth={strokeWidth} strokeLinecap="round" markerEnd={`url(#infArrow${markerKey})`} strokeDasharray={flow.animated && isActive ? "10,5" : "none"}>
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
          {nodes.filter(n => n.id !== 'inference-engine').map(node => {
            const colors = roleColors[node.role]
            const isActive = node.phase <= currentPhase
            const isHovered = hoveredNode === node.id
            const isSelected = selectedNode?.id === node.id
            return (
              <g key={node.id} className="cursor-pointer" style={{ opacity: isActive ? 1 : 0.4 }}
                onClick={() => handleNodeClick(node)} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}>
                {(isActive && (isHovered || isSelected)) && (<rect x={node.x - 4} y={node.y - 4} width={node.width + 8} height={node.height + 8} rx="16" fill={colors.fill} opacity={0.2} filter="url(#infGlowStrong)" />)}
                <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="12" fill="url(#infStorageGrad)" stroke={colors.fill} strokeWidth={isSelected ? 3 : 2} />
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
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600" /><span className="text-xs text-gray-400">Burst Read (Model Load)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gradient-to-r from-raspberry to-raspberry-dark" /><span className="text-xs text-gray-400">Primary Storage</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-green-500" /><span className="text-xs text-gray-400">Compute Only (No Storage)</span></div>
          <div className="flex items-center gap-2 pl-4 border-l border-gray-700"><span className="text-xs text-emerald-400 font-semibold">Key:</span><span className="text-xs text-gray-400">Token generation loop has ZERO storage I/O</span></div>
        </div>
      </div>
    </div>
  )
}
