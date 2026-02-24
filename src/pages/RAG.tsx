import PipelineDiagram, { PageHeader, BottomLine } from '../components/PipelineDiagram'
import type { Phase } from '../components/PipelineDiagram'
import RAGDiagram from '../components/diagrams/RAGDiagram'

const ragPhases: Phase[] = [
  {
    id: 'document-ingestion',
    name: 'Document Ingestion',
    description: 'Source documents land in object storage for processing.',
    role: 'primary',
    roleLabel: 'PRIMARY',
    s3Paths: [
      's3://rag-source/documents/',
      's3://rag-source/nasa-apod/2024-03-15.md',
      's3://rag-processed/chunks/',
    ],
    details: 'Source documents arrive continuously: PDFs, web pages, APIs, internal docs. A processing pipeline chunks them, cleans them, and prepares them for embedding. Object storage is the canonical source of truth.',
    ioProfile: 'Continuous small-to-medium writes during ingestion',
  },
  {
    id: 'embedding-generation',
    name: 'Embedding Generation',
    description: 'Embedding model reads chunks, produces vectors for the vector DB.',
    role: 'primary',
    roleLabel: 'SOURCE READ',
    s3Paths: [
      's3://rag-processed/chunks/doc-{id}-chunk-{001..N}.json',
    ],
    details: 'An embedding model reads each chunk and produces dense vector representations. Object storage is the read source. After embedding, vectors land in a vector database (Milvus, Weaviate, Pinecone, Clickhouse).',
    ioProfile: 'Sequential reads of all chunks during embedding pass',
  },
  {
    id: 'vector-db',
    name: 'Vector Database',
    description: 'Vectors stored and indexed for similarity search.',
    role: 'buffered',
    roleLabel: 'BACKING STORE',
    s3Paths: [
      's3://vectordb-data/milvus/segments/',
      's3://vectordb-data/weaviate/backups/',
    ],
    details: 'Many vector databases (Milvus, LanceDB, Weaviate) use S3-compatible storage as their durable backing store. The vector index lives in memory/SSD for fast search, but persistent storage is object storage.',
    ioProfile: 'Write-ahead logs, segment flushes, backup/restore operations',
  },
  {
    id: 'query-retrieval',
    name: 'Query & Retrieval',
    description: 'User query embedded, top-K chunks retrieved from vector DB.',
    role: 'buffered',
    roleLabel: 'POSSIBLY IN PATH',
    s3Paths: [],
    details: 'User query → embed → vector search → retrieve top-K chunks. Storage involvement depends on architecture: Option A: Vector DB stores chunks inline (storage NOT in query path). Option B: Vector DB stores pointers to S3 (storage IS in query hot path). Option C: Chunks cached in Redis (storage is warm path).',
    ioProfile: 'Depends on architecture — may be zero or many small reads per query',
  },
  {
    id: 'llm-generation',
    name: 'LLM Generation',
    description: 'Retrieved context stuffed into prompt, LLM generates response.',
    role: 'not-in-path',
    roleLabel: 'NOT IN PATH',
    s3Paths: [],
    details: 'Retrieved chunks are assembled into the LLM prompt as context. The LLM generates a response. This is pure inference — GPU memory and compute. Object storage is not involved in this phase.',
    ioProfile: 'None — this is GPU compute only',
  },
]

export default function RAG() {
  return (
    <div>
      <PageHeader
        title="RAG Pipelines"
        subtitle="Retrieval-Augmented Generation"
        description="Enhancing model responses by retrieving relevant context from external data at query time. No model weights change — this is about augmenting inference with dynamic knowledge retrieval."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Visual Diagram */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pipeline Overview</h2>
          <RAGDiagram />
        </section>

        {/* Detailed Phases */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Phase-by-Phase Breakdown</h2>
          <PipelineDiagram phases={ragPhases} title="RAG Pipeline" />
        </section>

        {/* The Critical Question */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">The Critical Architecture Question</h2>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold text-amber-800 mb-4">Where do retrieved chunks come from at query time?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <div className="font-medium text-gray-900 mb-2">Option A: Inline Storage</div>
                <p className="text-sm text-gray-600 mb-2">Vector DB stores chunk text inline with the vector</p>
                <div className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-600">
                  Storage: <span className="font-semibold text-green-600">NOT in query path</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <div className="font-medium text-gray-900 mb-2">Option B: Pointer Storage</div>
                <p className="text-sm text-gray-600 mb-2">Vector DB stores pointers back to S3 chunks</p>
                <div className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-600">
                  Storage: <span className="font-semibold text-raspberry">IN query hot path</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <div className="font-medium text-gray-900 mb-2">Option C: Cached</div>
                <p className="text-sm text-gray-600 mb-2">Chunks cached in Redis/app memory after first retrieval</p>
                <div className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-600">
                  Storage: <span className="font-semibold text-amber-600">Warm path (cache miss)</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-amber-700">
              Your architecture choice determines whether object storage latency affects query response time. 
              Know which pattern you're using.
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
                Continuous Ingestion
              </h3>
              <p className="text-gray-600">
                RAG is not a one-time setup. New documents arrive continuously. Your ingestion pipeline 
                (ingest → chunk → embed → upsert) runs on a schedule or trigger. Object storage is always 
                the durable source of truth.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </span>
                Re-embedding Safety Net
              </h3>
              <p className="text-gray-600">
                New embedding model? Different chunk sizes? Dimension change? You'll need to re-embed 
                everything. Object storage as the source-of-truth means you can always regenerate your 
                vector index from the original documents.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                Vector DB Backing Store
              </h3>
              <p className="text-gray-600">
                Many vector databases use S3-compatible storage as their durable layer. Milvus, LanceDB, 
                and others flush segments to object storage. You might be using object storage in the 
                vector DB tier without realizing it.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-raspberry/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                RAG ≠ Inference
              </h3>
              <p className="text-gray-600">
                RAG is a retrieval + generation pipeline. The retrieval phase has distinct storage patterns 
                from pure inference. Don't conflate "RAG performance" with "LLM inference performance" — 
                they're measuring different things.
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority Metric</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Document Ingestion</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Small-medium writes</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Continuous / scheduled</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Availability, durability</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Embedding Pass</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sequential reads</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Per ingestion batch</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Read throughput</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Vector DB Flush</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Segment writes</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Periodic</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Write throughput, durability</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Chunk Retrieval</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Small random reads</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Per query (if in path)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Latency (if in query path)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <BottomLine>
          Object storage is the document store, embedding source, and often the vector DB backing store. 
          You're always in the ingestion pipeline. Whether you're in the query path depends on your 
          architecture — know which pattern you're using and plan accordingly.
        </BottomLine>
      </div>
    </div>
  )
}
