# **Webhook Integration**

## **Overview**

Ensembles and members can be configured as **webhook receivers**, enabling event-driven workflows from external services. Any ensemble or member can be exposed as a webhook endpoint, with built-in signature verification, event routing, and automatic registration capabilities.

## **Core Concepts**

### Webhook-Enabled Members and Ensembles

Any member or ensemble can be configured to receive webhooks by adding a `webhook` configuration:

```
# ensembles/github-events.yaml
name: github-events
description: Handle GitHub webhook events

webhook:
  enabled: true
  path: /webhooks/github  # Optional custom path
  events:
    - push
    - pull_request
    - issues
  verification:
    type: hmac-sha256
    secret: ${env.GITHUB_WEBHOOK_SECRET}
  
flow:
  - member: parse-github-event
    input:
      headers: ${webhook.headers}
      body: ${webhook.body}
      event: ${webhook.event}
```

## **Webhook Configuration**

### 1\. Basic Webhook Setup

```
# members/stripe-handler/member.yaml
name: stripe-handler
type: Function
description: Handle Stripe payment events

webhook:
  enabled: true
  provider: stripe  # Pre-configured provider
  events:
    - payment_intent.succeeded
    - customer.subscription.created
    - invoice.paid

code: |
  export default async function({ webhook }) {
    const { event, data } = webhook;
    
    switch(event) {
      case 'payment_intent.succeeded':
        return handlePaymentSuccess(data);
      case 'customer.subscription.created':
        return handleNewSubscription(data);
    }
  }
```

### 2\. Custom Webhook Configuration

```
# ensembles/custom-webhook.yaml
name: custom-webhook
description: Handle custom webhook with verification

webhook:
  enabled: true
  path: /webhooks/custom/${input.customer_id}  # Dynamic path
  
  verification:
    type: custom
    handler: verify-webhook  # Member that verifies
    
  headers:  # Required headers
    - x-webhook-signature
    - x-webhook-timestamp
    
  rateLimit:
    requests: 100
    window: 60  # seconds
    
  retry:
    enabled: true
    maxAttempts: 3
    backoff: exponential
```

### 3\. Webhook Providers Registry

```
# config/webhooks.yaml
providers:
  github:
    verification:
      type: hmac-sha256
      header: x-hub-signature-256
      secret_env: GITHUB_WEBHOOK_SECRET
    events:
      - push
      - pull_request
      - issues
      - workflow_run
      
  stripe:
    verification:
      type: stripe-signature
      header: stripe-signature
      secret_env: STRIPE_WEBHOOK_SECRET
    events:
      - payment_intent.*
      - customer.*
      - invoice.*
      
  slack:
    verification:
      type: hmac-sha256
      header: x-slack-signature
      secret_env: SLACK_SIGNING_SECRET
    challenge: true  # Responds to Slack challenges
    
  shopify:
    verification:
      type: hmac-sha256
      header: x-shopify-hmac-sha256
      secret_env: SHOPIFY_WEBHOOK_SECRET
```

## **Webhook Routes**

### Automatic Route Generation

When webhooks are enabled, Conductor automatically creates routes:

```
# Default patterns
/conductor/webhooks/:ensemble_name
/conductor/webhooks/:member_type/:member_name

# Custom patterns
/webhooks/github/events
/webhooks/stripe/payments
/webhooks/slack/commands
```

### Route Configuration in wrangler.toml

```
# wrangler.toml
[env.production]
routes = [
  "https://api.ownerco.com/conductor/*",
  "https://webhooks.ownerco.com/*",
  "https://api.ownerco.com/webhooks/*"
]
```

## **Webhook Security**

### 1\. Signature Verification

```javascript
// conductor/webhooks/verification.js
export class WebhookVerifier {
  async verify(request, config) {
    const { type, secret, header } = config.verification;
    
    switch(type) {
      case 'hmac-sha256':
        return await this.verifyHMAC(request, secret, header);
        
      case 'stripe-signature':
        return await this.verifyStripe(request, secret);
        
      case 'custom':
        return await this.verifyCustom(request, config);
    }
  }
  
  async verifyHMAC(request, secret, headerName) {
    const signature = request.headers.get(headerName);
    const body = await request.text();
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const verified = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToArrayBuffer(signature),
      encoder.encode(body)
    );
    
    return { verified, body };
  }
}
```

### 2\. IP Allowlisting

