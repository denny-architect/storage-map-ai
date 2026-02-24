import { PageHeader, BottomLine } from '../components/PipelineDiagram'

interface PathGroup {
  category: string
  description: string
  paths: {
    path: string
    purpose: string
    workloads: string[]
  }[]
}

const pathGroups: PathGroup[] = [
  {
    category: 'Training Data',
    description: 'Raw and processed datasets for model training',
    paths: [
      { path: 's3://raw-data/', purpose: 'Unprocessed ingested data (web scrapes, documents, images)', workloads: ['Training'] },
      { path: 's3://training-data/cleaned/', purpose: 'Deduplicated, filtered, toxicity-screened data', workloads: ['Training'] },
      { path: 's3://training-data/tokenized/', purpose: 'Pre-tokenized shards ready for DataLoader', workloads: ['Training'] },
      { path: 's3://training-data/tokenized/shard-{00000..99999}.tar', purpose: 'Webdataset or Mosaic format shards', workloads: ['Training'] },
    ],
  },
  {
    category: 'Fine-Tuning Data',
    description: 'Curated datasets for domain adaptation',
    paths: [
      { path: 's3://finetune-data/{dataset-name}/train.jsonl', purpose: 'Training split in JSONL format', workloads: ['Fine-Tuning'] },
      { path: 's3://finetune-data/{dataset-name}/eval.jsonl', purpose: 'Evaluation/validation split', workloads: ['Fine-Tuning'] },
      { path: 's3://finetune-data/{dataset-name}/metadata.json', purpose: 'Dataset configuration and statistics', workloads: ['Fine-Tuning'] },
    ],
  },
  {
    category: 'RAG Documents',
    description: 'Source documents and processed chunks for retrieval',
    paths: [
      { path: 's3://rag-source/', purpose: 'Original documents (PDFs, markdown, etc.)', workloads: ['RAG'] },
      { path: 's3://rag-source/{source-name}/{date}.md', purpose: 'Dated document ingestion', workloads: ['RAG'] },
      { path: 's3://rag-processed/chunks/', purpose: 'Chunked and cleaned text for embedding', workloads: ['RAG'] },
      { path: 's3://rag-processed/chunks/{doc-id}-chunk-{N}.json', purpose: 'Individual chunk with metadata', workloads: ['RAG'] },
    ],
  },
  {
    category: 'Model Registry',
    description: 'Versioned model artifacts and adapters',
    paths: [
      { path: 's3://model-registry/{model-name}/{version}/', purpose: 'Base model version directory', workloads: ['Training', 'Fine-Tuning', 'Inference'] },
      { path: 's3://model-registry/{model-name}/{version}/model.safetensors', purpose: 'Model weights in safetensors format', workloads: ['Training', 'Inference'] },
      { path: 's3://model-registry/{model-name}/{version}/config.json', purpose: 'Model configuration', workloads: ['Training', 'Fine-Tuning', 'Inference'] },
      { path: 's3://model-registry/{model-name}/adapters/{adapter-name}/{version}/', purpose: 'LoRA adapter version', workloads: ['Fine-Tuning', 'Inference'] },
      { path: 's3://model-registry/{model-name}/adapters/{adapter-name}/{version}/adapter_model.safetensors', purpose: 'Adapter weights', workloads: ['Fine-Tuning', 'Inference'] },
    ],
  },
  {
    category: 'Checkpoints',
    description: 'Training and fine-tuning state snapshots',
    paths: [
      { path: 's3://training-checkpoints/{run-id}/step-{N}/', purpose: 'Full training checkpoint (model + optimizer)', workloads: ['Training'] },
      { path: 's3://finetune-checkpoints/{dataset-name}/epoch-{N}/', purpose: 'Fine-tuning checkpoint (adapter only)', workloads: ['Fine-Tuning'] },
      { path: 's3://finetune-checkpoints/{dataset-name}/epoch-{N}/adapter_model.bin', purpose: 'Adapter weights checkpoint', workloads: ['Fine-Tuning'] },
    ],
  },
  {
    category: 'Vector Database',
    description: 'Backing storage for vector databases',
    paths: [
      { path: 's3://vectordb-data/milvus/segments/', purpose: 'Milvus segment files', workloads: ['RAG'] },
      { path: 's3://vectordb-data/weaviate/backups/', purpose: 'Weaviate backup snapshots', workloads: ['RAG'] },
      { path: 's3://vectordb-data/lancedb/', purpose: 'LanceDB tables (native S3 support)', workloads: ['RAG'] },
    ],
  },
  {
    category: 'Experiment Tracking',
    description: 'MLflow, W&B, and TensorBoard artifacts',
    paths: [
      { path: 's3://mlflow-artifacts/experiment-{id}/run-{id}/', purpose: 'MLflow run artifacts', workloads: ['Training', 'Fine-Tuning'] },
      { path: 's3://training-logs/tensorboard/', purpose: 'TensorBoard event files', workloads: ['Training', 'Fine-Tuning'] },
      { path: 's3://experiment-configs/', purpose: 'Experiment configuration snapshots', workloads: ['Training', 'Fine-Tuning'] },
    ],
  },
  {
    category: 'Inference Logs',
    description: 'Request/response logging and observability',
    paths: [
      { path: 's3://inference-logs/{YYYY-MM}/{DD}/requests.parquet', purpose: 'Daily request logs in Parquet format', workloads: ['Inference'] },
      { path: 's3://inference-logs/metrics/', purpose: 'Aggregated metrics (latency, tokens, errors)', workloads: ['Inference'] },
      { path: 's3://inference-logs/errors/', purpose: 'Error logs and stack traces', workloads: ['Inference'] },
    ],
  },
  {
    category: 'Feedback Data',
    description: 'User feedback for RLHF and improvement',
    paths: [
      { path: 's3://feedback-data/rlhf/preference-pairs/', purpose: 'Human preference data for RLHF', workloads: ['Inference', 'Fine-Tuning'] },
      { path: 's3://feedback-data/corrections/', purpose: 'User corrections and edits', workloads: ['Inference', 'Fine-Tuning'] },
      { path: 's3://feedback-data/ratings/', purpose: 'Thumbs up/down, star ratings', workloads: ['Inference'] },
    ],
  },
]

