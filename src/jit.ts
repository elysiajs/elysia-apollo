import { GraphQLExecutionResult, GraphQLExecutor } from 'apollo-server-core'

import { assertCompositeType, GraphQLSchema } from 'graphql'
import {
    CompiledQuery,
    compileQuery,
    CompilerOptions,
    isCompiledQuery
} from 'graphql-jit'

import type { LRU } from 'tiny-lru'
// @ts-ignore
import { lru } from 'tiny-lru/dist/tiny-lru.esm.js'

export const jit = (
    cacheSize = 1024,
    compilerOpts: Partial<CompilerOptions> = {}
): GraphQLExecutor<any> => {
    const cache: LRU<CompiledQuery> = new lru(cacheSize)

    return async (req): Promise<GraphQLExecutionResult> => {
        const prefix = req.operationName || 'NotParametrized'
        const cacheKey = `${prefix}-${req.queryHash}`
        let compiledQuery = cache.get(cacheKey)

        if (!compiledQuery) {
            const compilationResult = compileQuery(
                req.schema,
                req.document,
                req.operationName || undefined,
                compilerOpts
            )
            if (isCompiledQuery(compilationResult)) {
                compiledQuery = compilationResult
                cache.set(cacheKey, compiledQuery)
            } else {
                // ...is ExecutionResult
                return compilationResult
            }
        }

        return Bun.peek(
            compiledQuery.query(
                req.schema,
                req.context,
                req.request.variables ?? {}
            )
        )
    }
}
