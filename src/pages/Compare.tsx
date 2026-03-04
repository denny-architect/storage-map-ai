import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, BottomLine } from '../components/PipelineDiagram'

// =============================================================================
// TYPES
// =============================================================================

type Role = 'primary' | 'buffered' | 'burst' | 'not-in-path' | 'varies'
type Tier = 0 | 1 | 2 | 3

interface PhaseDetail {
  role: Role
  short: string
  detail: string
  tier: Tier | Tier[]
  apps: string[]
  s3Path: string
  ioProfile: string
  volume: string
  minioFeature: string
}

interface WorkloadSummary {
  key: string
  label: string
  color: string
  bgColor: string
  borderColor: string
  intensity: string
  intensityPct: number
  nodeCount: number
  description: string
  keyInsight: string
  hotPath: string
  peakThroughput: string
  dataScale: string
}

// =============================================================================
// THE COMPARISON MATRIX — Every cell has tier, apps, S3 path, I/O profile
// =============================================================================

const phases = [
  'Data Ingestion',
  'Data Processing',
  'Active Compute Loop',
  'Checkpointing',
  'Model / Artifact Registry',
  'Observability & Logging',
  'Feedback / Iteration Loop',
] as const

type Phase = typeof phases[number]

const matrix: Record<Phase, Record<string, PhaseDetail>> = {
  'Data Ingestion': {
    training: {
      role: 'primary',
      short: 'PB-scale writes',
      detail: 'Web scrapes, Common Crawl, domain corpora — petabytes of unstructured data land in the Bronze layer of the Lakehouse.',
      tier: 2,
      apps: ['Spark', 'Airflow'],
      s3Path: 's3://data-lake/raw/common-crawl/',
      ioProfile: 'Sequential writes, 10-50 GB/s ingestion',
      volume: 'Petabytes',
      minioFeature: '165 GiB/s PUT throughput on 32-node cluster',
    },
    rag: {
      role: 'primary',
      short: 'Continuous ingestion',
      detail: 'Documents arrive continuously — PDFs, APIs, web pages. Object storage is the canonical source of truth, event notifications trigger pipelines.',
      tier: 2,
      apps: ['LangChain', 'LlamaIndex'],
      s3Path: 's3://rag-source/documents/',
      ioProfile: 'Continuous small-medium writes',
      volume: 'GBs to TBs',
      minioFeature: 'Event notifications auto-trigger ingestion on new object upload',
    },
    fineTuning: {
      role: 'primary',
      short: 'Small datasets (GB)',
      detail: 'Curated instruction/response pairs in JSONL format. Thousands to millions of examples — not trillions of tokens. Quality > quantity.',
      tier: 2,
      apps: ['Custom curation'],
      s3Path: 's3://finetune-data/customer-support-v2/train.jsonl',
      ioProfile: 'Small-medium writes during curation',
      volume: 'MBs to GBs',
      minioFeature: 'Object versioning preserves every dataset iteration',
    },
    inference: {
      role: 'not-in-path',
      short: 'N/A',
      detail: 'Inference does not ingest raw training data. The model weights already encode the knowledge from training.',
      tier: [],
      apps: [],
      s3Path: '—',
      ioProfile: 'None',
      volume: '—',
      minioFeature: '—',
    },
  },

  'Data Processing': {
    training: {
      role: 'primary',
      short: 'ELT Medallion (TB/job)',
      detail: 'Spark transforms raw data through Bronze → Silver → Gold via Iceberg tables. Each layer is a full read-write cycle. Deduplication removes 30-50%.',
      tier: [0, 2],
      apps: ['Spark', 'Iceberg', 'Polars'],
      s3Path: 's3://lakehouse/bronze/ → silver/ → gold/',
      ioProfile: 'Batch R/W cycles, TB-scale per job',
      volume: 'Terabytes per ELT stage',
      minioFeature: 'S3 Tables (Iceberg) — ACID, time travel, schema evolution',
    },
    rag: {
      role: 'primary',
      short: 'Chunking + Embedding',
      detail: 'Documents split into 512-2048 token chunks, cleaned, embedded into 768-1536 dim vectors via embedding model, stored in vector DB.',
      tier: [0, 1, 2],
      apps: ['Weaviate', 'Sentence Transformers'],
      s3Path: 's3://rag-processed/chunks/doc-{id}-chunk-{N}.json',
      ioProfile: 'Read source → Write chunks → Write vectors',
      volume: 'Millions of chunk objects',
      minioFeature: 'S3 Select — server-side filtering, 80%+ bandwidth reduction',
    },
    fineTuning: {
      role: 'not-in-path',
      short: 'Pre-curated',
      detail: 'Fine-tuning data is curated offline. No Medallion pipeline or ELT — datasets arrive ready to use. The "processing" is human curation.',
      tier: [],
      apps: [],
      s3Path: '—',
      ioProfile: 'None — datasets pre-curated',
      volume: '—',
      minioFeature: '—',
    },
    inference: {
      role: 'not-in-path',
      short: 'N/A',
      detail: 'Inference does not process raw data. It serves a finished model.',
      tier: [],
      apps: [],
      s3Path: '—',
      ioProfile: 'None',
      volume: '—',
      minioFeature: '—',
    },
  },

  'Active Compute Loop': {
    training: {
      role: 'buffered',
      short: 'Streaming 325 GiB/s',
      detail: 'PyTorch DataLoader streams tokenized shards from Hot S3 (Tier 1) with multi-worker prefetch. GPU training loop runs in VRAM — no storage I/O during forward/backward pass.',
      tier: [0, 1],
      apps: ['PyTorch DataLoader', 'Ray'],
      s3Path: 's3://lakehouse/gold/tokenized-shards/',
      ioProfile: 'Sequential reads w/ prefetch, 325 GiB/s',
      volume: 'Continuous stream',
      minioFeature: '325 GiB/s GET — keeps 1000-GPU clusters fed',
    },
    rag: {
      role: 'varies',
      short: 'Arch-dependent',
      detail: 'Vector search runs in Weaviate (Tier 0 — local NVMe HNSW). LLM generation is GPU-only. If chunks fetched from S3 at query time, storage is in hot path.',
      tier: 0,
      apps: ['Weaviate', 'vLLM'],
      s3Path: 'Weaviate PVC (Tier 0 block)',
      ioProfile: 'Random reads, <500μs HNSW lookups',
      volume: 'Per-query (ms-scale)',
      minioFeature: 'Weaviate S3 backup/restore for disaster recovery',
    },
    fineTuning: {
      role: 'buffered',
      short: 'Streaming reads',
      detail: 'Same DataLoader pattern as training but dramatically smaller scale. Frozen base model + LoRA adapters trained on <1% of parameters. Hours, not weeks.',
      tier: [0, 1],
      apps: ['PyTorch + PEFT/LoRA'],
      s3Path: 's3://finetune-data/customer-support-v2/train.jsonl',
      ioProfile: 'Sequential reads (small dataset)',
      volume: 'MBs to GBs',
      minioFeature: 'Fast single-object read for small datasets',
    },
    inference: {
      role: 'not-in-path',
      short: 'NOT IN PATH',
      detail: 'Forward pass is pure GPU compute. Weights in VRAM, KV cache in VRAM. Autoregressive generation — no storage I/O per token. This is the honest truth.',
      tier: 0,
      apps: ['vLLM', 'Triton'],
      s3Path: '— (GPU VRAM only)',
      ioProfile: 'None — compute-bound',
      volume: 'Weights resident in VRAM',
      minioFeature: '— Storage not involved during generation',
    },
  },

  'Checkpointing': {
    training: {
      role: 'primary',
      short: '500GB-1TB writes',
      detail: 'Full model state (weights + Adam optimizer momentum + variance) saved every N steps. Your disaster recovery. A failed checkpoint during multi-week run = days of lost GPU time.',
      tier: 2,
      apps: ['PyTorch DCP', 'DeepSpeed'],
      s3Path: 's3://training-checkpoints/{run-id}/step-{N}/',
      ioProfile: 'Bursty large sequential writes',
      volume: '500GB-1TB per checkpoint (70B model)',
      minioFeature: 'Erasure coding ensures checkpoint durability across drive failures',
    },
    rag: {
      role: 'not-in-path',
      short: '—',
      detail: 'RAG does not train a model, so there are no model checkpoints. Weaviate snapshots are a separate backup operation.',
      tier: [],
      apps: [],
      s3Path: '—',
      ioProfile: 'None',
      volume: '—',
      minioFeature: '—',
    },
    fineTuning: {
      role: 'primary',
      short: '~100MB adapters',
      detail: 'Only LoRA adapter weights saved — ~50-500MB per checkpoint vs 500GB+ for full training. 1,000-5,000x smaller. Same S3 pattern, dramatically different scale.',
      tier: 2,
      apps: ['PEFT', 'MLflow'],
      s3Path: 's3://finetune-checkpoints/{dataset}/epoch-{N}/adapter_model.bin',
      ioProfile: 'Small sequential writes',
      volume: '~50-500 MB per checkpoint',
      minioFeature: 'Object versioning tracks every adapter iteration',
    },
    inference: {
      role: 'not-in-path',
      short: '—',
      detail: 'Inference does not modify weights — nothing to checkpoint. The model is read-only at serving time.',
      tier: [],
      apps: [],
      s3Path: '—',
      ioProfile: 'None',
      volume: '—',
      minioFeature: '—',
    },
  },

  'Model / Artifact Registry': {
    training: {
      role: 'primary',
      short: 'Export destination',
      detail: 'Final trained model exported as safetensors to Model Registry. Versioned, immutable artifact. Source of truth for what gets deployed.',
      tier: 2,
      apps: ['MLflow', 'Kubeflow'],
      s3Path: 's3://model-registry/{model}/{version}/model.safetensors',
      ioProfile: 'Large sequential write, versioned',
      volume: '100s GB per model',
      minioFeature: 'S3 versioning + Object Lock for immutable model artifacts',
    },
    rag: {
      role: 'not-in-path',
      short: '—',
      detail: 'RAG uses existing models but does not produce new model artifacts. The embedding model is loaded from registry but not modified.',
      tier: [],
      apps: [],
      s3Path: '—',
      ioProfile: 'None (consumer, not producer)',
      volume: '—',
      minioFeature: '—',
    },
    fineTuning: {
      role: 'primary',
      short: 'Adapter versioning',
      detail: 'LoRA adapters versioned independently from base models. Same base, multiple domain-specific adapters. Clear lineage: /llama-3-8b/adapters/customer-support-v2/',
      tier: [1, 2],
      apps: ['MLflow', 'PEFT'],
      s3Path: 's3://model-registry/{model}/adapters/{adapter-name}/{version}/',
      ioProfile: 'Small sequential writes, read-heavy retrieval',
      volume: '~50-500 MB per adapter',
      minioFeature: 'Prefix-based namespace enables adapter discovery and lifecycle',
    },
    inference: {
      role: 'burst',
      short: 'Burst read source',
      detail: 'Model weights pulled on cold start, scale-out, or updates. LoRA adapters hot-swapped per request or tenant. Registry is source of truth for what\'s deployed.',
      tier: [1, 2],
      apps: ['vLLM', 'Triton', 'KServe'],
      s3Path: 's3://model-registry/llama-3-70b/v1.0/model.safetensors',
      ioProfile: 'Large burst read (model) + small reads (adapters)',
      volume: '16-140 GB models, 50-500 MB adapters',
      minioFeature: 'Distributed DRAM cache — sub-second adapter swaps',
    },
  },

  'Observability & Logging': {
    training: {
      role: 'primary',
      short: 'Training metrics',
      detail: 'MLflow logs loss curves, learning rate, gradient norms, artifacts. TensorBoard event files. Continuous small writes throughout training.',
      tier: 1,
      apps: ['MLflow', 'TensorBoard', 'W&B'],
      s3Path: 's3://mlflow-artifacts/experiment-{id}/run-{id}/',
      ioProfile: 'Continuous small-medium writes',
      volume: 'GBs per experiment',
      minioFeature: 'MLflow artifact backend on MinIO AIStor',
    },
    rag: {
      role: 'primary',
      short: 'Query logs',
      detail: 'Retrieved chunks, relevance scores, latency metrics. Essential for debugging retrieval quality and optimizing chunk strategy.',
      tier: [1, 2],
      apps: ['LangSmith', 'Custom'],
      s3Path: 's3://rag-logs/queries/',
      ioProfile: 'Continuous small writes',
      volume: 'GBs over time',
      minioFeature: 'Event notifications for real-time quality monitoring',
    },
    fineTuning: {
      role: 'primary',
      short: 'Adapter metrics',
      detail: 'Same as training but smaller scale. Validation loss, adapter convergence, eval metrics. Experiment comparison across adapter iterations.',
      tier: 1,
      apps: ['MLflow', 'W&B'],
      s3Path: 's3://mlflow-artifacts/finetune-{id}/',
      ioProfile: 'Continuous small writes',
      volume: 'MBs to GBs',
      minioFeature: 'MLflow artifact backend — compare adapter experiments',
    },
    inference: {
      role: 'primary',
      short: 'Request/response logs',
      detail: 'Every interaction logged: prompts, completions, token counts, latency, errors. Compliance mandates durable retention. Terabytes at scale.',
      tier: [2, 3],
      apps: ['Prometheus', 'Grafana', 'Custom'],
      s3Path: 's3://inference-logs/{YYYY-MM}/{DD}/requests.parquet',
      ioProfile: 'Continuous small writes (async)',
      volume: 'Terabytes over time',
      minioFeature: 'ILM auto-tiers old logs to Tier 3 archive',
    },
  },

  'Feedback / Iteration Loop': {
    training: {
      role: 'not-in-path',
      short: '—',
      detail: 'Pre-training is a one-shot process — no direct feedback loop. The dataset is fixed for the duration of a training run.',
      tier: [],
      apps: [],
      s3Path: '—',
      ioProfile: 'None',
      volume: '—',
      minioFeature: '—',
    },
    rag: {
      role: 'primary',
      short: 'Corpus updates',
      detail: 'New documents trigger re-embedding. Relevance feedback improves chunking strategy. The RAG pipeline is inherently iterative — corpus freshness is critical.',
      tier: 2,
      apps: ['LangChain', 'Custom'],
      s3Path: 's3://rag-source/ (updated documents)',
      ioProfile: 'Triggered writes on document updates',
      volume: 'Varies',
      minioFeature: 'S3 event notifications trigger re-ingestion automatically',
    },
    fineTuning: {
      role: 'primary',
      short: 'RLHF → new adapter',
      detail: 'User feedback from inference feeds back into fine-tuning via RLHF/DPO. Preference pairs become training data for the next adapter iteration.',
      tier: 2,
      apps: ['TRL', 'Custom RLHF'],
      s3Path: 's3://feedback-data/rlhf/preference-pairs/',
      ioProfile: 'Batch reads of feedback data',
      volume: 'GBs',
      minioFeature: 'Object versioning tracks feedback dataset evolution',
    },
    inference: {
      role: 'primary',
      short: 'User feedback → RLHF',
      detail: 'Thumbs up/down, corrections, preference pairs. Stored durably, batched for fine-tuning. Closes the loop: Inference → Feedback → Fine-Tuning → New Adapter → Inference.',
      tier: 2,
      apps: ['Custom feedback API'],
      s3Path: 's3://feedback-data/rlhf/preference-pairs/batch-{date}.jsonl',
      ioProfile: 'Small writes (feedback), batch reads (training)',
      volume: 'GBs over time',
      minioFeature: 'Object Lock for immutable feedback audit trails',
    },
  },
}

