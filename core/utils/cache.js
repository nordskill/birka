const MAX_CACHE_SIZE = 1000; // Maximum number of items in the cache
const DEFAULT_EXPIRATION = 0; // Default expiration time in ms (0 means no expiration)

class Cache {
    #maxSize;
    #expiration; // in milliseconds
    #cache; // Map to store cache entries

    constructor(options = {}) {
        this.#maxSize = options.maxSize || MAX_CACHE_SIZE;
        this.#expiration = options.expiration || DEFAULT_EXPIRATION; // in ms
        this.#cache = new Map();
    }

    get size() {
        return this.#cache.size;
    }

    get(key) {
        const item = this.#cache.get(key);
        if (!item) return null;

        // Check for expiration
        if (this.#isExpired(item.timestamp)) {
            this.#cache.delete(key);
            return null;
        }

        // Move item to the end to mark it as recently used
        this.#cache.delete(key);
        this.#cache.set(key, item);

        return item.value;
    }

    set(key, value) {
        if (this.#cache.has(key)) {
            this.#cache.delete(key);
        } else if (this.#cache.size >= this.#maxSize) {
            // Remove least recently used item
            const firstKey = this.#cache.keys().next().value;
            this.#cache.delete(firstKey);
        }

        this.#cache.set(key, {
            value: value,
            timestamp: Date.now()
        });
    }

    delete(key) {
        this.#cache.delete(key);
    }

    clear() {
        this.#cache.clear();
    }

    // Private method to check if an item is expired
    #isExpired(timestamp) {
        return this.#expiration > 0 && (Date.now() - timestamp) > this.#expiration;
    }
}

const cacheInstance = new Cache({
    maxSize: MAX_CACHE_SIZE,
    expiration: DEFAULT_EXPIRATION
});

export default cacheInstance;