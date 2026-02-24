import PipelineDiagram, { PageHeader, BottomLine } from '../components/PipelineDiagram'
import type { Phase } from '../components/PipelineDiagram'
import InferenceDiagram from '../components/diagrams/InferenceDiagram'

const inferencePhases: Phase[] = [
  {
    id: 'model-loading',
    name: 'Model Loading',
    description: 'Model weights pulled from object storage into GPU memory.',
    role: 'burst',
    roleLabel: 'BURST READ',
    s3Paths: [
      's3://model-registry/llama-3-70b/v1.0/model.safetensors',
    ],
    details: 'Model weights get pulled from object storage into GPU VRAM. This happens on cold start, scale-out (new replica), model update, or crash recovery. For a 70B model in FP16, that\'s ~140GB moving from S3 to GPU. Object storage throughput directly impacts time-to-first-token for new instances.',
    ioProfile: 'Large sequential read (tens to hundreds of GB), happens once per instance lifecycle',
  },
  {
    id: 'inference-loop',
    name: 'Inference Loop',
    description: 'The actual generation — GPU compute and GPU memory only.',
    role: 'not-in-path',
    roleLabel: 'NOT IN PATH',
    s3Paths: [],
    details: 'User prompt → tokenize → forward pass → sample → generate tokens → detokenize → response. Everything in this loop is GPU compute and GPU memory. The weights are already in VRAM. The KV cache lives in VRAM. Object storage is not here. Period.',
    ioProfile: 'None — this is pure GPU compute',
  },
  {
    id: 'logging',
    name: 'Observability',
    description: 'Every request/response logged for compliance and analytics.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://inference-logs/2024-03/15/requests.parquet',
      's3://inference-logs/metrics/model-latency/',
    ],
    details: 'Every request/response gets logged: token counts, latency, user info, prompt, response, model version, error codes. This feeds your Clickhouse + Grafana observability stack. Compliance and audit requirements make this non-optional in enterprise.',
    ioProfile: 'Continuous small-to-medium writes (append-heavy)',
  },
  {
    id: 'feedback',
    name: 'Feedback Collection',
    description: 'User feedback stored for RLHF and future fine-tuning.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://feedback-data/rlhf/preference-pairs/batch-2024-03.jsonl',
    ],
    details: 'User feedback (thumbs up/down, corrections, preferences) gets collected and stored for future fine-tuning rounds. This closes the loop back to the fine-tuning pipeline. Object storage is the durable store for this feedback data.',
    ioProfile: 'Continuous small writes, batch reads during fine-tuning',
  },
  {
    id: 'model-updates',
    name: 'Model Updates',
    description: 'New model versions, A/B tests, canary rollouts.',
    role: 'burst',
    roleLabel: 'BURST READ',
    s3Paths: [
      's3://model-registry/llama-3-70b/v1.1/',
      's3://model-registry/llama-3-70b/v1.0/',
    ],
    details: 'New model version deployed? A/B test between v1.0 and v1.1? Canary rollout? Rollback needed? Every model swap is another burst read from object storage. In a large serving fleet, this happens regularly.',
    ioProfile: 'Large sequential reads, frequency depends on deployment cadence',
  },
]

export default function Inference() {
  return (
    <div>
      <PageHeader
        title="Inference"
        subtitle="Model Serving"
        description="Running trained models to generate predictions. This is the 'ollama run llama3' moment. Storage loads the model and logs everything — but is NOT in the generation loop."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Critical Callout */}
        <section className="mb-12">
          <div className="bg-raspberry/5 border-2 border-raspberry rounded-xl p-8">
            <h2 className="text-2xl font-bold text-raspberry mb-4">The Most Important Point on This Entire Site</h2>
            <p className="text-lg text-gray-700 mb-4">
              During active inference — the milliseconds when the GPU is generating tokens — 
              <span className="font-bold"> object storage is not in the path</span>. 
              Not latency. Not throughput. Not IOPS. It's just not there.
            </p>
            <p className="text-gray-600">
              The model weights are already in GPU memory. The KV cache lives in VRAM. 
              The tokenizer is in CPU memory. The forward pass is pure matrix multiplication on the GPU. 
              Anyone who claims otherwise is either confused or selling something.
            </p>
          </div>
        </section>

        {/* Visual Diagram */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pipeline Overview</h2>
          <InferenceDiagram />
        </section>

        {/* Anatomy of a Request */}
        <section className="mb-12">
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
                  <p className="font-medium text-gray-900">Return response</p>
                  <p className="text-sm text-gray-500">Network I/O, not storage</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Phases */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Where Storage Actually Matters</h2>
          <PipelineDiagram phases={inferencePhases} title="Inference Pipeline" />
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
                Feedback Loop
              </h3>
              <p className="text-gray-600">
                User feedback (preferences, corrections, thumbs up/down) feeds back into fine-tuning. 
                Object storage is the bridge: inference logs and feedback data become the training data 
                for the next iteration. The model lifecycle is circular.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </span>
                Model Lifecycle
              </h3>
              <p className="text-gray-600">
                Models get updated, rolled back, A/B tested. Every model swap is a burst read from object storage. 
                The model registry (in object storage) is the source of truth for which model versions 
                exist and which are deployed where.
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
          logging and feedback throughout, model updates on demand. But during the actual generation — 
          the forward pass, the attention, the token sampling — storage is not in the picture. 
          The GPU is doing matrix math with data already in VRAM. That's the honest story.
        </BottomLine>
      </div>
    </div>
  )
}