// =============================================================================
// WORKLOAD SUMMARIES (for top banner)
// =============================================================================

const workloadSummaries: WorkloadSummary[] = [
  {
    key: 'training',
    label: 'Training',
    color: 'text-raspberry',
    bgColor: 'bg-raspberry',
    borderColor: 'border-raspberry',
    intensity: 'Critical Path',
    intensityPct: 100,
    nodeCount: 8,
    description: 'Pre-training from petabytes of raw data. Storage in every phase.',
    keyInsight: 'Storage throughput = GPU utilization. Every GB/s of storage throughput lost is $30-50/min burned on idle GPUs (1000-GPU cluster).',
    hotPath: 'Yes — throughput-sensitive end-to-end',
    peakThroughput: '325 GiB/s DataLoader reads',
    dataScale: 'Petabytes in, terabytes of checkpoints',
  },
  {
    key: 'rag',
    label: 'RAG',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-500',
    intensity: 'Architecture-Dependent',
    intensityPct: 75,
    nodeCount: 8,
    description: 'Retrieval-augmented generation. Storage owns ingestion; query path varies.',
    keyInsight: 'Whether storage is in the query hot path depends on your architecture: inline S3, pointer-based retrieval, or Weaviate with S3 backup.',
    hotPath: 'Depends on retrieval architecture',
    peakThroughput: 'Varies — query path may bypass S3',
    dataScale: 'GBs-TBs corpus, millions of vectors',
  },
  {
    key: 'fineTuning',
    label: 'Fine-Tuning',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    intensity: 'Medium',
    intensityPct: 45,
    nodeCount: 6,
    description: 'LoRA/QLoRA — same patterns as training at 1,000-5,000x smaller scale.',
    keyInsight: 'LoRA adapter ~100MB vs full checkpoint ~500GB. Same S3 patterns, dramatically different scale. Adapter versioning is the killer feature.',
    hotPath: 'Possibly (adapter swap at inference)',
    peakThroughput: 'Burst model load (16-140 GB)',
    dataScale: 'MBs datasets, MBs adapters',
  },
  {
    key: 'inference',
    label: 'Inference',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500',
    intensity: 'Bookends Only',
    intensityPct: 20,
    nodeCount: 6,
    description: 'Model serving. Storage at the bookends — NOT in the generation loop.',
    keyInsight: 'Token generation is 100% GPU VRAM. Storage loads the model, logs results, collects feedback, swaps adapters — but not during the forward pass.',
    hotPath: 'Only at cold start / adapter swap',
    peakThroughput: '10+ GB/s model load target',
    dataScale: '16-140 GB model, MBs adapters',
  },
]

