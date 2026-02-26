import { useState } from 'react'
import { PageHeader } from '../components/PipelineDiagram'
import InteractiveTrainingExplorer from '../components/InteractiveTrainingExplorer'
import StorageLayoutExplorer from '../components/StorageLayoutExplorer'
import ReferenceArchitecture from '../components/ReferenceArchitecture'

type ViewType = 'reference' | 'storage-layout' | 'training' | 'rag' | 'fine-tuning' | 'inference'

export default function Explorer() {
  const [activeView, setActiveView] = useState<ViewType>('reference')

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
      available: false,
    },
    { 
      id: 'fine-tuning', 
      name: 'Fine-Tuning', 
      description: 'LoRA & adapter training',
      available: false,
    },
    { 
      id: 'inference', 
      name: 'Inference', 
      description: 'Model serving & generation',
      available: false,
    },
  ]

  return (
    <div>
      <PageHeader
        title="AI Training Reference Architecture"
        subtitle="META-Inspired, MinIO-Powered"
        description="A prescriptive guide to AI storage. ONE stack, clear tiers, step-by-step pipeline. Built for storage veterans learning AI infrastructure."
      >
        {/* View Selector */}
        <div className="flex flex-wrap gap-3 mt-8">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => view.available && setActiveView(view.id)}
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
          {activeView === 'training' && <InteractiveTrainingExplorer />}
          
          {(activeView === 'rag' || activeView === 'fine-tuning' || activeView === 'inference') && (
            <div className="bg-gray-100 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Coming Soon</h3>
              <p className="text-gray-500">The {views.find(v => v.id === activeView)?.name} explorer is under development.</p>
            </div>
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
