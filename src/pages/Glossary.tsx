import { useState } from 'react'
import { PageHeader } from '../components/PipelineDiagram'

interface GlossaryTerm {
  term: string
  definition: string
  context?: string
  relatedTerms?: string[]
  category?: 'ai-ml' | 'storage' | 'minio'   // for filtering
}

const glossaryTerms: GlossaryTerm[] = [
  // =========================================================================
  // AI / ML TERMS
  // =========================================================================
  {
    term: 'Adapter (LoRA)',
    definition: 'Small, trainable matrices added to a frozen base model during fine-tuning. Instead of updating all model weights, only these adapters are trained — dramatically reducing compute and storage requirements.',
    context: 'A LoRA adapter for a 70B model might be 50-500MB, versus 140GB+ for the full model weights. Stored at s3://model-registry/{model}/adapters/{name}/{version}/.',
    relatedTerms: ['LoRA', 'QLoRA', 'Fine-Tuning', 'Model Registry'],
    category: 'ai-ml',
  },
  {
    term: 'Autoregressive Generation',
    definition: 'The process where a language model generates output one token at a time, with each new token depending on all previously generated tokens. This is why inference is sequential and why the KV cache matters.',
    context: 'Each forward pass generates one token. A 100-token response requires 100 forward passes. Storage is NOT in this loop — it\'s pure GPU VRAM compute.',
    relatedTerms: ['Forward Pass', 'KV Cache', 'Token'],
    category: 'ai-ml',
  },
  {
    term: 'Checkpoint',
    definition: 'A snapshot of the training state at a particular point — includes model weights, optimizer state, scheduler state, and training metadata. Used for disaster recovery and resuming interrupted training.',
    context: 'A full training checkpoint for a 70B model with Adam optimizer can exceed 500GB (model + 2-4x for optimizer momentum). Protected by MinIO AIStor erasure coding (Reed-Solomon).',
    relatedTerms: ['Optimizer State', 'Erasure Coding', 'Training Loop'],
    category: 'ai-ml',
  },
  {
    term: 'Chunking',
    definition: 'The process of splitting documents into smaller segments for embedding and retrieval in RAG systems. Chunk size affects retrieval quality — too large loses precision, too small loses context.',
    context: 'Common chunk sizes are 256-1024 tokens. Overlapping chunks help preserve context at boundaries. Chunks stored at s3://rag-processed/chunks/.',
    relatedTerms: ['RAG', 'Embedding', 'Vector Database'],
    category: 'ai-ml',
  },
  {
    term: 'Cold Start',
    definition: 'When an inference instance starts up and must load model weights from storage into GPU memory before serving requests. Cold start time directly impacts autoscaling responsiveness.',
    context: 'A 70B model (140GB) at MinIO AIStor\'s 325 GiB/s GET throughput loads in under 1 second at cluster scale. At 10 GB/s, ~14 seconds. At 1 GB/s, over 2 minutes.',
    relatedTerms: ['Model Loading', 'TTFT', 'MinIO Cache'],
    category: 'ai-ml',
  },
  {
    term: 'DataLoader',
    definition: 'Component in training frameworks (like PyTorch) that handles reading data from storage, batching, shuffling, and prefetching. Sits between object storage and GPU, managing the data pipeline.',
    context: 'Modern DataLoaders use prefetch buffers and multiple workers to hide storage latency. Target: 325 GiB/s aggregate read throughput to keep GPU clusters fed.',
    relatedTerms: ['Prefetch', 'Training Loop', 'WebDataset', 'MinIO Cache'],
    category: 'ai-ml',
  },
  {
    term: 'Embedding',
    definition: 'A dense vector representation of text (or other data) in a high-dimensional space where similar items are close together. Created by embedding models and stored in vector databases for similarity search.',
    context: 'Common embedding dimensions: 384, 768, 1024, 1536. Higher dimensions capture more nuance but cost more storage and compute.',
    relatedTerms: ['Vector Database', 'RAG', 'Semantic Search'],
    category: 'ai-ml',
  },
  {
    term: 'Forward Pass',
    definition: 'A single pass of input data through a neural network to produce an output. During inference, this is the core computation that happens entirely in GPU memory — no storage I/O involved.',
    context: 'The forward pass involves matrix multiplications through transformer layers: attention + FFN. Storage is not in the forward pass — everything runs in GPU memory.',
    relatedTerms: ['Inference', 'Autoregressive Generation', 'GPU Memory'],
    category: 'ai-ml',
  },
  {
    term: 'GGUF',
    definition: 'A file format for storing quantized language models, designed for efficient loading and inference. Successor to GGML format, used by llama.cpp and related tools.',
    context: 'GGUF files are typically smaller than safetensors due to quantization (4-bit, 8-bit, etc.). Stored in the model registry like any other artifact.',
    relatedTerms: ['Quantization', 'safetensors', 'Model Registry'],
    category: 'ai-ml',
  },
  {
    term: 'KV Cache',
    definition: 'The key-value cache in transformer attention that stores computed attention states from previous tokens. Grows linearly with sequence length and lives entirely in GPU VRAM during inference.',
    context: 'For a 70B model with 128K context, KV cache can consume tens of GB of VRAM per sequence. This is Tier 0 (NVMe block / VRAM) — not MinIO AIStor.',
    relatedTerms: ['Attention', 'VRAM', 'Inference'],
    category: 'ai-ml',
  },
  {
    term: 'LoRA (Low-Rank Adaptation)',
    definition: 'A fine-tuning technique that freezes the base model and trains small rank-decomposition matrices. Enables domain adaptation with minimal storage and compute overhead.',
    context: 'LoRA typically trains <1% of the parameters, resulting in adapters that are 1,000-5,000x smaller than full model weights (~100MB vs ~500GB).',
    relatedTerms: ['Adapter', 'Fine-Tuning', 'QLoRA'],
    category: 'ai-ml',
  },
  {
    term: 'Medallion Architecture',
    definition: 'A data architecture pattern that organizes data into three layers: Bronze (raw), Silver (cleaned/validated), and Gold (curated/ready for consumption). Used with Iceberg/Delta S3 Tables on MinIO AIStor.',
    context: 'Each layer is a full read-write cycle through S3. Bronze → Silver deduplication can remove 30-50% of data. Gold contains tokenized shards for DataLoader streaming.',
    relatedTerms: ['Data Lake', 'Iceberg', 'S3 Tables', 'Object Storage'],
    category: 'ai-ml',
  },
  {
    term: 'Model Registry',
    definition: 'A versioned repository of model artifacts — weights, configurations, metadata. Provides the source of truth for what models exist and which versions are deployed.',
    context: 'MinIO AIStor is the natural backing store: versioned, durable, S3-compatible, with Object Lock for immutable artifacts and MinIO Catalog for GraphQL metadata search.',
    relatedTerms: ['Model Versioning', 'safetensors', 'Object Lock', 'MinIO Catalog'],
    category: 'ai-ml',
  },
  {
    term: 'ONNX',
    definition: 'Open Neural Network Exchange — an open format for representing machine learning models. Enables interoperability between frameworks and optimized inference runtimes.',
    context: 'Models can be exported from PyTorch/TensorFlow to ONNX and run on ONNX Runtime for inference. Stored as versioned artifacts in the model registry.',
    relatedTerms: ['Model Format', 'safetensors', 'Inference'],
    category: 'ai-ml',
  },
  {
    term: 'Optimizer State',
    definition: 'The internal state of the training optimizer (like Adam) — includes momentum terms and variance estimates for each parameter. Can be 2-4x the size of model weights.',
    context: 'A 70B model with Adam has ~140GB of weights + ~400GB of optimizer state = 500GB+ checkpoints. This is why checkpoint storage and erasure coding matter.',
    relatedTerms: ['Checkpoint', 'Adam', 'Training', 'Erasure Coding'],
    category: 'ai-ml',
  },
  {
    term: 'Prefetch',
    definition: 'Loading data from storage into memory before it\'s needed, hiding storage latency from the compute pipeline. Critical for keeping GPUs fed during training.',
    context: 'DataLoaders prefetch multiple batches ahead while the GPU processes the current batch. MinIO Cache provides an additional DRAM-level prefetch layer.',
    relatedTerms: ['DataLoader', 'Training Loop', 'Throughput', 'MinIO Cache'],
    category: 'ai-ml',
  },
  {
    term: 'QLoRA',
    definition: 'Quantized LoRA — combines LoRA fine-tuning with 4-bit quantization of the base model. Enables fine-tuning of large models on consumer GPUs with minimal quality loss.',
    context: 'QLoRA can fine-tune a 65B model on a single 48GB GPU by loading the base model in 4-bit precision. The adapter itself is still stored in full precision.',
    relatedTerms: ['LoRA', 'Quantization', 'Fine-Tuning'],
    category: 'ai-ml',
  },
  {
    term: 'Quantization',
    definition: 'Reducing the numerical precision of model weights (e.g., from FP16 to INT8 or INT4). Reduces memory footprint and can speed up inference, with some quality trade-off.',
    context: 'A 70B model goes from ~140GB (FP16) to ~70GB (INT8) to ~35GB (INT4). Less VRAM needed, faster cold start from storage.',
    relatedTerms: ['GGUF', 'QLoRA', 'Inference', 'Cold Start'],
    category: 'ai-ml',
  },
  {
    term: 'RAG (Retrieval-Augmented Generation)',
    definition: 'A technique that enhances LLM responses by retrieving relevant context from external documents at query time. Combines retrieval (search) with generation (LLM).',
    context: 'RAG is not pure inference — it\'s a pipeline with distinct ingestion, retrieval, and generation phases. Storage is central to the ingestion pipeline and may be in the query path.',
    relatedTerms: ['Vector Database', 'Embedding', 'Chunking'],
    category: 'ai-ml',
  },
  {
    term: 'RLHF (Reinforcement Learning from Human Feedback)',
    definition: 'A technique for aligning language models with human preferences using feedback data (preference pairs). Creates the feedback loop from inference back to fine-tuning.',
    context: 'Preference pairs stored at s3://feedback-data/rlhf/preference-pairs/. Object Lock ensures immutable audit trails. This closes the lifecycle loop.',
    relatedTerms: ['Fine-Tuning', 'DPO', 'Feedback Loop', 'Object Lock'],
    category: 'ai-ml',
  },
  {
    term: 'safetensors',
    definition: 'A safe and fast file format for storing tensors (model weights). Designed to prevent arbitrary code execution vulnerabilities present in pickle-based formats.',
    context: 'safetensors is the recommended format for model storage, replacing older .bin/.pt files. Stored at s3://model-registry/{model}/{version}/model.safetensors.',
    relatedTerms: ['Model Format', 'GGUF', 'Model Registry'],
    category: 'ai-ml',
  },
  {
    term: 'Token',
    definition: 'The basic unit of text that language models process — roughly 4 characters or 0.75 words in English. Models have maximum context lengths measured in tokens.',
    context: 'GPT-4 has 8K-128K token context windows. A token is not a word — "tokenization" is 3 tokens.',
    relatedTerms: ['Tokenizer', 'Context Window', 'Inference'],
    category: 'ai-ml',
  },
  {
    term: 'TTFT (Time to First Token)',
    definition: 'The latency from receiving a user request to generating the first output token. Includes prompt processing and initial generation — but NOT model loading.',
    context: 'TTFT is a key inference metric. It\'s distinct from cold start time, which includes model loading from storage.',
    relatedTerms: ['Cold Start', 'Inference', 'Latency'],
    category: 'ai-ml',
  },
  {
    term: 'Vector Database',
    definition: 'A database optimized for storing and searching high-dimensional vectors (embeddings). Uses specialized indexes (HNSW, IVF) for fast approximate nearest neighbor search.',
    context: 'Examples: Milvus, Weaviate, Qdrant, Chroma. Many use S3 (MinIO AIStor) as their durable backing store. HNSW index lives on Tier 0 NVMe for <500us lookups.',
    relatedTerms: ['Embedding', 'RAG', 'Semantic Search', 'HNSW'],
    category: 'ai-ml',
  },
  {
    term: 'VRAM',
    definition: 'Video RAM — the GPU\'s high-bandwidth memory where model weights, KV cache, and intermediate activations live during inference. The primary constraint for serving large models.',
    context: 'An H100 has 80GB VRAM. A 70B model in FP16 needs ~140GB, requiring multi-GPU setups. This is Tier 0 — not object storage.',
    relatedTerms: ['GPU Memory', 'KV Cache', 'Model Loading'],
    category: 'ai-ml',
  },
  {
    term: 'WebDataset',
    definition: 'A format for storing training data as tar archives of samples, designed for efficient streaming from object storage. Each sample is a set of files with a common prefix.',
    context: 'WebDataset enables sequential reads and easy shuffling at the shard level — ideal for distributed training from S3 at 325 GiB/s aggregate throughput.',
    relatedTerms: ['DataLoader', 'Training Data', 'Sharding'],
    category: 'ai-ml',
  },

  // =========================================================================
  // STORAGE INFRASTRUCTURE TERMS
  // =========================================================================
  {
    term: 'Disaggregated Architecture',
    definition: 'An infrastructure pattern that separates compute and storage into independent, independently-scalable tiers. Compute nodes (GPUs) and storage nodes scale independently based on workload needs.',
    context: 'MinIO AIStor enables disaggregated architecture for AI: scale GPU clusters without touching storage, and scale storage without reconfiguring compute. The whitepaper calls this "AI data lake architecture."',
    relatedTerms: ['Object Storage', 'Data Lake', 'Kubernetes'],
    category: 'storage',
  },
  {
    term: 'Erasure Coding',
    definition: 'A data protection method that splits data into fragments with redundant parity data, allowing reconstruction if some fragments are lost. MinIO uses per-object inline Reed-Solomon coding written in assembly.',
    context: 'A 12-drive, 6-parity configuration tolerates up to 5 drive failures (~50% drive loss). More storage-efficient than triple replication. The whitepaper benchmarks show negligible performance impact.',
    relatedTerms: ['Durability', 'Object Storage', 'BitRot Protection', 'Reed-Solomon'],
    category: 'storage',
  },
  {
    term: 'GPU-Direct Storage (GDS)',
    definition: 'A technology allowing direct data transfer between storage and GPU memory, bypassing the CPU. Used for Tier 0 NVMe block I/O with cuFile. Not S3 — raw block access.',
    context: 'GDS via cuFile loads model weights directly to H200 VRAM over PCIe 5/6. This is Tier 0 — MinIO AIStor starts at Tier 1 (S3 API).',
    relatedTerms: ['NVMe', 'VRAM', 'Tier 0'],
    category: 'storage',
  },
  {
    term: 'HNSW (Hierarchical Navigable Small Worlds)',
    definition: 'A graph-based approximate nearest neighbor search algorithm used by vector databases. Provides sub-millisecond lookup times when the index fits on local NVMe.',
    context: 'Weaviate uses HNSW on Tier 0 NVMe for <500us lookups. The index itself is memory-mapped block I/O — not object storage. S3 provides backup/restore.',
    relatedTerms: ['Vector Database', 'NVMe', 'RAG'],
    category: 'storage',
  },
  {
    term: 'NVMe (Non-Volatile Memory Express)',
    definition: 'A high-speed storage interface that connects directly to the CPU/GPU via PCIe. Provides the lowest latency storage tier (<100us) for shuffle, KV cache, and vector indexes.',
    context: 'Tier 0 = local NVMe block (NOT MinIO AIStor). Tier 1 = MinIO AIStor on local NVMe via S3 API. Tier 2 = MinIO AIStor over RDMA to remote NVMe.',
    relatedTerms: ['Tier 0', 'Tier 1', 'PCIe', 'GDS'],
    category: 'storage',
  },
  {
    term: 'Object Storage',
    definition: 'A storage architecture that manages data as discrete objects with metadata, accessed via HTTP/S3 APIs. Scales to exabytes, provides durability via erasure coding, and is the foundation of AI data infrastructure.',
    context: 'S3-compatible object storage is the de facto standard for AI/ML. The whitepaper states "all major LLMs were trained on data stored in an object store." MinIO AIStor is the implementation.',
    relatedTerms: ['S3', 'MinIO AIStor', 'Data Lake', 'Erasure Coding'],
    category: 'storage',
  },
  {
    term: 'RDMA (Remote Direct Memory Access)',
    definition: 'A networking technology that allows direct memory-to-memory data transfer between computers, bypassing the OS kernel. RoCE v2 (RDMA over Converged Ethernet) enables this over standard Ethernet.',
    context: 'Tier 2 uses S3 over RDMA to NVMe at 400 GbE (RoCE v2). This is how MinIO AIStor achieves 325 GiB/s GET throughput on a 32-node cluster.',
    relatedTerms: ['RoCE', 'Tier 2', '400 GbE'],
    category: 'storage',
  },
  {
    term: 'S3 API',
    definition: 'The de facto standard API for object storage, originally defined by Amazon Web Services. Provides operations for buckets, objects, versioning, locking, lifecycle management, and encryption.',
    context: 'The whitepaper states MinIO provides "the most complete S3 API implementation outside AWS." Compatible with TensorFlow, Kubeflow, Spark, Presto, Trino, and virtually all ML tools.',
    relatedTerms: ['Object Storage', 'MinIO AIStor', 'Bucket'],
    category: 'storage',
  },

  // =========================================================================
  // MinIO AIStor SPECIFIC TERMS (from whitepaper)
  // =========================================================================
  {
    term: 'MinIO AIStor',
    definition: 'MinIO\'s commercial enterprise object storage suite for AI data infrastructure. Includes Cache, Catalog, Firewall, KMS, Observability, and Global Console — with 24/7 support.',
    context: 'The whitepaper positions AIStor as the complete storage platform for AI: from PB-scale data lakes to model registries. Benchmarks: 325 GiB/s GET, 165 GiB/s PUT (32-node), 2.5 TiB/s (300-server).',
    relatedTerms: ['MinIO Cache', 'MinIO Catalog', 'MinIO Firewall', 'Object Storage'],
    category: 'minio',
  },
  {
    term: 'MinIO Cache',
    definition: 'A distributed shared DRAM cache that accelerates read-heavy workloads. Designed to prevent GPU starvation during DataLoader streaming and enable sub-second LoRA adapter hot-swaps.',
    context: 'Whitepaper: "MinIO Cache is a distributed shared DRAM cache designed for ultra-high-performance AI workloads." Sits between the application and the erasure-coded storage layer.',
    relatedTerms: ['MinIO AIStor', 'DataLoader', 'Cold Start', 'Adapter'],
    category: 'minio',
  },
  {
    term: 'MinIO Catalog',
    definition: 'A GraphQL-based namespace and metadata search engine. Enables discovery and querying across billions of objects — find any model, adapter, checkpoint, or dataset by metadata.',
    context: 'Whitepaper: "MinIO Catalog" provides GraphQL-based search. Essential for organizations managing thousands of model versions, adapters, and experiment artifacts.',
    relatedTerms: ['MinIO AIStor', 'Model Registry', 'GraphQL'],
    category: 'minio',
  },
  {
    term: 'MinIO Firewall',
    definition: 'An S3-aware, data-centric firewall that handles TLS termination, load balancing, and Quality of Service (QoS). Secures the data path without sacrificing throughput.',
    context: 'Whitepaper: "MinIO Firewall" is an S3-aware firewall. Unlike generic network firewalls, it understands S3 operations and can enforce data-centric policies.',
    relatedTerms: ['MinIO AIStor', 'Security', 'TLS'],
    category: 'minio',
  },
  {
    term: 'S3 Select',
    definition: 'A feature that enables SQL-like queries on objects (CSV, JSON, Parquet) server-side, returning only matching data. MinIO\'s implementation uses SIMD acceleration for high throughput.',
    context: 'Whitepaper: MinIO\'s S3 Select is SIMD-accelerated. Reduces bandwidth by 80%+ by filtering data at the storage layer — essential for ELT, log analytics, and feature retrieval.',
    relatedTerms: ['MinIO AIStor', 'Parquet', 'SIMD', 'Data Processing'],
    category: 'minio',
  },
  {
    term: 'S3 Tables (Iceberg/Delta)',
    definition: 'Open table formats (Apache Iceberg, Delta Lake, Apache Hudi) that provide ACID transactions, time travel, and schema evolution on top of S3 object storage.',
    context: 'The Medallion architecture (Bronze → Silver → Gold) runs on S3 Tables. MinIO AIStor provides the S3 foundation; Iceberg/Delta provide the table semantics.',
    relatedTerms: ['Medallion Architecture', 'Iceberg', 'Data Lake', 'Object Storage'],
    category: 'minio',
  },
  {
    term: 'Object Lock (WORM)',
    definition: 'A feature that makes objects immutable for a specified retention period. Supports governance and compliance modes with legal holds. Objects cannot be modified or deleted until retention expires.',
    context: 'Whitepaper: Compliant with SEC 17a-4(f), FINRA 4511(c), CFTC 1.31(c-d). Essential for model artifacts, audit logs, and regulatory compliance in AI deployments.',
    relatedTerms: ['MinIO AIStor', 'Compliance', 'Immutability', 'Retention'],
    category: 'minio',
  },
  {
    term: 'BitRot Protection',
    definition: 'A data integrity feature that uses HighwayHash (SIMD-accelerated, >10 GB/s per core) to verify data integrity on every read and write. Detects and repairs silent data corruption automatically.',
    context: 'Whitepaper: "BitRot protection" with HighwayHash >10 GB/s per core. Combined with inline healing, MinIO can detect and repair corrupted data blocks on read.',
    relatedTerms: ['MinIO AIStor', 'HighwayHash', 'Erasure Coding', 'Data Integrity'],
    category: 'minio',
  },
  {
    term: 'Bucket Notifications',
    definition: 'Event-driven triggers that fire when objects are created, accessed, or deleted. Supports Kafka, NATS, AMQP, MQTT, Webhooks, Elasticsearch, Redis, PostgreSQL, and MySQL as targets.',
    context: 'Whitepaper: "Lambda Notifications" with extensive target support. In AI pipelines, triggers RAG re-embedding on document upload, checkpoint validation, and RLHF pipeline kickoff.',
    relatedTerms: ['MinIO AIStor', 'Event-Driven', 'Kafka', 'NATS'],
    category: 'minio',
  },
  {
    term: 'Lifecycle Management (ILM)',
    definition: 'Automatic rules that manage object lifecycle: tiering between storage classes, expiring temporary data, and transitioning old objects to cold storage.',
    context: 'Whitepaper: "ILM" for automatic tiering and expiration. In AI pipelines: tier old inference logs from Tier 2 → Tier 3, expire intermediate Bronze data, enforce retention windows.',
    relatedTerms: ['MinIO AIStor', 'Tiering', 'Storage Tiers', 'Expiration'],
    category: 'minio',
  },
  {
    term: 'Active-Active Replication',
    definition: 'Near-synchronous replication between two or more MinIO sites where both sites accept reads and writes simultaneously. Provides disaster recovery and geographic distribution.',
    context: 'Whitepaper: Active-Active, Active-Passive, and Batch replication modes. Essential for multi-site model registry sync and distributed inference log collection.',
    relatedTerms: ['MinIO AIStor', 'Disaster Recovery', 'Replication'],
    category: 'minio',
  },
  {
    term: 'MinIO Sidekick',
    definition: 'A tiny sidecar load-balancer that sits alongside application pods, eliminating the network hop to a centralized load balancer. Minimizes latency for S3 API calls.',
    context: 'Whitepaper: "Sidekick" eliminates network hops. Deployed as a sidecar container in Kubernetes pods that need low-latency S3 access (DataLoaders, inference engines).',
    relatedTerms: ['MinIO AIStor', 'Kubernetes', 'Load Balancing'],
    category: 'minio',
  },
  {
    term: 'Global Console',
    definition: 'MinIO\'s unified management interface — a single pane of glass for managing MinIO instances across multiple clouds, data centers, and edge locations.',
    context: 'Whitepaper: "Global Console" for centralized management. Manage storage tiers, IAM policies, replication, and observability from one interface.',
    relatedTerms: ['MinIO AIStor', 'Multi-Cloud', 'Management'],
    category: 'minio',
  },
  {
    term: 'Inline Healing',
    definition: 'MinIO\'s ability to detect and repair erasure-coded data blocks automatically on read, without requiring a separate rebuild process. Object-level healing, not drive-level.',
    context: 'Whitepaper: "Inline Healing" at the object level. When a read detects a corrupted shard via BitRot hash check, the remaining healthy shards rebuild the data in real time.',
    relatedTerms: ['Erasure Coding', 'BitRot Protection', 'Data Integrity'],
    category: 'minio',
  },
]