```
webhook:
  security:
    allowedIPs:
      - 140.82.112.0/20  # GitHub
      - 143.55.64.0/20   # GitHub
      - 54.187.174.169   # Stripe
      - 54.187.205.235   # Stripe
    cloudflare: true  # Use CF's IP validation
```

### 3\. Event Filtering

```
webhook:
  events:
    include:
      - payment_intent.succeeded
      - customer.created
    exclude:
      - "*.test"  # Exclude test events
      - "*.sandbox"  # Exclude sandbox events
```

## **Webhook Registration**

### Auto-Registration with Services

```
# ensembles/auto-register.yaml
name: github-webhook-handler

webhook:
  enabled: true
  autoRegister: true  # Auto-register on deploy
  
  registration:
    service: github
    config:
      owner: ${env.GITHUB_OWNER}
      repo: ${env.GITHUB_REPO}
      events:
        - push
        - pull_request
      url: https://api.ownerco.com/webhooks/github
      secret: ${env.GITHUB_WEBHOOK_SECRET}
```

### Registration via CLI

```shell
# Register webhook with service
npx ensemble webhook register github-events --service github

# List registered webhooks
npx ensemble webhook list

# Update webhook configuration
npx ensemble webhook update github-events --add-event issues

# Test webhook locally
npx ensemble webhook test github-events --payload sample.json

# Unregister webhook
npx ensemble webhook unregister github-events
```

## **Event Processing**

### 1\. Event Router

```javascript
// conductor/webhooks/router.js
export class WebhookRouter {
  constructor(conductor) {
    this.conductor = conductor;
  }
  
  async route(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Extract ensemble/member from path
    const match = path.match(/\/webhooks\/(.+)/);
    if (!match) return new Response('Not Found', { status: 404 });
    
    const targetName = match[1];
    
    // Load webhook config
    const config = await this.loadWebhookConfig(targetName);
    
    // Verify webhook signature
    const { verified, body } = await this.verify(request, config);
    if (!verified) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Parse event
    const event = this.parseEvent(request, body, config);
    
    // Execute ensemble/member with webhook context
    const result = await this.conductor.execute(targetName, {
      webhook: {
        headers: Object.fromEntries(request.headers),
        body: body,
        event: event,
        raw: request
      }
    });
    
    return Response.json(result);
  }
}
```

### 2\. Event Queue (Optional)

```
webhook:
  queue:
    enabled: true
    service: queues  # Cloudflare Queues
    config:
      name: webhook-events
      batchSize: 10
      maxRetries: 3
      dlq: webhook-dlq  # Dead letter queue
```

### 3\. Event Storage

```
webhook:
  storage:
    enabled: true
    destination: r2  # Store in R2
    bucket: ownerco-oiq-webhooks
    format: json
    retention: 30  # days
    schema:
      - timestamp
      - event_type
      - payload
      - headers
      - verification_status
```

## **Usage Examples**

### Example 1: GitHub CI/CD Pipeline

```
# ensembles/github-ci.yaml
name: github-ci
description: CI/CD triggered by GitHub webhooks

webhook:
  enabled: true
  provider: github
  events:
    - push
    - pull_request.opened
    - pull_request.synchronize

flow:
  - condition: ${webhook.event == 'push'}
    member: deploy-production
    input:
      branch: ${webhook.body.ref}
      commit: ${webhook.body.head_commit.id}
      
  - condition: ${webhook.event.startsWith('pull_request')}
    member: run-tests
    input:
      pr_number: ${webhook.body.pull_request.number}
      
  - member: notify-slack
    input:
      channel: '#deployments'
      message: ${previous.output.message}
```

### Example 2: Stripe Payment Processing

```
# ensembles/stripe-payments.yaml
name: stripe-payments
description: Handle Stripe payment webhooks

webhook:
  enabled: true
  provider: stripe
  events:
    - payment_intent.succeeded
    - payment_intent.failed
    - charge.refunded

flow:
  - member: parse-stripe-event
    input:
      event: ${webhook.event}
      data: ${webhook.body}
      
  - switch: ${webhook.event}
    cases:
      - case: payment_intent.succeeded
        member: process-payment
      - case: payment_intent.failed  
        member: handle-failed-payment
      - case: charge.refunded
        member: process-refund
        
  - member: update-database
    type: Data
    input:
      operation: upsert
      table: payments
      data: ${previous.output}
      
  - member: send-email
    input:
      to: ${previous.output.customer_email}
      template: ${webhook.event}
      data: ${previous.output}
```

### Example 3: Slack Command Handler

