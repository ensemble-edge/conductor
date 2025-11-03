# CLI Commands - Complete! ✅

## Summary

Implemented a hybrid CLI that executes members locally when possible and falls back to remote API execution. The CLI provides unified access to both built-in and user-defined members with intelligent execution mode selection.

**Stats:**
- 🗂️ **4 CLI files** created
- 🔀 **Hybrid execution** (local first, then API)
- 🎨 **Colored output** with chalk
- ⚙️ **Multiple output formats** (json, pretty, table)
- ✅ **All files compile successfully**

---

## What Was Built

### 1. Exec Command

**Location:** `src/cli/commands/exec.ts`

**Purpose:** Execute members locally or remotely with automatic fallback.

**Execution Flow:**
1. **Check if `--remote` flag** is present
2. **If not remote:**
   - Try local execution via built-in registry
   - If local execution fails → Fall back to API
3. **If remote or fallback:**
   - Use TypeScript SDK to call API
   - Requires API URL and optional API key

**Usage:**

```bash
# Execute member locally (default)
conductor exec fetch --input '{"url":"https://example.com"}'

# Execute with input from file
conductor exec scrape --file input.json

# Execute with config
conductor exec scrape \
  --input '{"url":"https://example.com"}' \
  --config '{"strategy":"balanced"}'

# Force remote execution
conductor exec fetch \
  --input '{"url":"https://example.com"}' \
  --remote \
  --api-url https://api.conductor.dev \
  --api-key your-api-key

# Use environment variables for API
export CONDUCTOR_API_URL=https://api.conductor.dev
export CONDUCTOR_API_KEY=your-api-key
conductor exec fetch --input '{"url":"https://example.com"}' --remote

# Different output formats
conductor exec fetch --input '{"url":"https://example.com"}' --output json
conductor exec fetch --input '{"url":"https://example.com"}' --output raw
conductor exec fetch --input '{"url":"https://example.com"}' --output pretty
```

**Options:**
- `-i, --input <json>` - Input data as JSON string
- `-c, --config <json>` - Configuration as JSON string
- `-f, --file <path>` - Input data from JSON file
- `--remote` - Force remote execution via API
- `--api-url <url>` - API URL (default: CONDUCTOR_API_URL env)
- `--api-key <key>` - API key (default: CONDUCTOR_API_KEY env)
- `--output <format>` - Output format: json, pretty, or raw (default: pretty)

**Output Examples:**

**Pretty Format (default):**
```
→ Executing locally...

✓ Execution successful

Result:
{
  "statusCode": 200,
  "body": "...",
  "headers": {...}
}

Duration: 234ms
Mode: local
```

**JSON Format:**
```json
{
  "success": true,
  "data": {
    "statusCode": 200,
    "body": "..."
  },
  "metadata": {
    "duration": 234,
    "timestamp": 1699564800000
  }
}
```

**Raw Format:**
```
{"statusCode":200,"body":"..."}
```

---

### 2. Members Command

**Location:** `src/cli/commands/members.ts`

**Purpose:** List and inspect available members (built-in and user-defined).

**Subcommands:**
- `conductor members list` - List all members
- `conductor members info <name>` - Get member details

#### 2.1 List Members

**Usage:**
```bash
# List members locally
conductor members list

# List from API
conductor members list --remote

# Different output formats
conductor members list --output table
conductor members list --output simple
conductor members list --output json
```

**Options:**
- `--remote` - List from API instead of local
- `--api-url <url>` - API URL (default: CONDUCTOR_API_URL env)
- `--api-key <key>` - API key (default: CONDUCTOR_API_KEY env)
- `--output <format>` - Output format: json, table, or simple (default: table)

**Output Examples:**

**Table Format (default):**
```
Available Members:

fetch          function    HTTP client with exponential backoff retry
scrape         function    Web scraping with 3-tier fallback
validate       function    Evaluation framework with multiple evaluators
rag            function    Retrieval-augmented generation
hitl           function    Human-in-the-loop workflows

Total: 5 members
```

**Simple Format:**
```
fetch
scrape
validate
rag
hitl
```

**JSON Format:**
```json
[
  {
    "name": "fetch",
    "type": "function",
    "version": "1.0.0",
    "description": "HTTP client with exponential backoff retry",
    "builtIn": true
  },
  ...
]
```

#### 2.2 Member Info

**Usage:**
```bash
# Get member info locally
conductor members info fetch

# Get from API
conductor members info fetch --remote

# JSON output
conductor members info fetch --output json
```

