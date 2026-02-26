import { useState } from 'react'

// =============================================================================
// THE PRESCRIPTIVE REFERENCE ARCHITECTURE
// "Here's THE way to do AI Training Storage - like META, but achievable"
// =============================================================================

// THE STACK (ONE choice, alternatives in parentheses)
const STACK = {
  platform: { primary: 'OpenShift AI', alts: ['Kubernetes', 'EKS/GKE'] },
  hardware: { primary: '8-Node GPU Cluster', alts: ['HPE ProLiant DL380a', 'Dell PowerEdge'] },
  gpus: { primary: 'NVIDIA H200', alts: ['H100', 'A100'] },
  training: { primary: 'PyTorch', alts: ['TensorFlow', 'JAX'] },
  distributed: { primary: 'Ray', alts: ['Horovod', 'DeepSpeed'] },
  dataEng: { primary: 'Spark', alts: ['Dask', 'Polars'] },
  tableFormat: { primary: 'Iceberg', alts: ['Delta Lake', 'Hudi'] },
  mlops: { primary: 'MLflow', alts: ['Kubeflow', 'W&B'] },
  vectorDb: { primary: 'Weaviate', alts: ['Milvus', 'Pinecone', 'pgvector'] },
  serving: { primary: 'vLLM', alts: ['TensorRT-LLM', 'Triton'] },
  storage: { primary: 'MinIO AIStor', alts: ['(This is non-negotiable)'] },
}

// THE PIPELINE PHASES - Step by step, what happens where
interface PipelinePhase {
  id: string
  name: string
  description: string
  storageOperation: string
  tier: 0 | 1 | 2 | 3
  ioPattern: string
  dataVolume: string
  latencyReq: string
  minioRole: string
  metaComparison: string
}

