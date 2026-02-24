import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader, BottomLine } from '../components/PipelineDiagram'

type Role = 'primary' | 'buffered' | 'burst' | 'not-in-path' | 'varies'

interface CellData {
  role: Role
  short: string
  detail: string
}

interface ComparisonData {
  [phase: string]: {
    training: CellData
    rag: CellData
    fineTuning: CellData
    inference: CellData
  }
}

const comparisonData: ComparisonData = {
  'Data Lake / Source': {
    training: { role: 'primary', short: 'Massive reads (PB)', detail: 'Petabytes of raw text, images, code. The foundation of everything. Object storage is the data lake.' },
    rag: { role: 'primary', short: 'Continuous ingestion', detail: 'Documents arrive continuously. Chunking, cleaning, preparing for embedding. Always the source of truth.' },
    fineTuning: { role: 'primary', short: 'Small datasets (GB)', detail: 'Curated instruction/response pairs. Thousands to millions of examples, not trillions of tokens.' },
    inference: { role: 'not-in-path', short: '—', detail: 'Inference doesn\'t need raw training data. The model weights already encode the knowledge.' },
  },
  'Active Compute Loop': {
    training: { role: 'buffered', short: 'Streaming reads', detail: 'DataLoader streams batches through prefetch buffers. Sustained GB/s throughput, not random IOPS.' },
    rag: { role: 'not-in-path', short: 'Not in LLM gen', detail: 'The LLM generation step is GPU-only. Storage may be in retrieval path depending on architecture.' },
    fineTuning: { role: 'buffered', short: 'Streaming reads', detail: 'Same pattern as training but dramatically smaller scale. Hours, not weeks.' },
    inference: { role: 'not-in-path', short: 'NOT IN PATH', detail: 'The forward pass is pure GPU compute. Weights in VRAM, KV cache in VRAM. No storage I/O.' },
  },
  'Checkpointing': {
    training: { role: 'primary', short: 'Huge writes (TB)', detail: '500GB-1TB per checkpoint for large models. Model + optimizer state. Your disaster recovery.' },
    rag: { role: 'not-in-path', short: '—', detail: 'RAG doesn\'t checkpoint model weights — it\'s not training a model.' },
    fineTuning: { role: 'primary', short: 'Tiny writes (MB)', detail: 'Only adapter weights saved. ~100MB per checkpoint vs 500GB+ for full training. 5,000x smaller.' },
    inference: { role: 'not-in-path', short: '—', detail: 'Inference doesn\'t modify weights, so nothing to checkpoint.' },
  },
  'Model Registry': {
    training: { role: 'primary', short: 'Export destination', detail: 'Final trained model exported in serving format. Versioned and stored as the source of truth.' },
    rag: { role: 'not-in-path', short: '—', detail: 'RAG uses existing models but doesn\'t produce new model artifacts.' },
    fineTuning: { role: 'primary', short: 'Adapter versioning', detail: 'LoRA adapters versioned independently from base models. Same base, multiple adapters.' },
    inference: { role: 'burst', short: 'Burst read source', detail: 'Model weights pulled from registry on cold start, scale-out, updates. Throughput affects cold start time.' },
  },
  'Logging / Observability': {
    training: { role: 'primary', short: 'Training metrics', detail: 'Loss curves, learning rate, gradient norms. MLflow/W&B artifacts. TensorBoard logs.' },
    rag: { role: 'primary', short: 'Query logs', detail: 'Retrieved chunks, relevance scores, latency. Debug and optimize retrieval quality.' },
    fineTuning: { role: 'primary', short: 'Training metrics', detail: 'Same as training but smaller scale. Validation loss, adapter convergence.' },
    inference: { role: 'primary', short: 'Request/response logs', detail: 'Every interaction logged. Token counts, latency, errors. Compliance and analytics.' },
  },
  'Hot Path?': {
    training: { role: 'primary', short: 'Throughput-sensitive', detail: 'Storage throughput directly affects training speed. GB/s matters, not latency.' },
    rag: { role: 'varies', short: 'Possibly (retrieval)', detail: 'Depends on architecture. If chunks fetched from S3 at query time, storage is in hot path.' },
    fineTuning: { role: 'varies', short: 'Possibly (adapter swap)', detail: 'If dynamically loading adapters per-request at serving time, storage could be hot path.' },
    inference: { role: 'burst', short: 'Only at model load', detail: 'Hot path for cold start/scale-out. NOT hot path during token generation.' },
  },
}

const roleConfig = {
  'primary': { 
    bg: 'bg-gradient-to-r from-raspberry to-raspberry-dark', 
    hoverBg: 'hover:shadow-lg hover:shadow-raspberry/30', 
    text: 'text-white', 
    label: 'Primary',
    dot: 'bg-raspberry'
  },
  'buffered': { 
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500', 
    hoverBg: 'hover:shadow-lg hover:shadow-amber-500/30', 
    text: 'text-white', 
    label: 'Buffered',
    dot: 'bg-amber-500'
  },
  'burst': { 
    bg: 'bg-gradient-to-r from-blue-500 to-blue-600', 
    hoverBg: 'hover:shadow-lg hover:shadow-blue-500/30', 
    text: 'text-white', 
    label: 'Burst',
    dot: 'bg-blue-500'
  },
  'not-in-path': { 
    bg: 'bg-gradient-to-r from-gray-400 to-gray-500', 
    hoverBg: 'hover:shadow-lg hover:shadow-gray-400/30', 
    text: 'text-white', 
    label: 'Not In Path',
    dot: 'bg-gray-400'
  },
  'varies': { 
    bg: 'bg-gradient-to-r from-purple-500 to-purple-600', 
    hoverBg: 'hover:shadow-lg hover:shadow-purple-500/30', 
    text: 'text-white', 
    label: 'Varies',
    dot: 'bg-purple-500'
  },
}