// =============================================================================
// STYLE CONFIGS
// =============================================================================

const roleConfig: Record<Role, { bg: string; text: string; label: string; dot: string }> = {
  'primary':     { bg: 'bg-gradient-to-r from-raspberry to-raspberry-dark', text: 'text-white', label: 'Primary', dot: 'bg-raspberry' },
  'buffered':    { bg: 'bg-gradient-to-r from-amber-500 to-orange-500',     text: 'text-white', label: 'Buffered', dot: 'bg-amber-500' },
  'burst':       { bg: 'bg-gradient-to-r from-blue-500 to-blue-600',        text: 'text-white', label: 'Burst', dot: 'bg-blue-500' },
  'not-in-path': { bg: 'bg-gradient-to-r from-gray-300 to-gray-400',        text: 'text-white', label: 'Not In Path', dot: 'bg-gray-400' },
  'varies':      { bg: 'bg-gradient-to-r from-purple-500 to-purple-600',    text: 'text-white', label: 'Varies', dot: 'bg-purple-500' },
}

const tierColors: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: 'bg-emerald-500',  text: 'text-emerald-700', label: 'T0 NVMe Block' },
  1: { bg: 'bg-raspberry',    text: 'text-raspberry',   label: 'T1 Hot S3' },
  2: { bg: 'bg-amber-500',    text: 'text-amber-600',   label: 'T2 Warm S3' },
  3: { bg: 'bg-gray-500',     text: 'text-gray-600',    label: 'T3 Archive' },
}

