/**
 * OpenAPI 3.1 Specification
 *
 * Complete API documentation for Conductor.
 */
export declare const openAPISpec: {
    readonly openapi: "3.1.0";
    readonly info: {
        readonly title: "Conductor API";
        readonly version: "1.0.0";
        readonly description: "Agentic workflow orchestration framework for Cloudflare Workers";
        readonly contact: {
            readonly name: "Ensemble Edge";
            readonly url: "https://github.com/ensemble-edge/conductor";
        };
        readonly license: {
            readonly name: "Apache 2.0";
            readonly url: "https://www.apache.org/licenses/LICENSE-2.0.html";
        };
    };
    readonly servers: readonly [{
        readonly url: "https://api.conductor.dev";
        readonly description: "Production server";
    }, {
        readonly url: "http://localhost:8787";
        readonly description: "Local development server";
    }];
    readonly tags: readonly [{
        readonly name: "execution";
        readonly description: "Member execution endpoints";
    }, {
        readonly name: "members";
        readonly description: "Member discovery and information";
    }, {
        readonly name: "health";
        readonly description: "Health check and monitoring";
    }];
    readonly paths: {
        readonly '/': {
            readonly get: {
                readonly summary: "Get API information";
                readonly description: "Returns basic information about the Conductor API";
                readonly tags: readonly ["health"];
                readonly responses: {
                    readonly '200': {
                        readonly description: "API information";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly version: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly documentation: {
                                            readonly type: "string";
                                        };
                                        readonly endpoints: {
                                            readonly type: "object";
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly '/api/v1/execute': {
            readonly post: {
                readonly summary: "Execute a member";
                readonly description: "Execute a built-in member synchronously";
                readonly tags: readonly ["execution"];
                readonly security: readonly [{
                    readonly apiKey: readonly [];
                }];
                readonly requestBody: {
                    readonly required: true;
                    readonly content: {
                        readonly 'application/json': {
                            readonly schema: {
                                readonly $ref: "#/components/schemas/ExecuteRequest";
                            };
                        };
                    };
                };
                readonly responses: {
                    readonly '200': {
                        readonly description: "Execution successful";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/ExecuteResponse";
                                };
                            };
                        };
                    };
                    readonly '400': {
                        readonly description: "Validation error";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/ErrorResponse";
                                };
                            };
                        };
                    };
                    readonly '401': {
                        readonly description: "Unauthorized";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/ErrorResponse";
                                };
                            };
                        };
                    };
                    readonly '404': {
                        readonly description: "Member not found";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/ErrorResponse";
                                };
                            };
                        };
                    };
                    readonly '500': {
                        readonly description: "Execution error";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/ErrorResponse";
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly '/api/v1/members': {
            readonly get: {
                readonly summary: "List all members";
                readonly description: "Get a list of all available built-in members";
                readonly tags: readonly ["members"];
                readonly security: readonly [{
                    readonly apiKey: readonly [];
                }];
                readonly responses: {
                    readonly '200': {
                        readonly description: "List of members";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/MemberListResponse";
                                };
                            };
                        };
                    };
                    readonly '401': {
                        readonly description: "Unauthorized";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/ErrorResponse";
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly '/api/v1/members/{name}': {
            readonly get: {
                readonly summary: "Get member details";
                readonly description: "Get detailed information about a specific member";
                readonly tags: readonly ["members"];
                readonly security: readonly [{
                    readonly apiKey: readonly [];
                }];
                readonly parameters: readonly [{
                    readonly name: "name";
                    readonly in: "path";
                    readonly required: true;
                    readonly description: "Member name";
                    readonly schema: {
                        readonly type: "string";
                    };
                    readonly example: "fetch";
                }];
                readonly responses: {
                    readonly '200': {
                        readonly description: "Member details";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/MemberDetailResponse";
                                };
                            };
                        };
                    };
                    readonly '401': {
                        readonly description: "Unauthorized";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/ErrorResponse";
                                };
                            };
                        };
                    };
                    readonly '404': {
                        readonly description: "Member not found";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/ErrorResponse";
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly '/health': {
            readonly get: {
                readonly summary: "Health check";
                readonly description: "Check the health status of the API and its dependencies";
                readonly tags: readonly ["health"];
                readonly responses: {
                    readonly '200': {
                        readonly description: "Service is healthy or degraded";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/HealthResponse";
                                };
                            };
                        };
                    };
                    readonly '503': {
                        readonly description: "Service is unhealthy";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly $ref: "#/components/schemas/HealthResponse";
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly '/health/ready': {
            readonly get: {
                readonly summary: "Readiness check";
                readonly description: "Check if the service is ready to accept traffic";
                readonly tags: readonly ["health"];
                readonly responses: {
                    readonly '200': {
                        readonly description: "Service is ready";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly ready: {
                                            readonly type: "boolean";
                                        };
                                        readonly timestamp: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        readonly '/health/live': {
            readonly get: {
                readonly summary: "Liveness check";
                readonly description: "Check if the service is alive";
                readonly tags: readonly ["health"];
                readonly responses: {
                    readonly '200': {
                        readonly description: "Service is alive";
                        readonly content: {
                            readonly 'application/json': {
                                readonly schema: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly alive: {
                                            readonly type: "boolean";
                                        };
                                        readonly timestamp: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    readonly components: {
        readonly securitySchemes: {
            readonly apiKey: {
                readonly type: "apiKey";
                readonly in: "header";
                readonly name: "X-API-Key";
                readonly description: "API key for authentication";
            };
        };
        readonly schemas: {
            readonly ExecuteRequest: {
                readonly type: "object";
                readonly required: readonly ["member", "input"];
                readonly properties: {
                    readonly member: {
                        readonly type: "string";
                        readonly description: "Name of the member to execute";
                        readonly example: "fetch";
                    };
                    readonly input: {
                        readonly type: "object";
                        readonly description: "Input data for the member";
                        readonly additionalProperties: true;
                        readonly example: {
                            readonly url: "https://api.example.com/data";
                        };
                    };
                    readonly config: {
                        readonly type: "object";
                        readonly description: "Optional configuration for the member";
                        readonly additionalProperties: true;
                        readonly example: {
                            readonly timeout: 5000;
                        };
                    };
                    readonly userId: {
                        readonly type: "string";
                        readonly description: "User ID for memory/storage operations";
                        readonly example: "user_123";
                    };
                    readonly sessionId: {
                        readonly type: "string";
                        readonly description: "Session ID for conversation history";
                        readonly example: "session_abc";
                    };
                    readonly metadata: {
                        readonly type: "object";
                        readonly description: "Additional metadata";
                        readonly additionalProperties: true;
                    };
                };
            };
            readonly ExecuteResponse: {
                readonly type: "object";
                readonly required: readonly ["success", "metadata"];
                readonly properties: {
                    readonly success: {
                        readonly type: "boolean";
                        readonly description: "Whether the execution was successful";
                    };
                    readonly data: {
                        readonly description: "Execution result data";
                        readonly oneOf: readonly [{
                            readonly type: "object";
                        }, {
                            readonly type: "array";
                        }, {
                            readonly type: "string";
                        }, {
                            readonly type: "number";
                        }, {
                            readonly type: "boolean";
                        }];
                    };
                    readonly error: {
                        readonly type: "string";
                        readonly description: "Error message if execution failed";
                    };
                    readonly metadata: {
                        readonly type: "object";
                        readonly required: readonly ["executionId", "duration", "timestamp"];
                        readonly properties: {
                            readonly executionId: {
                                readonly type: "string";
                                readonly description: "Unique execution ID";
                                readonly example: "req_l5x8k2p4b7m";
                            };
                            readonly duration: {
                                readonly type: "number";
                                readonly description: "Execution duration in milliseconds";
                                readonly example: 234;
                            };
                            readonly timestamp: {
                                readonly type: "number";
                                readonly description: "Completion timestamp";
                                readonly example: 1699564800000;
                            };
                        };
                    };
                };
            };
            readonly MemberListResponse: {
                readonly type: "object";
                readonly required: readonly ["members", "count"];
                readonly properties: {
                    readonly members: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly name: {
                                    readonly type: "string";
                                    readonly example: "fetch";
                                };
                                readonly type: {
                                    readonly type: "string";
                                    readonly example: "function";
                                };
                                readonly version: {
                                    readonly type: "string";
                                    readonly example: "1.0.0";
                                };
                                readonly description: {
                                    readonly type: "string";
                                    readonly example: "HTTP client with retry";
                                };
                                readonly builtIn: {
                                    readonly type: "boolean";
                                    readonly example: true;
                                };
                            };
                        };
                    };
                    readonly count: {
                        readonly type: "number";
                        readonly description: "Total number of members";
                        readonly example: 5;
                    };
                };
            };
            readonly MemberDetailResponse: {
                readonly type: "object";
                readonly required: readonly ["name", "type", "builtIn"];
                readonly properties: {
                    readonly name: {
                        readonly type: "string";
                        readonly example: "fetch";
                    };
                    readonly type: {
                        readonly type: "string";
                        readonly example: "function";
                    };
                    readonly version: {
                        readonly type: "string";
                        readonly example: "1.0.0";
                    };
                    readonly description: {
                        readonly type: "string";
                        readonly example: "HTTP client with exponential backoff retry";
                    };
                    readonly builtIn: {
                        readonly type: "boolean";
                        readonly example: true;
                    };
                    readonly config: {
                        readonly type: "object";
                        readonly properties: {
                            readonly schema: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                            readonly defaults: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                    };
                    readonly input: {
                        readonly type: "object";
                        readonly properties: {
                            readonly schema: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                            readonly examples: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                };
                            };
                        };
                    };
                    readonly output: {
                        readonly type: "object";
                        readonly properties: {
                            readonly schema: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                    };
                };
            };
            readonly HealthResponse: {
                readonly type: "object";
                readonly required: readonly ["status", "timestamp", "version", "checks"];
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["healthy", "degraded", "unhealthy"];
                        readonly example: "healthy";
                    };
                    readonly timestamp: {
                        readonly type: "number";
                        readonly example: 1699564800000;
                    };
                    readonly version: {
                        readonly type: "string";
                        readonly example: "1.0.0";
                    };
                    readonly checks: {
                        readonly type: "object";
                        readonly properties: {
                            readonly database: {
                                readonly type: "boolean";
                            };
                            readonly cache: {
                                readonly type: "boolean";
                            };
                            readonly queue: {
                                readonly type: "boolean";
                            };
                        };
                    };
                };
            };
            readonly ErrorResponse: {
                readonly type: "object";
                readonly required: readonly ["error", "message", "timestamp"];
                readonly properties: {
                    readonly error: {
                        readonly type: "string";
                        readonly description: "Error type";
                        readonly example: "ValidationError";
                    };
                    readonly message: {
                        readonly type: "string";
                        readonly description: "Human-readable error message";
                        readonly example: "Member name is required";
                    };
                    readonly code: {
                        readonly type: "string";
                        readonly description: "Error code";
                        readonly example: "VALIDATION_ERROR";
                    };
                    readonly details: {
                        readonly description: "Additional error details";
                        readonly oneOf: readonly [{
                            readonly type: "object";
                        }, {
                            readonly type: "array";
                        }, {
                            readonly type: "string";
                        }];
                    };
                    readonly timestamp: {
                        readonly type: "number";
                        readonly description: "Error timestamp";
                        readonly example: 1699564800000;
                    };
                    readonly requestId: {
                        readonly type: "string";
                        readonly description: "Request ID for tracing";
                        readonly example: "req_l5x8k2p4b7m";
                    };
                };
            };
        };
    };
};
export type OpenAPISpec = typeof openAPISpec;
//# sourceMappingURL=spec.d.ts.map