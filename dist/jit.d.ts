import { GraphQLExecutor } from 'apollo-server-core';
import { CompilerOptions } from 'graphql-jit';
export declare const jit: (cacheSize?: number, compilerOpts?: Partial<CompilerOptions>) => GraphQLExecutor<any>;
