/**
 * PDF Member Tests
 *
 * Tests for PDF generation from HTML with R2 storage and delivery options
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PdfMember } from '../../../src/members/pdf/pdf-member.js';
import type { MemberConfig, MemberExecutionContext } from '../../../src/runtime/types.js';
import type { PdfMemberOutput } from '../../../src/members/pdf/types/index.js';

describe('PdfMember', () => {
	let mockEnv: any;
	let mockCtx: ExecutionContext;
	let mockR2: R2Bucket;

	beforeEach(() => {
		// Mock R2 bucket
		mockR2 = {
			get: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
			list: vi.fn(),
		} as unknown as R2Bucket;

		mockEnv = {
			ASSETS: mockR2,
		};

		mockCtx = {
			waitUntil: vi.fn(),
			passThroughOnException: vi.fn(),
		} as unknown as ExecutionContext;
	});

	describe('Constructor', () => {
		it('should create PDF member with inline HTML', () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Test</h1>'
				}
			};

			const member = new PdfMember(config);
			expect(member).toBeDefined();
		});

		it('should create PDF member with HTML member reference', () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					fromMember: 'render-html'
				}
			};

			const member = new PdfMember(config);
			expect(member).toBeDefined();
		});

		it('should throw error with invalid page scale', () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Test</h1>'
				},
				page: {
					scale: 5.0  // Invalid: > 2.0
				}
			};

			expect(() => new PdfMember(config)).toThrow('Invalid page config');
		});

		it('should throw error with invalid R2 key', () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Test</h1>'
				},
				storage: {
					saveToR2: true,
					r2Key: '../../../etc/passwd'  // Invalid: contains ..
				}
			};

			expect(() => new PdfMember(config)).toThrow('Invalid storage config');
		});
	});

	describe('PDF Generation', () => {
		it('should generate PDF from inline HTML', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<html><body><h1>Test Document</h1></body></html>'
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.pdf).toBeDefined();
			expect(output.pdf).toBeInstanceOf(ArrayBuffer);
			expect(output.size).toBeGreaterThan(0);
		});

		it('should generate PDF from HTML member output', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					fromMember: 'render-html'
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {
					'render-html': {
						output: {
							html: '<html><body><h1>From HTML Member</h1></body></html>'
						}
					}
				}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.pdf).toBeDefined();
			expect(output.size).toBeGreaterThan(0);
		});

		it('should fail when HTML member output is missing', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					fromMember: 'render-html'
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(false);
			expect(response.error).toContain('did not produce HTML output');
		});

		it('should fail when no HTML source is specified', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF'
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(false);
			expect(response.error).toContain('No HTML source specified');
		});
	});

	describe('Page Configuration', () => {
		it('should apply A4 portrait configuration', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>A4 Portrait</h1>'
				},
				page: {
					size: 'A4',
					orientation: 'portrait',
					margins: {
						top: 20,
						right: 20,
						bottom: 20,
						left: 20
					}
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.pdf).toBeDefined();
		});

		it('should apply Letter landscape configuration', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Letter Landscape</h1>'
				},
				page: {
					size: 'Letter',
					orientation: 'landscape'
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
		});
	});

	describe('R2 Storage', () => {
		it('should store PDF to R2', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Store Me</h1>'
				},
				storage: {
					saveToR2: true,
					r2Key: 'static/test.pdf',
					publicUrl: true
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.r2Key).toBe('static/test.pdf');
			expect(output.url).toContain('/assets/static/');
			expect(mockR2.put).toHaveBeenCalledWith(
				'static/test.pdf',
				expect.any(ArrayBuffer),
				expect.objectContaining({
					httpMetadata: expect.objectContaining({
						contentType: 'application/pdf'
					})
				})
			);
		});

		it('should not store to R2 when not configured', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>No Storage</h1>'
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.r2Key).toBeUndefined();
			expect(output.url).toBeUndefined();
			expect(mockR2.put).not.toHaveBeenCalled();
		});

		it('should generate default R2 key when not specified', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Auto Key</h1>'
				},
				storage: {
					saveToR2: true
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.r2Key).toMatch(/^static\/generated-\d+-[a-z0-9]+\.pdf$/);
		});
	});

	describe('Delivery Mode', () => {
		it('should create inline Content-Disposition header', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Display Inline</h1>'
				},
				deliveryMode: 'inline',
				filename: 'report.pdf'
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.contentDisposition).toBe('inline; filename="report.pdf"');
			expect(output.filename).toBe('report.pdf');
		});

		it('should create attachment Content-Disposition header', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Force Download</h1>'
				},
				deliveryMode: 'attachment',
				filename: 'invoice.pdf'
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.contentDisposition).toBe('attachment; filename="invoice.pdf"');
			expect(output.filename).toBe('invoice.pdf');
		});

		it('should default to inline mode', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Default Mode</h1>'
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.contentDisposition).toContain('inline');
		});
	});

	describe('Metadata', () => {
		it('should return generation metadata', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Test</h1>'
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.metadata).toBeDefined();
			expect(output.metadata?.generateTime).toBeGreaterThan(0);
			expect(output.metadata?.htmlSize).toBeGreaterThan(0);
		});

		it('should set PDF metadata', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Test Document</h1>'
				},
				metadata: {
					title: 'Test Report',
					author: 'Conductor',
					subject: 'Testing',
					keywords: 'test, pdf, generation'
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
		});
	});

	describe('Input Overrides', () => {
		it('should override HTML source from input', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Default</h1>'
				}
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {
					html: {
						inline: '<h1>Overridden</h1>'
					}
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
		});

		it('should override delivery mode from input', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Test</h1>'
				},
				deliveryMode: 'inline'
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {
					deliveryMode: 'attachment'
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.contentDisposition).toContain('attachment');
		});

		it('should override filename from input', async () => {
			const config: MemberConfig = {
				name: 'test-pdf',
				type: 'PDF',
				html: {
					inline: '<h1>Test</h1>'
				},
				filename: 'default.pdf'
			};

			const member = new PdfMember(config);
			const context: MemberExecutionContext = {
				input: {
					filename: 'custom.pdf'
				},
				env: mockEnv,
				ctx: mockCtx,
				previousOutputs: {}
			};

			const response = await member.execute(context);

			expect(response.success).toBe(true);
			const output = response.data as PdfMemberOutput;
			expect(output.filename).toBe('custom.pdf');
		});
	});
});
