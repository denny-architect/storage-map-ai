import { PageHeader, BottomLine } from '../components/PipelineDiagram'

interface Component {
  id: string
  name: string
  description: string
  role: string
  phase: string
  port?: string
  category: 'compute' | 'storage' | 'vector' | 'observability' | 'interface'
}

const components: Component[] = [
  {
    id: 'minio',
    name: 'MinIO',
    description: 'S3-compatible object storage for documents, embeddings backup, and observability data',
    role: 'Primary storage layer - document source of truth, vector DB backing, log storage',
    phase: 'All Phases',
    port: '9000 / 9001',
    category: 'storage',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Local LLM inference server running embedding and generation models',
    role: 'Embedding generation (nomic-embed-text) and response generation (llama3)',
    phase: 'Embedding & Generation',
    port: '11434',
    category: 'compute',
  },
  {
    id: 'maxi',
    name: 'Maxi Embedder',
    description: 'Custom embedding service that chunks documents and generates vectors',
    role: 'Document processing pipeline - chunking, embedding orchestration',
    phase: 'Ingestion',
    port: '8080',
    category: 'compute',
  },
  {
    id: 'clickhouse',
    name: 'ClickHouse',
    description: 'OLAP database with vector search capabilities for storing and querying embeddings',
    role: 'Vector database - stores embeddings, handles similarity search',
    phase: 'Storage & Retrieval',
    port: '8123 / 9000',
    category: 'vector',
  },
  {
    id: 'crc',
    name: 'CRC (Chat RAG Controller)',
    description: 'API service orchestrating the RAG pipeline - query → retrieve → generate',
    role: 'RAG orchestration - coordinates embedding lookup and LLM generation',
    phase: 'Query & Generation',
    port: '3000',
    category: 'compute',
  },
  {
    id: 'jupyter',
    name: 'Jupyter Notebook',
    description: 'Interactive development environment for data exploration and testing',
    role: 'Development interface - testing embeddings, queries, and pipeline debugging',
    phase: 'Development',
    port: '8888',
    category: 'interface',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Visualization and monitoring dashboard for the entire stack',
    role: 'Observability - latency tracking, throughput monitoring, error rates',
    phase: 'Monitoring',
    port: '3001',
    category: 'observability',
  },
]

const categoryColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  storage: { bg: 'bg-raspberry/10', border: 'border-raspberry/30', text: 'text-raspberry', icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z' },
  compute: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  vector: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
  observability: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  interface: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
}

const pipelinePhases = [
  {
    phase: 'Document Ingestion',
    components: ['minio', 'maxi'],
    description: 'NASA APOD documents stored in MinIO, processed by Maxi embedder',
    storageRole: 'PRIMARY',
  },
  {
    phase: 'Embedding Generation',
    components: ['maxi', 'ollama'],
    description: 'Maxi reads chunks, Ollama generates embeddings via nomic-embed-text',
    storageRole: 'SOURCE READ',
  },
  {
    phase: 'Vector Storage',
    components: ['clickhouse', 'minio'],
    description: 'Embeddings stored in ClickHouse, backed by MinIO for durability',
    storageRole: 'BACKING STORE',
  },
  {
    phase: 'Query Processing',
    components: ['crc', 'clickhouse', 'ollama'],
    description: 'CRC embeds query, searches ClickHouse, sends context to Ollama',
    storageRole: 'RETRIEVAL PATH',
  },
  {
    phase: 'Response Generation',
    components: ['ollama'],
    description: 'Ollama generates response using retrieved context - GPU only',
    storageRole: 'NOT IN PATH',
  },
  {
    phase: 'Observability',
    components: ['grafana', 'minio'],
    description: 'Metrics and logs stored in MinIO, visualized in Grafana',
    storageRole: 'PRIMARY',
  },
]

