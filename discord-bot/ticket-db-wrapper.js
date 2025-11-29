// Wrapper to automatically sync tickets to database
function createDatabaseSyncedMap() {
    const originalMap = new Map();
    
    return {
        set: async function(key, value) {
            originalMap.set(key, value);
            // Save to database if function is available
            if (global.saveTicketToDB && value.ticketId) {
                await global.saveTicketToDB(value);
            }
            return this;
        },
        get: function(key) {
            return originalMap.get(key);
        },
        has: function(key) {
            return originalMap.has(key);
        },
        delete: async function(key) {
            const ticket = originalMap.get(key);
            const result = originalMap.delete(key);
            // Mark as resolved in database
            if (global.updateTicketStatus && ticket) {
                await global.updateTicketStatus(key, 'resolved');
            }
            return result;
        },
        clear: function() {
            return originalMap.clear();
        },
        get size() {
            return originalMap.size;
        },
        keys: function() {
            return originalMap.keys();
        },
        values: function() {
            return originalMap.values();
        },
        entries: function() {
            return originalMap.entries();
        },
        forEach: function(callback, thisArg) {
            return originalMap.forEach(callback, thisArg);
        },
        [Symbol.iterator]: function() {
            return originalMap[Symbol.iterator]();
        }
    };
}

module.exports = { createDatabaseSyncedMap };