**Options:**
- `--remote` - Get info from API instead of local
- `--api-url <url>` - API URL
- `--api-key <key>` - API key
- `--output <format>` - Output format: json or pretty (default: pretty)

**Output Example (Pretty):**
```
fetch
Version: 1.0.0

Description:
HTTP client with exponential backoff retry

Tags:
http, client, retry

Input Schema:
{
  "url": "string (required)",
  "method": "string",
  "headers": "object",
  "body": "any"
}

Examples:
Example 1:
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  }
}

Config Schema:
{
  "timeout": "number",
  "maxRetries": "number",
  "retryDelay": "number"
}
```

---

### 3. Health Command

**Location:** `src/cli/index.ts`

**Purpose:** Check API health status.

**Usage:**
```bash
# Check health
conductor health

# With custom API URL
conductor health --api-url https://api.conductor.dev
```

**Output:**
```
API Health:

Status: healthy
Version: 1.0.0

Checks:
  ✓ database
  ✓ cache
```

---

### 4. Config Command

**Location:** `src/cli/index.ts`

**Purpose:** Show current CLI configuration.

**Usage:**
```bash
conductor config
```

**Output:**
```
Configuration:

API URL: https://api.conductor.dev
API Key: set

Set via environment variables:
  export CONDUCTOR_API_URL=https://api.conductor.dev
  export CONDUCTOR_API_KEY=your-api-key
```

---

## Hybrid Execution Strategy

### Local Execution

**When it's used:**
- Default mode when `--remote` flag is NOT present
- If built-in registry is accessible
- If execution doesn't require Cloudflare bindings

**How it works:**
```typescript
// Get built-in registry
const registry = getBuiltInRegistry();

// Create member instance
const member = registry.create(memberName, config, mockEnv);

// Execute directly
const result = await member.execute(context);
```

**Advantages:**
- ✅ Faster (no network overhead)
- ✅ Works offline
- ✅ No API key needed
- ✅ Immediate feedback

**Limitations:**
- ❌ No access to real Cloudflare bindings (KV, D1, Vectorize, AI)
- ❌ Only works for built-in members
- ❌ Limited to local environment capabilities

### Remote Execution (API)

**When it's used:**
- When `--remote` flag is present
- When local execution is not possible
- Automatic fallback from local execution

**How it works:**
```typescript
// Create SDK client
const client = createClient({
  baseUrl: apiUrl,
  apiKey
});

// Execute via API
const result = await client.execute({
  member: memberName,
  input,
  config
});
```

**Advantages:**
- ✅ Full access to Cloudflare bindings
- ✅ Works from anywhere
- ✅ Consistent with production behavior
- ✅ Can access user-defined members

**Limitations:**
- ❌ Requires network connection
- ❌ Requires API key (for authenticated endpoints)
- ❌ Slower (network latency)

### Decision Flow

```
User runs: conductor exec fetch --input {...}
           ↓
    Check --remote flag?
           ↓
    ┌──────┴──────┐
    NO            YES
    ↓              ↓
Can execute    Execute via
locally?       API (SDK)
    ↓              ↓
┌───┴───┐      Success!
YES     NO
↓        ↓
Execute  Execute via
locally  API (fallback)
↓
Success!
```

---

## Environment Variables

### CONDUCTOR_API_URL
- **Purpose:** Default API URL for remote execution
- **Example:** `export CONDUCTOR_API_URL=https://api.conductor.dev`
- **Used by:** `exec`, `members list --remote`, `members info --remote`, `health`

### CONDUCTOR_API_KEY
- **Purpose:** API key for authentication
- **Example:** `export CONDUCTOR_API_KEY=your-api-key`
- **Used by:** All commands that connect to API
- **Optional:** Not needed for public endpoints (health, docs)

**Setup:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export CONDUCTOR_API_URL=https://api.conductor.dev
export CONDUCTOR_API_KEY=your-api-key-here

# Or use a .env file
echo "CONDUCTOR_API_URL=https://api.conductor.dev" > .env
echo "CONDUCTOR_API_KEY=your-api-key" >> .env
source .env
```

---

## Complete Examples

### Example 1: Fetch Data

```bash
# Fetch data from API
conductor exec fetch \
  --input '{
    "url": "https://api.github.com/users/octocat",
    "method": "GET"
  }' \
  --output pretty
```

**Output:**
```
→ Executing locally...

✓ Execution successful

Result:
{
  "statusCode": 200,
  "body": "{\"login\":\"octocat\",...}",
  "headers": {...},
  "duration": 234,
  "attempt": 1
}

