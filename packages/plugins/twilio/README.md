# Twilio Plugin for Conductor

Production-ready plugin that **extends Conductor with SMS and voice messaging capabilities via Twilio**.

## What This Plugin Does

1. **Registers a new trigger type**: `twilio:sms`
2. **Handles Twilio webhooks**: Receives SMS messages via Twilio's webhook system
3. **Executes ensembles**: Triggers ensemble flows when SMS messages arrive
4. **Auto-replies**: Optionally sends SMS responses using TwiML

## Installation

```bash
pnpm add @conductor/twilio
```

## Usage

### 1. Register the Plugin

In your Conductor application, register the Twilio SMS trigger:

```typescript
import { registerTwilioSMSTrigger } from '@conductor/twilio'

// Register the custom trigger type
registerTwilioSMSTrigger()
```

### 2. Create an Ensemble with Twilio SMS Trigger

```yaml
name: sms-support-bot
description: AI-powered SMS support bot

trigger:
  - type: twilio:sms  # ← Custom trigger type from plugin!
    path: /twilio/sms/support
    auth:
      accountSid: ${env.TWILIO_ACCOUNT_SID}
      authToken: ${env.TWILIO_AUTH_TOKEN}
    filter:
      to: ["+1234567890"]
    autoReply:
      enabled: true

flow:
  - agent: process-sms
    input:
      message: ${input.message}
      from: ${input.from}

  - agent: generate-reply
    input: ${process-sms}
```

### 3. Configure Twilio Webhook

In your Twilio console, set your SMS webhook URL to:

```
https://your-conductor-app.com/twilio/sms/support
```

## Configuration

### Trigger Config

```yaml
trigger:
  - type: twilio:sms

    # Webhook path (optional, defaults to /twilio/sms/{ensemble-name})
    path: /twilio/sms/support

    # Twilio authentication (required)
    auth:
      accountSid: ${env.TWILIO_ACCOUNT_SID}
      authToken: ${env.TWILIO_AUTH_TOKEN}

    # Optional: Filter messages
    filter:
      from: ["+1111111111", "+2222222222"]  # Whitelist senders
      to: ["+1234567890"]                   # Whitelist recipients

    # Optional: Auto-reply via TwiML
    autoReply:
      enabled: true
      message: "Thanks! We'll respond soon."  # Or use ensemble output
```

### Input Data Available to Ensemble

When an SMS is received, your ensemble flow has access to:

```yaml
input:
  sms:
    from: "+1111111111"
    to: "+1234567890"
    body: "Hello, I need help!"
    messageSid: "SM..."
    accountSid: "AC..."
  message: "Hello, I need help!"  # Shortcut to body
  from: "+1111111111"              # Shortcut to from
  to: "+1234567890"                # Shortcut to to

metadata:
  trigger: "twilio:sms"
  messageSid: "SM..."
  provider: "twilio"
```

## Creating Your Own Custom Trigger

This plugin's implementation can serve as a guide for building your own custom triggers. Here's how:

### 1. Define Trigger Schema

```typescript
import { z } from 'zod'

const MyTriggerSchema = z.object({
  type: z.literal('my-custom-trigger'),
  // ... your trigger config fields
})

export type MyTriggerConfig = z.infer<typeof MyTriggerSchema>
```

### 2. Implement Trigger Handler

```typescript
import type { TriggerHandlerContext } from '@ensemble-edge/conductor/runtime'
import { Executor } from '@ensemble-edge/conductor/runtime'

async function handleMyTrigger(context: TriggerHandlerContext): Promise<void> {
  const { app, ensemble, trigger, agents, env, ctx } = context
  const config = trigger as MyTriggerConfig

  // Register routes/webhooks/listeners
  app.post('/my-trigger', async (c) => {
    // Extract data from your trigger source
    const input = await extractData(c)

    // Execute ensemble
    const executor = new Executor({ env, ctx })
    for (const agent of agents) {
      executor.registerAgent(agent)
    }

    const result = await executor.executeEnsemble(ensemble, {
      input,
      metadata: { trigger: 'my-custom-trigger' },
    })

    return c.json(result)
  })
}
```

### 3. Register with TriggerRegistry

```typescript
import { getTriggerRegistry } from '@ensemble-edge/conductor/runtime'

export function registerMyTrigger(): void {
  const registry = getTriggerRegistry()

  registry.register(handleMyTrigger, {
    type: 'my-custom-trigger',
    name: 'My Custom Trigger',
    description: 'Triggers ensembles from my custom source',
    schema: MyTriggerSchema as any,
    requiresAuth: true,
    tags: ['custom', 'my-plugin'],
    plugin: '@my-org/my-plugin',
  })
}
```

### 4. Call Registration During Init

Users of your plugin call this during app initialization:

```typescript
import { registerMyTrigger } from '@my-org/my-plugin'

// Before ensembles are loaded
registerMyTrigger()
```

## Complete Example

See the [twilio:sms-bot.yaml](../../conductor/catalog/cloud/cloudflare/templates/ensembles/examples/other-triggers/twilio:sms-bot.yaml) ensemble for a complete, production-ready SMS support bot implementation.

## Security

⚠️ **Important**: The current implementation does NOT validate Twilio request signatures. For production use, you should:

1. Verify the `X-Twilio-Signature` header
2. Use Twilio's validation library
3. Reject requests that don't come from Twilio

See: https://www.twilio.com/docs/usage/security#validating-requests

## License

MIT
