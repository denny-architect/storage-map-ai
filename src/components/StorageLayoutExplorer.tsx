import { useState, useCallback, useMemo } from 'react'

// ============================================================================
// SOFTWARE STACK LOGOS (Text-based for now - can swap to images)
// ============================================================================

interface SoftwareComponent {
  name: string
  tier: number | number[] // which tier(s) it connects to
  category: 'compute' | 'mlops' | 'serving' | 'vector' | 'elt' | 'governance'
  color: string
}

const softwareStack: SoftwareComponent[] = [
  // ELT / Data Engineering
  { name: 'Spark', tier: [0, 1, 2], category: 'elt', color: '#E25A1C' },
  { name: 'Databricks', tier: 2, category: 'elt', color: '#FF3621' },
  // Training / Compute
  { name: 'PyTorch', tier: [0, 1], category: 'compute', color: '#EE4C2C' },
  { name: 'TensorFlow', tier: [0, 1], category: 'compute', color: '#FF6F00' },
  { name: 'Ray', tier: 1, category: 'compute', color: '#028CF0' },
  // MLOps
  { name: 'Kubeflow', tier: 1, category: 'mlops', color: '#326CE5' },
  { name: 'MLflow', tier: [1, 2], category: 'mlops', color: '#0194E2' },
  // Serving
  { name: 'vLLM', tier: 0, category: 'serving', color: '#7C3AED' },
  { name: 'KServe', tier: 1, category: 'serving', color: '#326CE5' },
  // Vector
  { name: 'Weaviate', tier: 0, category: 'vector', color: '#01CC88' },
  // Governance
  { name: 'TrustyAI', tier: 3, category: 'governance', color: '#EE0000' },
  // Table Formats
  { name: 'Iceberg', tier: 2, category: 'elt', color: '#4A90D9' },
  { name: 'Delta', tier: 2, category: 'elt', color: '#003366' },
]

// ============================================================================
// TYPES
// ============================================================================

interface StorageTier {
  id: string
  tier: number
  name: string
  subtitle: string
  capacity: string
  latency: string
  isMinIO: boolean
  color: string
  description: string
  components: ComponentInfo[]
  details: string[]
  accessMethod: string
}

interface ComponentInfo {
  id: string
  name: string
  shortName: string
  logo?: string
  tier: number
  description: string
  storageUse: string
  ioPattern: string
}

/*
interface DataFlowPath {
  id: string
  from: string
  to: string
  label: string
  volume: 'massive' | 'heavy' | 'medium' | 'light'
  animated: boolean
}
*/

// ============================================================================
// DATA
// ============================================================================

