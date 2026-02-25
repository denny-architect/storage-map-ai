# The AI Storage Map

**An educational resource for understanding where object storage actually lives in AI/ML pipelines.**

> Everyone talks about AI storage. Almost nobody draws the lines correctly.

This is a technical reference that maps object storage's role across four major AI workloads: Training, RAG, Fine-Tuning, and Inference. Each phase is explained with accurate technical detail, pipeline diagrams, and practical S3 path layouts.

## 🌐 Live Site

Visit the site at: https://denny-architect.github.io/storage-map-ai/

## Features

- **Four Deep-Dive Pages**: Detailed breakdowns of Training, RAG, Fine-Tuning, and Inference pipelines
- **Interactive Comparison Matrix**: Side-by-side view of storage roles across all workloads
- **Custom SVG Pipeline Diagrams**: Visual representations of data flow and storage involvement
- **S3 Path Reference**: Complete namespace design for organizing AI/ML storage
- **Glossary**: Engineer-friendly definitions of AI/ML terminology
- **Common Misconceptions**: Myth-busting section addressing frequent misunderstandings

## Technical Stack

- React 18 + TypeScript
- Tailwind CSS v4
- Vite
- React Router

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Insights

### The Honest Story

Object storage is the gravitational center of the AI data lifecycle:

- **Training**: Data lake, checkpoint store, artifact registry — storage is in the critical path from minute one
- **RAG**: Document store, embedding source, potentially vector DB backing — always in ingestion, architecture-dependent for queries
- **Fine-Tuning**: Same patterns as training but 1000x smaller scale — adapter versioning is the compelling story
- **Inference**: Bookends only — model loading and logging, but NOT in the generation loop

### The Most Important Point

During active inference — the milliseconds where the GPU is doing matrix math — object storage is **not in the path**. The model weights are in VRAM, the KV cache is in VRAM, and the forward pass is pure GPU compute. Storage loads the model and logs everything, but the generation itself is object storage-free.

## Storage Examples

This resource references [MinIO AIStor](https://min.io/product/aistor) as the example S3-compatible object store, demonstrating patterns that apply to any enterprise object storage deployment.

## Contributing

Contributions are welcome! If you spot technical inaccuracies or have suggestions for additional content, please open an issue or PR.

## License

MIT License - feel free to use this as an educational resource.

