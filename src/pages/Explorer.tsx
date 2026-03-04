import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader, BottomLine } from '../components/PipelineDiagram'
import InteractiveTrainingExplorer from '../components/InteractiveTrainingExplorer'
import InteractiveRAGExplorer from '../components/InteractiveRAGExplorer'
import InteractiveFineTuningExplorer from '../components/InteractiveFineTuningExplorer'
import InteractiveInferenceExplorer from '../components/InteractiveInferenceExplorer'
import StorageLayoutExplorer from '../components/StorageLayoutExplorer'
import ReferenceArchitecture from '../components/ReferenceArchitecture'

type ViewType = 'reference' | 'storage-layout' | 'training' | 'rag' | 'fine-tuning' | 'inference'

const validViews: ViewType[] = ['reference', 'storage-layout', 'training', 'rag', 'fine-tuning', 'inference']

export default function Explorer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam = searchParams.get('view') as ViewType | null
  const initialView: ViewType = viewParam && validViews.includes(viewParam) ? viewParam : 'reference'
  const [activeView, setActiveView] = useState<ViewType>(initialView)

  // Sync URL → state when query param changes (e.g. back/forward navigation)
  useEffect(() => {
    const v = searchParams.get('view') as ViewType | null
    if (v && validViews.includes(v) && v !== activeView) {
      setActiveView(v)
    }
  }, [searchParams])

  // Sync state → URL when user clicks a tab
  const handleViewChange = (view: ViewType) => {
    setActiveView(view)
    setSearchParams(view === 'reference' ? {} : { view })
  }

  const views: { id: ViewType; name: string; description: string; available: boolean; badge?: string }[] = [
    { 
      id: 'reference', 
      name: 'Reference Architecture', 
      description: 'Prescriptive Guide',
      available: true,
      badge: 'START HERE'
    },
    { 
      id: 'storage-layout', 
      name: 'Storage Tiers', 
      description: 'The 4-Tier Layout',
      available: true,
    },
    { 
      id: 'training', 
      name: 'Training Pipeline', 
      description: 'Pre-training data flow',
      available: true,
    },
    { 
      id: 'rag', 
      name: 'RAG Pipeline', 
      description: 'Retrieval-augmented generation',
      available: true,
    },
    { 
      id: 'fine-tuning', 
      name: 'Fine-Tuning', 
      description: 'LoRA & adapter training',
      available: true,
    },
    { 
      id: 'inference', 
      name: 'Inference', 
      description: 'Model serving & generation',
      available: true,
    },
  ]

  return (
    <div>
      <PageHeader
        title="AI Training Reference Architecture"
        subtitle="Prescriptive Guide"
        description="A prescriptive guide to AI storage. ONE stack, clear tiers, step-by-step pipeline. Built for storage veterans learning AI infrastructure."
      >
        {/* View Selector */}
        <div className="flex flex-wrap gap-3 mt-8">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => view.available && handleViewChange(view.id)}
              disabled={!view.available}
              className={`relative px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                activeView === view.id
                  ? 'bg-raspberry text-white shadow-lg shadow-raspberry/30'
                  : view.available
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    : 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              <span className="block font-semibold">{view.name}</span>
              <span className="block text-xs opacity-70 mt-0.5">{view.description}</span>
              
              {view.badge && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                  {view.badge}
                </span>
              )}
              
              {!view.available && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-700 text-gray-400 text-[10px] rounded-full">
                  Coming Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Explorer */}
        <section className="mb-12">
          {activeView === 'reference' && <ReferenceArchitecture />}
          {activeView === 'storage-layout' && <StorageLayoutExplorer />}
          
          {activeView === 'training' && (
            <>
              <InteractiveTrainingExplorer />

              {/* Key Technical Insights — migrated from Training tab */}
              <section className="mt-12 mb-12">
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

              {/* I/O Profile Summary — migrated from Training tab */}
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
            </>
          )}

          {activeView === 'rag' && <InteractiveRAGExplorer />}

          {activeView === 'fine-tuning' && (
            <>
              <InteractiveFineTuningExplorer />

              {/* Scale Comparison */}
              <section className="mt-12 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">The Scale Difference</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="text-gray-600 mb-6">
                    The key insight: with LoRA, you're not touching 99%+ of the base model weights. 
                    This fundamentally changes the storage requirements.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-4xl font-bold text-raspberry mb-2">140GB</div>
                      <div className="text-sm text-gray-600 mb-1">70B Model (FP16)</div>
                      <div className="text-xs text-gray-400">Base model weights</div>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-4xl font-bold text-amber-500 mb-2">500GB+</div>
                      <div className="text-sm text-gray-600 mb-1">Full Training Checkpoint</div>
                      <div className="text-xs text-gray-400">Model + optimizer state</div>
                    </div>
                    <div className="text-center p-6 bg-raspberry/10 rounded-lg border-2 border-raspberry">
                      <div className="text-4xl font-bold text-raspberry mb-2">100MB</div>
                      <div className="text-sm text-gray-600 mb-1">LoRA Adapter</div>
                      <div className="text-xs text-gray-400">Just the trained parameters</div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    That's a <span className="font-semibold">5,000x</span> difference in checkpoint size.
                  </p>
                </div>
              </section>

              {/* Key Insights */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Technical Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </span>
                      Adapter Versioning
                    </h3>
                    <p className="text-gray-600">
                      The model registry pattern becomes elegant with LoRA: version adapters independently from base models. 
                      Same base model, multiple domain-specific adapters, clear lineage tracking. 
                      <code className="text-xs bg-gray-100 px-1 rounded">/llama-3-8b/adapters/customer-support-v2/</code>
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </span>
                      Hot-Swap at Inference
                    </h3>
                    <p className="text-gray-600">
                      Adapters are small enough to load dynamically at inference time. vLLM and Triton support 
                      multi-adapter serving — load base model once, swap adapters per request or tenant. 
                      Object storage is in the hot path for adapter swaps.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </span>
                      Dataset Curation Matters
                    </h3>
                    <p className="text-gray-600">
                      Fine-tuning is only as good as your data. The dataset preparation phase — curation, 
                      formatting, quality filtering — is where the real work happens. Object storage holds 
                      the versioned datasets that make results reproducible.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      QLoRA: Same Storage, Less GPU
                    </h3>
                    <p className="text-gray-600">
                      <span className="font-semibold">QLoRA</span> adds 4-bit quantization to LoRA — reducing GPU memory 
                      dramatically. From a storage perspective, patterns are identical: quantization happens at load time, 
                      not in storage. Checkpoints and adapters are the same size; you just need less GPU memory during training.
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Dataset Load</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sequential read</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">MB to GB</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Once at training start</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Base Model Load</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Large sequential read</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">16-140 GB</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Once at training start</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Adapter Checkpoint</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Small sequential write</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">~50-500 MB</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Per epoch or N steps</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Adapter Export</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Small sequential write</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">~50-500 MB</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Once at training end</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <BottomLine>
                Fine-tuning with LoRA transforms the storage story: small curated datasets instead of petabytes, 
                tiny adapter checkpoints instead of terabytes. Object storage remains the dataset store, model registry, 
                and checkpoint store — but at dramatically smaller scale. The adapter versioning pattern is where 
                object storage shines: same base, many adapters, clear lineage. And adapters are small enough 
                to hot-swap at inference time — bridging fine-tuning directly into serving.
              </BottomLine>
            </>
          )}

          {activeView === 'inference' && (
            <>
              <InteractiveInferenceExplorer />

              {/* Anatomy of a Request */}
              <section className="mt-12 mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Anatomy of a Single Request</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">1</div>
                      <div>
                        <p className="font-medium text-gray-900">User prompt arrives at API endpoint</p>
                        <p className="text-sm text-gray-500">Network I/O, not storage</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">2</div>
                      <div>
                        <p className="font-medium text-gray-900">Tokenizer converts text to token IDs</p>
                        <p className="text-sm text-gray-500">CPU, in-memory operation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">3</div>
                      <div>
                        <p className="font-medium text-gray-900">Token IDs sent to GPU</p>
                        <p className="text-sm text-gray-500">PCIe transfer, not storage</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white">4</div>
                      <div className="flex-1">
                        <p className="font-medium text-emerald-800">Forward pass through transformer layers</p>
                        <div className="mt-2 text-sm text-emerald-700 space-y-1">
                          <p>→ Attention computation (KV cache in GPU memory)</p>
                          <p>→ FFN layers (matrix multiplications, GPU compute)</p>
                          <p>→ Logits produced</p>
                          <p>→ Sampling strategy applied (temperature, top-p, etc.)</p>
                          <p>→ Output token generated</p>
                          <p>→ <span className="font-semibold">Repeat autoregressively until stop condition</span></p>
                        </div>
                        <div className="mt-3 inline-flex items-center px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded">
                          EVERYTHING HERE IS GPU MEMORY + COMPUTE. NO STORAGE.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">5</div>
                      <div>
                        <p className="font-medium text-gray-900">Detokenize back to text</p>
                        <p className="text-sm text-gray-500">CPU, in-memory operation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">6</div>
                      <div>
                        <p className="font-medium text-gray-900">Return response + log to object storage</p>
                        <p className="text-sm text-gray-500">Network I/O + async storage write</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Key Insights */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Technical Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      Cold Start Impact
                    </h3>
                    <p className="text-gray-600">
                      Object storage throughput directly affects time-to-first-token <span className="italic">for new instances</span>. 
                      A 70B model at 140GB needs to move from S3 to GPU VRAM. At 10 GB/s, that's 14 seconds. 
                      At 1 GB/s, that's 2+ minutes. This matters for autoscaling and recovery.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      Logging at Scale
                    </h3>
                    <p className="text-gray-600">
                      A high-traffic inference endpoint generates terabytes of logs over time: request/response pairs, 
                      latency metrics, token counts, error codes. Compliance requirements often mandate retention. 
                      Object storage is the durable, cost-effective home for this data.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </span>
                      Feedback Loop → Fine-Tuning
                    </h3>
                    <p className="text-gray-600">
                      User feedback (preferences, corrections, thumbs up/down) feeds back into fine-tuning via RLHF/DPO. 
                      Object storage is the bridge: inference feedback data becomes the training data 
                      for the next LoRA adapter iteration. The model lifecycle is circular, not linear.
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </span>
                      Model Lifecycle & LoRA Swaps
                    </h3>
                    <p className="text-gray-600">
                      Models get updated, rolled back, A/B tested. LoRA adapters get hot-swapped per tenant. 
                      Every model or adapter swap is a burst read from object storage. The registry is the 
                      source of truth for which versions and adapters are deployed where.
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">When</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage Role</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Model Loading</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Large sequential read</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cold start, scale-out, updates</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">BURST READ</span></td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Adapter Swap</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Small sequential read</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Per-request or per-tenant</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">BURST READ</span></td>
                      </tr>
                      <tr className="bg-emerald-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-800">Token Generation</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600">None</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600">Every request</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium bg-emerald-200 text-emerald-800 rounded">NOT IN PATH</span></td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Request Logging</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Continuous small writes</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Every request</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium bg-raspberry/20 text-raspberry rounded">PRIMARY</span></td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Feedback Storage</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Small writes</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">When users provide feedback</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium bg-raspberry/20 text-raspberry rounded">PRIMARY</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <BottomLine>
                Object storage is the bookends and the audit trail for inference: model loading at the start, 
                LoRA adapter swaps per tenant, logging and feedback throughout, model updates on demand. 
                But during the actual generation — the forward pass, the attention, the token sampling — 
                storage is not in the picture. The GPU is doing matrix math with data already in VRAM. 
                That's the technical reality. And feedback closes the loop back to fine-tuning — making 
                the model lifecycle circular.
              </BottomLine>
            </>
          )}
        </section>

        {/* Quick Tips */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Use This Explorer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
              <div className="w-12 h-12 rounded-xl bg-raspberry/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Watch the Flow</h3>
              <p className="text-sm text-gray-600">
                Animated data paths show how data moves through the pipeline. Thicker lines = more data volume.
              </p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Click to Explore</h3>
              <p className="text-sm text-gray-600">
                Click any node to see detailed information: S3 paths, I/O profiles, and MinIO AIStor features.
              </p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Control Playback</h3>
              <p className="text-sm text-gray-600">
                Use Play/Pause/Step controls to move through pipeline phases. Adjust speed for detailed analysis.
              </p>
            </div>
          </div>
        </section>

        {/* Key Insight Callout */}
        <div className="relative bg-gradient-to-r from-raspberry/5 via-raspberry/10 to-raspberry/5 border-2 border-raspberry/20 rounded-2xl p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-raspberry/10 rounded-full blur-2xl" />
          
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-raspberry to-raspberry-dark rounded-xl flex items-center justify-center shadow-lg shadow-raspberry/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-raspberry text-lg mb-2">The Big Picture</h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>Storage intensity varies dramatically across AI workloads.</strong> Training is storage-heavy from start to finish (100%). 
                RAG depends on your architecture (75%). Fine-tuning is a lighter version of training (45%). 
                And inference? Object storage loads the model and logs results, but the actual generation loop is <strong>compute-only</strong> (20%).
              </p>
              <p className="text-gray-600 mt-3 text-sm">
                This explorer helps you understand exactly where MinIO AIStor fits in each pipeline — and where it doesn't.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
