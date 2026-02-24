import { Link } from 'react-router-dom'
import DataGravityChart from '../components/DataGravityChart'

const pipelines = [
  {
    id: 'training',
    title: 'Model Training',
    subtitle: 'Pre-Training from Scratch',
    description: 'Building foundation models from raw data. Petabytes in, terabytes of checkpoints out. Storage is in the critical path from minute one.',
    intensity: 'critical',
    path: '/training',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    gradient: 'from-raspberry/20 to-orange-500/20',
    borderColor: 'group-hover:border-raspberry',
  },
  {
    id: 'rag',
    title: 'RAG',
    subtitle: 'Retrieval-Augmented Generation',
    description: 'Enhancing model responses with external context at query time. Storage owns the ingestion pipeline and may be in the retrieval path.',
    intensity: 'high',
    path: '/rag',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    gradient: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'group-hover:border-amber-500',
  },
  {
    id: 'fine-tuning',
    title: 'Fine-Tuning',
    subtitle: 'LoRA & QLoRA',
    description: 'Adapting foundation models to specific domains with minimal trainable parameters. Small datasets in, tiny adapters out.',
    intensity: 'medium',
    path: '/fine-tuning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'group-hover:border-blue-500',
  },
  {
    id: 'inference',
    title: 'Inference',
    subtitle: 'Model Serving',
    description: 'Running trained models to generate predictions. Storage loads the model and logs everything — but is NOT in the generation loop.',
    intensity: 'bookends',
    path: '/inference',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
      </svg>
    ),
    gradient: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'group-hover:border-emerald-500',
  },
]

const myths = [
  {
    myth: '"Object storage is in the inference hot path"',
    reality: 'During active generation, everything happens in GPU memory. The model weights are already loaded. The KV cache lives in VRAM. Storage touches inference at model load and logging — not during the forward pass.',
  },
  {
    myth: '"RAG is an inference workload"',
    reality: "RAG is a retrieval + generation pipeline. The retrieval phase (document ingestion, chunking, embedding, vector search) has its own storage patterns. Only the final generation step shares patterns with inference.",
  },
  {
    myth: '"Fine-tuning requires the same storage footprint as pre-training"',
    reality: 'With LoRA, you freeze 99%+ of the base model. A fine-tuning checkpoint for a 70B model might be 100MB (the adapter) versus 500GB+ for a full training checkpoint. Different orders of magnitude.',
  },
  {
    myth: '"All AI workloads need low-latency storage"',
    reality: 'Most AI storage operations are throughput-bound, not latency-bound. Training reads sequential batches. Checkpoints are large sequential writes. Model loading is a bulk transfer. Optimize for GB/s, not IOPS.',
  },
  {
    myth: '"You need special AI-specific storage"',
    reality: 'You need storage that does the basics exceptionally well: S3-compatible APIs, high aggregate throughput, erasure coding for durability, and the ability to scale to petabytes. That\'s enterprise object storage.',
  },
]

