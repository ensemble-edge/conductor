/**
 * Storage Module
 *
 * Exports all repository interfaces and implementations.
 */

// Base repository types
export type { Repository, PutOptions, ListOptions, ListResult, Serializer } from './repository.js'

export { JSONSerializer, StringSerializer, BinarySerializer } from './repository.js'

// Repository implementations
export { KVRepository } from './kv-repository.js'
export { D1Repository, type D1RepositoryConfig } from './d1-repository.js'
export { R2Repository } from './r2-repository.js'
export {
  HyperdriveRepository,
  type HyperdriveConfig,
  type DatabaseType,
  type QueryResult,
  type QueryMetadata,
  type TableMetadata,
  type HyperdriveTransaction,
} from './hyperdrive-repository.js'

export { QueryCache, type QueryCacheConfig, type CacheStats } from './query-cache.js'