const PIPELINE_PHASES: PipelinePhase[] = [
  {
    id: 'ingest',
    name: '1. Data Ingestion',
    description: 'Raw data lands in the lake. Unstructured: images, video, text, logs.',
    storageOperation: 'WRITE → Bronze layer',
    tier: 2,
    ioPattern: 'Sequential writes, massive volume',
    dataVolume: 'Petabytes',
    latencyReq: '5-15ms OK (batch)',
    minioRole: 'Data Lake Foundation',
    metaComparison: 'META: Tectonic distributed FS. You: MinIO AIStor.',
  },
  {
    id: 'elt',
    name: '2. ELT Processing',
    description: 'Spark transforms raw → cleaned → tokenized. Bronze → Silver → Gold.',
    storageOperation: 'READ Bronze → WRITE Silver/Gold',
    tier: 2,
    ioPattern: 'Batch R/W, Iceberg tables',
    dataVolume: 'Terabytes per job',
    latencyReq: '5-15ms (batch)',
    minioRole: 'Medallion Architecture Host',
    metaComparison: 'META: Custom data preprocessing. You: Spark + Iceberg on MinIO.',
  },
  {
    id: 'shuffle',
    name: '3. Spark Shuffle',
    description: 'Intermediate shuffle data during ELT. Ephemeral, high IOPS.',
    storageOperation: 'Ephemeral R/W',
    tier: 0,
    ioPattern: 'Random I/O, <100μs required',
    dataVolume: 'GBs-TBs per job',
    latencyReq: '<100μs (critical)',
    minioRole: 'NONE - Local NVMe only',
    metaComparison: 'META: Local NVMe shuffle. You: Same - Tier 0 block.',
  },
  {
    id: 'dataload',
    name: '4. DataLoader Streaming',
    description: 'PyTorch DataLoader pulls tokenized shards to GPUs. Sustained throughput.',
    storageOperation: 'READ Gold shards → GPU memory',
    tier: 1,
    ioPattern: 'Sequential reads, prefetch, 325 GiB/s',
    dataVolume: 'Continuous stream',
    latencyReq: '1-5ms (throughput > latency)',
    minioRole: 'Hot S3 Cache (in-cluster)',
    metaComparison: 'META: 16 TB/s to 16K GPUs. You: 325 GiB/s per node.',
  },
  {
    id: 'training',
    name: '5. GPU Training Loop',
    description: 'Forward pass → Loss → Backward pass → Gradient sync. Pure compute.',
    storageOperation: 'NONE - GPU memory only',
    tier: 0,
    ioPattern: 'Compute-bound, no storage I/O',
    dataVolume: 'Weights in VRAM (GBs-TBs)',
    latencyReq: 'N/A - memory-resident',
    minioRole: 'NONE during active training',
    metaComparison: 'META: 400 TFLOPs/GPU. You: Same H200 = same math.',
  },
  {
    id: 'checkpoint',
    name: '6. Checkpointing',
    description: 'Save full model state every N steps. Disaster recovery. Critical.',
    storageOperation: 'WRITE model + optimizer state',
    tier: 2,
    ioPattern: 'Bursty large sequential writes',
    dataVolume: '500GB-1TB per checkpoint (70B model)',
    latencyReq: '5-15ms OK (periodic burst)',
    minioRole: 'Durable checkpoint store',
    metaComparison: 'META: Tectonic synchronized checkpoints. You: MinIO AIStor.',
  },
  {
    id: 'experiment',
    name: '7. Experiment Tracking',
    description: 'MLflow logs metrics, params, artifacts. Continuous throughout training.',
    storageOperation: 'WRITE artifacts + READ for analysis',
    tier: 1,
    ioPattern: 'Mixed small-medium objects',
    dataVolume: 'GBs per experiment',
    latencyReq: '1-5ms',
    minioRole: 'MLflow artifact backend',
    metaComparison: 'META: Internal tooling. You: MLflow + MinIO.',
  },
  {
    id: 'vectorize',
    name: '8. Embedding/Vectorization',
    description: 'For RAG: chunk documents → embed → store vectors in Weaviate.',
    storageOperation: 'READ docs → WRITE vectors',
    tier: 0,
    ioPattern: 'Random access, <500μs for HNSW',
    dataVolume: 'Millions of vectors',
    latencyReq: '<500μs (query time)',
    minioRole: 'NONE - Weaviate on local NVMe',
    metaComparison: 'META: Not public. You: Weaviate PVC on local NVMe.',
  },
  {
    id: 'export',
    name: '9. Model Export',
    description: 'Final model → safetensors → Model Registry. Immutable artifact.',
    storageOperation: 'WRITE final model',
    tier: 2,
    ioPattern: 'Large sequential write, versioned',
    dataVolume: '100s GB per model',
    latencyReq: '5-15ms',
    minioRole: 'Model Registry (S3 versioning)',
    metaComparison: 'META: Internal registry. You: MinIO with versioning.',
  },
  {
    id: 'archive',
    name: '10. Compliance Archive',
    description: 'Old checkpoints, audit logs, historical data. 7-year retention.',
    storageOperation: 'WRITE-once, read-rarely',
    tier: 3,
    ioPattern: 'Archive, ILM auto-tiered',
    dataVolume: 'Exabytes over time',
    latencyReq: '15-50ms OK',
    minioRole: 'Object Lock, WORM, SEC 17a-4',
    metaComparison: 'META: Compliance requirements. You: MinIO Object Lock.',
  },
]

// THE TIERS - Clear, no ambiguity
const TIERS = [
  {
    tier: 0,
    name: 'Raw Block / GDS',
    what: 'Local NVMe, GPU-Direct Storage, mmap, PVCs',
    capacity: 'Node-local (TBs)',
    latency: '<100μs',
    isMinIO: false,
    color: '#10B981',
    analogy: 'Like: HBA direct-attach to server',
    notLike: 'NOT like: iSCSI over network',
  },
  {
    tier: 1,
    name: 'Hot S3 (In-Cluster)',
    what: 'MinIO Pod on local NVMe inside the K8s cluster',
    capacity: '100s TB+',
    latency: '1-5ms',
    isMinIO: true,
    color: '#C72C48',
    analogy: 'Like: NVMe-oF to nearby storage',
    notLike: 'NOT like: SAN over FC fabric',
  },
  {
    tier: 2,
    name: 'Warm S3 (AIStor)',
    what: 'MinIO AIStor - THE capacity tier, data lake',
    capacity: 'PB+',
    latency: '5-15ms',
    isMinIO: true,
    color: '#F59E0B',
    analogy: 'Like: Enterprise SAN (NetApp, Pure)',
    notLike: 'NOT like: Your grandfather\'s NAS',
  },
  {
    tier: 3,
    name: 'Cold Archive',
    what: 'MinIO AIStor with Object Lock, ILM tiering',
    capacity: 'EB+',
    latency: '15-50ms',
    isMinIO: true,
    color: '#6B7280',
    analogy: 'Like: Tape library (but accessible)',
    notLike: 'NOT like: Glacier (we\'re on-prem)',
  },
]

