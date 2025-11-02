# **n8n Integration**

## **Ensemble Edge Node**

## **Overview**

The **Ensemble Edge Node** for n8n enables seamless integration between n8n workflows and any Ensemble Edge project. This generic node can authenticate against any conductor instance, execute ensembles/members, and handle webhooks bidirectionally.

## **Node Architecture**

### Core Features

- **Universal Compatibility**: Works with any Ensemble Edge project  
- **Multiple Operations**: Execute ensembles, members, or raw API calls  
- **Dynamic Discovery**: Auto-discover available ensembles/members  
- **Streaming Support**: Handle long-running operations  
- **Webhook Integration**: Both trigger and action capabilities

## **n8n Node Implementation**

### 1\. Node Definition

```ts
// nodes/EnsembleEdge/EnsembleEdge.node.ts
import {
  IExecuteFunctions,
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  NodeOperationError,
} from 'n8n-workflow';

export class EnsembleEdge implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Ensemble Edge',
    name: 'ensembleEdge',
    icon: 'file:ensemble.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with any Ensemble Edge project',
    defaults: {
      name: 'Ensemble Edge',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'ensembleEdgeApi',
        required: true,
      },
    ],
    properties: [
      // Resource Selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Ensemble',
            value: 'ensemble',
            description: 'Execute an ensemble workflow',
          },
          {
            name: 'Member',
            value: 'member',
            description: 'Execute a single member',
          },
          {
            name: 'Discovery',
            value: 'discovery',
            description: 'Discover available resources',
          },
        ],
        default: 'ensemble',
      },
      
      // Operation Selection
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['ensemble'],
          },
        },
        options: [
          {
            name: 'Execute',
            value: 'execute',
            description: 'Execute an ensemble',
            action: 'Execute an ensemble',
          },
          {
            name: 'Execute Async',
            value: 'executeAsync',
            description: 'Execute ensemble asynchronously',
            action: 'Execute an ensemble asynchronously',
          },
          {
            name: 'List',
            value: 'list',
            description: 'List available ensembles',
            action: 'List ensembles',
          },
        ],
        default: 'execute',
      },
      
      // Dynamic Ensemble Selection
      {
        displayName: 'Ensemble',
        name: 'ensembleName',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getEnsembles',
        },
        required: true,
        displayOptions: {
          show: {
            resource: ['ensemble'],
            operation: ['execute', 'executeAsync'],
          },
        },
        default: '',
        description: 'Select ensemble to execute',
      },
      
      // Input Configuration
      {
        displayName: 'Input Type',
        name: 'inputType',
        type: 'options',
        options: [
          {
            name: 'JSON',
            value: 'json',
          },
          {
            name: 'Fields',
            value: 'fields',
          },
          {
            name: 'Previous Node',
            value: 'previousNode',
          },
        ],
        default: 'previousNode',
        displayOptions: {
          show: {
            operation: ['execute', 'executeAsync'],
          },
        },
      },
      
      // JSON Input
      {
        displayName: 'Input Data',
        name: 'inputJson',
        type: 'json',
        default: '{}',
        displayOptions: {
          show: {
            inputType: ['json'],
          },
        },
      },
      
      // Field-based Input
      {
        displayName: 'Input Fields',
        name: 'inputFields',
        placeholder: 'Add Field',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            inputType: ['fields'],
          },
        },
        default: {},
        options: [
          {
            name: 'field',
            displayName: 'Field',
            values: [
              {
                displayName: 'Field Name',
                name: 'name',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Field Value',
                name: 'value',
                type: 'string',
                default: '',
              },
            ],
          },
        ],
      },
      
      // Advanced Options
      {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Cache',
            name: 'cache',
            type: 'boolean',
            default: true,
            description: 'Whether to use cached results',
          },
          {
            displayName: 'Timeout',
            name: 'timeout',
            type: 'number',
            default: 30,
            description: 'Timeout in seconds',
          },
          {
            displayName: 'Retry',
            name: 'retry',
            type: 'number',
            default: 0,
            description: 'Number of retry attempts',
          },
        ],
      },
    ],
  };

  // Load dynamic options
  methods = {
    loadOptions: {
      async getEnsembles(this: IExecuteFunctions) {
        const credentials = await this.getCredentials('ensembleEdgeApi');
        const response = await this.helpers.request({
          method: 'GET',
          url: `${credentials.apiUrl}/conductor/discovery/ensembles`,
          headers: {
            'x-api-key': credentials.apiKey,
          },
        });
        
        return response.ensembles.map((ensemble: any) => ({
          name: ensemble.name,
          value: ensemble.name,
          description: ensemble.description,
        }));
      },
      
      async getMembers(this: IExecuteFunctions) {
        const credentials = await this.getCredentials('ensembleEdgeApi');
        const response = await this.helpers.request({
          method: 'GET',
          url: `${credentials.apiUrl}/conductor/discovery/members`,
          headers: {
            'x-api-key': credentials.apiKey,
          },
        });
        
        return response.members.map((member: any) => ({
          name: member.name,
          value: member.name,
          description: `${member.type}: ${member.description}`,
        }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;
    const credentials = await this.getCredentials('ensembleEdgeApi');

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData;
        
        if (resource === 'ensemble') {
          if (operation === 'execute') {
            const ensembleName = this.getNodeParameter('ensembleName', i) as string;
            const inputType = this.getNodeParameter('inputType', i) as string;
            
            let inputData;
            if (inputType === 'json') {
              inputData = this.getNodeParameter('inputJson', i) as object;
            } else if (inputType === 'fields') {
              const fields = this.getNodeParameter('inputFields.field', i, []) as any[];
              inputData = fields.reduce((acc, field) => {
                acc[field.name] = field.value;
                return acc;
              }, {});
            } else {
              inputData = items[i].json;
            }
            
            responseData = await this.helpers.request({
              method: 'POST',
              url: `${credentials.apiUrl}/conductor/ensemble/${ensembleName}`,
              headers: {
                'x-api-key': credentials.apiKey as string,
                'Content-Type': 'application/json',
              },
              body: inputData,
              json: true,
            });
          }
          // Add other operations...
        }
        
        returnData.push({
          json: responseData,
          pairedItem: { item: i },
        });
        
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: error.message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error);
      }
    }
    
    return [returnData];
  }
}
```

