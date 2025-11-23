/**
 * Branded Types for Domain Concepts
 *
 * Branded types provide compile-time type safety for domain concepts,
 * preventing accidental misuse of primitive types.
 *
 * @example
 * ```typescript
 * const modelId = ModelId.create('@cf/meta/llama-3.1-8b-instruct');
 * const agentId = AgentName.create('analyze-company');
 *
 * // Type error! Can't pass AgentName where ModelId is expected
 * platform.validateModel(agentId); // ❌ Compile error
 * platform.validateModel(modelId);  // ✅ Works
 * ```
 */
/**
 * Model ID validation and creation
 */
export const ModelId = {
    /**
     * Create a ModelId from a string
     * @throws {Error} if the model ID is invalid
     */
    create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Model ID cannot be empty');
        }
        // Model IDs should not contain spaces
        if (value.includes(' ')) {
            throw new Error(`Invalid model ID format: "${value}" (contains spaces)`);
        }
        return value.trim();
    },
    /**
     * Check if a string is a valid ModelId
     */
    isValid(value) {
        return !!value && value.trim().length > 0 && !value.includes(' ');
    },
    /**
     * Safely create a ModelId, returning null if invalid
     */
    tryCreate(value) {
        try {
            return ModelId.create(value);
        }
        catch {
            return null;
        }
    },
    /**
     * Unwrap a ModelId back to a string
     */
    unwrap(modelId) {
        return modelId;
    },
};
/**
 * Agent name validation and creation
 */
export const AgentName = {
    /**
     * Create an AgentName from a string
     * @throws {Error} if the agent name is invalid
     */
    create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Agent name cannot be empty');
        }
        // Agent names must be lowercase alphanumeric with hyphens
        const normalized = value.trim();
        if (!/^[a-z0-9-]+$/.test(normalized)) {
            throw new Error(`Invalid agent name format: "${value}" ` + `(must be lowercase alphanumeric with hyphens)`);
        }
        return normalized;
    },
    /**
     * Check if a string is a valid AgentName
     */
    isValid(value) {
        return !!value && /^[a-z0-9-]+$/.test(value.trim());
    },
    /**
     * Safely create an AgentName, returning null if invalid
     */
    tryCreate(value) {
        try {
            return AgentName.create(value);
        }
        catch {
            return null;
        }
    },
    /**
     * Unwrap an AgentName back to a string
     */
    unwrap(agentName) {
        return agentName;
    },
};
/**
 * Ensemble name validation and creation
 */
export const EnsembleName = {
    /**
     * Create an EnsembleName from a string
     * @throws {Error} if the ensemble name is invalid
     */
    create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Ensemble name cannot be empty');
        }
        // Ensemble names must be lowercase alphanumeric with hyphens
        const normalized = value.trim();
        if (!/^[a-z0-9-]+$/.test(normalized)) {
            throw new Error(`Invalid ensemble name format: "${value}" ` +
                `(must be lowercase alphanumeric with hyphens)`);
        }
        return normalized;
    },
    /**
     * Check if a string is a valid EnsembleName
     */
    isValid(value) {
        return !!value && /^[a-z0-9-]+$/.test(value.trim());
    },
    /**
     * Safely create an EnsembleName, returning null if invalid
     */
    tryCreate(value) {
        try {
            return EnsembleName.create(value);
        }
        catch {
            return null;
        }
    },
    /**
     * Unwrap an EnsembleName back to a string
     */
    unwrap(ensembleName) {
        return ensembleName;
    },
};
/**
 * Provider ID validation and creation
 */
export const ProviderId = {
    /**
     * Create a ProviderId from a string
     * @throws {Error} if the provider ID is invalid
     */
    create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Provider ID cannot be empty');
        }
        // Provider IDs must be lowercase alphanumeric with hyphens
        const normalized = value.trim().toLowerCase();
        if (!/^[a-z0-9-]+$/.test(normalized)) {
            throw new Error(`Invalid provider ID format: "${value}" ` + `(must be lowercase alphanumeric with hyphens)`);
        }
        return normalized;
    },
    /**
     * Check if a string is a valid ProviderId
     */
    isValid(value) {
        return !!value && /^[a-z0-9-]+$/.test(value.trim().toLowerCase());
    },
    /**
     * Safely create a ProviderId, returning null if invalid
     */
    tryCreate(value) {
        try {
            return ProviderId.create(value);
        }
        catch {
            return null;
        }
    },
    /**
     * Unwrap a ProviderId back to a string
     */
    unwrap(providerId) {
        return providerId;
    },
};
/**
 * Platform name validation and creation
 */
export const PlatformName = {
    /**
     * Create a PlatformName from a string
     * @throws {Error} if the platform name is invalid
     */
    create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Platform name cannot be empty');
        }
        const normalized = value.trim().toLowerCase();
        return normalized;
    },
    /**
     * Check if a string is a valid PlatformName
     */
    isValid(value) {
        return !!value && value.trim().length > 0;
    },
    /**
     * Safely create a PlatformName, returning null if invalid
     */
    tryCreate(value) {
        try {
            return PlatformName.create(value);
        }
        catch {
            return null;
        }
    },
    /**
     * Unwrap a PlatformName back to a string
     */
    unwrap(platformName) {
        return platformName;
    },
};
/**
 * Binding name validation and creation
 */
export const BindingName = {
    /**
     * Create a BindingName from a string
     * @throws {Error} if the binding name is invalid
     */
    create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Binding name cannot be empty');
        }
        // Binding names are typically UPPER_CASE
        const normalized = value.trim();
        if (!/^[A-Z_][A-Z0-9_]*$/.test(normalized)) {
            throw new Error(`Invalid binding name format: "${value}" ` + `(must be UPPER_CASE with underscores)`);
        }
        return normalized;
    },
    /**
     * Check if a string is a valid BindingName
     */
    isValid(value) {
        return !!value && /^[A-Z_][A-Z0-9_]*$/.test(value.trim());
    },
    /**
     * Safely create a BindingName, returning null if invalid
     */
    tryCreate(value) {
        try {
            return BindingName.create(value);
        }
        catch {
            return null;
        }
    },
    /**
     * Unwrap a BindingName back to a string
     */
    unwrap(bindingName) {
        return bindingName;
    },
};
/**
 * Version string validation and creation
 */
export const VersionString = {
    /**
     * Create a VersionString from a string
     * @throws {Error} if the version string is invalid
     */
    create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('Version string cannot be empty');
        }
        return value.trim();
    },
    /**
     * Check if a string is a valid VersionString
     */
    isValid(value) {
        return !!value && value.trim().length > 0;
    },
    /**
     * Safely create a VersionString, returning null if invalid
     */
    tryCreate(value) {
        try {
            return VersionString.create(value);
        }
        catch {
            return null;
        }
    },
    /**
     * Unwrap a VersionString back to a string
     */
    unwrap(versionString) {
        return versionString;
    },
};
