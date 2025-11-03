/**
 * HITL Member - Type Definitions
 */

export type HITLAction = 'suspend' | 'resume' | 'approve' | 'reject';
export type HITLStatus = 'suspended' | 'approved' | 'rejected' | 'expired';
export type NotificationChannel = 'slack' | 'email' | 'webhook';

export interface HITLConfig {
	action?: HITLAction;
	timeout?: number; // milliseconds
	notificationChannel?: NotificationChannel;
	notificationConfig?: Record<string, any>;
}

export interface HITLSuspendInput {
	approvalData: Record<string, any>;
}

export interface HITLResumeInput {
	executionId: string;
	approved: boolean;
	comments?: string;
}

export type HITLInput = HITLSuspendInput | HITLResumeInput;

export interface HITLSuspendResult {
	status: 'suspended';
	executionId: string;
	approvalUrl: string;
	expiresAt: number;
}

export interface HITLResumeResult {
	status: HITLStatus;
	executionId: string;
	state?: Record<string, any>;
	comments?: string;
}

export type HITLResult = HITLSuspendResult | HITLResumeResult;

export interface ApprovalState {
	executionId: string;
	state: Record<string, any>;
	suspendedAt: number;
	expiresAt: number;
	approvalData: Record<string, any>;
	status: HITLStatus;
	comments?: string;
}
