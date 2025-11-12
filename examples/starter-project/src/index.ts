/**
 * Example Conductor Worker
 *
 * This shows how to use @ensemble-edge/conductor as a dependency
 * to build your own AI orchestration system
 */

import { Executor, MemberLoader } from '@ensemble-edge/conductor';
import { Parser } from '@ensemble-edge/conductor';

// Import your agents
import greetConfig from '../agents/greet/agent.yaml';
import greetFunction from '../agents/greet';

// Import your ensembles
import helloWorldYAML from '../ensembles/hello-world.yaml';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Health check
		if (url.pathname === '/health') {
			return Response.json({ status: 'ok', service: 'conductor' });
		}

		// Execute ensemble
		if (url.pathname === '/ensemble/hello-world' && request.method === 'POST') {
			try {
				// Parse request body
				const input = await request.json();

				// Create executor
				const executor = new Executor({ env, ctx });

				// Create loader
				const loader = new MemberLoader({ env, ctx });

				// Register agents
				const greetMember = loader.registerAgent(greetConfig, greetFunction);
				executor.registerAgent(greetMember);

				// Execute ensemble
				const result = await executor.executeFromYAML(helloWorldYAML, input);

				return Response.json(result);
			} catch (error) {
				return Response.json(
					{
						success: false,
						error: error instanceof Error ? error.message : 'Unknown error'
					},
					{ status: 500 }
				);
			}
		}

		return new Response('Not Found', { status: 404 });
	}
} satisfies ExportedHandler<Env>;
