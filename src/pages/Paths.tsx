import { PageHeader, BottomLine } from '../components/PipelineDiagram'

interface PathGroup {
  category: string
  description: string
  icon: React.ReactNode
  color: string
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
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    color: 'from-raspberry to-raspberry-dark',
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
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'from-blue-500 to-blue-600',
    paths: [
      { path: 's3://finetune-data/{dataset-name}/train.jsonl', purpose: 'Training split in JSONL format', workloads: ['Fine-Tuning'] },
      { path: 's3://finetune-data/{dataset-name}/eval.jsonl', purpose: 'Evaluation/validation split', workloads: ['Fine-Tuning'] },
      { path: 's3://finetune-data/{dataset-name}/metadata.json', purpose: 'Dataset configuration and statistics', workloads: ['Fine-Tuning'] },
    ],
  },
  {
    category: 'RAG Documents',
    description: 'Source documents and processed chunks for retrieval',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
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
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'from-purple-500 to-purple-600',
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
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'from-teal-500 to-cyan-500',
    paths: [
      { path: 's3://training-checkpoints/{run-id}/step-{N}/', purpose: 'Full training checkpoint (model + optimizer)', workloads: ['Training'] },
      { path: 's3://finetune-checkpoints/{dataset-name}/epoch-{N}/', purpose: 'Fine-tuning checkpoint (adapter only)', workloads: ['Fine-Tuning'] },
      { path: 's3://finetune-checkpoints/{dataset-name}/epoch-{N}/adapter_model.bin', purpose: 'Adapter weights checkpoint', workloads: ['Fine-Tuning'] },
    ],
  },
  {
    category: 'Vector Database',
    description: 'Backing storage for vector databases',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    color: 'from-indigo-500 to-indigo-600',
    paths: [
      { path: 's3://vectordb-data/milvus/segments/', purpose: 'Milvus segment files', workloads: ['RAG'] },
      { path: 's3://vectordb-data/weaviate/backups/', purpose: 'Weaviate backup snapshots', workloads: ['RAG'] },
      { path: 's3://vectordb-data/lancedb/', purpose: 'LanceDB tables (native S3 support)', workloads: ['RAG'] },
    ],
  },
  {
    category: 'Experiment Tracking',
    description: 'MLflow, W&B, and TensorBoard artifacts',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'from-pink-500 to-rose-500',
    paths: [
      { path: 's3://mlflow-artifacts/experiment-{id}/run-{id}/', purpose: 'MLflow run artifacts', workloads: ['Training', 'Fine-Tuning'] },
      { path: 's3://training-logs/tensorboard/', purpose: 'TensorBoard event files', workloads: ['Training', 'Fine-Tuning'] },
      { path: 's3://experiment-configs/', purpose: 'Experiment configuration snapshots', workloads: ['Training', 'Fine-Tuning'] },
    ],
  },
  {
    category: 'Inference Logs',
    description: 'Request/response logging and observability',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'from-emerald-500 to-green-500',
    paths: [
      { path: 's3://inference-logs/{YYYY-MM}/{DD}/requests.parquet', purpose: 'Daily request logs in Parquet format', workloads: ['Inference'] },
      { path: 's3://inference-logs/metrics/', purpose: 'Aggregated metrics (latency, tokens, errors)', workloads: ['Inference'] },
      { path: 's3://inference-logs/errors/', purpose: 'Error logs and stack traces', workloads: ['Inference'] },
    ],
  },
  {
    category: 'Feedback Data',
    description: 'User feedback for RLHF and improvement',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'from-red-500 to-rose-500',
    paths: [
      { path: 's3://feedback-data/rlhf/preference-pairs/', purpose: 'Human preference data for RLHF', workloads: ['Inference', 'Fine-Tuning'] },
      { path: 's3://feedback-data/corrections/', purpose: 'User corrections and edits', workloads: ['Inference', 'Fine-Tuning'] },
      { path: 's3://feedback-data/ratings/', purpose: 'Thumbs up/down, star ratings', workloads: ['Inference'] },
    ],
  },
]

const workloadColors: Record<string, string> = {
  'Training': 'bg-raspberry/10 text-raspberry border-raspberry/20',
  'RAG': 'bg-amber-100 text-amber-700 border-amber-200',
  'Fine-Tuning': 'bg-blue-100 text-blue-700 border-blue-200',
  'Inference': 'bg-emerald-100 text-emerald-700 border-emerald-200',
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
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Detailed Path Reference</h2>
          <div className="space-y-6">
            {pathGroups.map((group) => (
              <div key={group.category} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className={`bg-gradient-to-r ${group.color} px-6 py-4`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                      {group.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{group.category}</h3>
                      <p className="text-sm text-white/80">{group.description}</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {group.paths.map((pathItem, index) => (
                    <div key={index} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <code className="flex-shrink-0 text-sm bg-gray-900 text-emerald-400 px-4 py-2 rounded-lg font-mono break-all">
                          {pathItem.path}
                        </code>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{pathItem.purpose}</p>
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
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Versioning',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                ),
                color: 'from-purple-500 to-purple-600',
                items: [
                  { text: 'Use semantic versioning for models:', code: 'v1.0.0' },
                  { text: 'Enable S3 bucket versioning for critical paths' },
                  { text: 'Never overwrite — create new versions' },
                ],
              },
              {
                title: 'Lifecycle Management',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                color: 'from-teal-500 to-cyan-500',
                items: [
                  { text: 'Set retention policies on inference logs' },
                  { text: 'Tier old checkpoints to cold storage' },
                  { text: 'Delete intermediate training data after export' },
                ],
              },
              {
                title: 'Access Control',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                color: 'from-amber-500 to-orange-500',
                items: [
                  { text: 'Separate buckets per team or project' },
                  { text: 'Read-only access for inference services' },
                  { text: 'Audit logs for compliance-sensitive paths' },
                ],
              },
              {
                title: 'Performance',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                color: 'from-raspberry to-raspberry-dark',
                items: [
                  { text: 'Use sharding prefixes for high-throughput reads' },
                  { text: 'Multipart upload for large checkpoints' },
                  { text: 'Consider Parquet/Arrow for log analytics' },
                ],
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
                      <span>
                        {item.text}
                        {item.code && <code className="ml-1 px-2 py-0.5 bg-gray-100 rounded text-xs">{item.code}</code>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
