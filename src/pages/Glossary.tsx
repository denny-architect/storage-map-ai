import { useState } from 'react'
import { PageHeader } from '../components/PipelineDiagram'

interface GlossaryTerm {
  term: string
  definition: string
  context?: string
  relatedTerms?: string[]
}

const glossaryTerms: GlossaryTerm[] = [
  {
    term: 'Adapter (LoRA)',
    definition: 'Small, trainable matrices added to a frozen base model during fine-tuning. Instead of updating all model weights, only these adapters are trained — dramatically reducing compute and storage requirements.',
    context: 'A LoRA adapter for a 70B model might be 50-500MB, versus 140GB+ for the full model weights.',
    relatedTerms: ['LoRA', 'QLoRA', 'Fine-Tuning'],
  },
  {
    term: 'Autoregressive Generation',
    definition: 'The process where a language model generates output one token at a time, with each new token depending on all previously generated tokens. This is why inference is sequential and why the KV cache matters.',
    context: 'Each forward pass generates one token. A 100-token response requires 100 forward passes.',
    relatedTerms: ['Forward Pass', 'KV Cache', 'Token'],
  },
  {
    term: 'Checkpoint',
    definition: 'A snapshot of the training state at a particular point — includes model weights, optimizer state, scheduler state, and training metadata. Used for disaster recovery and resuming interrupted training.',
    context: 'A full training checkpoint for a 70B model with Adam optimizer can exceed 500GB (model + 2-4x for optimizer momentum).',
    relatedTerms: ['Optimizer State', 'Training Loop'],
  },
  {
    term: 'Chunking',
    definition: 'The process of splitting documents into smaller segments for embedding and retrieval in RAG systems. Chunk size affects retrieval quality — too large loses precision, too small loses context.',
    context: 'Common chunk sizes are 256-1024 tokens. Overlapping chunks help preserve context at boundaries.',
    relatedTerms: ['RAG', 'Embedding', 'Vector Database'],
  },
  {
    term: 'Cold Start',
    definition: 'When an inference instance starts up and must load model weights from storage into GPU memory before serving requests. Cold start time directly impacts autoscaling responsiveness.',
    context: 'A 70B model at 10 GB/s throughput takes ~14 seconds to load. At 1 GB/s, over 2 minutes.',
    relatedTerms: ['Model Loading', 'TTFT'],
  },
  {
    term: 'DataLoader',
    definition: 'Component in training frameworks (like PyTorch) that handles reading data from storage, batching, shuffling, and prefetching. Sits between object storage and GPU, managing the data pipeline.',
    context: 'Modern DataLoaders use prefetch buffers and multiple workers to hide storage latency.',
    relatedTerms: ['Prefetch', 'Training Loop', 'Batch'],
  },
  {
    term: 'Embedding',
    definition: 'A dense vector representation of text (or other data) in a high-dimensional space where similar items are close together. Created by embedding models and stored in vector databases for similarity search.',
    context: 'Common embedding dimensions: 384, 768, 1024, 1536. Higher dimensions capture more nuance but cost more.',
    relatedTerms: ['Vector Database', 'RAG', 'Semantic Search'],
  },
  {
    term: 'Erasure Coding',
    definition: 'A data protection method that splits data into fragments with redundant parity data, allowing reconstruction if some fragments are lost. More storage-efficient than simple replication.',
    context: 'MinIO uses Reed-Solomon erasure coding. A 4+2 configuration can lose any 2 drives and recover.',
    relatedTerms: ['Durability', 'Object Storage'],
  },
  {
    term: 'Forward Pass',
    definition: 'A single pass of input data through a neural network to produce an output. During inference, this is the core computation that happens entirely in GPU memory — no storage I/O involved.',
    context: 'The forward pass involves matrix multiplications through transformer layers: attention + FFN.',
    relatedTerms: ['Inference', 'Backward Pass', 'GPU Memory'],
  },
  {
    term: 'GGUF',
    definition: 'A file format for storing quantized language models, designed for efficient loading and inference. Successor to GGML format, used by llama.cpp and related tools.',
    context: 'GGUF files are typically smaller than safetensors due to quantization (4-bit, 8-bit, etc.).',
    relatedTerms: ['Quantization', 'safetensors', 'Model Format'],
  },
  {
    term: 'KV Cache',
    definition: 'The key-value cache in transformer attention that stores computed attention states from previous tokens. Grows linearly with sequence length and lives entirely in GPU VRAM during inference.',
    context: 'For a 70B model with 128K context, KV cache can consume tens of GB of VRAM per sequence.',
    relatedTerms: ['Attention', 'VRAM', 'Inference'],
  },
  {
    term: 'LoRA (Low-Rank Adaptation)',
    definition: 'A fine-tuning technique that freezes the base model and trains small rank-decomposition matrices. Enables domain adaptation with minimal storage and compute overhead.',
    context: 'LoRA typically trains <1% of the parameters, resulting in adapters that are 100-1000x smaller than full model weights.',
    relatedTerms: ['Adapter', 'Fine-Tuning', 'QLoRA'],
  },
  {
    term: 'Model Registry',
    definition: 'A versioned repository of model artifacts — weights, configurations, metadata. Provides the source of truth for what models exist and which versions are deployed.',
    context: 'Object storage is the natural backing store: versioned, durable, and accessible across environments.',
    relatedTerms: ['Model Versioning', 'safetensors', 'Deployment'],
  },
  {
    term: 'Object Storage',
    definition: 'A storage architecture that manages data as discrete objects with metadata, accessed via HTTP/S3 APIs. Scales to exabytes, provides durability via erasure coding, and is the foundation of AI data infrastructure.',
    context: 'S3-compatible object storage is the de facto standard for AI/ML: training data, checkpoints, model registry, logs.',
    relatedTerms: ['S3', 'MinIO', 'Data Lake'],
  },
  {
    term: 'ONNX',
    definition: 'Open Neural Network Exchange — an open format for representing machine learning models. Enables interoperability between frameworks and optimized inference runtimes.',
    context: 'Models can be exported from PyTorch/TensorFlow to ONNX and run on ONNX Runtime for inference.',
    relatedTerms: ['Model Format', 'safetensors', 'Inference'],
  },
  {
    term: 'Optimizer State',
    definition: 'The internal state of the training optimizer (like Adam) — includes momentum terms and variance estimates for each parameter. Can be 2-4x the size of model weights.',
    context: 'A 70B model with Adam has ~140GB of weights + ~400GB of optimizer state = 500GB+ checkpoints.',
    relatedTerms: ['Checkpoint', 'Adam', 'Training'],
  },
  {
    term: 'Prefetch',
    definition: 'Loading data from storage into memory before it\'s needed, hiding storage latency from the compute pipeline. Critical for keeping GPUs fed during training.',
    context: 'DataLoaders prefetch multiple batches ahead while the GPU processes the current batch.',
    relatedTerms: ['DataLoader', 'Training Loop', 'Throughput'],
  },
  {
    term: 'QLoRA',
    definition: 'Quantized LoRA — combines LoRA fine-tuning with 4-bit quantization of the base model. Enables fine-tuning of large models on consumer GPUs with minimal quality loss.',
    context: 'QLoRA can fine-tune a 65B model on a single 48GB GPU by loading the base model in 4-bit precision.',
    relatedTerms: ['LoRA', 'Quantization', 'Fine-Tuning'],
  },
  {
    term: 'Quantization',
    definition: 'Reducing the numerical precision of model weights (e.g., from FP16 to INT8 or INT4). Reduces memory footprint and can speed up inference, with some quality trade-off.',
    context: 'A 70B model goes from ~140GB (FP16) to ~70GB (INT8) to ~35GB (INT4).',
    relatedTerms: ['GGUF', 'QLoRA', 'Inference'],
  },
  {
    term: 'RAG (Retrieval-Augmented Generation)',
    definition: 'A technique that enhances LLM responses by retrieving relevant context from external documents at query time. Combines retrieval (search) with generation (LLM).',
    context: 'RAG is not pure inference — it\'s a pipeline with distinct ingestion, retrieval, and generation phases.',
    relatedTerms: ['Vector Database', 'Embedding', 'Chunking'],
  },
  {
    term: 'safetensors',
    definition: 'A safe and fast file format for storing tensors (model weights). Designed to prevent arbitrary code execution vulnerabilities present in pickle-based formats.',
    context: 'safetensors is the recommended format for model storage, replacing older .bin/.pt files.',
    relatedTerms: ['Model Format', 'GGUF', 'Model Registry'],
  },
  {
    term: 'Token',
    definition: 'The basic unit of text that language models process — roughly 4 characters or 0.75 words in English. Models have maximum context lengths measured in tokens.',
    context: 'GPT-4 has 8K-128K token context windows. A token is not a word — "tokenization" is 3 tokens.',
    relatedTerms: ['Tokenizer', 'Context Window', 'Inference'],
  },
  {
    term: 'TTFT (Time to First Token)',
    definition: 'The latency from receiving a user request to generating the first output token. Includes prompt processing and initial generation — but NOT model loading.',
    context: 'TTFT is a key inference metric. It\'s distinct from cold start time, which includes model loading.',
    relatedTerms: ['Cold Start', 'Inference', 'Latency'],
  },
  {
    term: 'Vector Database',
    definition: 'A database optimized for storing and searching high-dimensional vectors (embeddings). Uses specialized indexes (HNSW, IVF) for fast approximate nearest neighbor search.',
    context: 'Examples: Milvus, Weaviate, Pinecone, Qdrant, Chroma. Many use S3 as their durable backing store.',
    relatedTerms: ['Embedding', 'RAG', 'Semantic Search'],
  },
  {
    term: 'VRAM',
    definition: 'Video RAM — the GPU\'s high-bandwidth memory where model weights, KV cache, and intermediate activations live during inference. The primary constraint for serving large models.',
    context: 'An H100 has 80GB VRAM. A 70B model in FP16 needs ~140GB, requiring multi-GPU setups.',
    relatedTerms: ['GPU Memory', 'KV Cache', 'Model Loading'],
  },
  {
    term: 'WebDataset',
    definition: 'A format for storing training data as tar archives of samples, designed for efficient streaming from object storage. Each sample is a set of files with a common prefix.',
    context: 'WebDataset enables sequential reads and easy shuffling at the shard level — ideal for distributed training.',
    relatedTerms: ['DataLoader', 'Training Data', 'Sharding'],
  },
]