```
# members/slack-command/member.yaml
name: slack-command
type: Function
description: Handle Slack slash commands

webhook:
  enabled: true
  provider: slack
  challenge: true  # Handle Slack challenges
  commands:
    - /ensemble
    - /ai-help
    
code: |
  export default async function({ webhook }) {
    const { command, text, user_id, channel_id } = webhook.body;
    
    // Route based on command
    switch(command) {
      case '/ensemble':
        return handleEnsembleCommand(text, user_id);
      case '/ai-help':
        return handleAIHelp(text, channel_id);
    }
    
    // Return Slack-formatted response
    return {
      response_type: 'in_channel',
      text: 'Command processed',
      attachments: [...]
    };
  }
```

## **Monitoring & Debugging**

### Webhook Analytics

```javascript
// conductor/webhooks/analytics.js
export class WebhookAnalytics {
  constructor(env) {
    this.analytics = env.ANALYTICS;
  }
  
  async track(event) {
    await this.analytics.writeDataPoint({
      dataset: 'webhooks',
      point: {
        blobs: [
          event.provider,
          event.event_type,
          event.ensemble_name
        ],
        doubles: [
          event.processing_time,
          event.payload_size
        ],
        indexes: [event.provider]
      }
    });
  }
}
```

### Debug Mode

```
webhook:
  debug:
    enabled: true
    logLevel: verbose
    storage:
      destination: kv
      ttl: 3600  # Keep debug logs for 1 hour
    includeHeaders: true
    includeBody: true
```

### Webhook Testing

```shell
# Test with sample payload
npx ensemble webhook test github-events \
  --event push \
  --payload samples/github-push.json

# Simulate webhook locally
npx ensemble dev --webhook-mode

# Replay webhook from storage
npx ensemble webhook replay <webhook-id>

# Validate webhook configuration
npx ensemble webhook validate
```

## **Best Practices**

### 1\. Security

- **Always verify signatures** \- Never trust webhooks without verification  
- **Use environment variables** for secrets  
- **Implement rate limiting** to prevent abuse  
- **Log all webhook events** for audit trails

### 2\. Reliability

- **Implement idempotency** \- Handle duplicate webhooks gracefully  
- **Use queues for processing** \- Don't block webhook responses  
- **Set appropriate timeouts** \- Webhooks often have tight timeouts  
- **Return 2xx quickly** \- Process async, respond fast

### 3\. Development

- **Use webhook.site for testing** during development  
- **Mock webhooks in tests** with sample payloads  
- **Version your webhook handlers** for backward compatibility  
- **Document expected payloads** in member/ensemble docs

### 4\. Monitoring

- **Track webhook metrics** \- Success rates, processing times  
- **Alert on failures** \- Repeated failures may indicate issues  
- **Monitor rate limits** \- Stay within provider limits  
- **Archive webhook data** \- Store for debugging and compliance

## **Configuration Examples**

### Complete Webhook Configuration

```
# ensembles/production-webhooks.yaml
name: production-webhooks
description: Production webhook handler with full configuration

webhook:
  enabled: true
  path: /webhooks/production
  
  # Security
  verification:
    type: hmac-sha256
    secret: ${env.WEBHOOK_SECRET}
    header: x-webhook-signature
    
  allowedIPs:
    - 192.168.1.0/24
    
  # Rate limiting
  rateLimit:
    requests: 1000
    window: 60
    byIP: true
    
  # Event configuration
  events:
    include: ["production.*", "critical.*"]
    exclude: ["*.test", "*.debug"]
    
  # Processing
  queue:
    enabled: true
    name: production-webhooks
    
  storage:
    enabled: true
    destination: r2
    bucket: webhook-archive
    
  # Monitoring
  analytics:
    enabled: true
    dataset: production-webhooks
    
  debug:
    enabled: false
    
  # Auto-recovery
  retry:
    enabled: true
    maxAttempts: 3
    backoff: exponential
    dlq: webhook-failures

flow:
  - member: validate-webhook
  - member: process-event
  - member: update-systems
  - member: notify-team
```

## **Summary**

Webhook support in Ensemble Edge enables:

1. **Event-driven workflows** \- React to external events in real-time  
2. **Secure integration** \- Built-in signature verification and security  
3. **Provider compatibility** \- Pre-configured for major services  
4. **Edge-native processing** \- Handle webhooks at the edge with low latency  
5. **Flexible routing** \- Route events to appropriate ensembles/members  
6. **Robust handling** \- Queuing, retries, and monitoring built-in

This makes Ensemble Edge a complete platform for both API-driven and event-driven orchestration at the edge.  