### 2\. Credentials Definition

```ts
// credentials/EnsembleEdgeApi.credentials.ts
import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class EnsembleEdgeApi implements ICredentialType {
  name = 'ensembleEdgeApi';
  displayName = 'Ensemble Edge API';
  documentationUrl = 'https://ensemble-edge.com/docs/n8n';
  properties: INodeProperties[] = [
    {
      displayName: 'API URL',
      name: 'apiUrl',
      type: 'string',
      default: 'https://api.ownerco.com',
      placeholder: 'https://api.yourcompany.com',
      description: 'The base URL of your Ensemble Edge conductor',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Your Ensemble Edge API key',
    },
    {
      displayName: 'Project ID',
      name: 'projectId',
      type: 'string',
      default: '',
      placeholder: 'ownerco-oiq',
      description: 'Optional project identifier',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'x-api-key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.apiUrl}}',
      url: '/conductor/health',
      method: 'GET',
    },
  };
}
```

### 3\. Webhook Trigger Node

```ts
// nodes/EnsembleEdge/EnsembleEdgeTrigger.node.ts
import {
  IWebhookFunctions,
  IWebhookResponseData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class EnsembleEdgeTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Ensemble Edge Trigger',
    name: 'ensembleEdgeTrigger',
    icon: 'file:ensemble.svg',
    group: ['trigger'],
    version: 1,
    description: 'Receive webhooks from Ensemble Edge',
    defaults: {
      name: 'Ensemble Edge Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'ensembleEdgeApi',
        required: false,
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'ensemble-webhook',
      },
    ],
    properties: [
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        options: [
          {
            name: 'Ensemble Completed',
            value: 'ensemble.completed',
          },
          {
            name: 'Ensemble Failed',
            value: 'ensemble.failed',
          },
          {
            name: 'Member Executed',
            value: 'member.executed',
          },
          {
            name: 'Webhook Received',
            value: 'webhook.received',
          },
        ],
        default: ['ensemble.completed'],
        description: 'Events to listen for',
      },
      {
        displayName: 'Verification',
        name: 'verification',
        type: 'boolean',
        default: true,
        description: 'Verify webhook signatures',
      },
    ],
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const credentials = await this.getCredentials('ensembleEdgeApi');
    const verification = this.getNodeParameter('verification', false) as boolean;
    
    if (verification && credentials) {
      // Verify webhook signature
      const signature = req.headers['x-webhook-signature'] as string;
      const isValid = await verifyWebhookSignature(
        req.body,
        signature,
        credentials.apiKey as string
      );
      
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }
    
    return {
      workflowData: [
        this.helpers.returnJsonArray(req.body),
      ],
    };
  }
}
```