// THE STORAGE DINOSAUR TRANSLATION
// This is the key insight for your audience
const DINOSAUR_TRANSLATION = {
  title: 'For Storage Veterans: The GPU/DPU is NOT like iSCSI/TOE',
  explanation: `
Your instinct: "GPU talks to storage like iSCSI initiator talks to target."
Reality: GPU doesn't "talk to storage" during training at all.

The GPU is the COMPUTE. Storage is the STAGING AREA.
- Data is PRELOADED into GPU VRAM before training starts
- Training loop runs ENTIRELY in GPU memory (no storage I/O)
- Checkpoints are PERIODIC WRITES (not continuous I/O)

Think of it like this:
- OLD: Database server doing random I/O to SAN all day
- NEW: Load the dataset, train for hours in memory, occasionally save

The DPU handles:
- Network offload (RDMA/RoCE for GPU-to-GPU communication)
- NOT storage I/O during training

Storage handles:
- Data Lake (before training)
- Checkpoints (during training, but periodic)
- Model Registry (after training)
`,
  comparison: [
    { old: 'iSCSI Initiator', new: 'RDMA NIC (CX-7)', purpose: 'GPU-to-GPU gradient sync' },
    { old: 'TOE Card', new: 'DPU (BlueField-3)', purpose: 'Network offload, not storage' },
    { old: 'SAN Target', new: 'MinIO AIStor', purpose: 'Data Lake + Checkpoints' },
    { old: 'LUN', new: 'S3 Bucket', purpose: 'Namespace for objects' },
    { old: 'RAID Controller', new: 'Erasure Coding', purpose: 'Data protection' },
    { old: 'FC Fabric', new: 'RoCE v2 / InfiniBand', purpose: 'GPU interconnect' },
  ],
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ReferenceArchitecture() {
  const [selectedPhase, setSelectedPhase] = useState<PipelinePhase | null>(null)
  const [showDinosaurGuide, setShowDinosaurGuide] = useState(false)
  const [viewMode, setViewMode] = useState<'pipeline' | 'tiers' | 'stack'>('pipeline')

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-raspberry to-raspberry-dark px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              AI Training Reference Architecture
            </h2>
            <p className="text-raspberry-light mt-1">
              Prescriptive. META-inspired. MinIO-powered.
            </p>
          </div>
          <button
            onClick={() => setShowDinosaurGuide(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors border border-white/20"
          >
            🦖 Storage Veteran Guide
          </button>
        </div>
      </div>

      {/* View Selector */}
      <div className="border-b border-white/10 px-6 py-3 bg-gray-800/50">
        <div className="flex gap-2">
          {[
            { id: 'pipeline', label: 'Pipeline Flow', desc: 'Step-by-step' },
            { id: 'tiers', label: 'Storage Tiers', desc: '4-tier layout' },
            { id: 'stack', label: 'The Stack', desc: 'Software choices' },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setViewMode(view.id as typeof viewMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === view.id
                  ? 'bg-raspberry text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="block">{view.label}</span>
              <span className="block text-[10px] opacity-70">{view.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'pipeline' && (
          <PipelineView
            phases={PIPELINE_PHASES}
            selectedPhase={selectedPhase}
            onSelectPhase={setSelectedPhase}
          />
        )}
        {viewMode === 'tiers' && <TierView tiers={TIERS} />}
        {viewMode === 'stack' && <StackView stack={STACK} />}
      </div>

      {/* Dinosaur Guide Modal */}
      {showDinosaurGuide && (
        <DinosaurGuideModal
          data={DINOSAUR_TRANSLATION}
          onClose={() => setShowDinosaurGuide(false)}
        />
      )}
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function PipelineView({
  phases,
  selectedPhase,
  onSelectPhase,
}: {
  phases: PipelinePhase[]
  selectedPhase: PipelinePhase | null
  onSelectPhase: (phase: PipelinePhase | null) => void
}) {
  const tierColors: Record<number, string> = {
    0: '#10B981',
    1: '#C72C48',
    2: '#F59E0B',
    3: '#6B7280',
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 mb-4">
        <strong className="text-white">The Pipeline:</strong> Click any phase to see storage details.
        Each phase maps to a specific storage tier.
      </div>

      {/* Phase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {phases.map((phase, idx) => (
          <button
            key={phase.id}
            onClick={() => onSelectPhase(selectedPhase?.id === phase.id ? null : phase)}
            className={`relative text-left p-4 rounded-xl border-2 transition-all ${
              selectedPhase?.id === phase.id
                ? 'border-white/50 bg-white/10 scale-[1.02]'
                : 'border-white/10 bg-gray-800/30 hover:border-white/30 hover:bg-gray-800/50'
            }`}
          >
            {/* Tier Indicator */}
            <div
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: tierColors[phase.tier] }}
            >
              T{phase.tier}
            </div>

            {/* Phase Number */}
            <div className="text-xs text-gray-500 mb-1">Phase {idx + 1}</div>
            
            {/* Phase Name */}
            <h4 className="text-white font-semibold text-sm leading-tight pr-8">
              {phase.name.replace(/^\d+\.\s*/, '')}
            </h4>
            
            {/* Storage Op */}
            <div className="mt-2 text-[10px] text-gray-400 font-mono">
              {phase.storageOperation}
            </div>
          </button>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedPhase && (
        <div className="mt-6 bg-gray-800/50 rounded-xl border border-white/10 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-2"
                style={{ backgroundColor: tierColors[selectedPhase.tier] }}
              >
                TIER {selectedPhase.tier}
              </div>
              <h3 className="text-xl font-bold text-white">{selectedPhase.name}</h3>
              <p className="text-gray-400 mt-1">{selectedPhase.description}</p>
            </div>
            <button
              onClick={() => onSelectPhase(null)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">I/O Pattern</div>
              <div className="text-white text-sm">{selectedPhase.ioPattern}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Data Volume</div>
              <div className="text-white text-sm">{selectedPhase.dataVolume}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Latency Req</div>
              <div className="text-white text-sm">{selectedPhase.latencyReq}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">MinIO Role</div>
              <div className="text-white text-sm font-medium" style={{ color: selectedPhase.tier === 0 ? '#EF4444' : '#C72C48' }}>
                {selectedPhase.minioRole}
              </div>
            </div>
          </div>

          {/* META Comparison */}
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">META Comparison</div>
            <p className="text-gray-300 text-sm">{selectedPhase.metaComparison}</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
        {TIERS.map((tier) => (
          <div key={tier.tier} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tier.color }}
            />
            <span className="text-xs text-gray-400">
              T{tier.tier}: {tier.name} {!tier.isMinIO && '(NOT MinIO)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TierView({ tiers }: { tiers: typeof TIERS }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 mb-4">
        <strong className="text-white">The 4 Tiers:</strong> Understand where data lives at each latency target.
        Note: Tier 0 is NOT MinIO.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.map((tier) => (
          <div
            key={tier.tier}
            className="rounded-xl border-2 p-5"
            style={{
              borderColor: `${tier.color}50`,
              background: `linear-gradient(135deg, ${tier.color}10 0%, transparent 100%)`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: tier.color }}
                >
                  T{tier.tier}
                </div>
                <div>
                  <h4 className="text-white font-bold">{tier.name}</h4>
                  <div className="text-xs text-gray-400">{tier.latency} · {tier.capacity}</div>
                </div>
              </div>
              {!tier.isMinIO && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                  NOT MinIO
                </span>
              )}
              {tier.isMinIO && (
                <span className="px-2 py-1 bg-raspberry/20 text-raspberry text-xs font-bold rounded-full">
                  MinIO
                </span>
              )}
            </div>

            <p className="text-gray-300 text-sm mb-4">{tier.what}</p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-400">{tier.analogy}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span className="text-gray-400">{tier.notLike}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Capacity Scale */}
      <div className="mt-6 bg-gray-800/50 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Capacity Scale (Log)</h4>
        <div className="flex items-end gap-1 h-20">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              className="flex-1 rounded-t flex flex-col items-center justify-end"
              style={{
                backgroundColor: `${tier.color}30`,
                height: `${25 + tier.tier * 25}%`,
              }}
            >
              <span className="text-[10px] text-white font-medium">{tier.capacity}</span>
            </div>
          ))}
        </div>
        <div className="flex mt-2">
          {tiers.map((tier) => (
            <div key={tier.tier} className="flex-1 text-center text-[10px] text-gray-500">
              Tier {tier.tier}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StackView({ stack }: { stack: typeof STACK }) {
  const categories = [
    { key: 'platform', label: 'Platform', icon: '☸️' },
    { key: 'hardware', label: 'Hardware', icon: '🖥️' },
    { key: 'gpus', label: 'GPUs', icon: '🎮' },
    { key: 'training', label: 'Training Framework', icon: '🔥' },
    { key: 'distributed', label: 'Distributed', icon: '🌐' },
    { key: 'dataEng', label: 'Data Engineering', icon: '⚡' },
    { key: 'tableFormat', label: 'Table Format', icon: '🧊' },
    { key: 'mlops', label: 'MLOps', icon: '📊' },
    { key: 'vectorDb', label: 'Vector DB', icon: '🔍' },
    { key: 'serving', label: 'Serving', icon: '🚀' },
    { key: 'storage', label: 'Storage', icon: '💾' },
  ]

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400 mb-4">
        <strong className="text-white">The Stack:</strong> ONE primary choice per category.
        Alternatives in parentheses for flexibility.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(({ key, label, icon }) => {
          const item = stack[key as keyof typeof stack]
          const isStorage = key === 'storage'
          
          return (
            <div
              key={key}
              className={`rounded-xl border p-4 ${
                isStorage
                  ? 'border-raspberry bg-raspberry/10'
                  : 'border-white/10 bg-gray-800/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
              </div>
              <div className={`font-bold ${isStorage ? 'text-raspberry' : 'text-white'}`}>
                {item.primary}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ({item.alts.join(', ')})
              </div>
            </div>
          )
        })}
      </div>

      {/* The Bottom Line */}
      <div className="mt-6 bg-gradient-to-r from-raspberry/20 to-transparent border border-raspberry/30 rounded-xl p-5">
        <h4 className="text-raspberry font-bold mb-2">The Bottom Line</h4>
        <p className="text-gray-300 text-sm">
          META built Tectonic (custom distributed FS) to train Llama 3 on 16K GPUs.
          You get the same architecture pattern with <strong className="text-white">MinIO AIStor</strong> — 
          without building from scratch. Same S3 API, same performance class, fraction of the effort.
        </p>
      </div>
    </div>
  )
}

function DinosaurGuideModal({
  data,
  onClose,
}: {
  data: typeof DINOSAUR_TRANSLATION
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-amber-500/20 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🦖</span>
              <div>
                <h3 className="text-xl font-bold text-white">{data.title}</h3>
                <p className="text-amber-400 text-sm">A translation for storage veterans</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Explanation */}
          <div className="bg-gray-800/50 rounded-xl p-5">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              {data.explanation}
            </pre>
          </div>

          {/* Translation Table */}
          <div>
            <h4 className="text-white font-semibold mb-3">The Translation Table</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-white/10">
                    <th className="pb-2 pr-4">Old World</th>
                    <th className="pb-2 pr-4">AI World</th>
                    <th className="pb-2">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {data.comparison.map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 pr-4 text-red-400">{row.old}</td>
                      <td className="py-2 pr-4 text-emerald-400">{row.new}</td>
                      <td className="py-2 text-gray-400">{row.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical Insight */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <h4 className="text-red-400 font-bold mb-2">⚠️ The Critical Insight</h4>
            <p className="text-gray-300 text-sm">
              <strong className="text-white">Storage is NOT in the critical path during training.</strong><br />
              The GPU training loop runs entirely in GPU memory. Storage is used for:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>• <strong className="text-amber-400">Before:</strong> Loading the dataset (DataLoader → GPU)</li>
              <li>• <strong className="text-amber-400">During:</strong> Periodic checkpoints (every N steps)</li>
              <li>• <strong className="text-amber-400">After:</strong> Saving the final model</li>
            </ul>
            <p className="mt-3 text-gray-300 text-sm">
              This is fundamentally different from a database workload where storage I/O is continuous.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
