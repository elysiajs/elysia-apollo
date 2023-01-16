import { compileQuery, isCompiledQuery } from 'graphql-jit';
// @ts-ignore
import { lru } from 'tiny-lru/dist/tiny-lru.esm.js';
export const jit = (cacheSize = 1024, compilerOpts = {}) => {
    const cache = new lru(cacheSize);
    return async (req) => {
        const prefix = req.operationName || 'NotParametrized';
        const cacheKey = `${prefix}-${req.queryHash}`;
        let compiledQuery = cache.get(cacheKey);
        if (!compiledQuery) {
            const compilationResult = compileQuery(req.schema, req.document, req.operationName || undefined, compilerOpts);
            if (isCompiledQuery(compilationResult)) {
                compiledQuery = compilationResult;
                cache.set(cacheKey, compiledQuery);
            }
            else {
                // ...is ExecutionResult
                return compilationResult;
            }
        }
        return Bun.peek(compiledQuery.query(req.schema, req.context, req.request.variables ?? {}));
    };
};