export default function DemoStack() {
  return (
    <div>
      <PageHeader
        title="Demo Stack"
        subtitle="APOD RAG Reference Architecture"
        description="A working RAG implementation using NASA's Astronomy Picture of the Day as the knowledge base. This maps each component to its role in the pipeline and shows where MinIO fits."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Architecture Overview */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Architecture Overview</h2>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 overflow-x-auto">
            <svg viewBox="0 0 1000 500" className="w-full min-w-[800px]" style={{ minHeight: '450px' }}>
              <defs>
                <linearGradient id="demoStorageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#C72C48" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#C72C48" stopOpacity="0.4" />
                </linearGradient>
                <marker id="demoArrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
                </marker>
                <marker id="demoArrowRed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#C72C48" />
                </marker>
              </defs>

              {/* Background grid */}
              <pattern id="demoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#demoGrid)" />

              {/* Title */}
              <text x="500" y="30" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                APOD RAG Demo Architecture
              </text>

              {/* MinIO Storage Layer (Bottom) */}
              <g>
                <rect x="50" y="400" width="900" height="80" rx="12" fill="url(#demoStorageGrad)" stroke="#C72C48" strokeWidth="2" />
                <text x="500" y="440" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  MinIO Object Storage
                </text>
                <text x="500" y="460" textAnchor="middle" fill="#FCA5A5" fontSize="11">
                  apod-docs/ | embeddings-backup/ | observability-logs/ | model-cache/
                </text>
              </g>

              {/* Ingestion Layer */}
              <g>
                <rect x="80" y="70" width="180" height="120" rx="8" fill="#1F2937" stroke="#C72C48" strokeWidth="2" />
                <text x="170" y="100" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">Document Ingestion</text>
                <text x="170" y="125" textAnchor="middle" fill="#9CA3AF" fontSize="11">Maxi Embedder</text>
                <text x="170" y="145" textAnchor="middle" fill="#9CA3AF" fontSize="10">Chunks → Embeds</text>
                <rect x="100" y="160" width="140" height="18" rx="4" fill="#C72C48" />
                <text x="170" y="172" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">FROM MinIO</text>
                
                {/* Arrow from storage */}
                <path d="M 170 395 L 170 195" stroke="#C72C48" strokeWidth="3" markerEnd="url(#demoArrowRed)" />
              </g>

              {/* Ollama Compute */}
              <g>
                <rect x="310" y="70" width="180" height="120" rx="8" fill="#1F2937" stroke="#3B82F6" strokeWidth="2" />
                <text x="400" y="100" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">LLM Engine</text>
                <text x="400" y="125" textAnchor="middle" fill="#93C5FD" fontSize="11">Ollama</text>
                <text x="400" y="145" textAnchor="middle" fill="#9CA3AF" fontSize="10">nomic-embed + llama3</text>
                <rect x="330" y="160" width="140" height="18" rx="4" fill="#3B82F6" />
                <text x="400" y="172" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">GPU COMPUTE</text>
              </g>

              {/* ClickHouse Vector DB */}
              <g>
                <rect x="540" y="70" width="180" height="120" rx="8" fill="#1F2937" stroke="#8B5CF6" strokeWidth="2" />
                <text x="630" y="100" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">Vector Database</text>
                <text x="630" y="125" textAnchor="middle" fill="#C4B5FD" fontSize="11">ClickHouse</text>
                <text x="630" y="145" textAnchor="middle" fill="#9CA3AF" fontSize="10">Similarity Search</text>
                <rect x="560" y="160" width="140" height="18" rx="4" fill="#8B5CF6" />
                <text x="630" y="172" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">BACKED BY S3</text>
                
                {/* Arrow to storage */}
                <path d="M 630 195 L 630 395" stroke="#C72C48" strokeWidth="2" markerEnd="url(#demoArrowRed)" strokeDasharray="6,3" />
              </g>

              {/* CRC Controller */}
              <g>
                <rect x="770" y="70" width="180" height="120" rx="8" fill="#1F2937" stroke="#10B981" strokeWidth="2" />
                <text x="860" y="100" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">RAG Controller</text>
                <text x="860" y="125" textAnchor="middle" fill="#6EE7B7" fontSize="11">CRC API</text>
                <text x="860" y="145" textAnchor="middle" fill="#9CA3AF" fontSize="10">Orchestration</text>
                <rect x="790" y="160" width="140" height="18" rx="4" fill="#10B981" />
                <text x="860" y="172" textAnchor="middle" fill="white" fontSize="9" fontWeight="500">COORDINATOR</text>
              </g>

              {/* Observability Layer */}
              <g>
                <rect x="310" y="240" width="180" height="100" rx="8" fill="#1F2937" stroke="#F59E0B" strokeWidth="2" />
                <text x="400" y="270" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">Observability</text>
                <text x="400" y="295" textAnchor="middle" fill="#FCD34D" fontSize="11">Grafana</text>
                <text x="400" y="315" textAnchor="middle" fill="#9CA3AF" fontSize="10">Metrics & Logs</text>
                
                {/* Arrow to storage */}
                <path d="M 400 345 L 400 395" stroke="#C72C48" strokeWidth="2" markerEnd="url(#demoArrowRed)" />
              </g>

              {/* Jupyter */}
              <g>
                <rect x="540" y="240" width="180" height="100" rx="8" fill="#1F2937" stroke="#F59E0B" strokeWidth="2" />
                <text x="630" y="270" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">Development</text>
                <text x="630" y="295" textAnchor="middle" fill="#FCD34D" fontSize="11">Jupyter</text>
                <text x="630" y="315" textAnchor="middle" fill="#9CA3AF" fontSize="10">Testing & Debug</text>
              </g>

              {/* Flow arrows between components */}
              <path d="M 260 130 L 305 130" stroke="#6B7280" strokeWidth="2" markerEnd="url(#demoArrow)" />
              <path d="M 490 130 L 535 130" stroke="#6B7280" strokeWidth="2" markerEnd="url(#demoArrow)" />
              <path d="M 720 130 L 765 130" stroke="#6B7280" strokeWidth="2" markerEnd="url(#demoArrow)" />
              
              {/* User request flow */}
              <circle cx="860" cy="280" r="25" fill="#374151" stroke="#6B7280" strokeWidth="2" />
              <text x="860" y="275" textAnchor="middle" fill="white" fontSize="9">User</text>
              <text x="860" y="288" textAnchor="middle" fill="white" fontSize="9">Query</text>
              <path d="M 860 255 L 860 195" stroke="#6B7280" strokeWidth="2" markerEnd="url(#demoArrow)" />
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-raspberry" />
                <span className="text-sm text-gray-300">Storage Layer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm text-gray-300">GPU Compute</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500" />
                <span className="text-sm text-gray-300">Vector Database</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-sm text-gray-300">Orchestration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500" />
                <span className="text-sm text-gray-300">Observability</span>
              </div>
            </div>
          </div>
        </section>

        {/* Component Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Stack Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.map((component) => {
              const colors = categoryColors[component.category]
              return (
                <div
                  key={component.id}
                  className={`${colors.bg} border ${colors.border} rounded-xl p-6 hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${colors.bg} border ${colors.border} rounded-lg flex items-center justify-center`}>
                      <svg className={`w-6 h-6 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d={colors.icon} />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{component.name}</h3>
                        {component.port && (
                          <code className="text-xs bg-gray-200 px-2 py-0.5 rounded font-mono text-gray-600">
                            :{component.port}
                          </code>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{component.description}</p>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Role:</span> {component.role}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Phase:</span> {component.phase}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Pipeline Phase Mapping */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pipeline Phase Mapping</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phase</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Components</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Storage Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pipelinePhases.map((phase, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900">{phase.phase}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {phase.components.map((compId) => {
                            const comp = components.find(c => c.id === compId)
                            const colors = comp ? categoryColors[comp.category] : categoryColors.compute
                            return (
                              <span
                                key={compId}
                                className={`px-2 py-1 text-xs font-medium rounded ${colors.bg} ${colors.text}`}
                              >
                                {comp?.name || compId}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">{phase.description}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          phase.storageRole === 'NOT IN PATH' 
                            ? 'bg-gray-100 text-gray-600' 
                            : 'bg-raspberry/10 text-raspberry'
                        }`}>
                          {phase.storageRole}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* S3 Bucket Layout for Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Demo S3 Bucket Layout</h2>
          <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm text-gray-300 font-mono">
{`s3://apod-demo/
├── source-documents/           # Raw NASA APOD markdown files
│   └── 2024-03-15.md          # Daily astronomy content
├── processed-chunks/           # Chunked documents ready for embedding
│   └── apod-2024-03-15-chunk-001.json
├── embedding-cache/            # Cached embeddings (backup/restore)
│   └── nomic-embed-text/
├── clickhouse-backup/          # ClickHouse segment backups
│   └── segments/
├── observability/              # Grafana data and logs
│   ├── metrics/
│   └── logs/
└── model-cache/                # Ollama model weights (optional)
    └── llama3/`}
            </pre>
          </div>
        </section>

        {/* Key Insight */}
        <section className="mb-12">
          <div className="bg-raspberry/5 border-2 border-raspberry/20 rounded-xl p-8">
            <h3 className="text-xl font-bold text-raspberry mb-4">What This Demo Illustrates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Storage is Pervasive</h4>
                <p className="text-gray-600 text-sm">
                  MinIO touches 5 of the 6 pipeline phases. It's the document source, the vector DB backing store, 
                  the observability data lake, and the optional model cache. Only GPU compute is storage-free.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">But Not in Generation</h4>
                <p className="text-gray-600 text-sm">
                  When Ollama is generating tokens in the response phase, storage is not involved. 
                  The model weights are in GPU memory, the context is in the prompt, and the forward pass is pure compute.
                </p>
              </div>
            </div>
          </div>
        </section>

        <BottomLine>
          This demo stack shows a complete RAG implementation where MinIO provides the storage backbone 
          for every phase except active LLM generation. The pattern applies to any S3-compatible object store 
          and any RAG architecture: storage owns the data lifecycle, compute owns the generation.
        </BottomLine>
      </div>
    </div>
  )
}
