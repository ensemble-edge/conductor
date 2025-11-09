/**
 * HTML Member Tests
 *
 * Tests for HTML template rendering with cookie support
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HtmlMember } from '../../../src/members/html/html-member.js';
import type { MemberConfig, MemberExecutionContext } from '../../../src/runtime/types.js';
import type { HtmlMemberOutput } from '../../../src/members/html/types/index.js';

describe('HtmlMember', () => {
	let mockEnv: any;
	let mockCtx: ExecutionContext;
	let mockKV: KVNamespace;
	let mockR2: R2Bucket;

	beforeEach(() => {
		// Mock KV namespace
		mockKV = {
			get: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
			list: vi.fn(),
		} as unknown as KVNamespace;

		// Mock R2 bucket
		mockR2 = {
			get: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
			list: vi.fn(),
		} as unknown as R2Bucket;

		mockEnv = {
			TEMPLATES: mockKV,
			ASSETS: mockR2,
		};

		mockCtx = {
			waitUntil: vi.fn(),
			passThroughOnException: vi.fn(),
		} as unknown as ExecutionContext;
	});

	describe('Constructor', () => {
		it('should create HTML member with inline template', () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '<h1>{{title}}</h1>'
				}
			};

			const member = new HtmlMember(config);
			expect(member).toBeDefined();
		});

		it('should throw error without template config', () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML'
			};

			expect(() => new HtmlMember(config)).toThrow('HTML member requires a template configuration');
		});
	});

	describe('Template Rendering', () => {
		it('should render simple template with variables', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '<h1>{{title}}</h1><p>{{description}}</p>'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {
						title: 'Test Page',
						description: 'This is a test'
					}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			expect(output.html).toContain('<h1>Test Page</h1>');
			expect(output.html).toContain('<p>This is a test</p>');
		});

		it('should render template with conditionals', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '{{#if showMessage}}<p>{{message}}</p>{{/if}}'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {
						showMessage: true,
						message: 'Hello World'
					}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			expect(output.html).toContain('<p>Hello World</p>');
		});

		it('should render template with loops', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '<ul>{{#each items}}<li>{{name}}</li>{{/each}}</ul>'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {
						items: [
							{ name: 'Item 1' },
							{ name: 'Item 2' },
							{ name: 'Item 3' }
						]
					}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			expect(output.html).toContain('<li>Item 1</li>');
			expect(output.html).toContain('<li>Item 2</li>');
			expect(output.html).toContain('<li>Item 3</li>');
		});

		it('should render template with nested object paths', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '<h1>{{user.name}}</h1><p>{{user.email}}</p>'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {
						user: {
							name: 'John Doe',
							email: 'john@example.com'
						}
					}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			expect(output.html).toContain('<h1>John Doe</h1>');
			expect(output.html).toContain('<p>john@example.com</p>');
		});
	});

	describe('Cookie Management', () => {
		it('should read cookies from input', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '<p>Session: {{cookies.session}}</p>'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {},
					cookies: {
						session: 'abc123',
						username: 'johndoe'
					}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			expect(output.html).toContain('<p>Session: abc123</p>');
			expect(output.readCookies).toEqual({
				session: 'abc123',
				username: 'johndoe'
			});
		});

		it('should set cookies in response', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '<h1>Login Success</h1>'
				},
				cookieSecret: 'test-secret-key',
				defaultCookieOptions: {
					httpOnly: true,
					secure: true,
					sameSite: 'lax'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {},
					setCookies: [
						{
							name: 'session',
							value: 'xyz789',
							options: {
								maxAge: 3600
							}
						}
					]
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			expect(output.cookies).toBeDefined();
			expect(output.cookies?.length).toBeGreaterThan(0);
			expect(output.cookies![0]).toContain('session=');
			expect(output.cookies![0]).toContain('Max-Age=3600');
			expect(output.cookies![0]).toContain('HttpOnly');
			expect(output.cookies![0]).toContain('Secure');
			expect(output.cookies![0]).toContain('SameSite=Lax');
		});

		it('should delete cookies', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '<h1>Logged Out</h1>'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {},
					deleteCookies: ['session', 'remember_me']
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			expect(output.cookies).toBeDefined();
			expect(output.cookies?.length).toBe(2);
			expect(output.cookies![0]).toContain('session=');
			expect(output.cookies![0]).toContain('Max-Age=0');
			expect(output.cookies![1]).toContain('remember_me=');
			expect(output.cookies![1]).toContain('Max-Age=0');
		});

		it('should sign cookies when secret is provided', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '<h1>Secure Login</h1>'
				},
				cookieSecret: 'super-secret-key'
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {},
					setCookies: [
						{
							name: 'session',
							value: 'user123',
							options: {
								signed: true
							}
						}
					]
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			expect(output.cookies).toBeDefined();
			// Signed cookie should contain value + signature (base64)
			expect(output.cookies![0]).toMatch(/session=user123\.[A-Za-z0-9+/=]+/);
		});
	});

	describe('Template Loading', () => {
		it('should load template from KV', async () => {
			const kvTemplate = '<h1>{{title}}</h1>';
			vi.mocked(mockKV.get).mockResolvedValue(kvTemplate);

			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					kv: 'templates/home'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {
						title: 'Home Page'
					}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			expect(mockKV.get).toHaveBeenCalledWith('templates/home', 'text');
			const output = response.data as HtmlMemberOutput;
			expect(output.html).toContain('<h1>Home Page</h1>');
		});

		it('should load template from R2', async () => {
			const r2Template = '<h1>{{title}}</h1>';
			const mockR2Object = {
				text: vi.fn().mockResolvedValue(r2Template)
			};
			vi.mocked(mockR2.get).mockResolvedValue(mockR2Object as any);

			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					r2: 'templates/home.html'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {
						title: 'Home Page'
					}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			expect(mockR2.get).toHaveBeenCalledWith('templates/home.html');
			const output = response.data as HtmlMemberOutput;
			expect(output.html).toContain('<h1>Home Page</h1>');
		});

		it('should throw error when KV template not found', async () => {
			vi.mocked(mockKV.get).mockResolvedValue(null);

			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					kv: 'templates/missing'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(false);
			expect(response.error).toContain('Template not found in KV');
		});
	});

	describe('Render Options', () => {
		it('should inline CSS when option is enabled', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: `
						<style>
							.header { color: red; }
						</style>
						<div class="header">Title</div>
					`
				},
				renderOptions: {
					inlineCss: true
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			// Style tag should be removed
			expect(output.html).not.toContain('<style>');
			// CSS should be inlined
			expect(output.html).toContain('style="color: red;"');
			expect(output.metadata?.cssInlined).toBe(true);
		});

		it('should minify HTML when option is enabled', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: `
						<html>
							<head>
								<title>Test</title>
							</head>
							<body>
								<h1>Title</h1>
								<!-- Comment -->
								<p>Content</p>
							</body>
						</html>
					`
				},
				renderOptions: {
					minify: true
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			// Should not contain extra whitespace
			expect(output.html).not.toContain('\n');
			expect(output.html).not.toContain('  ');
			// Should not contain comments
			expect(output.html).not.toContain('<!-- Comment -->');
			expect(output.metadata?.minified).toBe(true);
		});
	});

	describe('Metadata', () => {
		it('should return rendering metadata', async () => {
			const config: MemberConfig = {
				name: 'test-html',
				type: 'HTML',
				template: {
					inline: '<h1>{{title}}</h1>'
				}
			};

			const member = new HtmlMember(config);
			const context: MemberExecutionContext = {
				input: {
					data: {
						title: 'Test'
					}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as HtmlMemberOutput;
			expect(output.metadata).toBeDefined();
			expect(output.metadata?.renderTime).toBeGreaterThan(0);
			expect(output.metadata?.templateSize).toBeGreaterThan(0);
			expect(output.metadata?.outputSize).toBeGreaterThan(0);
			expect(output.engine).toBe('simple');
		});
	});
});
