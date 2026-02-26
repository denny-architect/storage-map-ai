# AI Training Reference Architecture
## META-Inspired, MinIO-Powered
### A Prescriptive Guide for Storage Veterans

**Created**: February 26, 2026  
**Live Demo**: https://denny-architect.github.io/storage-map-ai/explorer  
**Repository**: https://github.com/denny-architect/storage-map-ai

---

## Executive Summary

This document captures the prescriptive AI training storage architecture developed for MinIO presales training. It translates complex AI infrastructure concepts into familiar storage terminology for professionals with deep SAN/NAS/iSCSI backgrounds but limited AI/ML exposure.

**Key Insight**: Storage is NOT in the critical path during GPU training. The training loop runs entirely in GPU memory. Storage handles: Before (data loading), During (periodic checkpoints), and After (model saving).

---

## The Stack (ONE Choice Per Category)

| Category | Primary Choice | Alternatives |
|----------|---------------|--------------|
| **Platform** | OpenShift AI | Kubernetes, EKS/GKE |
| **Hardware** | 8-Node GPU Cluster | HPE ProLiant DL380a, Dell PowerEdge |
| **GPUs** | NVIDIA H200 | H100, A100 |
| **Training Framework** | PyTorch | TensorFlow, JAX |
| **Distributed** | Ray | Horovod, DeepSpeed |
| **Data Engineering** | Spark | Dask, Polars |
| **Table Format** | Iceberg | Delta Lake, Hudi |
| **MLOps** | MLflow | Kubeflow, W&B |
| **Vector DB** | Weaviate | Milvus, Pinecone, pgvector |
| **Serving** | vLLM | TensorRT-LLM, Triton |
| **Storage** | **MinIO AIStor** | *(Non-negotiable)* |

---

## The 4-Tier Storage Architecture

### Tier 0: Raw Block / GDS
| Attribute | Value |
|-----------|-------|
| **What** | Local NVMe, GPU-Direct Storage (GDS), mmap, PVCs |
| **Capacity** | Node-local (TBs) |
| **Latency** | <100μs |
| **MinIO?** | **NO** - Pure block I/O |
| **Like** | HBA direct-attach to server |
| **NOT Like** | iSCSI over network |

**Use Cases**: Spark Shuffle, Weaviate HNSW index, vLLM model weights/KV cache

### Tier 1: Hot S3 (In-Cluster MinIO)
| Attribute | Value |
|-----------|-------|
| **What** | MinIO Pod on local NVMe inside the K8s cluster |
| **Capacity** | 100s TB+ |
| **Latency** | 1-5ms |
| **MinIO?** | **YES** - Operational S3 |
| **Like** | NVMe-oF to nearby storage |
| **NOT Like** | SAN over FC fabric |

**Use Cases**: PyTorch DataLoaders, Kubeflow artifacts, MLflow registry (active models)

### Tier 2: Warm S3 (MinIO AIStor - Capacity)
| Attribute | Value |
|-----------|-------|
| **What** | MinIO AIStor - THE capacity tier, data lake |
| **Capacity** | PB+ |
| **Latency** | 5-15ms |
| **MinIO?** | **YES** - Capacity tier |
| **Like** | Enterprise SAN (NetApp, Pure) |
| **NOT Like** | Your grandfather's NAS |

**Use Cases**: Checkpoints, Feature Store (Feast), Model staging, Medallion (Bronze/Silver/Gold), S3 Tables (Iceberg/Delta)