const storageTiers: StorageTier[] = [
  {
    id: 'tier-0',
    tier: 0,
    name: 'Raw Block / GDS',
    subtitle: 'NVMe Local (Block)',
    capacity: 'Node-Local (TBs)',
    latency: '<100μs',
    isMinIO: false,
    color: '#10B981', // Emerald
    description: 'NOT object storage. Raw NVMe block I/O, GPU-Direct Storage (GDS), mmap, PVCs. PCIe 5 direct to VRAM.',
    accessMethod: 'Raw Block / mmap / GDS / PVC',
    components: [
      {
        id: 'spark-shuffle',
        name: 'Spark Shuffle Spill',
        shortName: 'Spark Shuffle Spill',
        tier: 0,
        description: 'Ephemeral shuffle data written to local NVMe during Spark jobs',
        storageUse: 'Temporary spill space for shuffle operations — not durable',
        ioPattern: 'Random R/W, ephemeral, high IOPS',
      },
      {
        id: 'weaviate-hnsw',
        name: 'Weaviate HNSW Index',
        shortName: 'Weaviate HNSW Index',
        tier: 0,
        description: 'In-memory vector graph requiring sub-500μs nearest-neighbor lookups',
        storageUse: 'HNSW graph traversal via memory-mapped NVMe',
        ioPattern: 'Random reads, memory-mapped, latency-critical',
      },
      {
        id: 'vllm-cache',
        name: 'vLLM KV Cache',
        shortName: 'vLLM KV Cache',
        tier: 0,
        description: 'Model weights loaded via GDS + KV cache pinned in GPU VRAM',
        storageUse: 'Bulk weight load via cuFile, then VRAM-resident KV cache',
        ioPattern: 'One-time bulk load → persistent VRAM residency',
      },
    ],
    details: [
      'This is NOT MinIO AIStor — pure block I/O',
      'GPU-Direct Storage (GDS) via cuFile',
      'Sub-100μs P99 latency required',
      'Ephemeral - not durable storage',
      'PVCs for StatefulSets (Weaviate)',
      'PCIe 5/6 direct to H200 VRAM',
    ],
  },
  {
    id: 'tier-1',
    tier: 1,
    name: 'Hot S3 (In-Cluster)',
    subtitle: 'NVMe Local (PVC / S3)',
    capacity: '100s TB+',
    latency: '1-5ms',
    isMinIO: true,
    color: '#C72C48', // MinIO Raspberry
    description: 'MinIO AIStor Pod running IN-CLUSTER on local NVMe. Operational S3 for active workloads — NOT capacity tier.',
    accessMethod: 'S3 API (http://minio-local.ai-ns)',
    components: [
      {
        id: 'pytorch-dataloader',
        name: 'PyTorch DataLoader',
        shortName: 'PyTorch DataLoader',
        tier: 1,
        description: 'Streaming tokenized shards to GPUs via S3 with prefetch buffers',
        storageUse: 'Sequential reads with multi-worker prefetch',
        ioPattern: '325 GiB/s aggregate read throughput',
      },
      {
        id: 'kubeflow-artifacts',
        name: 'Kubeflow Pipeline Artifacts',
        shortName: 'Kubeflow Pipeline Artifacts',
        tier: 1,
        description: 'Intermediate outputs between pipeline steps (models, metrics, datasets)',
        storageUse: 'Step outputs, workflow state, inter-stage data',
        ioPattern: 'Mixed R/W, workflow-driven, ephemeral',
      },
      {
        id: 'mlflow-active',
        name: 'MLflow Model Registry',
        shortName: 'MLflow Model Registry',
        tier: 1,
        description: 'Active model versions staged for deployment — fast retrieval required',
        storageUse: 'Production model binaries, version metadata',
        ioPattern: 'Read-heavy, low-latency serving path',
      },
      {
        id: 'ray-objects',
        name: 'Ray Object Store',
        shortName: 'Ray Object Store',
        tier: 1,
        description: 'Distributed shared objects across Ray workers for parallel compute',
        storageUse: 'Shared tensors, intermediate results across workers',
        ioPattern: 'Random R/W, distributed, latency-sensitive',
      },
    ],
    details: [
      'MinIO AIStor Pod IN-CLUSTER (not adjacent)',
      'Single pod with local NVMe drives',
      'Operational S3 — not capacity tier',
      '325 GiB/s read throughput',
      'S3 API over localhost / service mesh',
      'DataLoader streaming, pipeline artifacts',
    ],
  },
  {
    id: 'tier-2',
    tier: 2,
    name: 'Warm S3 (MinIO AIStor)',
    subtitle: 'S3 over RDMA to NVMe (400GbE)',
    capacity: 'PB+',
    latency: '5-15ms',
    isMinIO: true,
    color: '#F59E0B', // Amber
    description: 'MinIO AIStor — THE capacity tier. Data Lake, Lakehouse, Medallion architecture. S3 Tables (Iceberg/Delta/Hudi). 400GbE RoCE v2.',
    accessMethod: 'S3 over RDMA / RoCE v2 (400GbE)',
    components: [
      {
        id: 'checkpoints',
        name: 'Training Checkpoints',
        shortName: 'Training Checkpoints',
        tier: 2,
        description: 'Full model state saved for disaster recovery — 500 GB to 1 TB per save (70B model)',
        storageUse: 'Periodic full-state snapshots during training runs',
        ioPattern: 'Bursty sequential writes, 50-100 GB/s peak',
      },
      {
        id: 'medallion',
        name: 'Medallion Architecture (Bronze/Silver/Gold)',
        shortName: 'Medallion (Bronze/Silver/Gold)',
        tier: 2,
        description: 'Lakehouse data lifecycle: raw ingest → cleaned/deduped → tokenized/sharded',
        storageUse: 'Each layer is a full read-write cycle through object storage',
        ioPattern: 'ELT batch processing, TB-scale per job',
      },
      {
        id: 'feast-features',
        name: 'Feast Feature Store',
        shortName: 'Feast Feature Store',
        tier: 2,
        description: 'Offline feature snapshots in Parquet/ORC for reproducible training',
        storageUse: 'Historical feature tables, point-in-time joins',
        ioPattern: 'Bulk columnar reads for training pipelines',
      },
      {
        id: 's3-tables',
        name: 'S3 Tables (Iceberg/Delta)',
        shortName: 'S3 Tables (Iceberg/Delta)',
        tier: 2,
        description: 'ACID transactions, time travel, schema evolution — the Lakehouse table format',
        storageUse: 'Structured data with transactional guarantees',
        ioPattern: 'Columnar reads/writes, partition pruning',
      },
    ],
    details: [
      'MinIO AIStor — CAPACITY TIER',
      'The Data Lake / Lakehouse lives here',
      'S3 Tables: Iceberg, Delta, Hudi',
      'Medallion: Bronze → Silver → Gold',
      'S3 over RDMA to NVMe — 400GbE RoCE v2',
      'Erasure coding for durability',
    ],
  },
  {
    id: 'tier-3',
    tier: 3,
    name: 'Cold Archive',
    subtitle: 'S3 to NVMe/SSD — 100GbE (SSD Recommended)',
    capacity: 'EB+',
    latency: '15-50ms',
    isMinIO: true,
    color: '#6B7280', // Gray
    description: 'MinIO AIStor with Object Lock. S3 to NVMe/SSD over 100GbE. 7-year retention, WORM compliance, immutable audit trails.',
    accessMethod: 'S3 w/ Object Lock + ILM (100GbE)',
    components: [
      {
        id: 'trustyai-logs',
        name: 'TrustyAI Audit Logs',
        shortName: 'TrustyAI Audit Logs',
        tier: 3,
        description: 'Immutable model lineage and decision audit trail — WORM-protected',
        storageUse: 'Write-once compliance logs with Object Lock',
        ioPattern: 'Write-once, read on audit/investigation',
      },
      {
        id: 'model-archives',
        name: 'Model Version Archive',
        shortName: 'Model Version Archive',
        tier: 3,
        description: 'Retired model versions retained for regulatory compliance',
        storageUse: 'Long-term immutable model retention via ILM from Tier 2',
        ioPattern: 'Auto-tiered from Tier 2, rarely retrieved',
      },
      {
        id: 'historical-data',
        name: 'Historical Training Data',
        shortName: 'Historical Training Data',
        tier: 3,
        description: 'Original training datasets preserved for reproducibility and legal holds',
        storageUse: 'Legal/compliance retention, SEC 17a-4(f)',
        ioPattern: 'Archive, retrieved for audits or retraining',
      },
    ],
    details: [
      'MinIO AIStor with Object Lock',
      'WORM: SEC 17a-4(f) compliant',
      '7-year retention policies',
      'Immutable audit trails',
      'Auto-tiering from Tier 2 via ILM',
      'Legal hold capability',
    ],
  },
]

