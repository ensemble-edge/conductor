# AutoRAG Setup Guide

Cloudflare AutoRAG is the easiest way to implement RAG - it handles everything automatically!

## What AutoRAG Does Automatically

1. **Monitors R2 Bucket** - Watches for new/updated files
2. **Converts Documents** - PDFs, images, HTML, CSV → structured Markdown
3. **Chunks Content** - Splits into optimal sizes with overlap
4. **Generates Embeddings** - Uses Workers AI embedding models
5. **Indexes Vectors** - Stores in Vectorize automatically
6. **Handles Retrieval** - Semantic search with optional reranking
7. **Generates Answers** - AI-powered responses grounded in your data

## Quick Start

### 1. Create R2 Bucket

```bash
npx wrangler r2 bucket create my-docs
```

### 2. Configure AutoRAG in wrangler.toml

```toml
[[ai_autorag]]
name = "my-rag"
r2_bucket = "my-docs"

[ai_autorag.chunking]
size = 512           # Tokens per chunk
overlap = 0.1        # 10% overlap between chunks

[ai_autorag.embedding]
model = "@cf/baai/bge-base-en-v1.5"
```

### 3. Upload Documents to R2

```bash
# Upload a single file
npx wrangler r2 object put my-docs/doc.pdf --file=./doc.pdf

# Upload a directory
npx wrangler r2 object put my-docs/folder --path=./documents/ --recursive
```

### 4. Create AutoRAG Agent

`agents/search-docs/agent.yaml`:

```yaml
name: search-docs
type: autorag
description: Search documentation using AutoRAG

config:
  instance: "my-rag"  # Matches [[ai_autorag]] name
  mode: "answer"      # or "results" for raw search
  topK: 5
  rewriteQuery: true
```

### 5. Use in Ensemble

`ensembles/qa.yaml`:

```yaml
name: qa
description: Answer questions from documentation

flow:
  - agent: search-docs
    input:
      query: ${input.question}

output:
  answer: ${search-docs.output.answer}
  sources: ${search-docs.output.sources}
```

### 6. Query Your Data

```bash
curl -X POST http://localhost:8787/execute/qa \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I configure AutoRAG?"}'
```

## Configuration Options

### Chunking Strategies

```toml
[ai_autorag.chunking]
size = 512           # Default: 512 tokens
overlap = 0.15       # Default: 10% (0.1)
```

Recommendations:
- **Small chunks (256-512)**: Better for precise answers
- **Large chunks (1024-2048)**: Better for context-heavy tasks
- **Overlap (10-20%)**: Prevents splitting related content

### Embedding Models

Available models:
- `@cf/baai/bge-base-en-v1.5` (default) - General purpose, English
- `@cf/baai/bge-large-en-v1.5` - Higher quality, slower
- `@cf/baai/bge-small-en-v1.5` - Faster, smaller

```toml
[ai_autorag.embedding]
model = "@cf/baai/bge-large-en-v1.5"
```

### Metadata Filters

Add metadata to filter results:

```bash
npx wrangler r2 object put my-docs/api-docs.pdf \
  --file=./api-docs.pdf \
  --metadata='{"category":"api","version":"2.0"}'
```

Then filter in your queries (coming soon in AutoRAG).

## Supported File Types

AutoRAG automatically processes:
- **PDFs** - Text extraction with layout preservation
- **Images** (PNG, JPG) - OCR and vision-to-language
- **Text** (TXT, MD) - Direct ingestion
- **HTML** - Content extraction
- **CSV** - Structured data extraction
- **JSON** - Structured data extraction

## Answer vs Results Mode

### Answer Mode (default)

Returns AI-generated response grounded in documents:

```yaml
config:
  mode: "answer"  # Uses aiSearch()
```

Response:
```json
{
  "answer": "AutoRAG is configured in wrangler.toml...",
  "sources": [
    {
      "content": "Configuration section excerpt...",
      "score": 0.92,
      "id": "doc_123"
    }
  ]
}
```

### Results Mode

Returns raw search results without generation:

```yaml
config:
  mode: "results"  # Uses search()
```

Response:
```json
{
  "results": [
    {
      "content": "Full chunk content...",
      "score": 0.92,
      "id": "doc_123"
    }
  ],
  "context": "Combined context for your own LLM...",
  "count": 5
}
```

## Best Practices

### 1. Document Organization

Organize R2 bucket by category:
```
my-docs/
  api/
    endpoints.pdf
    authentication.pdf
  guides/
    getting-started.pdf
    tutorials/
```

### 2. Document Quality

- Use clear, well-structured documents
- Include titles, headings, and sections
- Avoid scanned images without OCR
- Keep documents up to date

### 3. Query Optimization

Good queries:
- ✅ "How do I configure AutoRAG chunking?"
- ✅ "What authentication methods are supported?"

Avoid:
- ❌ "stuff about config" (too vague)
- ❌ "authentication" (too short)

### 4. Monitoring

AutoRAG continuously monitors R2:
- New files → automatically indexed
- Updated files → automatically reindexed
- Deleted files → automatically removed from index

No manual reprocessing needed!

## Comparison: AutoRAG vs Manual Vectorize RAG

| Feature | AutoRAG | Vectorize RAG |
|---------|---------|---------------|
| Setup | Point to R2 bucket | Manual vectors |
| Chunking | Automatic | Manual |
| Embedding | Automatic | Manual |
| Monitoring | Continuous | Manual |
| File Types | PDFs, images, etc. | Text only |
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Control | Less | Full |

**Use AutoRAG when:**
- You want the easiest RAG setup
- You have documents in R2
- You want automatic updates
- You don't need fine-grained control

**Use Vectorize RAG when:**
- You need custom chunking logic
- You have specialized embedding models
- You want full control over indexing
- You're building complex RAG pipelines

## Limitations (Beta)

- Maximum 10 AutoRAG instances per account
- Maximum 100,000 files per instance
- R2 storage and Workers AI costs apply

## Next Steps

- [AutoRAG Examples](./examples/)
- [Vectorize RAG (Manual)](../vectorize-rag/)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
