function deepFreeze(object) {
	// Handle null, undefined, and primitive types (they are immutable)
	if (object === null || typeof object !== 'object') {
		return object;
	}

	// If the object is already frozen, return it
	if (Object.isFrozen(object)) {
		return object;
	}

	// Handle arrays
	if (Array.isArray(object)) {
		// Freeze each element in the array
		object.forEach(element => deepFreeze(element));
		Object.freeze(object);
		return object;
	}

	// Handle Date objects
	if (object instanceof Date) {
		Object.freeze(object);
		return object;
	}

	// Handle Buffer (Binary data)
	if (Buffer.isBuffer(object)) {
		// Buffers are mutable but freezing the buffer prevents re-assignment
		// Note: Freezing does not make the contents immutable
		Object.freeze(object);
		return object;
	}

	// Handle MongoDB BSON types
	const bsonType = object._bsontype;

	if (bsonType) {
		// List of BSON types to freeze
		const typesToFreeze = [
			'ObjectID',      // ObjectId
			'Decimal128',    // Decimal128
			'Int32',         // Int32
			'Long',          // Int64 (Long)
			'Timestamp',     // Timestamp
			'MinKey',        // MinKey
			'MaxKey',        // MaxKey
			'BSONSymbol',    // BSONSymbol
			'Code',          // Code
			'DBRef',         // DBRef
			'Binary',        // Binary
			'Double',        // Double
			'BSONRegExp'     // BSONRegExp
		];

		if (typesToFreeze.includes(bsonType)) {
			Object.freeze(object);
			return object;
		} else {
			// Skip types that cannot be frozen
			return object;
		}
	}

	// Handle other objects (including nested objects)
	const propNames = Object.getOwnPropertyNames(object);

	// Freeze properties before freezing self
	for (const name of propNames) {
		const value = object[name];

		// Recursively freeze properties
		deepFreeze(value);
	}

	// Freeze self (no-op if already frozen)
	return Object.freeze(object);
}

export { deepFreeze };