const workloadColors: Record<string, string> = {
  'Training': 'bg-raspberry/10 text-raspberry',
  'RAG': 'bg-amber-100 text-amber-700',
  'Fine-Tuning': 'bg-blue-100 text-blue-700',
  'Inference': 'bg-emerald-100 text-emerald-700',
}

export default function Paths() {
  return (
    <div>
      <PageHeader
        title="S3 Path Reference"
        subtitle="Namespace Design"
        description="A complete reference for organizing your AI/ML object storage namespace. These patterns work for organizations running any combination of training, RAG, fine-tuning, and inference workloads."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Namespace Overview</h2>
          <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm text-gray-300 font-mono">
{`s3://
├── raw-data/                    # Unprocessed ingested data
├── training-data/               # Cleaned & tokenized training data
│   ├── cleaned/
│   └── tokenized/
├── finetune-data/               # Curated fine-tuning datasets
│   └── {dataset-name}/
├── rag-source/                  # Original documents for RAG
├── rag-processed/               # Chunked documents
│   └── chunks/
├── model-registry/              # Versioned models and adapters
│   └── {model-name}/
│       ├── {version}/
│       └── adapters/
│           └── {adapter-name}/
├── training-checkpoints/        # Full training checkpoints (TB scale)
├── finetune-checkpoints/        # Adapter checkpoints (MB scale)
├── vectordb-data/               # Vector DB backing storage
├── mlflow-artifacts/            # Experiment tracking
├── training-logs/               # TensorBoard, metrics
├── inference-logs/              # Request/response logs
└── feedback-data/               # RLHF, user feedback`}
            </pre>
          </div>
        </section>

        {/* Detailed Path Groups */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Path Reference</h2>
          <div className="space-y-8">
            {pathGroups.map((group) => (
              <div key={group.category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">{group.category}</h3>
                  <p className="text-sm text-gray-600">{group.description}</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {group.paths.map((pathItem, index) => (
                    <div key={index} className="px-6 py-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <code className="flex-shrink-0 text-sm bg-gray-100 px-3 py-1.5 rounded font-mono text-raspberry break-all">
                          {pathItem.path}
                        </code>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{pathItem.purpose}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {pathItem.workloads.map((workload) => (
                            <span 
                              key={workload}
                              className={`px-2 py-0.5 text-xs font-medium rounded ${workloadColors[workload]}`}
                            >
                              {workload}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Versioning</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Use semantic versioning for models: <code className="bg-gray-100 px-1 rounded">v1.0.0</code>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Enable S3 bucket versioning for critical paths
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Never overwrite — create new versions
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Lifecycle Management</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Set retention policies on inference logs
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Tier old checkpoints to cold storage
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Delete intermediate training data after export
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Access Control</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Separate buckets per team or project
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Read-only access for inference services
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Audit logs for compliance-sensitive paths
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Performance</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Use sharding prefixes for high-throughput reads
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Multipart upload for large checkpoints
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-raspberry flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Consider Parquet/Arrow for log analytics
                </li>
              </ul>
            </div>
          </div>
        </section>

        <BottomLine>
          A well-designed namespace makes everything easier: debugging, compliance, cost tracking, 
          and team collaboration. These patterns scale from proof-of-concept to production. 
          The key is consistency — pick a convention and stick to it.
        </BottomLine>
      </div>
    </div>
  )
}