Duration: 234ms
Mode: local
```

### Example 2: Scrape Website

```bash
# Create input file
cat > scrape-input.json << EOF
{
  "url": "https://example.com"
}
EOF

# Execute with file input
conductor exec scrape \
  --file scrape-input.json \
  --config '{"strategy":"balanced"}' \
  --output json > result.json

# View result
cat result.json
```

### Example 3: Validate Content

```bash
# Validate with NLP
conductor exec validate \
  --input '{
    "content": "The product is great!",
    "evalType": "nlp",
    "reference": "The product is excellent!"
  }' \
  --config '{"threshold":0.7,"metrics":["bleu","rouge"]}'
```

### Example 4: RAG Index & Search

```bash
# Index content
conductor exec rag \
  --input '{
    "operation": "index",
    "content": "Conductor is a workflow orchestration framework...",
    "namespace": "docs"
  }' \
  --config '{"chunkStrategy":"semantic"}' \
  --remote

# Search content
conductor exec rag \
  --input '{
    "operation": "search",
    "query": "workflow orchestration",
    "namespace": "docs"
  }' \
  --config '{"topK":5}' \
  --remote
```

### Example 5: Human-in-the-Loop

```bash
# Request approval
conductor exec hitl \
  --input '{
    "operation": "request",
    "approvalData": {
      "action": "approve-purchase",
      "amount": 1000,
      "vendor": "Acme Corp"
    }
  }' \
  --config '{
    "notificationMethod": "slack",
    "slackChannel": "#approvals"
  }' \
  --remote
```

---

## Installation

### Global Installation

```bash
# Install globally
npm install -g @ensemble-edge/conductor

# Use CLI
conductor --help
```

### Local Installation

```bash
# Install locally
npm install @ensemble-edge/conductor

# Use via npx
npx conductor --help

# Or add to package.json scripts
{
  "scripts": {
    "exec": "conductor exec"
  }
}
npm run exec fetch --input '{"url":"..."}'
```

### Development

```bash
# Build
npm run build

# Link locally
npm link

# Test CLI
conductor --help
```

---

## File Structure

```
conductor/
├── src/
│   └── cli/
│       ├── index.ts              # Main CLI entry point
│       └── commands/
│           ├── exec.ts           # Exec command (local/remote)
│           └── members.ts        # Members command (list/info)
│
└── bin/
    └── conductor.js              # CLI executable entry point
```

---

## Benefits

### Hybrid Approach
- ✅ **Fast local execution** when possible
- ✅ **Automatic fallback** to API
- ✅ **Explicit remote execution** with `--remote` flag
- ✅ **Works offline** for local execution
- ✅ **Works everywhere** with API mode

### Developer Experience
- ✅ **Colored output** for better readability
- ✅ **Multiple output formats** (json, pretty, raw, table)
- ✅ **File input support** for complex data
- ✅ **Environment variables** for configuration
- ✅ **Helpful error messages**

### Consistency
- ✅ **Same interface** for built-in and user-defined members
- ✅ **Unified execution** across local and remote
- ✅ **Type-safe** with TypeScript
- ✅ **SDK integration** for remote execution

---

## Future Enhancements

### CLI Features
1. **Interactive mode** - Prompt for input interactively
2. **Config file** - `.conductorrc` for persistent config
3. **Shell completion** - Bash/Zsh completion scripts
4. **Verbose mode** - `--verbose` for debugging
5. **Dry run** - `--dry-run` to validate without executing
6. **History** - Track execution history
7. **Aliases** - Create shortcuts for common commands

### Execution
1. **Caching** - Cache local execution results
2. **Parallel execution** - Execute multiple members in parallel
3. **Pipeline** - Chain multiple members together
4. **Watch mode** - Re-execute on file changes

### Output
1. **Progress bars** - Show progress for long-running operations
2. **Streaming output** - Stream results as they arrive
3. **Templates** - Custom output templates
4. **Export formats** - CSV, XML, YAML

---

## Summary

CLI commands are complete with:
- ✅ **Hybrid execution** (local first, API fallback)
- ✅ **`conductor exec`** - Execute members
- ✅ **`conductor members list`** - List members
- ✅ **`conductor members info`** - Get member details
- ✅ **`conductor health`** - Check API health
- ✅ **`conductor config`** - Show configuration
- ✅ **Multiple output formats** (json, pretty, raw, table)
- ✅ **Environment variable support** (API_URL, API_KEY)
- ✅ **Colored output** with chalk
- ✅ **4 CLI files** created

Ready for npm install and command-line usage!
