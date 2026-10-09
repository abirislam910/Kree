// Minimal stand-in for the Supabase client. Each table query resolves to the
// next result queued with `queueQuery`, so tests control what the DB "returns"
// and can inspect every chained call that was made.

function createQueryBuilder(result, calls) {
    const builder = {};
    for (const method of ['select', 'insert', 'delete', 'eq', 'order', 'single', 'maybeSingle']) {
        builder[method] = jest.fn((...args) => {
            calls.push({ method, args });
            return builder;
        });
    }
    builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    return builder;
}

function createFakeSupabase({ user = null, userError = null } = {}) {
    const queryResults = [];
    const queries = [];

    const storageBucket = {
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        remove: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const supabase = {
        auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user }, error: userError }),
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn().mockResolvedValue({ error: null }),
        },
        storage: {
            from: jest.fn(() => storageBucket),
        },
        from: jest.fn((table) => {
            const calls = [];
            queries.push({ table, calls });
            const result = queryResults.shift() ?? { data: null, error: null };
            return createQueryBuilder(result, calls);
        }),

        // Test-only helpers
        storageBucket,
        queries,
        queueQuery(result) {
            queryResults.push(result);
            return supabase;
        },
    };

    return supabase;
}

module.exports = { createFakeSupabase };