type CategoryFilter = 'all' | 'ai-ml' | 'storage' | 'minio'

export default function Glossary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const filteredTerms = glossaryTerms.filter(item => {
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const letter = term.term[0].toUpperCase()
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(term)
    return acc
  }, {} as Record<string, GlossaryTerm[]>)

  const sortedLetters = Object.keys(groupedTerms).sort()

  const categoryBadge = (cat?: string) => {
    switch (cat) {
      case 'minio': return { label: 'MinIO AIStor', color: 'bg-raspberry/10 text-raspberry border-raspberry/20' }
      case 'storage': return { label: 'Storage Infra', color: 'bg-amber-100 text-amber-700 border-amber-200' }
      case 'ai-ml': return { label: 'AI/ML', color: 'bg-blue-100 text-blue-700 border-blue-200' }
      default: return null
    }
  }

  return (
    <div>
      <PageHeader
        title="Glossary"
        subtitle="AI Storage Jargon Decoder"
        description="AI/ML and storage terminology explained the way an engineer would explain it at a whiteboard — not the way a textbook would. MinIO AIStor features cross-referenced with the whitepaper."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-4 pl-14 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-raspberry/10 focus:border-raspberry outline-none transition-all text-lg"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-gray-700">Filter:</span>
          {[
            { id: 'all' as CategoryFilter, label: 'All Terms', count: glossaryTerms.length },
            { id: 'ai-ml' as CategoryFilter, label: 'AI/ML', count: glossaryTerms.filter(t => t.category === 'ai-ml').length },
            { id: 'storage' as CategoryFilter, label: 'Storage Infra', count: glossaryTerms.filter(t => t.category === 'storage').length },
            { id: 'minio' as CategoryFilter, label: 'MinIO AIStor', count: glossaryTerms.filter(t => t.category === 'minio').length },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                categoryFilter === cat.id
                  ? 'bg-raspberry text-white shadow-lg shadow-raspberry/30'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-raspberry/30'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        <p className="mb-8 text-sm text-gray-500 text-center">
          {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''} {searchTerm ? 'matching your search' : categoryFilter !== 'all' ? `in ${categoryFilter === 'minio' ? 'MinIO AIStor' : categoryFilter === 'ai-ml' ? 'AI/ML' : 'Storage Infra'}` : 'in glossary'}
        </p>

        {/* Letter Navigation */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {sortedLetters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gradient-to-br hover:from-raspberry hover:to-raspberry-dark hover:text-white border border-gray-200 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-raspberry/20"
            >
              {letter}
            </a>
          ))}
        </div>

        {/* Terms */}
        <div className="space-y-12">
          {sortedLetters.map((letter) => (
            <div key={letter} id={`letter-${letter}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-raspberry to-raspberry-dark rounded-xl flex items-center justify-center shadow-lg shadow-raspberry/20">
                  <span className="text-xl font-bold text-white">{letter}</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-raspberry/30 to-transparent" />
              </div>

              <div className="space-y-4">
                {groupedTerms[letter].map((item) => {
                  const badge = categoryBadge(item.category)
                  return (
                    <div
                      key={item.term}
                      className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-raspberry/30 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-raspberry transition-colors">
                          {item.term}
                        </h3>
                        {badge && (
                          <span className={`flex-shrink-0 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">{item.definition}</p>

                      {item.context && (
                        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 mb-4 border border-gray-100">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold text-raspberry">In practice:</span> {item.context}
                          </p>
                        </div>
                      )}

                      {item.relatedTerms && item.relatedTerms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Related:</span>
                          {item.relatedTerms.map((related) => (
                            <span
                              key={related}
                              className="px-3 py-1 text-xs bg-gray-100 hover:bg-raspberry/10 hover:text-raspberry text-gray-600 rounded-full transition-colors cursor-pointer"
                              onClick={() => setSearchTerm(related)}
                            >
                              {related}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredTerms.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No terms found matching "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-raspberry hover:text-raspberry-dark font-medium transition-colors"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