const workloads = [
  { key: 'training', label: 'Training', path: '/training', color: 'text-raspberry' },
  { key: 'rag', label: 'RAG', path: '/rag', color: 'text-amber-600' },
  { key: 'fineTuning', label: 'Fine-Tuning', path: '/fine-tuning', color: 'text-blue-600' },
  { key: 'inference', label: 'Inference', path: '/inference', color: 'text-emerald-600' },
]

export default function Compare() {
  const [selectedCell, setSelectedCell] = useState<{ phase: string; workload: string } | null>(null)

  const getSelectedData = (): CellData | null => {
    if (!selectedCell) return null
    const workloadKey = selectedCell.workload as keyof typeof comparisonData[string]
    return comparisonData[selectedCell.phase]?.[workloadKey] || null
  }

  const selectedData = getSelectedData()

  return (
    <div>
      <PageHeader
        title="Comparison Matrix"
        subtitle="Side-by-Side Analysis"
        description="See how object storage's role differs across all four AI workloads. Click any cell to see the detailed explanation."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Legend */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-sm font-bold text-gray-700">Storage Role:</span>
              {Object.entries(roleConfig).map(([role, config]) => (
                <div key={role} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.dot}`} />
                  <span className="text-sm font-medium text-gray-600">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                    <th className="px-6 py-5 text-left text-sm font-bold text-gray-900 w-48">Phase</th>
                    {workloads.map((workload) => (
                      <th key={workload.key} className="px-6 py-5 text-center">
                        <Link 
                          to={workload.path}
                          className={`text-sm font-bold ${workload.color} hover:underline transition-colors flex items-center justify-center gap-2`}
                        >
                          {workload.label}
                          <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(comparisonData).map(([phase, data]) => (
                    <tr key={phase} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{phase}</td>
                      {workloads.map((workload) => {
                        const cellData = data[workload.key as keyof typeof data]
                        const config = roleConfig[cellData.role]
                        const isSelected = selectedCell?.phase === phase && selectedCell?.workload === workload.key
                        
                        return (
                          <td key={workload.key} className="px-4 py-3">
                            <button
                              onClick={() => setSelectedCell({ phase, workload: workload.key })}
                              className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${config.bg} ${config.text} ${config.hoverBg} ${
                                isSelected ? 'ring-2 ring-offset-2 ring-gray-900 scale-105' : ''
                              }`}
                            >
                              {cellData.short}
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

        {/* Selected Cell Detail */}
        {selectedCell && selectedData ? (
          <section className="mb-8 animate-scale-in">
            <div className="bg-white rounded-2xl border-2 border-raspberry/30 p-6 shadow-lg shadow-raspberry/10">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 ${roleConfig[selectedData.role].bg} rounded-xl flex items-center justify-center shadow-lg`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {selectedCell.phase} — {workloads.find(w => w.key === selectedCell.workload)?.label}
                  </h3>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${roleConfig[selectedData.role].bg} ${roleConfig[selectedData.role].text} mb-3`}>
                    {roleConfig[selectedData.role].label}
                  </span>
                  <p className="text-gray-600 leading-relaxed">{selectedData.detail}</p>
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
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Click any cell in the table above to see a detailed explanation.</p>
            </div>
          </section>
        )}

        {/* Summary Cards */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Takeaways</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Training: Storage Everywhere',
                description: 'From raw data ingestion to checkpointing to final export, object storage is in the critical path at every stage of model training. Throughput is the key metric.',
                gradient: 'from-raspberry to-raspberry-dark',
                shadow: 'shadow-raspberry/20'
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'RAG: Architecture Matters',
                description: 'Storage is always in the ingestion pipeline. Whether it\'s in the query hot path depends on your architecture: inline storage, pointer-based retrieval, or caching layer.',
                gradient: 'from-amber-500 to-orange-500',
                shadow: 'shadow-amber-500/20'
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
                title: 'Fine-Tuning: Small Scale, Same Patterns',
                description: 'All the same storage patterns as training, but at dramatically smaller scale. The adapter versioning story is uniquely compelling — same base, many adapters.',
                gradient: 'from-blue-500 to-blue-600',
                shadow: 'shadow-blue-500/20'
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ),
                title: 'Inference: Bookends Only',
                description: 'Model loading at the start, logging throughout, feedback collection — but NOT during token generation. The forward pass is pure GPU compute. That\'s the honest truth.',
                gradient: 'from-emerald-500 to-green-500',
                shadow: 'shadow-emerald-500/20'
              },
            ].map((card, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg ${card.shadow}`}>
                    {card.icon}
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

        <BottomLine>
          Object storage is in every pipeline, at every phase, for every workload — except the 
          milliseconds where the GPU is doing matrix math during inference. Understanding these 
          patterns lets you optimize the right things: throughput for training, architecture decisions 
          for RAG, cold start performance for inference.
        </BottomLine>
      </div>
    </div>
  )
}
