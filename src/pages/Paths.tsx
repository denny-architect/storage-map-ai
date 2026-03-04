import { useState } from 'react'
import { PageHeader, BottomLine } from '../components/PipelineDiagram'

interface PathGroup {
  category: string
  description: string
  icon: React.ReactNode
  color: string
  tier: number | number[]
  storageFeature: string      // MinIO AIStor feature from whitepaper
  paperRef: string            // Whitepaper citation
  paths: {
    path: string
    purpose: string
    workloads: string[]
    ioProfile?: string        // I/O pattern
    volume?: string           // Data scale
  }[]
}

const pathGroups: PathGroup[] = [
  {
    category: 'Training Data (Lakehouse)',
    description: 'Medallion architecture — Bronze → Silver → Gold via Iceberg/Delta S3 Tables',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    color: 'from-raspberry to-raspberry-dark',
    tier: 2,
    storageFeature: 'S3 Tables (Iceberg) with ACID transactions, time travel, schema evolution; 165 GiB/s PUT on 32-node cluster',
    paperRef: 'Whitepaper: "S3 compatible" with Spark, Presto/Trino, Hive; supports Iceberg/Delta/Hudi table formats',
    paths: [
      { path: 's3://data-lake/raw/common-crawl/', purpose: 'Unprocessed Common Crawl data (Bronze layer)', workloads: ['Training'], ioProfile: 'Sequential writes', volume: 'Petabytes' },
      { path: 's3://data-lake/raw/proprietary/', purpose: 'Licensed and internal proprietary datasets', workloads: ['Training'], ioProfile: 'Batch writes', volume: 'TBs-PBs' },
      { path: 's3://data-lake/raw/web-scrapes/', purpose: 'Web-scraped text, images, structured data', workloads: ['Training'], ioProfile: 'Continuous writes', volume: 'TBs' },
      { path: 's3://lakehouse/bronze/{source}/{date}/', purpose: 'Raw ingested data — immutable landing zone', workloads: ['Training'], ioProfile: 'Write-once, read-many', volume: 'Petabytes' },
      { path: 's3://lakehouse/silver/cleaned-deduped/', purpose: 'Deduplicated and toxicity-filtered data (30-50% reduction)', workloads: ['Training'], ioProfile: 'Batch R/W', volume: 'Terabytes' },
      { path: 's3://lakehouse/gold/tokenized-shards/', purpose: 'Pre-tokenized shards ready for DataLoader (WebDataset/Mosaic)', workloads: ['Training'], ioProfile: 'Sequential reads at 325 GiB/s', volume: 'Terabytes' },
      { path: 's3://lakehouse/gold/tokenized-shards/shard-{00000..99999}.tar', purpose: 'Individual WebDataset shard files', workloads: ['Training'], ioProfile: 'Streaming reads', volume: 'GBs each' },
    ],
  },
  {
    category: 'Fine-Tuning Data',
    description: 'Curated datasets for domain adaptation via LoRA/QLoRA — quality over quantity',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'from-blue-500 to-blue-600',
    tier: 2,
    storageFeature: 'Object versioning preserves every dataset iteration; bucket notifications trigger retraining on new data',
    paperRef: 'Whitepaper: "Object versioning" with delete markers; "Lambda Notifications" for event-driven triggers',
    paths: [
      { path: 's3://finetune-data/{dataset-name}/train.jsonl', purpose: 'Training split — instruction/response pairs in JSONL', workloads: ['Fine-Tuning'], ioProfile: 'Read-once per epoch', volume: 'MBs-GBs' },
      { path: 's3://finetune-data/{dataset-name}/eval.jsonl', purpose: 'Evaluation/validation split for adapter quality', workloads: ['Fine-Tuning'], ioProfile: 'Read per eval step', volume: 'MBs' },
      { path: 's3://finetune-data/{dataset-name}/metadata.json', purpose: 'Dataset config: token counts, statistics, lineage', workloads: ['Fine-Tuning'], ioProfile: 'Small reads', volume: 'KBs' },
      { path: 's3://finetune-data/{dataset-name}/versions/{v}/train.jsonl', purpose: 'Versioned dataset snapshots for reproducibility', workloads: ['Fine-Tuning'], ioProfile: 'Read-once', volume: 'MBs-GBs' },
    ],
  },
  {
    category: 'RAG Documents & Chunks',
    description: 'Source documents and processed chunks for retrieval-augmented generation',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
    tier: [1, 2],
    storageFeature: 'Bucket notifications trigger re-embedding on upload; S3 Select filters document metadata server-side',
    paperRef: 'Whitepaper: "Lambda Notifications" (Kafka/NATS/AMQP); "S3 Select" with SIMD reduces bandwidth 80%+',
    paths: [
      { path: 's3://rag-source/documents/', purpose: 'Original documents (PDFs, markdown, HTML, etc.)', workloads: ['RAG'], ioProfile: 'Continuous writes', volume: 'GBs-TBs' },
      { path: 's3://rag-source/{source-name}/{date}.md', purpose: 'Dated document ingestion for freshness tracking', workloads: ['RAG'], ioProfile: 'Event-driven writes', volume: 'MBs' },
      { path: 's3://rag-processed/chunks/doc-{id}-chunk-{N}.json', purpose: 'Individual chunk with text, metadata, position info', workloads: ['RAG'], ioProfile: 'Batch writes', volume: 'Millions of objects' },
      { path: 's3://rag-processed/metadata/{doc-id}.json', purpose: 'Document-level metadata: source, date, chunk count', workloads: ['RAG'], ioProfile: 'S3 Select queries', volume: 'KBs each' },
      { path: 's3://rag-processed/embeddings/{model-name}/{doc-id}.npy', purpose: 'Pre-computed embeddings for batch indexing', workloads: ['RAG'], ioProfile: 'Batch reads', volume: 'GBs' },
    ],
  },
  {
    category: 'Model Registry',
    description: 'Versioned model artifacts, adapters, and deployment manifests — source of truth',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'from-purple-500 to-purple-600',
    tier: [1, 2],
    storageFeature: 'Object Lock (WORM) for immutable artifacts — SEC 17a-4(f) compliant; MinIO Catalog for GraphQL search',
    paperRef: 'Whitepaper: "Object Lock" with retention/legal hold, SEC 17a-4(f), FINRA 4511(c); "MinIO Catalog" GraphQL metadata search',
    paths: [
      { path: 's3://model-registry/{model-name}/{version}/', purpose: 'Base model version directory (safetensors, config, tokenizer)', workloads: ['Training', 'Fine-Tuning', 'Inference'], ioProfile: 'Large seq. write / burst read', volume: '16-140 GB' },
      { path: 's3://model-registry/{model-name}/{version}/model.safetensors', purpose: 'Model weights in safetensors format', workloads: ['Training', 'Inference'], ioProfile: 'Large burst read at 325 GiB/s', volume: '16-140 GB' },
      { path: 's3://model-registry/{model-name}/{version}/config.json', purpose: 'Model architecture configuration', workloads: ['Training', 'Fine-Tuning', 'Inference'], ioProfile: 'Small reads', volume: 'KBs' },
      { path: 's3://model-registry/{model-name}/{version}/tokenizer.json', purpose: 'Tokenizer vocabulary and rules', workloads: ['Training', 'Inference'], ioProfile: 'Small reads', volume: 'MBs' },
      { path: 's3://model-registry/{model-name}/adapters/{adapter-name}/{version}/', purpose: 'LoRA adapter version directory', workloads: ['Fine-Tuning', 'Inference'], ioProfile: 'Small seq. write / burst read', volume: '50-500 MB' },
      { path: 's3://model-registry/{model-name}/adapters/{adapter-name}/{version}/adapter_model.safetensors', purpose: 'Adapter weights — hot-swappable at inference', workloads: ['Fine-Tuning', 'Inference'], ioProfile: 'Sub-second via MinIO Cache', volume: '50-500 MB' },
    ],
  },
  {
    category: 'Checkpoints',
    description: 'Training and fine-tuning state snapshots — disaster recovery for multi-week runs',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'from-teal-500 to-cyan-500',
    tier: 2,
    storageFeature: 'Reed-Solomon erasure coding ensures checkpoint durability (12-drive, 6-parity tolerates 5 failures); BitRot protection via HighwayHash >10 GB/s/core',
    paperRef: 'Whitepaper: "inline, per-object erasure code in assembly" — Reed-Solomon; HighwayHash with SIMD >10 GB/s per core; BitRot healing on read',
    paths: [
      { path: 's3://training-checkpoints/{run-id}/step-{N}/', purpose: 'Full training checkpoint (model + optimizer state)', workloads: ['Training'], ioProfile: 'Burst large writes', volume: '500 GB - 1 TB' },
      { path: 's3://training-checkpoints/{run-id}/step-{N}/model.pt', purpose: 'Model weights at step N', workloads: ['Training'], ioProfile: 'Sequential write', volume: '100s GB' },
      { path: 's3://training-checkpoints/{run-id}/step-{N}/optimizer.pt', purpose: 'Adam optimizer state (momentum + variance)', workloads: ['Training'], ioProfile: 'Sequential write', volume: '200-400 GB' },
      { path: 's3://finetune-checkpoints/{dataset-name}/epoch-{N}/', purpose: 'Fine-tuning checkpoint — adapter only (1,000-5,000x smaller)', workloads: ['Fine-Tuning'], ioProfile: 'Small writes', volume: '50-500 MB' },
      { path: 's3://finetune-checkpoints/{dataset-name}/epoch-{N}/adapter_model.bin', purpose: 'LoRA adapter weights at epoch N', workloads: ['Fine-Tuning'], ioProfile: 'Small seq. write', volume: '50-500 MB' },
    ],
  },
  {
    category: 'Vector Database Backing',
    description: 'S3 as durable backend for vector databases — snapshots, segments, and backups',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    color: 'from-indigo-500 to-indigo-600',
    tier: [0, 2],
    storageFeature: 'Weaviate HNSW index on Tier 0 NVMe for <500us lookups; S3 backup/restore for disaster recovery',
    paperRef: 'Whitepaper: MinIO serves as durable backend for AI applications; supports disaggregated compute-storage architecture',
    paths: [
      { path: 's3://vectordb-data/weaviate/backups/{date}/', purpose: 'Weaviate backup snapshots (S3-based DR)', workloads: ['RAG'], ioProfile: 'Periodic large writes', volume: 'GBs-TBs' },
      { path: 's3://vectordb-data/milvus/segments/', purpose: 'Milvus segment files (S3 as persistent storage)', workloads: ['RAG'], ioProfile: 'Batch writes, random reads', volume: 'GBs-TBs' },
      { path: 's3://vectordb-data/lancedb/', purpose: 'LanceDB tables — native S3 support', workloads: ['RAG'], ioProfile: 'Columnar R/W', volume: 'GBs' },
      { path: 's3://vectordb-data/pgvector/dumps/', purpose: 'pgvector database dumps for backup', workloads: ['RAG'], ioProfile: 'Periodic batch writes', volume: 'GBs' },
    ],
  },
  {
    category: 'Experiment Tracking',
    description: 'MLflow, W&B, and TensorBoard artifacts — the complete experiment record',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'from-pink-500 to-rose-500',
    tier: [1, 2],
    storageFeature: 'MLflow artifact backend on MinIO AIStor; ILM auto-tiers old experiments to cold archive',
    paperRef: 'Whitepaper: "Lifecycle Management (ILM)" for automatic tiering; MinIO serves as S3-compatible backend for ML platforms',
    paths: [
      { path: 's3://mlflow-artifacts/experiment-{id}/run-{id}/', purpose: 'MLflow run artifacts (metrics, params, models)', workloads: ['Training', 'Fine-Tuning'], ioProfile: 'Continuous small writes', volume: 'GBs per experiment' },
      { path: 's3://mlflow-artifacts/experiment-{id}/run-{id}/artifacts/', purpose: 'Binary artifacts (plots, confusion matrices)', workloads: ['Training', 'Fine-Tuning'], ioProfile: 'Mixed small R/W', volume: 'MBs' },
      { path: 's3://training-logs/tensorboard/{run-id}/', purpose: 'TensorBoard event files (tfevents)', workloads: ['Training', 'Fine-Tuning'], ioProfile: 'Append writes', volume: 'MBs-GBs' },
      { path: 's3://experiment-configs/{experiment-id}.yaml', purpose: 'Experiment configuration snapshots for reproducibility', workloads: ['Training', 'Fine-Tuning'], ioProfile: 'Write-once', volume: 'KBs' },
    ],
  },
  {
    category: 'Inference Logs & Observability',
    description: 'Request/response logging, metrics, and compliance audit trails',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'from-emerald-500 to-green-500',
    tier: [2, 3],
    storageFeature: 'ILM auto-tiers old logs from Tier 2 to Tier 3 archive; Object Lock for compliance retention; S3 Select on Parquet for analytics',
    paperRef: 'Whitepaper: "ILM" lifecycle tiering; "Object Lock" with WORM retention (SEC 17a-4(f)); "S3 Select" on Parquet',
    paths: [
      { path: 's3://inference-logs/{YYYY-MM}/{DD}/requests.parquet', purpose: 'Daily request logs in columnar Parquet format', workloads: ['Inference'], ioProfile: 'Continuous writes, S3 Select reads', volume: 'TBs over time' },
      { path: 's3://inference-logs/metrics/{YYYY-MM-DD}.parquet', purpose: 'Aggregated metrics: latency, tokens/s, error rates', workloads: ['Inference'], ioProfile: 'Periodic writes', volume: 'GBs' },
      { path: 's3://inference-logs/errors/{YYYY-MM-DD}/', purpose: 'Error logs, stack traces, failed requests', workloads: ['Inference'], ioProfile: 'Sporadic writes', volume: 'MBs-GBs' },
      { path: 's3://inference-logs/audit/{YYYY-MM}/', purpose: 'Compliance audit trail — Object Lock enforced', workloads: ['Inference'], ioProfile: 'Immutable writes', volume: 'GBs' },
    ],
  },
  {
    category: 'Feedback Data (RLHF)',
    description: 'User feedback for RLHF/DPO — closes the Training → Inference → Training loop',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    color: 'from-red-500 to-rose-500',
    tier: 2,
    storageFeature: 'Object Lock for immutable feedback records; batch replication for DR; bucket notifications trigger fine-tuning pipelines',
    paperRef: 'Whitepaper: "Object Lock" WORM; "Batch Replication" for DR; "Lambda Notifications" for event-driven fine-tuning triggers',
    paths: [
      { path: 's3://feedback-data/rlhf/preference-pairs/batch-{date}.jsonl', purpose: 'Human preference pairs for RLHF (chosen/rejected)', workloads: ['Inference', 'Fine-Tuning'], ioProfile: 'Continuous writes, batch reads', volume: 'GBs' },
      { path: 's3://feedback-data/dpo/pairs/{date}/', purpose: 'DPO preference data (direct preference optimization)', workloads: ['Inference', 'Fine-Tuning'], ioProfile: 'Continuous writes', volume: 'GBs' },
      { path: 's3://feedback-data/corrections/', purpose: 'User corrections and edits to model outputs', workloads: ['Inference', 'Fine-Tuning'], ioProfile: 'Continuous small writes', volume: 'MBs-GBs' },
      { path: 's3://feedback-data/ratings/', purpose: 'Thumbs up/down, star ratings, NPS scores', workloads: ['Inference'], ioProfile: 'Continuous small writes', volume: 'MBs' },
    ],
  },
  {
    category: 'Feature Store',
    description: 'Pre-computed features for training and serving — Feast/Tecton on S3',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'from-violet-500 to-purple-600',
    tier: 2,
    storageFeature: 'Parquet-based offline store on S3; S3 Select for feature retrieval without full table scans',
    paperRef: 'Whitepaper: "S3 Select" for server-side feature filtering on CSV/JSON/Parquet objects',
    paths: [
      { path: 's3://feature-store/offline/{feature-group}/{date}/', purpose: 'Offline feature store (Feast/Tecton) — Parquet files', workloads: ['Training', 'Fine-Tuning'], ioProfile: 'Batch reads/writes', volume: 'GBs-TBs' },
      { path: 's3://feature-store/historical/{feature-group}/', purpose: 'Historical feature values for point-in-time joins', workloads: ['Training'], ioProfile: 'S3 Select queries', volume: 'TBs' },
    ],
  },
]

