import PipelineDiagram, { PageHeader, BottomLine } from '../components/PipelineDiagram'
import type { Phase } from '../components/PipelineDiagram'
import FineTuningDiagram from '../components/diagrams/FineTuningDiagram'

const fineTuningPhases: Phase[] = [
  {
    id: 'dataset-prep',
    name: 'Dataset Preparation',
    description: 'Curated instruction/response pairs stored in object storage.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://finetune-data/customer-support-v2/train.jsonl',
      's3://finetune-data/customer-support-v2/eval.jsonl',
      's3://finetune-data/customer-support-v2/metadata.json',
    ],
    details: 'Fine-tuning datasets are curated and formatted (instruction/response pairs, JSONL, chat format). Much smaller than pre-training data — thousands to millions of examples, not trillions of tokens.',
    ioProfile: 'Small-to-medium writes during curation, read once at training start',
  },
  {
    id: 'base-model-load',
    name: 'Base Model Loading',
    description: 'Frozen base model pulled from registry into GPU memory.',
    role: 'burst',
    roleLabel: 'BURST READ',
    s3Paths: [
      's3://model-registry/llama-3-8b/base/model.safetensors',
    ],
    details: 'The frozen base model gets pulled from the model registry into GPU memory. Same pattern as inference model loading — big sequential read, happens once at start of training. Then the model is frozen.',
    ioProfile: 'Large sequential read (tens to hundreds of GB), happens once',
  },
  {
    id: 'training-loop',
    name: 'Training Loop',
    description: 'Data streams through model, only adapter weights update.',
    role: 'buffered',
    roleLabel: 'BUFFERED',
    s3Paths: [
      's3://finetune-data/customer-support-v2/train.jsonl',
    ],
    details: 'Training data gets streamed through the model. Same mechanics as pre-training but dramatically smaller scale — hours or days, not weeks or months. Only the LoRA adapter parameters get updated.',
    ioProfile: 'Sequential reads of training data, much smaller volume than pre-training',
  },
  {
    id: 'checkpointing',
    name: 'Adapter Checkpoints',
    description: 'Only adapter weights saved — dramatically smaller than full checkpoints.',
    role: 'primary',
    roleLabel: 'PRIMARY (TINY)',
    s3Paths: [
      's3://finetune-checkpoints/customer-support-v2/epoch-3/adapter_model.bin',
    ],
    details: 'Checkpoint pattern is the same as pre-training but checkpoints are TINY — just the adapter weights. A LoRA adapter might be 50-500MB versus 500GB+ for a full model checkpoint.',
    ioProfile: 'Small sequential writes (~100MB per checkpoint)',
  },
  {
    id: 'adapter-export',
    name: 'Adapter Export',
    description: 'Final adapter versioned independently from base model.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://model-registry/llama-3-8b/adapters/customer-support-v2/adapter_model.safetensors',
      's3://model-registry/llama-3-8b/adapters/legal-analysis-v1/adapter_model.safetensors',
    ],
    details: 'Final LoRA adapter gets exported and versioned. The elegant part: you version adapters independently from base models. Same base, multiple adapters, all versioned in object storage.',
    ioProfile: 'Small writes for adapter export, immutable versioned objects',
  },
]

export default function FineTuning() {
  return (
    <div>
      <PageHeader
        title="Fine-Tuning"
        subtitle="LoRA & QLoRA"
        description="Taking a pre-trained foundation model and adapting it to a specific domain or task. LoRA freezes the base model and trains small rank-decomposition matrices. The storage footprint is dramatically different from full training."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Visual Diagram */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pipeline Overview</h2>
          <FineTuningDiagram />
        </section>

        {/* Scale Comparison */}
        <section className="mb-12">
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

        {/* Detailed Phases */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Phase-by-Phase Breakdown</h2>
          <PipelineDiagram phases={fineTuningPhases} title="Fine-Tuning Pipeline" />
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
                Hot-Swap Potential
              </h3>
              <p className="text-gray-600">
                Adapters are small enough to load dynamically at inference time. vLLM and Triton support 
                multi-adapter serving — load base model once, swap adapters per request or tenant. 
                Object storage could be in the hot path here.
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
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Fast Iteration
              </h3>
              <p className="text-gray-600">
                Small checkpoints mean fast saves and fast restores. Small datasets mean quick training runs. 
                Fine-tuning enables rapid experimentation — train a new adapter in hours, test it, 
                iterate. Storage becomes less of a bottleneck.
              </p>
            </div>
          </div>
        </section>

        {/* QLoRA Note */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">A Note on QLoRA</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <p className="text-blue-800">
              <span className="font-semibold">QLoRA</span> adds quantization to LoRA — the base model is loaded 
              in 4-bit precision, reducing GPU memory requirements dramatically. From a storage perspective, 
              the patterns are identical to LoRA: the quantization happens at load time, not in storage. 
              Your checkpoints and adapters are the same size; you just need less GPU memory during training.
            </p>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Tens to hundreds of GB</td>
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
          object storage shines: same base, many adapters, clear lineage.
        </BottomLine>
      </div>
    </div>
  )
}