const intensityConfig: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-gradient-to-r from-raspberry to-raspberry-dark', text: 'text-white', label: 'Critical Path' },
  high: { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-white', label: 'High Involvement' },
  medium: { bg: 'bg-gradient-to-r from-blue-500 to-blue-600', text: 'text-white', label: 'Medium Involvement' },
  bookends: { bg: 'bg-gradient-to-r from-gray-500 to-gray-600', text: 'text-white', label: 'Bookends Only' },
}

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-dark text-white py-24 lg:py-32 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 animated-gradient" />
        
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-raspberry/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 pattern-grid opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">Technical Reference for AI/ML Engineers</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Everyone talks about{' '}
              <span className="gradient-text">AI storage</span>.
              <br />
              <span className="text-gray-400">Almost nobody draws the lines correctly.</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-3xl animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              This is a technical reference for where object storage actually lives in AI/ML pipelines — 
              not where marketing slides put it. Every phase mapped. Every I/O pattern explained. 
              <span className="text-white font-medium"> No hand-waving.</span>
            </p>
            
            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              <Link
                to="/compare"
                className="btn-primary inline-flex items-center px-8 py-4 text-white font-semibold rounded-xl transition-all"
              >
                See the Full Picture
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/glossary"
                className="btn-secondary inline-flex items-center px-8 py-4 text-white font-semibold rounded-xl transition-all"
              >
                Glossary
              </Link>
            </div>
          </div>
          
          {/* Floating decorative elements */}
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border-2 border-raspberry/20 rounded-2xl rotate-12 animate-pulse-glow" />
              <div className="absolute inset-4 border border-white/10 rounded-xl -rotate-6" />
              <div className="absolute inset-8 bg-gradient-to-br from-raspberry/10 to-transparent rounded-lg backdrop-blur-sm border border-white/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold gradient-text">4</div>
                  <div className="text-sm text-gray-400 mt-1">Pipelines</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Cards */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Four Pipelines. Four Storage Stories.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each AI workload has distinct phases where storage plays different roles. 
              Click to explore the technical details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {pipelines.map((pipeline, index) => (
              <Link
                key={pipeline.id}
                to={pipeline.path}
                style={{ animationDelay: `${index * 100}ms` }}
                className={`group relative bg-white rounded-2xl p-8 border-2 border-gray-100 ${pipeline.borderColor} transition-all duration-300 card-hover opacity-0 animate-scale-in`}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${pipeline.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative flex items-start gap-5">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 group-hover:bg-white/80 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-raspberry transition-all duration-300 shadow-sm group-hover:shadow-lg">
                    {pipeline.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-900 transition-colors">
                        {pipeline.title}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${intensityConfig[pipeline.intensity].bg} ${intensityConfig[pipeline.intensity].text} shadow-sm`}>
                        {intensityConfig[pipeline.intensity].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 font-medium">{pipeline.subtitle}</p>
                    <p className="text-gray-600 leading-relaxed">{pipeline.description}</p>
                  </div>
                </div>
                
                {/* Arrow indicator */}
                <div className="absolute top-8 right-8 text-gray-300 group-hover:text-raspberry group-hover:translate-x-1 transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Data Gravity Visualization */}
      <section className="py-20 bg-gray-50 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-80 h-80 bg-raspberry/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-raspberry/10 text-raspberry font-medium text-sm rounded-full mb-4">
              Scale Comparison
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Data Gravity: A Visual Comparison</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The relative data volumes across AI workloads span many orders of magnitude. 
              This is why one-size-fits-all storage advice doesn't work.
            </p>
          </div>
          <DataGravityChart />
        </div>
      </section>

      {/* Myths Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-gray-100 text-gray-700 font-medium text-sm rounded-full mb-4">
              Myth Busting
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Common Misconceptions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These get repeated in pitch decks and conference talks. Here's what's actually true.
            </p>
          </div>

          <div className="space-y-4">
            {myths.map((item, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 lg:p-8 border border-gray-100 hover:border-raspberry/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-12 h-12 bg-raspberry/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Myth: {item.myth}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      <span className="font-semibold text-raspberry">Reality:</span> {item.reality}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Line CTA */}
      <section className="relative py-24 bg-dark text-white overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 animated-gradient opacity-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-raspberry/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/15 rounded-full blur-[80px]" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-8 bg-gradient-to-br from-raspberry to-raspberry-dark rounded-2xl flex items-center justify-center shadow-2xl shadow-raspberry/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">The Bottom Line</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-10 max-w-3xl mx-auto">
            Object storage is the gravitational center of the AI data lifecycle. It's in every pipeline, 
            at every phase, for every workload — <span className="text-white font-medium">except the milliseconds where the GPU is doing matrix math</span>. 
            And it's the reason that matrix math has the right model, the right data, and a full audit trail.
          </p>
          <Link
            to="/compare"
            className="btn-primary inline-flex items-center px-10 py-5 text-white font-semibold rounded-xl text-lg transition-all"
          >
            Explore the Comparison Matrix
            <svg className="ml-3 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
