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
  'primary': { bg: 'bg-raspberry', hoverBg: 'hover:bg-raspberry-dark', text: 'text-white', label: 'Primary' },
  'buffered': { bg: 'bg-amber-500', hoverBg: 'hover:bg-amber-600', text: 'text-white', label: 'Buffered' },
  'burst': { bg: 'bg-blue-500', hoverBg: 'hover:bg-blue-600', text: 'text-white', label: 'Burst' },
  'not-in-path': { bg: 'bg-gray-400', hoverBg: 'hover:bg-gray-500', text: 'text-white', label: 'Not In Path' },
  'varies': { bg: 'bg-purple-500', hoverBg: 'hover:bg-purple-600', text: 'text-white', label: 'Varies' },
}

const workloads = [
  { key: 'training', label: 'Training', path: '/training' },
  { key: 'rag', label: 'RAG', path: '/rag' },
  { key: 'fineTuning', label: 'Fine-Tuning', path: '/fine-tuning' },
  { key: 'inference', label: 'Inference', path: '/inference' },
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
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Storage Role:</span>
              {Object.entries(roleConfig).map(([role, config]) => (
                <div key={role} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${config.bg}`} />
                  <span className="text-sm text-gray-600">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-48">Phase</th>
                    {workloads.map((workload) => (
                      <th key={workload.key} className="px-6 py-4 text-center">
                        <Link 
                          to={workload.path}
                          className="text-sm font-semibold text-gray-900 hover:text-raspberry transition-colors"
                        >
                          {workload.label}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(comparisonData).map(([phase, data]) => (
                    <tr key={phase} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{phase}</td>
                      {workloads.map((workload) => {
                        const cellData = data[workload.key as keyof typeof data]
                        const config = roleConfig[cellData.role]
                        const isSelected = selectedCell?.phase === phase && selectedCell?.workload === workload.key
                        
                        return (
                          <td key={workload.key} className="px-4 py-3">
                            <button
                              onClick={() => setSelectedCell({ phase, workload: workload.key })}
                              className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${config.bg} ${config.text} ${config.hoverBg} ${
                                isSelected ? 'ring-2 ring-offset-2 ring-gray-900' : ''
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
        {selectedCell && selectedData && (
          <section className="mb-8">
            <div className="bg-white rounded-xl border-2 border-raspberry/20 p-6">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 ${roleConfig[selectedData.role].bg} rounded-lg flex items-center justify-center`}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {selectedCell.phase} — {workloads.find(w => w.key === selectedCell.workload)?.label}
                  </h3>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${roleConfig[selectedData.role].bg} ${roleConfig[selectedData.role].text} mb-2`}>
                    {roleConfig[selectedData.role].label}
                  </span>
                  <p className="text-gray-600">{selectedData.detail}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {!selectedCell && (
          <section className="mb-8">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-gray-500">Click any cell in the table above to see a detailed explanation.</p>
            </div>
          </section>
        )}

        {/* Summary Cards */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Takeaways</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-raspberry rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Training: Storage Everywhere
              </h3>
              <p className="text-gray-600">
                From raw data ingestion to checkpointing to final export, object storage is in the critical path 
                at every stage of model training. Throughput is the key metric.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                RAG: Architecture Matters
              </h3>
              <p className="text-gray-600">
                Storage is always in the ingestion pipeline. Whether it's in the query hot path depends 
                on your architecture: inline storage, pointer-based retrieval, or caching layer.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                Fine-Tuning: Small Scale, Same Patterns
              </h3>
              <p className="text-gray-600">
                All the same storage patterns as training, but at dramatically smaller scale. 
                The adapter versioning story is uniquely compelling — same base, many adapters.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                Inference: Bookends Only
              </h3>
              <p className="text-gray-600">
                Model loading at the start, logging throughout, feedback collection — but NOT during 
                token generation. The forward pass is pure GPU compute. That's the honest truth.
              </p>
            </div>
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