## **Advanced Node Features**

### 1\. Dynamic Schema Discovery

```ts
// Dynamic input/output schema based on selected ensemble
async getEnsembleSchema(ensembleName: string) {
  const response = await this.helpers.request({
    method: 'GET',
    url: `${credentials.apiUrl}/conductor/ensemble/${ensembleName}/schema`,
    headers: {
      'x-api-key': credentials.apiKey,
    },
  });
  
  // Convert schema to n8n field definitions
  return schemaToN8nFields(response.schema);
}
```

### 2\. Streaming Support

```ts
// Handle long-running operations with streaming
async executeStream(this: IExecuteFunctions) {
  const ensembleName = this.getNodeParameter('ensembleName', 0) as string;
  
  const eventSource = new EventSource(
    `${credentials.apiUrl}/conductor/ensemble/${ensembleName}/stream`,
    {
      headers: {
        'x-api-key': credentials.apiKey,
      },
    }
  );
  
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'result') {
        results.push(data);
      } else if (data.type === 'complete') {
        eventSource.close();
        resolve(results);
      }
    };
    
    eventSource.onerror = (error) => {
      eventSource.close();
      reject(error);
    };
  });
}
```

### 3\. Batch Operations

```ts
// Execute multiple ensembles in parallel
async executeBatch(this: IExecuteFunctions) {
  const items = this.getInputData();
  const batchSize = this.getNodeParameter('batchSize', 0, 10) as number;
  
  const batches = chunk(items, batchSize);
  const results = [];
  
  for (const batch of batches) {
    const batchPromises = batch.map(item => 
      this.helpers.request({
        method: 'POST',
        url: `${credentials.apiUrl}/conductor/ensemble/${item.ensemble}`,
        body: item.json,
      })
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}
```

## **n8n Package Structure**

```
n8n-nodes-ensemble-edge/
├── package.json
├── nodes/
│   ├── EnsembleEdge/
│   │   ├── EnsembleEdge.node.ts
│   │   ├── EnsembleEdgeTrigger.node.ts
│   │   ├── EnsembleEdge.node.json
│   │   ├── ensemble.svg
│   │   └── methods/
│   │       ├── loadOptions.ts
│   │       └── execute.ts
│   └── shared/
│       ├── GenericFunctions.ts
│       └── types.ts
├── credentials/
│   └── EnsembleEdgeApi.credentials.ts
└── test/
    └── EnsembleEdge.test.ts
```

### package.json

```json
{
  "name": "n8n-nodes-ensemble-edge",
  "version": "1.0.0",
  "description": "n8n node for Ensemble Edge orchestration platform",
  "keywords": [
    "n8n-community-node-package",
    "ensemble-edge",
    "orchestration",
    "ai",
    "workflow"
  ],
  "author": {
    "name": "Ensemble Edge",
    "email": "support@ensemble-edge.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/ensemble-edge/n8n-nodes-ensemble-edge.git"
  },
  "main": "index.js",
  "scripts": {
    "build": "tsc && gulp build:icons",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint nodes credentials --ext .ts"
  },
  "files": [
    "dist"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/EnsembleEdgeApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/EnsembleEdge/EnsembleEdge.node.js",
      "dist/nodes/EnsembleEdge/EnsembleEdgeTrigger.node.js"
    ]
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "n8n-core": "^1.0.0",
    "n8n-workflow": "^1.0.0",
    "typescript": "^5.0.0"
  }
}
```

## **Usage Examples in n8n**

### Example 1: Simple Ensemble Execution