/*
// Data flows for future animation use
const dataFlows: DataFlowPath[] = [
  { id: 'ingest-to-lake', from: 'tier-1', to: 'tier-2', label: 'ELT to Lake', volume: 'massive', animated: true },
  { id: 'lake-to-loader', from: 'tier-2', to: 'tier-1', label: 'Training Data', volume: 'heavy', animated: true },
  { id: 'loader-to-gpu', from: 'tier-1', to: 'tier-0', label: 'Batches', volume: 'heavy', animated: true },
  { id: 'gpu-to-checkpoint', from: 'tier-0', to: 'tier-2', label: 'Checkpoints', volume: 'heavy', animated: true },
  { id: 'archive-ilm', from: 'tier-2', to: 'tier-3', label: 'ILM Archive', volume: 'medium', animated: false },
]
*/

// ============================================================================
// COMPONENT
// ============================================================================

export default function StorageLayoutExplorer() {
  const [selectedTier, setSelectedTier] = useState<StorageTier | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null)
  const [showLakehouseInfo, setShowLakehouseInfo] = useState(false)
  const [activeSoftware, setActiveSoftware] = useState<string | null>(null)

  // Which tier numbers are highlighted by the active software pill
  const highlightedTiers = useMemo<number[]>(() => {
    if (!activeSoftware) return []
    const sw = softwareStack.find(s => s.name === activeSoftware)
    if (!sw) return []
    return Array.isArray(sw.tier) ? sw.tier : [sw.tier]
  }, [activeSoftware])

  const handleTierClick = useCallback((tier: StorageTier) => {
    setSelectedTier(tier)
    setSelectedComponent(null)
  }, [])

  const handleComponentClick = useCallback((component: ComponentInfo, tier: StorageTier) => {
    setSelectedComponent(component)
    setSelectedTier(tier)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedTier(null)
    setSelectedComponent(null)
  }, [])

  const handleSoftwareClick = useCallback((name: string) => {
    setActiveSoftware(prev => prev === name ? null : name)
  }, [])

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-white/10 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-raspberry animate-pulse" />
              AI Storage Layout
              <span className="text-sm font-normal text-gray-400">— The 4-Tier Architecture</span>
            </h3>
            <p className="text-sm text-gray-400 mt-1">Click any tier or component to explore details</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLakehouseInfo(true)}
              className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors border border-amber-500/30"
            >
              Data Lake vs Lakehouse?
            </button>
          </div>
        </div>
      </div>

      {/* Software Stack - Above the Tiers */}
      <div className="px-6 py-4 border-b border-white/10 bg-gray-800/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Application Layer</span>
          <span className="text-[10px] text-gray-500">
            {activeSoftware
              ? <>
                  <span className="text-white font-semibold">{activeSoftware}</span>
                  {' '}uses Tier {highlightedTiers.join(' & ')}
                  <button onClick={() => setActiveSoftware(null)} className="ml-2 text-gray-400 hover:text-white">✕</button>
                </>
              : 'Click any app to see which tiers it uses'
            }
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {softwareStack.map((sw) => {
            const tierArr = Array.isArray(sw.tier) ? sw.tier : [sw.tier]
            const isActive = activeSoftware === sw.name
            const tierColors = tierArr.map(t => storageTiers.find(st => st.tier === t)?.color || '#fff')
            return (
              <button
                key={sw.name}
                onClick={() => handleSoftwareClick(sw.name)}
                className={`relative px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'scale-105 shadow-lg'
                    : activeSoftware
                      ? 'opacity-40 hover:opacity-70'
                      : 'hover:border-white/40 hover:scale-105'
                } border ${
                  isActive ? 'border-white/50 bg-gray-700/80' : 'border-white/10 bg-gray-800/50'
                }`}
                style={isActive ? { boxShadow: `0 0 12px ${tierColors[0]}40, 0 0 0 2px ${tierColors[0]}` } : undefined}
              >
                <span className={`text-xs font-semibold ${
                  isActive ? 'text-white' : 'text-gray-200'
                }`}>{sw.name}</span>
                <span className="ml-1.5 text-[10px] font-medium" style={{
                  color: isActive ? tierColors[0] : '#6b7280'
                }}>
                  T{tierArr.join(',')}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {tierArr.map(t => (
                      <div key={t} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: storageTiers.find(st => st.tier === t)?.color }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Diagram */}
      <div className="p-6 lg:p-8">
        {/* Tier Cards - Responsive Layout with MORE SPACING */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
          {storageTiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              isSelected={selectedTier?.id === tier.id}
              isHighlighted={highlightedTiers.includes(tier.tier)}
              isDimmed={highlightedTiers.length > 0 && !highlightedTiers.includes(tier.tier)}
              onClick={() => handleTierClick(tier)}
              onComponentClick={(comp) => handleComponentClick(comp, tier)}
            />
          ))}
        </div>

        {/* Flow Arrows Between Tiers */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <FlowIndicator direction="right" label="Hot → Warm → Cold" color="#C72C48" />
          <span className="text-gray-500 text-sm mx-4">|</span>
          <FlowIndicator direction="left" label="Training Data Flow" color="#F59E0B" />
        </div>

        {/* Capacity Scale Bar */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-300">Capacity Scale</span>
            <span className="text-xs text-gray-500">Logarithmic</span>
          </div>
          <div className="flex items-end gap-1 h-12">
            <div className="flex-1 bg-emerald-500/30 rounded-t" style={{ height: '20%' }}>
              <div className="text-[10px] text-emerald-400 text-center mt-1">TBs</div>
            </div>
            <div className="flex-1 bg-raspberry/30 rounded-t" style={{ height: '40%' }}>
              <div className="text-[10px] text-raspberry text-center mt-1">100s TB</div>
            </div>
            <div className="flex-1 bg-amber-500/30 rounded-t" style={{ height: '70%' }}>
              <div className="text-[10px] text-amber-400 text-center mt-1">PB+</div>
            </div>
            <div className="flex-1 bg-gray-500/30 rounded-t" style={{ height: '100%' }}>
              <div className="text-[10px] text-gray-400 text-center mt-1">EB+</div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-500">
            <span>Tier 0</span>
            <span>Tier 1</span>
            <span>Tier 2</span>
            <span>Tier 3</span>
          </div>
        </div>

        {/* Key Insight */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-400 mb-1">The Critical Insight</h4>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Tier 0 is NOT MinIO AIStor.</strong> It's raw block I/O — NVMe direct to GPU via GDS. 
                MinIO AIStor starts at Tier 1 (in-cluster operational S3) and scales through Tier 2 (capacity) to Tier 3 (archive). 
                The architecture is non-static by design — workloads float to the right tier based on latency and capacity needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {(selectedTier || selectedComponent) && (
        <DetailPanel
          tier={selectedTier}
          component={selectedComponent}
          onClose={handleClose}
        />
      )}

      {/* Lakehouse Modal */}
      {showLakehouseInfo && (
        <LakehouseModal onClose={() => setShowLakehouseInfo(false)} />
      )}

      {/* Legend */}
      <div className="bg-gray-800/50 border-t border-white/10 px-6 py-4">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-gray-400">Tier 0: NVMe Local Block (NOT MinIO AIStor)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-raspberry" />
            <span className="text-gray-400">Tier 1: NVMe Local PVC/S3 (MinIO AIStor)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-gray-400">Tier 2: RDMA/S3 to NVMe 400GbE (MinIO AIStor)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500" />
            <span className="text-gray-400">Tier 3: Cold Archive (Compliance)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TierCardProps {
  tier: StorageTier
  isSelected: boolean
  isHighlighted: boolean
  isDimmed: boolean
  onClick: () => void
  onComponentClick: (comp: ComponentInfo) => void
}

function TierCard({ tier, isSelected, isHighlighted, isDimmed, onClick, onComponentClick }: TierCardProps) {
  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'border-white/50 shadow-lg scale-[1.02]'
          : isHighlighted
            ? 'border-white/40 shadow-lg scale-[1.02]'
            : isDimmed
              ? 'border-white/5 opacity-30 scale-[0.98]'
              : 'border-white/10 hover:border-white/30'
      }`}
      style={{ 
        background: `linear-gradient(135deg, ${tier.color}${isHighlighted ? '25' : '15'} 0%, transparent 100%)`,
        borderColor: isSelected ? tier.color : isHighlighted ? `${tier.color}90` : undefined,
        boxShadow: isHighlighted ? `0 0 20px ${tier.color}30` : undefined,
      }}
      onClick={onClick}
    >
      {/* Highlight glow ring when software pill targets this tier */}
      {isHighlighted && (
        <div
          className="absolute -inset-1 rounded-xl opacity-25 animate-pulse pointer-events-none"
          style={{ backgroundColor: tier.color }}
        />
      )}
      {/* Header - More breathing room */}
      <div className="p-4 lg:p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span
            className="px-2 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: `${tier.color}30`, color: tier.color }}
          >
            TIER {tier.tier}
          </span>
          {!tier.isMinIO && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
              NOT MinIO AIStor
            </span>
          )}
          {tier.isMinIO && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-raspberry/20 text-raspberry">
              MinIO AIStor
            </span>
          )}
        </div>
        
        <h4 className="text-white font-bold text-base lg:text-lg leading-tight">{tier.name}</h4>
        <p className="text-gray-400 text-sm mt-1">{tier.subtitle}</p>
        
        <div className="flex flex-wrap items-center gap-3 lg:gap-4 mt-4 text-xs">
          <div>
            <span className="text-gray-500">Capacity:</span>
            <span className="text-white font-semibold ml-1">{tier.capacity}</span>
          </div>
          <div>
            <span className="text-gray-500">Latency:</span>
            <span className="font-semibold ml-1" style={{ color: tier.color }}>{tier.latency}</span>
          </div>
        </div>
      </div>

      {/* Components */}
      <div className="p-4 space-y-2">
        {tier.components.map((comp) => (
          <button
            key={comp.id}
            onClick={(e) => {
              e.stopPropagation()
              onComponentClick(comp)
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-white font-medium leading-snug">{comp.shortName}</span>
              <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{comp.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

interface DetailPanelProps {
  tier: StorageTier | null
  component: ComponentInfo | null
  onClose: () => void
}

function DetailPanel({ tier, component, onClose }: DetailPanelProps) {
  if (!tier) return null

  return (
    <div className="border-t border-white/10 bg-gray-900/80 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{ backgroundColor: `${tier.color}30`, color: tier.color }}
              >
                TIER {tier.tier}
              </span>
              {!tier.isMinIO && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                  NOT OBJECT STORAGE
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white">
              {component ? component.name : tier.name}
            </h3>
            <p className="text-gray-400 mt-1">
              {component ? component.description : tier.description}
            </p>
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

        {component ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Storage Use</h4>
              <p className="text-white">{component.storageUse}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">I/O Pattern</h4>
              <p className="text-white">{component.ioPattern}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Key Details</h4>
              <ul className="space-y-2">
                {tier.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tier.color }}
                    />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Access Method</h4>
              <code className="block text-sm bg-gray-900 text-raspberry-light px-3 py-2 rounded-lg font-mono">
                {tier.accessMethod}
              </code>
              
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mt-4 mb-3">Capacity</h4>
              <div className="text-2xl font-bold" style={{ color: tier.color }}>{tier.capacity}</div>
              
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mt-4 mb-3">Latency Target</h4>
              <div className="text-2xl font-bold" style={{ color: tier.color }}>{tier.latency}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FlowIndicator({ direction, label, color }: { direction: 'left' | 'right'; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      {direction === 'left' && (
        <svg className="w-4 h-4" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      )}
      <span className="text-xs text-gray-400">{label}</span>
      {direction === 'right' && (
        <svg className="w-4 h-4" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      )}
    </div>
  )
}

function LakehouseModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Data Lake vs Data Lakehouse</h3>
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
          {/* The Swamp */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
            <h4 className="text-lg font-bold text-red-400 mb-3">
              Approach 1: "The Swamp Evolution" 🏚️
            </h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-red-400 font-semibold mb-1">DATA LAKE (The Swamp)</div>
                <ul className="space-y-1 text-gray-400">
                  <li>• Raw files dumped in S3 — Parquet, CSV, JSON chaos</li>
                  <li>• No schema, no ACID, no governance</li>
                  <li>• "Data Swamp" — nobody knows what's in there</li>
                </ul>
              </div>
              <div className="text-center text-gray-500">↓ Years later... ↓</div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-amber-400 font-semibold mb-1">DATA LAKEHOUSE (Bolted On)</div>
                <ul className="space-y-1 text-gray-400">
                  <li>• Iceberg/Delta/Hudi table format ADDED on top</li>
                  <li>• Now you have schema, ACID, time travel</li>
                  <li>• <span className="text-red-400">But the swamp is still underneath</span></li>
                  <li>• Retrofitted governance, migration pain</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Born Clean */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
            <h4 className="text-lg font-bold text-emerald-400 mb-3">
              Approach 2: "Born Clean" ✨
            </h4>
            <div className="bg-gray-800/50 rounded-lg p-3 text-sm">
              <div className="text-emerald-400 font-semibold mb-2">DATA LAKEHOUSE (Native)</div>
              <ul className="space-y-1 text-gray-300">
                <li>• Start fresh with S3 Tables (Iceberg/Hudi/Delta)</li>
                <li>• Schema-on-write from day 1</li>
                <li>• ACID transactions, time travel, governance BUILT IN</li>
                <li>• <span className="text-emerald-400 font-semibold">No swamp — just structured medallion</span></li>
                <li>• MinIO S3 Tables = born-clean lakehouse</li>
              </ul>
            </div>
          </div>

          {/* MinIO S3 Tables */}
          <div className="bg-raspberry/10 border border-raspberry/30 rounded-xl p-5">
            <h4 className="text-lg font-bold text-raspberry mb-3">
              MinIO S3 Tables — The Best of Both Worlds
            </h4>
            <p className="text-sm text-gray-300 mb-3">
              MinIO AIStor now supports <strong className="text-white">S3 Tables</strong> — native Iceberg, Hudi, and Delta Sharing 
              support for on-prem data. Databricks Validated.
            </p>
            <div className="bg-gray-800/50 rounded-lg p-3 text-sm font-mono text-raspberry-light">
              On-Prem MinIO AIStor<br/>
              → S3 Tables (Iceberg)<br/>
              → Delta Sharing<br/>
              → Databricks Unity (AWS)<br/>
              <span className="text-emerald-400">→ ZERO COPY — data never leaves MinIO AIStor</span>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="text-sm text-gray-400">
            <strong className="text-white">Bottom Line:</strong> If you're starting new, go Lakehouse-native. 
            If you inherited a swamp, S3 Tables lets you add structure without ripping everything out.
          </div>
        </div>
      </div>
    </div>
  )
}
