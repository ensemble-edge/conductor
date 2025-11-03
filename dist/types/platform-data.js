/**
 * Platform Data Types
 *
 * Strongly-typed definitions for platform data structures.
 * Replaces all `any` types in platform adapters with proper types.
 */
/**
 * Type guards
 */
export const ModelValidation = {
    /**
     * Check if a model is deprecated
     */
    isDeprecated(model) {
        return model.status === 'deprecated';
    },
    /**
     * Check if a model is active
     */
    isActive(model) {
        return model.status === 'active';
    },
    /**
     * Check if a model is recommended
     */
    isRecommended(model) {
        return model.recommended === true;
    },
    /**
     * Check if a model is past end of life
     */
    isPastEOL(model) {
        if (!model.endOfLife)
            return false;
        return new Date(model.endOfLife) < new Date();
    },
    /**
     * Get days until end of life
     */
    getDaysUntilEOL(model) {
        if (!model.endOfLife)
            return null;
        const eolDate = new Date(model.endOfLife);
        const now = new Date();
        const diffMs = eolDate.getTime() - now.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    },
    /**
     * Check if a model meets minimum context window requirement
     */
    meetsContextWindow(model, minTokens) {
        return model.contextWindow >= minTokens;
    },
    /**
     * Check if a model has specific capability
     */
    hasCapability(model, capability) {
        return model.capabilities.includes(capability);
    },
    /**
     * Check if a model has all specified capabilities
     */
    hasAllCapabilities(model, capabilities) {
        return capabilities.every((cap) => model.capabilities.includes(cap));
    },
};