```json
{
  "nodes": [
    {
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "position": [250, 300],
      "parameters": {
        "url": "https://api.example.com/data",
        "method": "GET"
      }
    },
    {
      "name": "Ensemble Edge",
      "type": "n8n-nodes-ensemble-edge.ensembleEdge",
      "position": [450, 300],
      "parameters": {
        "resource": "ensemble",
        "operation": "execute",
        "ensembleName": "analyze-data",
        "inputType": "previousNode"
      },
      "credentials": {
        "ensembleEdgeApi": {
          "id": "1",
          "name": "Ensemble Production"
        }
      }
    },
    {
      "name": "Slack",
      "type": "n8n-nodes-base.slack",
      "position": [650, 300],
      "parameters": {
        "channel": "#notifications",
        "text": "={{$json.result}}"
      }
    }
  ]
}
```

### Example 2: Webhook-Triggered Workflow

```json
{
  "nodes": [
    {
      "name": "Ensemble Webhook",
      "type": "n8n-nodes-ensemble-edge.ensembleEdgeTrigger",
      "position": [250, 300],
      "webhookId": "abc123",
      "parameters": {
        "events": ["ensemble.completed"],
        "verification": true
      }
    },
    {
      "name": "Process Result",
      "type": "n8n-nodes-base.function",
      "position": [450, 300],
      "parameters": {
        "functionCode": "return items.map(item => ({ json: { processed: true, ...item.json }}))"
      }
    }
  ]
}
```

### Example 3: Batch Processing

```
# n8n workflow using Ensemble Edge for batch AI processing
workflow:
  trigger: schedule (every hour)
  nodes:
    1. MySQL: Get unprocessed records
    2. Ensemble Edge: Process batch with "summarize-content" ensemble
    3. MySQL: Update records with summaries
    4. Email: Send completion report
```

## **Configuration in Ensemble Edge**

### 1\. Enable n8n Integration

```
# config/integrations.yaml
n8n:
  enabled: true
  webhook_url: ${env.N8N_WEBHOOK_URL}
  events:
    - ensemble.completed
    - ensemble.failed
    - member.executed
  
  auth:
    method: api_key
    keys:
      - name: "n8n-production"
        key: ${env.N8N_API_KEY}
        scopes:
          - ensemble:execute
          - member:execute
          - discovery:read
```

### 2\. Auto-Registration

```shell
# Register n8n webhook automatically
npx ensemble integrations register n8n \
  --webhook-url https://n8n.company.com/webhook/ensemble \
  --api-key <key>
```

### 3\. Discovery Endpoint

```javascript
// conductor/discovery.js
export async function handleDiscovery(request, conductor) {
  const type = request.params.type; // 'ensembles' or 'members'
  
  const items = await conductor.discover(type);
  
  return Response.json({
    [type]: items.map(item => ({
      name: item.name,
      description: item.description,
      type: item.type,
      schema: item.schema,
      tags: item.tags
    }))
  });
}
```

## **Publishing to n8n Community**

### 1\. NPM Publication

```shell
# Build the node
npm run build

# Test locally
npm link
cd ~/.n8n/nodes
npm link n8n-nodes-ensemble-edge

# Publish to npm
npm publish --access public
```

### 2\. n8n Community Submission

```shell
# Submit to n8n community nodes
npm run submit-to-community
```

### 3\. Documentation

Create comprehensive docs at:

- GitHub README  
- n8n Community Nodes page  
- Ensemble Edge documentation site

## **Benefits of n8n Integration**

### For n8n Users

1. **Access to AI orchestration** \- Use Ensemble's AI capabilities in n8n  
2. **Edge computing** \- Execute workflows at the edge via Ensemble  
3. **Pre-built members** \- Access to Ensemble's member library  
4. **Scalability** \- Leverage Cloudflare's global infrastructure

### For Ensemble Edge Users

1. **Visual workflow builder** \- n8n's UI for building workflows  
2. **Integration ecosystem** \- Connect to 400+ n8n nodes  
3. **Alternative interface** \- Use n8n as a visual frontend  
4. **Hybrid workflows** \- Combine n8n and Ensemble capabilities

## **Summary**

The Ensemble Edge n8n node provides:

1. **Universal connectivity** \- Works with any Ensemble Edge project  
2. **Full feature access** \- Execute ensembles, members, discovery  
3. **Bidirectional webhooks** \- Trigger and be triggered  
4. **Dynamic configuration** \- Auto-discover available resources  
5. **Enterprise ready** \- Authentication, verification, error handling

This makes Ensemble Edge accessible to the entire n8n ecosystem while giving Ensemble users access to n8n's vast integration library, creating a powerful combination of edge orchestration and workflow automation.  