const workloads = [
  { key: 'training',    label: 'Training',    color: 'text-raspberry' },
  { key: 'rag',         label: 'RAG',         color: 'text-amber-600' },
  { key: 'fineTuning',  label: 'Fine-Tuning', color: 'text-blue-600' },
  { key: 'inference',   label: 'Inference',   color: 'text-emerald-600' },
]

// =============================================================================
// VIEW TYPES
// =============================================================================

type ViewMode = 'matrix' | 'tier-heatmap' | 'lifecycle'

// =============================================================================
// COMPONENT
// =============================================================================

export default function Compare() {
  const [selectedCell, setSelectedCell] = useState<{ phase: Phase; workload: string } | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('matrix')

  const getSelectedData = (): PhaseDetail | null => {
    if (!selectedCell) return null
    const wk = selectedCell.workload as keyof typeof matrix[Phase]
    return matrix[selectedCell.phase]?.[wk] || null
  }

  const selectedData = getSelectedData()

  return (
    <div>
      <PageHeader
        title="Cross-Pipeline Comparison"
        subtitle="The Complete Picture"
        description="Every phase, every tier, every workload — side by side. This is where storage, training, RAG, fine-tuning, and inference converge into one authoritative view."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ============================================================= */}
        {/* WORKLOAD SCORECARDS                                           */}
        {/* ============================================================= */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Workload Scorecards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {workloadSummaries.map((ws) => (
              <div
                key={ws.key}
                className={`bg-white rounded-2xl border-2 ${ws.borderColor}/30 p-5 hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-bold ${ws.color}`}>{ws.label}</h3>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${ws.bgColor} text-white`}>
                    {ws.intensity}
                  </span>
                </div>

                {/* Storage intensity bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Storage Intensity</span>
                    <span className="font-semibold">{ws.intensityPct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ws.bgColor}`}
                      style={{ width: `${ws.intensityPct}%` }}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{ws.description}</p>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pipeline Nodes</span>
                    <span className="font-semibold text-gray-900">{ws.nodeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hot Path?</span>
                    <span className="font-semibold text-gray-900">{ws.hotPath}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Peak Throughput</span>
                    <span className="font-semibold text-gray-900">{ws.peakThroughput}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Data Scale</span>
                    <span className="font-semibold text-gray-900">{ws.dataScale}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 italic leading-relaxed">{ws.keyInsight}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================= */}
        {/* VIEW SELECTOR                                                 */}
        {/* ============================================================= */}
        <section className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-700">View:</span>
            {[
              { id: 'matrix' as ViewMode,       label: 'Storage Role Matrix',    desc: 'Role per phase per workload' },
              { id: 'tier-heatmap' as ViewMode,  label: 'Tier Heatmap',          desc: 'Which tier each phase hits' },
              { id: 'lifecycle' as ViewMode,      label: 'I/O Profile Summary',   desc: 'Volume, throughput, patterns' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  viewMode === v.id
                    ? 'bg-raspberry text-white shadow-lg shadow-raspberry/30'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-raspberry/30 hover:bg-raspberry/5'
                }`}
              >
                <span className="block font-semibold">{v.label}</span>
                <span className="block text-[10px] opacity-70 mt-0.5">{v.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ============================================================= */}
        {/* LEGEND                                                        */}
        {/* ============================================================= */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              {viewMode !== 'tier-heatmap' ? (
                <>
                  <span className="text-sm font-bold text-gray-700">Storage Role:</span>
                  {Object.entries(roleConfig).map(([role, config]) => (
                    <div key={role} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${config.dot}`} />
                      <span className="text-sm text-gray-600">{config.label}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-gray-700">Storage Tier:</span>
                  {Object.entries(tierColors).map(([tier, config]) => (
                    <div key={tier} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                      <span className="text-sm text-gray-600">{config.label}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* MAIN VIEW: MATRIX                                             */}
        {/* ============================================================= */}
        {viewMode === 'matrix' && (
          <section className="mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                      <th className="px-5 py-4 text-left text-sm font-bold text-gray-900 w-48">Phase</th>
                      {workloads.map((wl) => (
                        <th key={wl.key} className="px-5 py-4 text-center">
                          <Link
                            to="/explorer"
                            className={`text-sm font-bold ${wl.color} hover:underline transition-colors flex items-center justify-center gap-1.5`}
                          >
                            {wl.label}
                            <svg className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {phases.map((phase) => (
                      <tr key={phase} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">{phase}</td>
                        {workloads.map((wl) => {
                          const cell = matrix[phase][wl.key]
                          const config = roleConfig[cell.role]
                          const isSelected = selectedCell?.phase === phase && selectedCell?.workload === wl.key
                          return (
                            <td key={wl.key} className="px-3 py-2.5">
                              <button
                                onClick={() => setSelectedCell({ phase, workload: wl.key })}
                                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${config.bg} ${config.text} hover:shadow-lg hover:scale-[1.03] ${
                                  isSelected ? 'ring-2 ring-offset-2 ring-gray-900 scale-105' : ''
                                }`}
                              >
                                {cell.short}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* MAIN VIEW: TIER HEATMAP                                       */}
        {/* ============================================================= */}
        {viewMode === 'tier-heatmap' && (
          <section className="mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                      <th className="px-5 py-4 text-left text-sm font-bold text-gray-900 w-48">Phase</th>
                      {workloads.map((wl) => (
                        <th key={wl.key} className={`px-5 py-4 text-center text-sm font-bold ${wl.color}`}>
                          {wl.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {phases.map((phase) => (
                      <tr key={phase} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">{phase}</td>
                        {workloads.map((wl) => {
                          const cell = matrix[phase][wl.key]
                          const tiers = Array.isArray(cell.tier) ? cell.tier : (cell.tier !== undefined && cell.role !== 'not-in-path' ? [cell.tier] : [])
                          return (
                            <td key={wl.key} className="px-3 py-2.5">
                              {tiers.length > 0 ? (
                                <div className="flex justify-center gap-1.5">
                                  {(tiers as Tier[]).map((t) => (
                                    <span
                                      key={t}
                                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-white ${tierColors[t].bg}`}
                                    >
                                      T{t}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-xs text-gray-400">—</div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tier Summary Counts */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {workloads.map((wl) => {
                const tierCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
                phases.forEach((phase) => {
                  const cell = matrix[phase][wl.key]
                  const tiers = Array.isArray(cell.tier) ? cell.tier : (cell.role !== 'not-in-path' && cell.tier !== undefined ? [cell.tier] : [])
                  ;(tiers as number[]).forEach((t) => tierCounts[t]++)
                })
                return (
                  <div key={wl.key} className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className={`text-sm font-bold ${wl.color} mb-3`}>{wl.label}</h4>
                    <div className="space-y-1.5">
                      {[0, 1, 2, 3].map((t) => (
                        <div key={t} className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center ${tierColors[t].bg}`}>
                            T{t}
                          </span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${tierColors[t].bg}`}
                              style={{ width: `${(tierCounts[t] / phases.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-6 text-right">{tierCounts[t]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* MAIN VIEW: I/O PROFILE LIFECYCLE                              */}
        {/* ============================================================= */}
        {viewMode === 'lifecycle' && (
          <section className="mb-8 space-y-6">
            {workloads.map((wl) => (
              <div key={wl.key} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className={`px-5 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white`}>
                  <h3 className={`text-base font-bold ${wl.color}`}>{wl.label} — I/O Profile by Phase</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="px-5 py-2.5">Phase</th>
                        <th className="px-5 py-2.5">I/O Pattern</th>
                        <th className="px-5 py-2.5">Volume</th>
                        <th className="px-5 py-2.5">S3 Path</th>
                        <th className="px-5 py-2.5">Tier</th>
                        <th className="px-5 py-2.5">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {phases.map((phase) => {
                        const cell = matrix[phase][wl.key]
                        const tiers = Array.isArray(cell.tier) ? cell.tier : (cell.role !== 'not-in-path' && cell.tier !== undefined ? [cell.tier] : [])
                        return (
                          <tr
                            key={phase}
                            className={`hover:bg-gray-50/50 transition-colors ${cell.role === 'not-in-path' ? 'opacity-50' : ''}`}
                          >
                            <td className="px-5 py-2.5 font-medium text-gray-900 whitespace-nowrap">{phase}</td>
                            <td className="px-5 py-2.5 text-gray-600">{cell.ioProfile}</td>
                            <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">{cell.volume}</td>
                            <td className="px-5 py-2.5">
                              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 break-all">
                                {cell.s3Path}
                              </code>
                            </td>
                            <td className="px-5 py-2.5">
                              <div className="flex gap-1">
                                {(tiers as number[]).map((t) => (
                                  <span key={t} className={`w-6 h-6 rounded text-[10px] font-bold text-white flex items-center justify-center ${tierColors[t].bg}`}>
                                    T{t}
                                  </span>
                                ))}
                                {tiers.length === 0 && <span className="text-gray-400">—</span>}
                              </div>
                            </td>
                            <td className="px-5 py-2.5">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${roleConfig[cell.role].bg} ${roleConfig[cell.role].text}`}>
                                {roleConfig[cell.role].label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ============================================================= */}
        {/* DETAIL PANEL (click any matrix/heatmap cell)                   */}
        {/* ============================================================= */}
        {selectedCell && selectedData ? (
          <section className="mb-8 animate-scale-in">
            <div className="bg-white rounded-2xl border-2 border-raspberry/30 p-6 shadow-lg shadow-raspberry/10">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {selectedCell.phase} — {workloads.find(w => w.key === selectedCell.workload)?.label}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${roleConfig[selectedData.role].bg} ${roleConfig[selectedData.role].text}`}>
                      {roleConfig[selectedData.role].label}
                    </span>
                    {(Array.isArray(selectedData.tier) ? selectedData.tier : (selectedData.role !== 'not-in-path' && selectedData.tier !== undefined ? [selectedData.tier] : [])).map((t: number) => (
                      <span key={t} className={`inline-block px-2 py-1 text-xs font-bold rounded-full text-white ${tierColors[t].bg}`}>
                        Tier {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed mb-5">{selectedData.detail}</p>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">I/O Pattern</div>
                  <div className="text-sm font-medium text-gray-900">{selectedData.ioProfile}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Data Volume</div>
                  <div className="text-sm font-medium text-gray-900">{selectedData.volume}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Key Apps</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedData.apps.length > 0 ? selectedData.apps.map((app) => (
                      <span key={app} className="px-2 py-0.5 text-xs bg-gray-200 rounded-full text-gray-700 font-medium">{app}</span>
                    )) : <span className="text-sm text-gray-400">—</span>}
                  </div>
                </div>
              </div>

              {/* S3 Path */}
              <div className="bg-gray-900 rounded-xl p-4 mb-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">S3 Path</div>
                <code className="text-sm text-emerald-400 font-mono break-all">{selectedData.s3Path}</code>
              </div>

              {/* MinIO AIStor Feature */}
              {selectedData.minioFeature !== '—' && (
                <div className="bg-raspberry/5 border border-raspberry/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-raspberry uppercase tracking-wider">MinIO AIStor Feature</span>
                  </div>
                  <p className="text-sm text-gray-700">{selectedData.minioFeature}</p>
                </div>
              )}
            </div>
          </section>
        ) : viewMode !== 'lifecycle' && (
          <section className="mb-8">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Click any cell in the table to see full details — S3 paths, I/O profiles, apps, and MinIO AIStor features.</p>
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/* THE LIFECYCLE — How workloads connect                          */}
        {/* ============================================================= */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">The Model Lifecycle</h2>
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="max-w-4xl mx-auto">
              {/* Circular flow */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center mb-8">
                {[
                  { label: 'Training', sub: 'Build the base model', color: 'from-raspberry to-raspberry-dark', arrow: true },
                  { label: 'Fine-Tuning', sub: 'Adapt with LoRA', color: 'from-blue-500 to-blue-600', arrow: true },
                  { label: 'Inference', sub: 'Serve + collect feedback', color: 'from-emerald-500 to-green-500', arrow: true },
                  { label: 'RAG', sub: 'Augment with external data', color: 'from-amber-500 to-orange-500', arrow: false },
                ].map((step, i) => (
                  <div key={step.label} className="relative">
                    <div className={`bg-gradient-to-br ${step.color} rounded-xl p-4 text-white`}>
                      <div className="text-sm font-bold">{step.label}</div>
                      <div className="text-xs opacity-75 mt-1">{step.sub}</div>
                    </div>
                    {step.arrow && i < 3 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-gray-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Feedback loop callout */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">The Feedback Loop</h4>
                    <p className="text-sm text-gray-400">
                      Inference feedback (RLHF preference pairs at{' '}
                      <code className="text-emerald-400 text-xs">s3://feedback-data/rlhf/</code>) flows back to Fine-Tuning as training data.
                      New LoRA adapters are exported to{' '}
                      <code className="text-emerald-400 text-xs">s3://model-registry/.../adapters/</code> and hot-swapped into Inference.
                      <strong className="text-white"> Object storage is the bus connecting every stage.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* KEY NUMBERS — The data that matters                           */}
        {/* ============================================================= */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Numbers at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { number: '325 GiB/s', label: 'DataLoader throughput', sub: 'Training — per node target', color: 'text-raspberry' },
              { number: '165 GiB/s', label: 'PUT throughput', sub: '32-node MinIO AIStor cluster', color: 'text-raspberry' },
              { number: '500GB-1TB', label: 'Per checkpoint', sub: 'Training — 70B model + optimizer', color: 'text-amber-500' },
              { number: '~100MB', label: 'LoRA adapter', sub: 'Fine-Tuning — 5,000x smaller', color: 'text-blue-500' },
              { number: '14 sec', label: 'Cold start @ 10GB/s', sub: 'Inference — 140GB model', color: 'text-emerald-500' },
              { number: '<500μs', label: 'HNSW lookup', sub: 'RAG — Weaviate on NVMe', color: 'text-purple-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.number}</div>
                <div className="text-xs font-semibold text-gray-900 mb-0.5">{stat.label}</div>
                <div className="text-[10px] text-gray-500">{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================= */}
        {/* STORAGE TIER USAGE ACROSS WORKLOADS                           */}
        {/* ============================================================= */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Storage Tier Usage by Workload</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Tier</th>
                    <th className="px-5 py-3">Spec</th>
                    <th className="px-5 py-3 text-raspberry">Training</th>
                    <th className="px-5 py-3 text-amber-600">RAG</th>
                    <th className="px-5 py-3 text-blue-600">Fine-Tuning</th>
                    <th className="px-5 py-3 text-emerald-600">Inference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    {
                      tier: 0, label: 'NVMe Block', spec: '<100μs, Node-Local',
                      training: 'Spark shuffle, GPU VRAM',
                      rag: 'Weaviate HNSW index',
                      fineTuning: 'GPU VRAM (LoRA)',
                      inference: 'vLLM KV cache, VRAM',
                    },
                    {
                      tier: 1, label: 'Hot S3', spec: '1-5ms, NVMe Local (PVC/S3)',
                      training: 'DataLoader streaming, MLflow',
                      rag: 'Embeddings cache',
                      fineTuning: 'Base model load, adapters',
                      inference: 'Model load, adapter swaps',
                    },
                    {
                      tier: 2, label: 'Warm S3', spec: '5-15ms, RDMA 400GbE',
                      training: 'Lakehouse, checkpoints, registry',
                      rag: 'Document store, corpus',
                      fineTuning: 'Datasets, checkpoints, registry',
                      inference: 'Model registry, logs, feedback',
                    },
                    {
                      tier: 3, label: 'Archive', spec: '15-50ms, 100GbE SSD',
                      training: 'Compliance archive',
                      rag: '—',
                      fineTuning: '—',
                      inference: 'Audit logs, TrustyAI',
                    },
                  ].map((row) => (
                    <tr key={row.tier} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-lg text-xs font-bold text-white flex items-center justify-center ${tierColors[row.tier].bg}`}>
                            T{row.tier}
                          </span>
                          <span className="font-semibold text-gray-900">{row.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{row.spec}</td>
                      <td className="px-5 py-3 text-gray-700">{row.training}</td>
                      <td className="px-5 py-3 text-gray-700">{row.rag}</td>
                      <td className="px-5 py-3 text-gray-700">{row.fineTuning}</td>
                      <td className="px-5 py-3 text-gray-700">{row.inference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ============================================================= */}
        {/* KEY TAKEAWAYS                                                 */}
        {/* ============================================================= */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Takeaways</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Training: Storage Is the Critical Path',
                description: 'From PB-scale ingestion through Medallion ELT, 325 GiB/s DataLoader streaming, TB-scale checkpoints, to model export — storage throughput directly impacts GPU utilization. Every idle GPU-minute costs $30-50 on a 1,000-GPU cluster.',
                gradient: 'from-raspberry to-raspberry-dark',
                shadow: 'shadow-raspberry/20',
              },
              {
                title: 'RAG: Architecture Determines Storage\'s Role',
                description: 'Storage always owns the ingestion pipeline (chunking, embedding, corpus management). Whether it\'s in the query hot path depends on architecture: Weaviate on local NVMe (Tier 0) vs. inline S3 retrieval. Design this deliberately.',
                gradient: 'from-amber-500 to-orange-500',
                shadow: 'shadow-amber-500/20',
              },
              {
                title: 'Fine-Tuning: Same Patterns, 5,000x Smaller',
                description: 'LoRA adapters are ~100MB vs 500GB full checkpoints. Same S3 patterns — datasets, registry, checkpoints — at dramatically smaller scale. The killer feature is adapter versioning: one base model, many domain adapters, hot-swappable at inference.',
                gradient: 'from-blue-500 to-blue-600',
                shadow: 'shadow-blue-500/20',
              },
              {
                title: 'Inference: Bookends + Audit Trail',
                description: 'Model loading, adapter swaps, request logging, feedback collection — but NOT during token generation. The forward pass is pure GPU compute with data in VRAM. Feedback closes the RLHF loop back to fine-tuning. Object storage is the bus.',
                gradient: 'from-emerald-500 to-green-500',
                shadow: 'shadow-emerald-500/20',
              },
            ].map((card, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg ${card.shadow}`}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================= */}
        {/* EXPLORE DEEPER                                                */}
        {/* ============================================================= */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-raspberry/5 via-raspberry/10 to-raspberry/5 rounded-2xl border-2 border-raspberry/20 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Explore Each Pipeline in Detail</h3>
                <p className="text-sm text-gray-600">
                  Interactive SVG diagrams with animated data flows, clickable nodes, S3 paths, and MinIO AIStor features for every pipeline.
                </p>
              </div>
              <Link
                to="/explorer"
                className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-raspberry to-raspberry-dark text-white font-semibold rounded-xl shadow-lg shadow-raspberry/30 hover:shadow-xl hover:shadow-raspberry/40 transition-all"
              >
                Open Explorer
              </Link>
            </div>
          </div>
        </section>

        <BottomLine>
          Object storage is in every pipeline, at every phase, for every workload — except the
          milliseconds where the GPU is doing matrix math during inference. Understanding these
          patterns across all four workloads lets you size the right tier (Tier 0-3), optimize for
          the right metric (throughput for training, latency for inference cold start, durability
          for checkpoints), and architect storage that scales from proof-of-concept to production.
          MinIO AIStor spans Tiers 1-3 — the complete storage foundation for AI infrastructure.
        </BottomLine>
      </div>
    </div>
  )
}
