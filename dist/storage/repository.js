/**
 * Repository Pattern for Storage Abstraction
 *
 * Provides a unified interface for all storage operations across
 * different storage backends (KV, D1, R2, etc.)
 */
/**
 * JSON serializer - works for most objects
 */
export class JSONSerializer {
    serialize(value) {
        return JSON.stringify(value);
    }
    deserialize(raw) {
        return JSON.parse(raw);
    }
}
/**
 * String serializer - passthrough for string values
 */
export class StringSerializer {
    serialize(value) {
        return value;
    }
    deserialize(raw) {
        return raw;
    }
}
/**
 * Binary serializer - for ArrayBuffer/Uint8Array
 */
export class BinarySerializer {
    serialize(value) {
        // Convert to base64 for storage
        const bytes = new Uint8Array(value);
        return btoa(String.fromCharCode(...bytes));
    }
    deserialize(raw) {
        // Convert from base64
        const binaryString = atob(raw);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
