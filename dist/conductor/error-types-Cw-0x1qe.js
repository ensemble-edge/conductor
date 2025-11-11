const Result = {
	ok(value) {
		return {
			success: true,
			value
		};
	},
	err(error) {
		return {
			success: false,
			error
		};
	},
	async fromPromise(promise) {
		try {
			const value = await promise;
			return Result.ok(value);
		} catch (error) {
			return Result.err(error instanceof Error ? error : new Error(String(error)));
		}
	},
	fromThrowable(fn) {
		try {
			return Result.ok(fn());
		} catch (error) {
			return Result.err(error instanceof Error ? error : new Error(String(error)));
		}
	},
	map(result, fn) {
		if (result.success) return Result.ok(fn(result.value));
		return result;
	},
	async mapAsync(result, fn) {
		if (result.success) return Result.ok(await fn(result.value));
		return result;
	},
	mapErr(result, fn) {
		if (result.success) return result;
		return Result.err(fn(result.error));
	},
	flatMap(result, fn) {
		if (result.success) return fn(result.value);
		return result;
	},
	async flatMapAsync(result, fn) {
		if (result.success) return await fn(result.value);
		return result;
	},
	unwrap(result) {
		if (result.success) return result.value;
		throw result.error;
	},
	unwrapOr(result, defaultValue) {
		return result.success ? result.value : defaultValue;
	},
	unwrapOrElse(result, fn) {
		return result.success ? result.value : fn(result.error);
	},
	isOk(result) {
		return result.success === true;
	},
	isErr(result) {
		return result.success === false;
	},
	all(results) {
		const values = [];
		for (const result of results) {
			if (!result.success) return result;
			values.push(result.value);
		}
		return Result.ok(values);
	},
	partition(results) {
		const values = [];
		const errors = [];
		for (const result of results) if (result.success) values.push(result.value);
		else errors.push(result.error);
		if (errors.length > 0) return Result.err(errors);
		return Result.ok(values);
	},
	async sequence(operations) {
		const values = [];
		for (const operation of operations) {
			const result = await operation();
			if (!result.success) return result;
			values.push(result.value);
		}
		return Result.ok(values);
	},
	match(result, handlers) {
		if (result.success) return handlers.ok(result.value);
		return handlers.err(result.error);
	},
	tap(result, fn) {
		if (result.success) fn(result.value);
		return result;
	},
	tapErr(result, fn) {
		if (!result.success) fn(result.error);
		return result;
	}
};
let ErrorCode = /* @__PURE__ */ function(ErrorCode$1) {
	ErrorCode$1["MEMBER_NOT_FOUND"] = "MEMBER_NOT_FOUND";
	ErrorCode$1["MEMBER_INVALID_CONFIG"] = "MEMBER_INVALID_CONFIG";
	ErrorCode$1["MEMBER_EXECUTION_FAILED"] = "MEMBER_EXECUTION_FAILED";
	ErrorCode$1["MEMBER_VALIDATION_FAILED"] = "MEMBER_VALIDATION_FAILED";
	ErrorCode$1["PROVIDER_NOT_FOUND"] = "PROVIDER_NOT_FOUND";
	ErrorCode$1["PROVIDER_AUTH_FAILED"] = "PROVIDER_AUTH_FAILED";
	ErrorCode$1["PROVIDER_API_ERROR"] = "PROVIDER_API_ERROR";
	ErrorCode$1["PROVIDER_TIMEOUT"] = "PROVIDER_TIMEOUT";
	ErrorCode$1["PROVIDER_RATE_LIMIT"] = "PROVIDER_RATE_LIMIT";
	ErrorCode$1["PLATFORM_UNSUPPORTED"] = "PLATFORM_UNSUPPORTED";
	ErrorCode$1["PLATFORM_BINDING_MISSING"] = "PLATFORM_BINDING_MISSING";
	ErrorCode$1["PLATFORM_VALIDATION_FAILED"] = "PLATFORM_VALIDATION_FAILED";
	ErrorCode$1["MODEL_NOT_FOUND"] = "MODEL_NOT_FOUND";
	ErrorCode$1["MODEL_DEPRECATED"] = "MODEL_DEPRECATED";
	ErrorCode$1["MODEL_EOL"] = "MODEL_EOL";
	ErrorCode$1["ENSEMBLE_NOT_FOUND"] = "ENSEMBLE_NOT_FOUND";
	ErrorCode$1["ENSEMBLE_PARSE_FAILED"] = "ENSEMBLE_PARSE_FAILED";
	ErrorCode$1["ENSEMBLE_VALIDATION_FAILED"] = "ENSEMBLE_VALIDATION_FAILED";
	ErrorCode$1["ENSEMBLE_EXECUTION_FAILED"] = "ENSEMBLE_EXECUTION_FAILED";
	ErrorCode$1["STATE_ACCESS_DENIED"] = "STATE_ACCESS_DENIED";
	ErrorCode$1["STATE_INVALID_KEY"] = "STATE_INVALID_KEY";
	ErrorCode$1["STORAGE_NOT_FOUND"] = "STORAGE_NOT_FOUND";
	ErrorCode$1["STORAGE_ACCESS_DENIED"] = "STORAGE_ACCESS_DENIED";
	ErrorCode$1["STORAGE_OPERATION_FAILED"] = "STORAGE_OPERATION_FAILED";
	ErrorCode$1["VALIDATION_FAILED"] = "VALIDATION_FAILED";
	ErrorCode$1["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
	ErrorCode$1["INTERNAL_ERROR"] = "INTERNAL_ERROR";
	return ErrorCode$1;
}({});
var ConductorError = class extends Error {
	constructor(message, details) {
		super(message);
		this.name = this.constructor.name;
		this.details = details;
		if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
	}
	toJSON() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			isOperational: this.isOperational,
			stack: this.stack
		};
	}
};
var MemberNotFoundError = class extends ConductorError {
	constructor(memberName) {
		super(`Member "${memberName}" not found in registry`);
		this.memberName = memberName;
		this.code = ErrorCode.MEMBER_NOT_FOUND;
		this.isOperational = true;
	}
	toUserMessage() {
		return `The member "${this.memberName}" does not exist. Check your ensemble configuration.`;
	}
};
var MemberConfigurationError = class extends ConductorError {
	constructor(memberName, reason) {
		super(`Invalid configuration for member "${memberName}": ${reason}`);
		this.memberName = memberName;
		this.reason = reason;
		this.code = ErrorCode.MEMBER_INVALID_CONFIG;
		this.isOperational = true;
	}
	toUserMessage() {
		return `Configuration error in member "${this.memberName}": ${this.reason}`;
	}
};
var MemberExecutionError = class extends ConductorError {
	constructor(memberName, reason, cause) {
		super(`Member "${memberName}" execution failed: ${reason}`);
		this.memberName = memberName;
		this.reason = reason;
		this.cause = cause;
		this.code = ErrorCode.MEMBER_EXECUTION_FAILED;
		this.isOperational = true;
	}
	toUserMessage() {
		return `Execution failed for member "${this.memberName}": ${this.reason}`;
	}
};
var ProviderNotFoundError = class extends ConductorError {
	constructor(providerId) {
		super(`AI provider "${providerId}" not found`);
		this.providerId = providerId;
		this.code = ErrorCode.PROVIDER_NOT_FOUND;
		this.isOperational = true;
	}
	toUserMessage() {
		return `The AI provider "${this.providerId}" is not available. Check your provider configuration.`;
	}
};
var ProviderAuthError = class extends ConductorError {
	constructor(providerId, reason) {
		super(`Authentication failed for provider "${providerId}": ${reason}`);
		this.providerId = providerId;
		this.reason = reason;
		this.code = ErrorCode.PROVIDER_AUTH_FAILED;
		this.isOperational = true;
	}
	toUserMessage() {
		return `Authentication error with "${this.providerId}": ${this.reason}. Check your API keys.`;
	}
};
var ProviderAPIError = class extends ConductorError {
	constructor(providerId, statusCode, response) {
		super(`API error from provider "${providerId}": ${statusCode} - ${response}`);
		this.providerId = providerId;
		this.statusCode = statusCode;
		this.response = response;
		this.code = ErrorCode.PROVIDER_API_ERROR;
		this.isOperational = true;
	}
	toUserMessage() {
		return `API error from "${this.providerId}" (HTTP ${this.statusCode}): ${this.response}`;
	}
};
var ProviderTimeoutError = class extends ConductorError {
	constructor(providerId, timeoutMs) {
		super(`Request to provider "${providerId}" timed out after ${timeoutMs}ms`);
		this.providerId = providerId;
		this.timeoutMs = timeoutMs;
		this.code = ErrorCode.PROVIDER_TIMEOUT;
		this.isOperational = true;
	}
	toUserMessage() {
		return `Request to "${this.providerId}" timed out. The service may be slow or unavailable.`;
	}
};
var PlatformBindingMissingError = class extends ConductorError {
	constructor(bindingName, hint) {
		super(`Binding "${bindingName}" not found` + (hint ? `: ${hint}` : ""));
		this.bindingName = bindingName;
		this.hint = hint;
		this.code = ErrorCode.PLATFORM_BINDING_MISSING;
		this.isOperational = true;
	}
	toUserMessage() {
		return `Required binding "${this.bindingName}" is not configured. ${this.hint || "Add it to wrangler.toml"}`;
	}
};
var ModelNotFoundError = class extends ConductorError {
	constructor(modelId) {
		super(`Model "${modelId}" not found in platform data`);
		this.modelId = modelId;
		this.code = ErrorCode.MODEL_NOT_FOUND;
		this.isOperational = true;
	}
	toUserMessage() {
		return `The model "${this.modelId}" is not available. Check the model ID or use a different model.`;
	}
};
var ModelDeprecatedError = class extends ConductorError {
	constructor(modelId, reason, replacement) {
		super(`Model "${modelId}" is deprecated` + (reason ? `: ${reason}` : "") + (replacement ? `. Use "${replacement}" instead` : ""));
		this.modelId = modelId;
		this.reason = reason;
		this.replacement = replacement;
		this.code = ErrorCode.MODEL_DEPRECATED;
		this.isOperational = true;
	}
	toUserMessage() {
		let msg = `The model "${this.modelId}" is deprecated`;
		if (this.reason) msg += `: ${this.reason}`;
		if (this.replacement) msg += `. Please migrate to "${this.replacement}"`;
		return msg;
	}
};
var ModelEOLError = class extends ConductorError {
	constructor(modelId, eolDate, replacement) {
		super(`Model "${modelId}" reached end of life on ${eolDate}` + (replacement ? `. Use "${replacement}" instead` : ""));
		this.modelId = modelId;
		this.eolDate = eolDate;
		this.replacement = replacement;
		this.code = ErrorCode.MODEL_EOL;
		this.isOperational = true;
	}
	toUserMessage() {
		let msg = `The model "${this.modelId}" is no longer available (EOL: ${this.eolDate})`;
		if (this.replacement) msg += `. Please use "${this.replacement}" instead`;
		return msg;
	}
};
var EnsembleNotFoundError = class extends ConductorError {
	constructor(ensembleName) {
		super(`Ensemble "${ensembleName}" not found`);
		this.ensembleName = ensembleName;
		this.code = ErrorCode.ENSEMBLE_NOT_FOUND;
		this.isOperational = true;
	}
	toUserMessage() {
		return `The ensemble "${this.ensembleName}" does not exist.`;
	}
};
var EnsembleParseError = class extends ConductorError {
	constructor(ensembleName, reason) {
		super(`Failed to parse ensemble "${ensembleName}": ${reason}`);
		this.ensembleName = ensembleName;
		this.reason = reason;
		this.code = ErrorCode.ENSEMBLE_PARSE_FAILED;
		this.isOperational = true;
	}
	toUserMessage() {
		return `Syntax error in ensemble "${this.ensembleName}": ${this.reason}`;
	}
};
var EnsembleExecutionError = class extends ConductorError {
	constructor(ensembleName, step, cause) {
		super(`Ensemble "${ensembleName}" failed at step "${step}": ${cause.message}`);
		this.ensembleName = ensembleName;
		this.step = step;
		this.cause = cause;
		this.code = ErrorCode.ENSEMBLE_EXECUTION_FAILED;
		this.isOperational = true;
	}
	toUserMessage() {
		return `Execution failed in ensemble "${this.ensembleName}" at step "${this.step}": ${this.cause.message}`;
	}
};
var StorageKeyNotFoundError = class extends ConductorError {
	constructor(key, storageType) {
		super(`Key "${key}" not found in ${storageType}`);
		this.key = key;
		this.storageType = storageType;
		this.code = ErrorCode.STORAGE_NOT_FOUND;
		this.isOperational = true;
	}
	toUserMessage() {
		return `The key "${this.key}" does not exist in ${this.storageType} storage.`;
	}
};
var ConfigurationError = class extends ConductorError {
	constructor(reason) {
		super(`Configuration error: ${reason}`);
		this.reason = reason;
		this.code = ErrorCode.CONFIGURATION_ERROR;
		this.isOperational = true;
	}
	toUserMessage() {
		return `Configuration error: ${this.reason}`;
	}
};
var InternalError = class extends ConductorError {
	constructor(reason, cause) {
		super(`Internal error: ${reason}`);
		this.reason = reason;
		this.cause = cause;
		this.code = ErrorCode.INTERNAL_ERROR;
		this.isOperational = false;
	}
	toUserMessage() {
		return `An unexpected error occurred. Please contact support.`;
	}
};
const Errors = {
	memberNotFound: (name) => new MemberNotFoundError(name),
	memberConfig: (name, reason) => new MemberConfigurationError(name, reason),
	memberExecution: (name, reason, cause) => new MemberExecutionError(name, reason, cause),
	providerNotFound: (id) => new ProviderNotFoundError(id),
	providerAuth: (id, reason) => new ProviderAuthError(id, reason),
	providerAPI: (id, status, response) => new ProviderAPIError(id, status, response),
	providerTimeout: (id, timeout) => new ProviderTimeoutError(id, timeout),
	modelNotFound: (id) => new ModelNotFoundError(id),
	modelDeprecated: (id, reason, replacement) => new ModelDeprecatedError(id, reason, replacement),
	modelEOL: (id, eolDate, replacement) => new ModelEOLError(id, eolDate, replacement),
	ensembleNotFound: (name) => new EnsembleNotFoundError(name),
	ensembleParse: (name, reason) => new EnsembleParseError(name, reason),
	ensembleExecution: (name, step, cause) => new EnsembleExecutionError(name, step, cause),
	bindingMissing: (name, hint) => new PlatformBindingMissingError(name, hint),
	storageNotFound: (key, storageType) => new StorageKeyNotFoundError(key, storageType),
	config: (reason) => new ConfigurationError(reason),
	internal: (reason, cause) => new InternalError(reason, cause)
};
export { Result as i, Errors as n, MemberExecutionError as r, EnsembleExecutionError as t };

//# sourceMappingURL=error-types-Cw-0x1qe.js.map