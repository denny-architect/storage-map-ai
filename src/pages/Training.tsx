import PipelineDiagram, { PageHeader, BottomLine } from '../components/PipelineDiagram'
import type { Phase } from '../components/PipelineDiagram'
import TrainingDiagram from '../components/diagrams/TrainingDiagram'

const trainingPhases: Phase[] = [
  {
    id: 'data-collection',
    name: 'Data Collection',
    description: 'Raw data lands in object storage — web scrapes, Common Crawl, domain corpora.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://training-data/raw/',
      's3://training-data/cleaned/',
      's3://training-data/tokenized/',
    ],
    details: 'This is petabytes of unstructured data. Object storage is the data lake. Everything starts here. Data goes through multiple stages: raw ingestion, deduplication, toxicity screening, and tokenization into training-ready shards.',
    ioProfile: 'Mixed writes during ingestion, large sequential writes for processed outputs',
  },
  {
    id: 'data-loading',
    name: 'Data Loading',
    description: 'Training frameworks stream batches through prefetch buffers to GPUs.',
    role: 'buffered',
    roleLabel: 'BUFFERED',
    s3Paths: [
      's3://training-data/tokenized/shard-{00000..99999}.tar',
    ],
    details: 'PyTorch DataLoader, Mosaic StreamingDataset, or NVIDIA DALI read batches from storage. The pattern is sequential bulk reads with prefetch buffers. Storage is being read continuously but through a caching layer — not random IOPS, but streaming throughput.',
    ioProfile: 'Sustained sequential reads, high aggregate throughput (GB/s)',
  },
  {
    id: 'checkpointing',
    name: 'Checkpointing',
    description: 'Full model state dumped to storage every N steps for disaster recovery.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://training-checkpoints/run-2024-03/step-50000/',
      's3://training-checkpoints/run-2024-03/step-100000/',
    ],
    details: 'For a 70B param model, a single checkpoint can be 500GB-1TB+ (optimizer state is 2-4x model size with Adam). This is bursty, massive sequential writes. GPU node dies? Resume from last checkpoint. This is your disaster recovery.',
    ioProfile: 'Bursty large sequential writes (hundreds of GB per checkpoint)',
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
                Throughput is King
              </h3>
              <p className="text-gray-600">
                Training storage is throughput-bound, not latency-bound. You need sustained GB/s reads for data loading 
                and burst GB/s writes for checkpointing. Random IOPS is not the metric that matters here.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </span>
                Checkpoint Scale
              </h3>
              <p className="text-gray-600">
                A 70B model checkpoint with Adam optimizer state can exceed 500GB. At regular intervals during 
                a weeks-long training run, you're writing terabytes of checkpoint data. Plan capacity accordingly.
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
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                Data Pipeline Stages
              </h3>
              <p className="text-gray-600">
                Raw data → cleaned → tokenized → sharded. Each stage lives in object storage with clear 
                bucket/prefix organization. This enables re-processing from any stage when requirements change.
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Batch Loading</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sequential reads w/ prefetch</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Continuous stream</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Read throughput (GB/s)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Checkpointing</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Bursty large writes</td>
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
          Object storage is the data lake, checkpoint store, and artifact registry for model training. 
          You're in the pipeline from minute one to final export. Optimize for throughput, plan for 
          petabyte-scale data and terabyte-scale checkpoints, and ensure durability for disaster recovery.
        </BottomLine>
      </div>
    </div>
  )
}
