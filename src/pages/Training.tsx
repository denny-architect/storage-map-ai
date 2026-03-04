import PipelineDiagram, { PageHeader, BottomLine } from '../components/PipelineDiagram'
import type { Phase } from '../components/PipelineDiagram'
import TrainingDiagram from '../components/diagrams/TrainingDiagram'

const trainingPhases: Phase[] = [
  {
    id: 'data-collection',
    name: 'Data Ingestion',
    description: 'Raw data lands in the Bronze layer — web scrapes, Common Crawl, domain corpora, images, video, logs.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://data-lake/bronze/common-crawl/',
      's3://data-lake/bronze/domain-corpora/',
      's3://data-lake/bronze/web-scrapes/',
    ],
    details: 'This is petabytes of unstructured data landing in the Bronze layer of the Medallion architecture. Object storage is the data lake foundation. Everything starts here — raw, unvalidated, schema-on-read. Write throughput is the metric that matters: you need to ingest at the rate data arrives, which can be hundreds of TB per day for large-scale training runs.',
    ioProfile: 'Massive sequential writes, sustained write throughput (hundreds of TB/day)',
  },
  {
    id: 'etl-processing',
    name: 'ELT / Medallion Processing',
    description: 'Spark + Iceberg transforms raw data through Bronze → Silver → Gold. Storage-intensive at every step.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://data-lake/bronze/common-crawl/',
      's3://data-lake/silver/deduplicated/',
      's3://data-lake/gold/tokenized-shards/',
    ],
    details: 'This is where raw data becomes training-ready. Spark reads from Bronze, deduplicates, filters toxicity, normalizes formats, and writes to Silver. Then another pass tokenizes, shards, and writes to Gold. Every transformation is a full read-write cycle through object storage. Iceberg table format provides ACID transactions, schema evolution, and time travel — critical for reproducibility. This phase can run for days on petabyte-scale datasets and is entirely storage-bound: Spark is reading and writing to MinIO AIStor at every step.',
    ioProfile: 'Batch read/write cycles, Iceberg tables, TB-scale per job, storage-bound',
  },
  {
    id: 'data-loading',
    name: 'DataLoader Streaming',
    description: 'PyTorch DataLoader streams Gold shards to GPUs. If storage can\'t keep up, GPUs sit idle.',
    role: 'buffered',
    roleLabel: 'BUFFERED',
    s3Paths: [
      's3://data-lake/gold/tokenized-shards/shard-{00000..99999}.tar',
    ],
    details: 'PyTorch DataLoader, Mosaic StreamingDataset, or NVIDIA DALI read tokenized shards from the Gold layer through prefetch buffers into GPU memory. The target is 325 GiB/s per node (META achieves 16 TB/s across 16K GPUs). This is not random IOPS — it\'s sustained sequential throughput. If storage throughput drops below what the GPUs consume, you get DataLoader stalls: GPUs idle waiting for the next batch. At $2-3/hr per GPU, idle H100s are burning money. Storage throughput directly translates to GPU utilization and training cost.',
    ioProfile: 'Sustained sequential reads, 325 GiB/s target per node, continuous for weeks',
  },
  {
    id: 'checkpointing',
    name: 'Checkpointing',
    description: 'Full model + optimizer state dumped to storage every N steps. Training pauses until the write completes.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://training-checkpoints/run-2024-03/step-50000/',
      's3://training-checkpoints/run-2024-03/step-100000/',
    ],
    details: 'For a 70B model, a single checkpoint is 500GB-1TB+ (optimizer state with Adam is 2-4x model size). Synchronous checkpointing pauses all GPUs until the write completes across all nodes. On a 1,000-GPU cluster at $2-3/hr per GPU, every minute of checkpoint pause costs $30-50. Faster storage write throughput directly reduces this pause window. Asynchronous checkpointing (writing in background while training continues) reduces but doesn\'t eliminate the storage dependency. Either way, durable object storage is non-negotiable — a failed checkpoint during a multi-week training run means restarting from the last good save.',
    ioProfile: 'Bursty massive sequential writes (500GB-1TB per checkpoint), latency-sensitive during sync writes',
  },
  {
    id: 'experiment-tracking',
    name: 'Experiment Tracking',
    description: 'MLflow, W&B track every run — metrics, hyperparams, artifacts.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://mlflow-artifacts/experiment-{id}/run-{id}/',
      's3://training-logs/tensorboard/',
    ],
    details: 'Every experiment generates artifacts: configuration files, metric logs, intermediate outputs, TensorBoard logs. These need durable, versioned storage for reproducibility and compliance.',
    ioProfile: 'Continuous small-to-medium writes, read-heavy during analysis',
  },
  {
    id: 'model-export',
    name: 'Model Export',
    description: 'Trained model exported in serving format and versioned in registry.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://model-registry/llama-3-70b/v1.0/model.safetensors',
    ],
    details: 'The final trained model gets exported in serving formats (safetensors, GGUF, ONNX) and versioned in a model registry backed by object storage. This is the artifact that downstream inference and fine-tuning will consume.',
    ioProfile: 'Large sequential write (final export), versioned immutable objects',
  },
]