export default function Glossary() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredTerms = glossaryTerms.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group by first letter
  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const letter = term.term[0].toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(term)
    return acc
  }, {} as Record<string, GlossaryTerm[]>)

  const sortedLetters = Object.keys(groupedTerms).sort()

  return (
    <div>
      <PageHeader
        title="Glossary"
        subtitle="Jargon Decoder"
        description="AI/ML terminology explained the way an engineer would explain it at a whiteboard — not the way a textbook would. Focus on practical understanding."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-raspberry focus:border-raspberry outline-none transition-colors"
            />
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Letter Navigation */}
        <div className="mb-8 flex flex-wrap gap-2">
          {sortedLetters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-raspberry hover:text-white rounded font-medium text-sm transition-colors"
            >
              {letter}
            </a>
          ))}
        </div>

        {/* Terms */}
        <div className="space-y-12">
          {sortedLetters.map((letter) => (
            <div key={letter} id={`letter-${letter}`}>
              <h2 className="text-2xl font-bold text-raspberry mb-4 pb-2 border-b border-gray-200">
                {letter}
              </h2>
              <div className="space-y-6">
                {groupedTerms[letter].map((item) => (
                  <div key={item.term} className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.term}</h3>
                    <p className="text-gray-600 mb-3">{item.definition}</p>
                    
                    {item.context && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-raspberry">Example:</span> {item.context}
                        </p>
                      </div>
                    )}
                    
                    {item.relatedTerms && item.relatedTerms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500">Related:</span>
                        {item.relatedTerms.map((related) => (
                          <span 
                            key={related}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {related}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredTerms.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No terms found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  )
}
