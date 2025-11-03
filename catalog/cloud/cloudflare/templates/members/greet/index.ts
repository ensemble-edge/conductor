/**
 * Greet Member - Think Type
 *
 * ⚠️ IMPORTANT: This file is NOT required for "think" type members!
 *
 * Since this member is defined as type: "think" in member.yaml, Conductor's
 * built-in Think member automatically handles:
 * - Loading the prompt from prompts/greeting.md
 * - Rendering the prompt with input variables (name, style, language)
 * - Loading config from configs/greet-settings.yaml
 * - Calling the AI model with the rendered prompt
 * - Returning the AI's response as output.message
 *
 * This file exists only to demonstrate the structure. You can safely delete it
 * and the member will still work perfectly.
 *
 * If you need custom logic (validation, transformation, API calls), change the
 * member type to "function" and implement your logic here.
 */

import type { MemberExecutionContext } from '@ensemble-edge/conductor';
import { sanitizeInput, formatMessage } from '../../lib/formatting';

/**
 * Optional custom implementation (not used when type: "think")
 *
 * If you change member.yaml to type: "function", this code will run.
 * It demonstrates:
 * - Using shared utilities from src/lib/
 * - Input validation and sanitization
 * - Custom output formatting
 */
export default async function greet({ input, config }: MemberExecutionContext) {
	// Sanitize user input using shared utility
	const name = sanitizeInput(input.name || 'World');
	const style = input.style || config?.defaults?.style || 'friendly';

	// Generate greeting based on style
	let message = '';
	if (style === 'formal') {
		message = `Good day, ${name}. It's a pleasure to meet you.`;
	} else if (style === 'casual') {
		message = `Hey ${name}! Great to see you!`;
	} else {
		message = `Hello, ${name}! Welcome to Conductor.`;
	}

	// Format message using shared utility
	const formattedMessage = formatMessage(message, false);

	return {
		message: formattedMessage
	};
}

/**
 * USAGE GUIDE:
 *
 * For AI-powered greetings (recommended):
 * - Keep type: "think" in member.yaml
 * - Delete this file or keep it for reference
 * - The AI model will generate personalized greetings
 *
 * For simple/deterministic greetings:
 * - Change type: "function" in member.yaml
 * - Use this implementation
 * - Faster execution, no AI model calls
 */