const workloadColors: Record<string, string> = {
  'Training': 'bg-raspberry/10 text-raspberry border-raspberry/20',
  'RAG': 'bg-amber-100 text-amber-700 border-amber-200',
  'Fine-Tuning': 'bg-blue-100 text-blue-700 border-blue-200',
  'Inference': 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const tierLabels: Record<number, { label: string; color: string }> = {
  0: { label: 'T0 NVMe Local (Block)', color: 'bg-emerald-500' },
  1: { label: 'T1 NVMe Local (PVC/S3)', color: 'bg-raspberry' },
  2: { label: 'T2 S3 over RDMA 400 GbE', color: 'bg-amber-500' },
  3: { label: 'T3 S3 to NVMe/SSD 100 GbE', color: 'bg-gray-500' },
}

export default function Paths() {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [showPaperRefs, setShowPaperRefs] = useState(false)

  return (
    <div>
      <PageHeader
        title="S3 Path Reference"
        subtitle="Namespace Design for AI Infrastructure"
        description="A complete reference for organizing your AI/ML object storage namespace on MinIO AIStor. Every path is mapped to storage tiers, I/O profiles, and MinIO features — all cross-referenced with the whitepaper."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Whitepaper Citation Banner */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-white/10 p-5 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-raspberry/20 flex items-center justify-center mt-0.5">
                <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm mb-1">Source: MinIO High-Performance Object Storage for AI Data Infrastructure</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  All MinIO AIStor features and capabilities referenced on this page are from the official whitepaper.
                  MinIO provides the most complete S3 API implementation outside AWS — supporting buckets, objects, versioning, locking, lifecycle management, encryption, and server-side queries.
                </p>
              </div>
              <button
                onClick={() => setShowPaperRefs(!showPaperRefs)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${showPaperRefs ? 'bg-raspberry text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
              >
                {showPaperRefs ? 'Hide' : 'Show'} Citations
              </button>
            </div>
          </div>
        </section>

        {/* Quick Overview */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-raspberry to-raspberry-dark rounded-xl flex items-center justify-center shadow-lg shadow-raspberry/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Namespace Overview</h2>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6 lg:p-8 overflow-x-auto shadow-2xl">
            <pre className="text-sm text-gray-300 font-mono leading-relaxed">
{`s3://
├── data-lake/                   # Raw ingested data (Bronze layer)
│   └── raw/{source}/{date}/
├── lakehouse/                   # Medallion architecture on Iceberg/Delta
│   ├── bronze/                  #   Immutable landing zone
│   ├── silver/                  #   Cleaned, deduped, filtered
│   └── gold/                    #   Tokenized shards (WebDataset)
│       └── tokenized-shards/
├── finetune-data/               # Curated fine-tuning datasets (JSONL)
│   └── {dataset-name}/
│       └── versions/{v}/
├── rag-source/                  # Original documents for RAG
├── rag-processed/               # Chunked documents + embeddings
│   ├── chunks/
│   ├── metadata/
│   └── embeddings/{model}/
├── model-registry/              # Versioned models + adapters
│   └── {model-name}/
│       ├── {version}/           #   safetensors, config, tokenizer
│       └── adapters/            #   LoRA adapters (hot-swappable)
│           └── {adapter-name}/{version}/
├── training-checkpoints/        # Full training checkpoints (500GB-1TB)
│   └── {run-id}/step-{N}/
├── finetune-checkpoints/        # Adapter checkpoints (50-500MB)
│   └── {dataset}/epoch-{N}/
├── vectordb-data/               # Vector DB backing (Weaviate, Milvus)
├── feature-store/               # Feast/Tecton offline features
│   └── offline/{feature-group}/
├── mlflow-artifacts/            # Experiment tracking
├── training-logs/               # TensorBoard, metrics
├── inference-logs/              # Request/response + compliance audit
│   └── audit/                   #   Object Lock enforced (WORM)
└── feedback-data/               # RLHF/DPO feedback loop
    ├── rlhf/preference-pairs/
    └── dpo/pairs/`}
            </pre>
          </div>
        </section>

        {/* Detailed Path Groups */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Detailed Path Reference</h2>
          <div className="space-y-6">
            {pathGroups.map((group) => {
              const tiers = Array.isArray(group.tier) ? group.tier : [group.tier]
              const isExpanded = expandedGroup === group.category
              return (
                <div key={group.category} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <div className={`bg-gradient-to-r ${group.color} px-6 py-4`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                        {group.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">{group.category}</h3>
                        <p className="text-sm text-white/80">{group.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {tiers.map((t) => (
                          <span key={t} className={`w-7 h-7 rounded-lg text-xs font-bold text-white flex items-center justify-center ${tierLabels[t].color}`}>
                            T{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* MinIO Feature + Paper Ref bar */}
                  <div className="px-6 py-3 bg-raspberry/5 border-b border-raspberry/10">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-raspberry uppercase tracking-wider whitespace-nowrap mt-0.5">MinIO AIStor:</span>
                      <span className="text-xs text-gray-700 leading-relaxed">{group.storageFeature}</span>
                    </div>
                    {showPaperRefs && (
                      <div className="flex items-start gap-2 mt-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-[11px] text-blue-700 italic leading-relaxed">{group.paperRef}</span>
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {group.paths.slice(0, isExpanded ? undefined : 3).map((pathItem, index) => (
                      <div key={index} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                          <code className="flex-shrink-0 text-sm bg-gray-900 text-emerald-400 px-4 py-2 rounded-lg font-mono break-all">
                            {pathItem.path}
                          </code>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600">{pathItem.purpose}</p>
                            {(pathItem.ioProfile || pathItem.volume) && (
                              <div className="flex flex-wrap gap-3 mt-1.5">
                                {pathItem.ioProfile && (
                                  <span className="text-[11px] text-gray-500">
                                    <span className="font-medium text-gray-700">I/O:</span> {pathItem.ioProfile}
                                  </span>
                                )}
                                {pathItem.volume && (
                                  <span className="text-[11px] text-gray-500">
                                    <span className="font-medium text-gray-700">Scale:</span> {pathItem.volume}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {pathItem.workloads.map((workload) => (
                              <span
                                key={workload}
                                className={`px-3 py-1 text-xs font-semibold rounded-full border ${workloadColors[workload]}`}
                              >
                                {workload}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {group.paths.length > 3 && (
                      <button
                        onClick={() => setExpandedGroup(isExpanded ? null : group.category)}
                        className="w-full px-6 py-3 text-sm text-raspberry font-medium hover:bg-raspberry/5 transition-colors text-center"
                      >
                        {isExpanded ? 'Show fewer paths' : `Show all ${group.paths.length} paths`}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Best Practices — refreshed with whitepaper specifics */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Versioning & Immutability',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                ),
                color: 'from-purple-500 to-purple-600',
                items: [
                  'Enable S3 bucket versioning on model-registry and finetune-data',
                  'Use Object Lock (WORM) for compliance-sensitive artifacts and audit logs',
                  'Never overwrite — create new versions; MinIO preserves full history with delete markers',
                  'Semantic versioning for models: s3://model-registry/llama-3/v1.2.0/',
                ],
                paperRef: 'Whitepaper: "Object versioning", "Object Lock" with retention/legal hold',
              },
              {
                title: 'Lifecycle Management (ILM)',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                color: 'from-teal-500 to-cyan-500',
                items: [
                  'ILM rules auto-tier old inference logs from Tier 2 → Tier 3 archive',
                  'Expire intermediate Bronze/Silver data after Gold export',
                  'Tiered storage for old checkpoints: hot → warm → cold',
                  'Retention policies on feedback data for compliance windows',
                ],
                paperRef: 'Whitepaper: "Lifecycle Management (ILM)" for automatic tiering and expiration',
              },
              {
                title: 'Access Control & Encryption',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                color: 'from-amber-500 to-orange-500',
                items: [
                  'AWS-compatible IAM with policy-based access control (PBAC)',
                  'SSE-S3 / SSE-KMS / SSE-C encryption — negligible performance impact',
                  'OpenID Connect + LDAP integration (Keycloak, Okta, AD)',
                  'Read-only IAM for inference service accounts; write for training pipelines',
                ],
                paperRef: 'Whitepaper: "IAM" with PBAC, OIDC, LDAP; "Encryption" via AES-256-GCM, ChaCha20-Poly1305',
              },
              {
                title: 'Performance Optimization',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                color: 'from-raspberry to-raspberry-dark',
                items: [
                  'Use WebDataset shard prefixes for parallel DataLoader reads at 325 GiB/s',
                  'Multipart upload for TB-scale checkpoints (parallel streams)',
                  'S3 Select on Parquet/CSV for log analytics — 80%+ bandwidth reduction',
                  'MinIO Cache (DRAM) for hot-path model and adapter reads',
                ],
                paperRef: 'Whitepaper: "S3 Select" with SIMD; "MinIO Cache" DRAM; 325 GiB/s GET benchmark',
              },
              {
                title: 'Replication & DR',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                ),
                color: 'from-indigo-500 to-indigo-600',
                items: [
                  'Active-active replication for multi-site model registry consistency',
                  'Batch replication for periodic DR of checkpoints and training data',
                  'Active-passive for read replicas near inference clusters',
                  'Cross-site feedback data sync for distributed RLHF collection',
                ],
                paperRef: 'Whitepaper: "Active-Active", "Active-Passive", "Batch" replication modes',
              },
              {
                title: 'Data Integrity',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                color: 'from-emerald-500 to-green-500',
                items: [
                  'Reed-Solomon erasure coding: 12-drive, 6-parity tolerates 5 drive failures',
                  'BitRot protection via HighwayHash at >10 GB/s per core (SIMD)',
                  'Inline healing: object-level automatic repair on read',
                  'Metadata-less design optimized for massive small file counts',
                ],
                paperRef: 'Whitepaper: "Erasure Coding" in assembly; "BitRot Protection" with HighwayHash; "Inline Healing"',
              },
            ].map((practice, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 bg-gradient-to-br ${practice.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {practice.icon}
                  </div>
                  <h3 className="font-bold text-gray-900">{practice.title}</h3>
                </div>
                <ul className="space-y-3">
                  {practice.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {showPaperRefs && (
                  <p className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-blue-700 italic">{practice.paperRef}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* S3 SDK Quick Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">SDK Quick Reference</h2>
          <p className="text-sm text-gray-500 mb-4">MinIO provides SDKs for Go, JavaScript, .NET, Python, and Java — all S3-compatible</p>
          <div className="bg-gray-900 rounded-2xl p-6 overflow-x-auto shadow-xl">
            <pre className="text-sm text-gray-300 font-mono leading-relaxed">
{`# Python — load a model from registry
from minio import Minio
client = Minio("minio.ai-cluster.local:9000", access_key="...", secret_key="...")

# Download model weights (325 GiB/s GET at cluster scale)
client.fget_object("model-registry",
    "llama-3-70b/v1.0/model.safetensors",
    "/local/nvme/model.safetensors")

# Upload checkpoint with erasure coding protection
client.fput_object("training-checkpoints",
    "run-42/step-10000/model.pt",
    "/local/nvme/checkpoint/model.pt")

# S3 Select — query Parquet logs server-side (80%+ bandwidth savings)
result = client.select_object_content("inference-logs",
    "2025-03/15/requests.parquet",
    SelectRequest("select * from s3object where latency_ms > 1000",
                  InputSerialization(parquet={}),
                  OutputSerialization(json={})))

# Bucket notifications — trigger on new document upload
events = client.listen_bucket_notification("rag-source",
    prefix="documents/", events=["s3:ObjectCreated:*"])`}
            </pre>
          </div>
        </section>

        <BottomLine>
          A well-designed namespace backed by MinIO AIStor makes everything easier: debugging, compliance, cost tracking,
          and team collaboration. These patterns scale from proof-of-concept to production — the same S3 API, the same
          namespace design, the same security model. The key is consistency: pick a convention, enforce it with IAM policies,
          and let ILM manage the lifecycle. All features referenced here are from the MinIO whitepaper.
        </BottomLine>
      </div>
    </div>
  )
}
