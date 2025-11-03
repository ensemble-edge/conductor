/**
 * OpenAPI 3.1 Specification
 *
 * Complete API documentation for Conductor.
 */

export const openAPISpec = {
	openapi: '3.1.0',
	info: {
		title: 'Conductor API',
		version: '1.0.0',
		description: 'Agentic workflow orchestration framework for Cloudflare Workers',
		contact: {
			name: 'Ensemble Edge',
			url: 'https://github.com/ensemble-edge/conductor'
		},
		license: {
			name: 'Apache 2.0',
			url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
		}
	},
	servers: [
		{
			url: 'https://api.conductor.dev',
			description: 'Production server'
		},
		{
			url: 'http://localhost:8787',
			description: 'Local development server'
		}
	],
	tags: [
		{
			name: 'execution',
			description: 'Member execution endpoints'
		},
		{
			name: 'members',
			description: 'Member discovery and information'
		},
		{
			name: 'health',
			description: 'Health check and monitoring'
		}
	],
	paths: {
		'/': {
			get: {
				summary: 'Get API information',
				description: 'Returns basic information about the Conductor API',
				tags: ['health'],
				responses: {
					'200': {
						description: 'API information',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										name: { type: 'string' },
										version: { type: 'string' },
										description: { type: 'string' },
										documentation: { type: 'string' },
										endpoints: { type: 'object' }
									}
								}
							}
						}
					}
				}
			}
		},
		'/api/v1/execute': {
			post: {
				summary: 'Execute a member',
				description: 'Execute a built-in member synchronously',
				tags: ['execution'],
				security: [{ apiKey: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ExecuteRequest' }
						}
					}
				},
				responses: {
					'200': {
						description: 'Execution successful',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ExecuteResponse' }
							}
						}
					},
					'400': {
						description: 'Validation error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					},
					'401': {
						description: 'Unauthorized',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					},
					'404': {
						description: 'Member not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					},
					'500': {
						description: 'Execution error',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					}
				}
			}
		},
		'/api/v1/members': {
			get: {
				summary: 'List all members',
				description: 'Get a list of all available built-in members',
				tags: ['members'],
				security: [{ apiKey: [] }],
				responses: {
					'200': {
						description: 'List of members',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/MemberListResponse' }
							}
						}
					},
					'401': {
						description: 'Unauthorized',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					}
				}
			}
		},
		'/api/v1/members/{name}': {
			get: {
				summary: 'Get member details',
				description: 'Get detailed information about a specific member',
				tags: ['members'],
				security: [{ apiKey: [] }],
				parameters: [
					{
						name: 'name',
						in: 'path',
						required: true,
						description: 'Member name',
						schema: { type: 'string' },
						example: 'fetch'
					}
				],
				responses: {
					'200': {
						description: 'Member details',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/MemberDetailResponse' }
							}
						}
					},
					'401': {
						description: 'Unauthorized',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					},
					'404': {
						description: 'Member not found',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/ErrorResponse' }
							}
						}
					}
				}
			}
		},
		'/health': {
			get: {
				summary: 'Health check',
				description: 'Check the health status of the API and its dependencies',
				tags: ['health'],
				responses: {
					'200': {
						description: 'Service is healthy or degraded',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/HealthResponse' }
							}
						}
					},
					'503': {
						description: 'Service is unhealthy',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/HealthResponse' }
							}
						}
					}
				}
			}
		},
		'/health/ready': {
			get: {
				summary: 'Readiness check',
				description: 'Check if the service is ready to accept traffic',
				tags: ['health'],
				responses: {
					'200': {
						description: 'Service is ready',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										ready: { type: 'boolean' },
										timestamp: { type: 'number' }
									}
								}
							}
						}
					}
				}
			}
		},
		'/health/live': {
			get: {
				summary: 'Liveness check',
				description: 'Check if the service is alive',
				tags: ['health'],
				responses: {
					'200': {
						description: 'Service is alive',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										alive: { type: 'boolean' },
										timestamp: { type: 'number' }
									}
								}
							}
						}
					}
				}
			}
		}
	},
	components: {
		securitySchemes: {
			apiKey: {
				type: 'apiKey',
				in: 'header',
				name: 'X-API-Key',
				description: 'API key for authentication'
			}
		},
		schemas: {
			ExecuteRequest: {
				type: 'object',
				required: ['member', 'input'],
				properties: {
					member: {
						type: 'string',
						description: 'Name of the member to execute',
						example: 'fetch'
					},
					input: {
						type: 'object',
						description: 'Input data for the member',
						additionalProperties: true,
						example: { url: 'https://api.example.com/data' }
					},
					config: {
						type: 'object',
						description: 'Optional configuration for the member',
						additionalProperties: true,
						example: { timeout: 5000 }
					},
					userId: {
						type: 'string',
						description: 'User ID for memory/storage operations',
						example: 'user_123'
					},
					sessionId: {
						type: 'string',
						description: 'Session ID for conversation history',
						example: 'session_abc'
					},
					metadata: {
						type: 'object',
						description: 'Additional metadata',
						additionalProperties: true
					}
				}
			},
			ExecuteResponse: {
				type: 'object',
				required: ['success', 'metadata'],
				properties: {
					success: {
						type: 'boolean',
						description: 'Whether the execution was successful'
					},
					data: {
						description: 'Execution result data',
						oneOf: [
							{ type: 'object' },
							{ type: 'array' },
							{ type: 'string' },
							{ type: 'number' },
							{ type: 'boolean' }
						]
					},
					error: {
						type: 'string',
						description: 'Error message if execution failed'
					},
					metadata: {
						type: 'object',
						required: ['executionId', 'duration', 'timestamp'],
						properties: {
							executionId: {
								type: 'string',
								description: 'Unique execution ID',
								example: 'req_l5x8k2p4b7m'
							},
							duration: {
								type: 'number',
								description: 'Execution duration in milliseconds',
								example: 234
							},
							timestamp: {
								type: 'number',
								description: 'Completion timestamp',
								example: 1699564800000
							}
						}
					}
				}
			},
			MemberListResponse: {
				type: 'object',
				required: ['members', 'count'],
				properties: {
					members: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								name: { type: 'string', example: 'fetch' },
								type: { type: 'string', example: 'function' },
								version: { type: 'string', example: '1.0.0' },
								description: { type: 'string', example: 'HTTP client with retry' },
								builtIn: { type: 'boolean', example: true }
							}
						}
					},
					count: {
						type: 'number',
						description: 'Total number of members',
						example: 5
					}
				}
			},
			MemberDetailResponse: {
				type: 'object',
				required: ['name', 'type', 'builtIn'],
				properties: {
					name: { type: 'string', example: 'fetch' },
					type: { type: 'string', example: 'function' },
					version: { type: 'string', example: '1.0.0' },
					description: { type: 'string', example: 'HTTP client with exponential backoff retry' },
					builtIn: { type: 'boolean', example: true },
					config: {
						type: 'object',
						properties: {
							schema: { type: 'object', additionalProperties: true },
							defaults: { type: 'object', additionalProperties: true }
						}
					},
					input: {
						type: 'object',
						properties: {
							schema: { type: 'object', additionalProperties: true },
							examples: { type: 'array', items: { type: 'object' } }
						}
					},
					output: {
						type: 'object',
						properties: {
							schema: { type: 'object', additionalProperties: true }
						}
					}
				}
			},
			HealthResponse: {
				type: 'object',
				required: ['status', 'timestamp', 'version', 'checks'],
				properties: {
					status: {
						type: 'string',
						enum: ['healthy', 'degraded', 'unhealthy'],
						example: 'healthy'
					},
					timestamp: {
						type: 'number',
						example: 1699564800000
					},
					version: {
						type: 'string',
						example: '1.0.0'
					},
					checks: {
						type: 'object',
						properties: {
							database: { type: 'boolean' },
							cache: { type: 'boolean' },
							queue: { type: 'boolean' }
						}
					}
				}
			},
			ErrorResponse: {
				type: 'object',
				required: ['error', 'message', 'timestamp'],
				properties: {
					error: {
						type: 'string',
						description: 'Error type',
						example: 'ValidationError'
					},
					message: {
						type: 'string',
						description: 'Human-readable error message',
						example: 'Member name is required'
					},
					code: {
						type: 'string',
						description: 'Error code',
						example: 'VALIDATION_ERROR'
					},
					details: {
						description: 'Additional error details',
						oneOf: [
							{ type: 'object' },
							{ type: 'array' },
							{ type: 'string' }
						]
					},
					timestamp: {
						type: 'number',
						description: 'Error timestamp',
						example: 1699564800000
					},
					requestId: {
						type: 'string',
						description: 'Request ID for tracing',
						example: 'req_l5x8k2p4b7m'
					}
				}
			}
		}
	}
} as const;

export type OpenAPISpec = typeof openAPISpec;
