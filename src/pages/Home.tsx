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

const intensityColors: Record<string, string> = {
  critical: 'bg-raspberry',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  bookends: 'bg-gray-500',
}

const intensityLabels: Record<string, string> = {
  critical: 'Critical Path',
  high: 'High Involvement',
  medium: 'Medium Involvement',
  bookends: 'Bookends Only',
}

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dark via-gray-900 to-darker text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Everyone talks about{' '}
              <span className="text-raspberry">AI storage</span>.
              <br />
              Almost nobody draws the lines correctly.
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              This is a technical reference for where object storage actually lives in AI/ML pipelines — 
              not where marketing slides put it. Every phase mapped. Every I/O pattern explained. 
              No hand-waving.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/compare"
                className="inline-flex items-center px-6 py-3 bg-raspberry hover:bg-raspberry-dark text-white font-semibold rounded-lg transition-colors"
              >
                See the Full Picture
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/glossary"
                className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                Glossary
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Four Pipelines. Four Storage Stories.</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each AI workload has distinct phases where storage plays different roles. 
              Click to explore the technical details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pipelines.map((pipeline) => (
              <Link
                key={pipeline.id}
                to={pipeline.path}
                className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-raspberry hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gray-100 group-hover:bg-raspberry/10 rounded-lg flex items-center justify-center text-gray-600 group-hover:text-raspberry transition-colors">
                    {pipeline.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-raspberry transition-colors">
                        {pipeline.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium text-white rounded ${intensityColors[pipeline.intensity]}`}>
                        {intensityLabels[pipeline.intensity]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{pipeline.subtitle}</p>
                    <p className="text-gray-600">{pipeline.description}</p>
                  </div>
                </div>
                <div className="absolute top-6 right-6 text-gray-400 group-hover:text-raspberry transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Data Gravity Visualization */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Gravity: A Visual Comparison</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The relative data volumes across AI workloads span many orders of magnitude. 
              This is why one-size-fits-all storage advice doesn't work.
            </p>
          </div>
          <DataGravityChart />
        </div>
      </section>

      {/* Myths Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Common Misconceptions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These get repeated in pitch decks and conference talks. Here's what's actually true.
            </p>
          </div>

          <div className="space-y-6">
            {myths.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-raspberry/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Myth: {item.myth}
                    </h3>
                    <p className="text-gray-600">
                      <span className="font-medium text-raspberry">Reality:</span> {item.reality}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Line */}
      <section className="py-16 bg-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">The Bottom Line</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            Object storage is the gravitational center of the AI data lifecycle. It's in every pipeline, 
            at every phase, for every workload — except the milliseconds where the GPU is doing matrix math. 
            And it's the reason that matrix math has the right model, the right data, and a full audit trail.
          </p>
          <Link
            to="/compare"
            className="inline-flex items-center px-8 py-4 bg-raspberry hover:bg-raspberry-dark text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Explore the Comparison Matrix
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