export default function Training() {
  return (
    <div>
      <PageHeader
        title="Model Training"
        subtitle="Pre-Training from Scratch"
        description="Building a foundation model from raw data. This is what Meta did to create LLaMA — massive compute, massive data, weeks or months of GPU time. Storage is in the critical path from minute one to final export."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Visual Diagram */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pipeline Overview</h2>
          <TrainingDiagram />
        </section>

        {/* Detailed Phases */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Phase-by-Phase Breakdown</h2>
          <PipelineDiagram phases={trainingPhases} title="Training Pipeline" />
        </section>

        {/* Key Insights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Technical Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
                Throughput Over Latency
              </h3>
              <p className="text-gray-600">
                Training storage is throughput-bound, not latency-bound. DataLoaders need sustained GB/s reads. 
                Checkpoints need burst GB/s writes. ELT jobs read and write entire tables. 
                The metric is aggregate throughput (GB/s), not random IOPS. Size your storage accordingly.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Storage Speed = GPU Dollars
              </h3>
              <p className="text-gray-600">
                When DataLoader throughput drops below GPU consumption rate, GPUs idle waiting for data. 
                When synchronous checkpoints pause training, every GPU in the cluster burns money doing nothing. 
                On a 1,000-GPU cluster at $2-3/hr per GPU, each minute of storage-induced idle time costs $30-50. 
                Faster storage directly reduces training cost.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                Medallion Architecture
              </h3>
              <p className="text-gray-600">
                Bronze (raw) → Silver (cleaned, deduplicated) → Gold (tokenized, sharded). Each layer lives in 
                object storage with Iceberg table format providing ACID transactions, schema evolution, and time travel. 
                Every transformation is a full read-write cycle through storage. This is where the petabytes get processed.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                Disaster Recovery
              </h3>
              <p className="text-gray-600">
                Checkpoints are your insurance policy. GPU node failure, network partition, software crash — 
                the ability to resume from the last checkpoint is why durable object storage is non-negotiable. 
                A failed checkpoint during a multi-week training run means restarting from the last good save — 
                potentially losing days of GPU compute.
              </p>
            </div>
          </div>
        </section>

        {/* I/O Profile Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">I/O Profile Summary</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority Metric</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Data Ingestion</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sequential writes</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Petabytes</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Write throughput</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">ELT / Medallion</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Batch read-write cycles</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">TB-scale per job</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R/W throughput, ACID (Iceberg)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DataLoader Streaming</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sequential reads w/ prefetch</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Continuous (325 GiB/s target)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Read throughput (GB/s)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Checkpointing</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Bursty large writes (sync pause)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">500GB-1TB per checkpoint</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Write throughput, durability</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Artifact Logging</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Continuous small writes</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Gigabytes</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Availability, versioning</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <BottomLine>
          Object storage is in the critical path for every phase of training except the GPU compute loop itself. 
          It's the data lake foundation (Bronze → Silver → Gold), the DataLoader source that must sustain 
          325 GiB/s per node to keep GPUs fed, the checkpoint store where 500GB-1TB writes pause the entire 
          cluster, and the artifact registry for experiment tracking and model export. Storage throughput 
          directly impacts GPU utilization and training cost. The GPU training loop runs in VRAM — but 
          everything that feeds it, saves it, and records it runs through object storage.
        </BottomLine>
      </div>
    </div>
  )
}