### Tier 3: Cold Archive (MinIO AIStor - Compliance)
| Attribute | Value |
|-----------|-------|
| **What** | MinIO AIStor with Object Lock, ILM tiering |
| **Capacity** | EB+ |
| **Latency** | 15-50ms |
| **MinIO?** | **YES** - Archive/compliance |
| **Like** | Tape library (but accessible) |
| **NOT Like** | Glacier (we're on-prem) |

**Use Cases**: TrustyAI audit logs, Model archives, Historical training data, 7-year retention (SEC 17a-4)

---

## The 10-Phase Training Pipeline

### Phase 1: Data Ingestion
- **Storage Op**: WRITE → Bronze layer
- **Tier**: 2 (MinIO AIStor)
- **I/O Pattern**: Sequential writes, massive volume
- **Data Volume**: Petabytes
- **Latency Req**: 5-15ms OK (batch)
- **MinIO Role**: Data Lake Foundation
- **META Comparison**: META uses Tectonic distributed FS. You use MinIO AIStor.

### Phase 2: ELT Processing
- **Storage Op**: READ Bronze → WRITE Silver/Gold
- **Tier**: 2 (MinIO AIStor)
- **I/O Pattern**: Batch R/W, Iceberg tables
- **Data Volume**: Terabytes per job
- **Latency Req**: 5-15ms (batch)
- **MinIO Role**: Medallion Architecture Host
- **META Comparison**: META uses custom data preprocessing. You use Spark + Iceberg on MinIO.

### Phase 3: Spark Shuffle
- **Storage Op**: Ephemeral R/W
- **Tier**: 0 (Local NVMe - NOT MinIO)
- **I/O Pattern**: Random I/O, <100μs required
- **Data Volume**: GBs-TBs per job
- **Latency Req**: <100μs (critical)
- **MinIO Role**: **NONE** - Local NVMe only
- **META Comparison**: META uses local NVMe shuffle. Same approach.

### Phase 4: DataLoader Streaming
- **Storage Op**: READ Gold shards → GPU memory
- **Tier**: 1 (In-cluster MinIO)
- **I/O Pattern**: Sequential reads, prefetch, 325 GiB/s
- **Data Volume**: Continuous stream
- **Latency Req**: 1-5ms (throughput > latency)
- **MinIO Role**: Hot S3 Cache (in-cluster)
- **META Comparison**: META achieves 16 TB/s to 16K GPUs. You get 325 GiB/s per node.

### Phase 5: GPU Training Loop
- **Storage Op**: **NONE** - GPU memory only
- **Tier**: 0 (No storage I/O)
- **I/O Pattern**: Compute-bound, no storage I/O
- **Data Volume**: Weights in VRAM (GBs-TBs)
- **Latency Req**: N/A - memory-resident
- **MinIO Role**: **NONE** during active training
- **META Comparison**: META achieves 400 TFLOPs/GPU. Same H200 = same math.

### Phase 6: Checkpointing
- **Storage Op**: WRITE model + optimizer state
- **Tier**: 2 (MinIO AIStor)
- **I/O Pattern**: Bursty large sequential writes
- **Data Volume**: 500GB-1TB per checkpoint (70B model)
- **Latency Req**: 5-15ms OK (periodic burst)
- **MinIO Role**: Durable checkpoint store
- **META Comparison**: META uses Tectonic synchronized checkpoints. You use MinIO AIStor.

### Phase 7: Experiment Tracking
- **Storage Op**: WRITE artifacts + READ for analysis
- **Tier**: 1 (In-cluster MinIO)
- **I/O Pattern**: Mixed small-medium objects
- **Data Volume**: GBs per experiment
- **Latency Req**: 1-5ms
- **MinIO Role**: MLflow artifact backend
- **META Comparison**: META uses internal tooling. You use MLflow + MinIO.

### Phase 8: Embedding/Vectorization (RAG)
- **Storage Op**: READ docs → WRITE vectors
- **Tier**: 0 (Local NVMe - NOT MinIO)
- **I/O Pattern**: Random access, <500μs for HNSW
- **Data Volume**: Millions of vectors
- **Latency Req**: <500μs (query time)
- **MinIO Role**: **NONE** - Weaviate on local NVMe
- **META Comparison**: META architecture not public for this. You use Weaviate PVC on local NVMe.

### Phase 9: Model Export
- **Storage Op**: WRITE final model
- **Tier**: 2 (MinIO AIStor)
- **I/O Pattern**: Large sequential write, versioned
- **Data Volume**: 100s GB per model
- **Latency Req**: 5-15ms
- **MinIO Role**: Model Registry (S3 versioning)
- **META Comparison**: META uses internal registry. You use MinIO with versioning.

### Phase 10: Compliance Archive
- **Storage Op**: WRITE-once, read-rarely
- **Tier**: 3 (MinIO AIStor Archive)
- **I/O Pattern**: Archive, ILM auto-tiered
- **Data Volume**: Exabytes over time
- **Latency Req**: 15-50ms OK
- **MinIO Role**: Object Lock, WORM, SEC 17a-4
- **META Comparison**: Same compliance requirements. MinIO Object Lock handles it.

---

## Storage Veteran Translation Guide

### The Core Misconception

**Your instinct**: "GPU talks to storage like iSCSI initiator talks to target."

**Reality**: GPU doesn't "talk to storage" during training at all.

The GPU is the **COMPUTE**. Storage is the **STAGING AREA**.
- Data is **PRELOADED** into GPU VRAM before training starts
- Training loop runs **ENTIRELY** in GPU memory (no storage I/O)
- Checkpoints are **PERIODIC WRITES** (not continuous I/O)

### The Translation Table

| Old World (SAN/NAS) | AI World | Purpose |
|---------------------|----------|---------|
| iSCSI Initiator | RDMA NIC (ConnectX-7) | GPU-to-GPU gradient sync |
| TOE Card | DPU (BlueField-3) | Network offload, NOT storage |
| SAN Target | MinIO AIStor | Data Lake + Checkpoints |
| LUN | S3 Bucket | Namespace for objects |
| RAID Controller | Erasure Coding | Data protection |
| FC Fabric | RoCE v2 / InfiniBand | GPU interconnect |
| Storage IOPS | GPU TFLOPs | Performance metric that matters |
| Block size | Object size | Data unit |

### Think of it Like This

| Old Pattern | New Pattern |
|-------------|-------------|
| Database server doing random I/O to SAN all day | Load the dataset, train for hours in memory, occasionally save |
| Storage in critical path (latency matters every ms) | Storage for staging/checkpoints (throughput matters, latency tolerant) |
| IOPS = performance | TFLOPs = performance |

---

## META Llama 3 Reference (What We're Emulating)

### META's Infrastructure (Llama 3 405B Training)
- **GPUs**: 16,384 H100 GPUs across 2,048 nodes
- **Platform**: Grand Teton (open-sourced to OCP)
- **Network**: RoCE OR InfiniBand (400Gbps endpoints)
- **Storage**: Tectonic (custom distributed FS) + Hammerspace (parallel NFS)
- **Throughput**: 16 TB/s to 16K GPUs
- **Capacity**: Exabyte-scale

### Key META Numbers
- 405B parameters
- 3.8 × 10²⁵ FLOPs total training compute
- 400 TFLOPs per GPU achieved (8K sequence length)
- 380 TFLOPs per GPU (131K sequence length)
- 4D Parallelism: FSDP + TP + PP + CP

### The MinIO Value Proposition

**META had to build Tectonic from scratch.**

**You get META-class storage architecture with MinIO AIStor:**
- Same S3 API
- Same performance class (325 GiB/s GET throughput)
- Same erasure coding durability
- Fraction of the engineering effort

---

## Data Lake vs Data Lakehouse

### Approach 1: "The Swamp Evolution" 🏚️

**DATA LAKE (The Swamp)**
- Raw files dumped in S3 — Parquet, CSV, JSON chaos
- No schema, no ACID, no governance
- "Data Swamp" — nobody knows what's in there

↓ *Years later...* ↓

**DATA LAKEHOUSE (Bolted On)**
- Iceberg/Delta/Hudi table format ADDED on top
- Now you have schema, ACID, time travel
- **But the swamp is still underneath**
- Retrofitted governance, migration pain

### Approach 2: "Born Clean" ✨

**DATA LAKEHOUSE (Native)**
- Start fresh with S3 Tables (Iceberg/Hudi/Delta)
- Schema-on-write from day 1
- ACID transactions, time travel, governance BUILT IN
- **No swamp — just structured medallion**
- MinIO S3 Tables = born-clean lakehouse

### MinIO S3 Tables — Best of Both Worlds

MinIO now supports **S3 Tables** — native Iceberg, Hudi, and Delta Sharing support for on-prem data. **Databricks Validated.**

```
On-Prem MinIO AIStor
→ S3 Tables (Iceberg)
→ Delta Sharing
→ Databricks Unity (AWS)
→ ZERO COPY — data never leaves MinIO
```

---

## Component → Tier Quick Reference

| Component | Tier | Why |
|-----------|------|-----|
| Spark Shuffle | 0 | Ephemeral, random I/O, needs <100μs |
| Weaviate HNSW Index | 0 | Vector similarity = random access patterns |
| vLLM Model Weights | 0 | GPU-Direct load, KV cache in VRAM |
| PyTorch DataLoaders | 1 | Streaming throughput, S3 API, 325 GiB/s |
| Kubeflow Artifacts | 1 | Pipeline intermediates, fast access |
| MLflow Registry (Active) | 1 | Models ready for deployment NOW |
| Ray Object Store | 1 | Distributed object references |
| Checkpoints | 2 | Bursty writes, huge (500GB-1TB), can tolerate 5-15ms |
| Feast Feature Store | 2 | Bulk Parquet/ORC, batch retrieval |
| Medallion (B/S/G) | 2 | THE DATA LAKE |
| S3 Tables (Iceberg/Delta) | 2 | ACID transactions, time travel |
| Delta Sharing → Cloud | 2 | Zero-copy to Databricks Unity |
| TrustyAI Audit Logs | 3 | WORM, 7-year retention |
| Model Archives | 3 | Retired versions, compliance |
| Historical Training Data | 3 | Reproducibility, legal |

---

## Files Created in This Session

| File | Purpose |
|------|---------|
| `src/components/ReferenceArchitecture.tsx` | Main prescriptive guide component (3 views) |
| `src/components/StorageLayoutExplorer.tsx` | 4-tier storage layout visualization |
| `src/components/InteractiveTrainingExplorer.tsx` | Animated training pipeline explorer |
| `src/pages/Explorer.tsx` | Main explorer page routing |

---

## Next Steps (Potential Enhancements)

1. **RAG Pipeline Explorer** - Document ingestion → chunking → embedding → vector DB → query
2. **Fine-Tuning Explorer** - LoRA/QLoRA with storage implications
3. **Inference Explorer** - Model serving with KV cache and storage patterns
4. **Interactive Comparison Tool** - Side-by-side tier comparison
5. **Real benchmark data** - Actual throughput numbers from customer deployments

---

## Key Takeaways for Sales Training

1. **Tier 0 is NOT MinIO** — Raw block I/O for GPU-direct and vector DBs
2. **Tier 1 is IN-CLUSTER MinIO** — Operational S3, not capacity tier
3. **Tier 2 is THE DATA LAKE** — MinIO AIStor, Medallion, S3 Tables
4. **Tier 3 is COMPLIANCE** — Object Lock, WORM, long-term retention
5. **Storage is NOT in the training loop** — It's before, periodic, and after
6. **GPU/DPU ≠ iSCSI/TOE** — Different paradigm, don't map old concepts
7. **META built custom, you get MinIO** — Same architecture, fraction of effort

---

*Document generated from storage-map-ai project development session, February 2026*
