/// <reference types="bun-types" />
import type { Context, Elysia, Handler } from 'elysia';
import { ApolloServerBase, type Config, type GraphQLOptions } from 'apollo-server-core';
import { jit } from './jit';
export interface ServerRegistration<Path extends string = '/graphql'> {
    path?: Path;
    enablePlayground: boolean;
    onHealthCheck?: Handler;
    disableHealthCheck?: boolean;
}
export interface ElysiaApolloConfig<Path extends string = '/graphql'> extends Config, Omit<ServerRegistration<Path>, 'enablePlayground'>, Partial<Pick<ServerRegistration, 'enablePlayground'>> {
}
export declare class ElysiaApolloServer<ContextFunctionParams = Context> extends ApolloServerBase<ContextFunctionParams> {
    private schema;
    private schemaHash;
    private documentStore;
    getOption(integrationContextArgument?: any): Promise<GraphQLOptions>;
    protected serverlessFramework(): boolean;
    createHandler<Path extends string = '/graphql'>({ path, disableHealthCheck, onHealthCheck, enablePlayground }: ServerRegistration<Path>): (app: Elysia) => import("elysia/dist/types").ElysiaRoute<"POST", {
        response: import("@sinclair/typebox").TObject<{
            data: import("@sinclair/typebox").TObject<{}>;
        }>;
        body: import("@sinclair/typebox").TObject<{
            query: import("@sinclair/typebox").TString<string>;
            operationName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString<string>>;
            variables: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{}>>;
        }>;
    }, {
        request: {};
        store: Record<typeof import("elysia").SCHEMA, {}> & Record<typeof import("elysia").SCHEMA, Record<Path, Record<"GET", Omit<import("elysia").TypedSchemaToRoute<import("elysia/dist/types").MergeSchema<{}, {}>>, "params"> & {
            params: Record<import("elysia/dist/types").ExtractPath<Path>, string>;
        } & {
            response: Response;
        }>>>;
        schema: {};
    }, Path, any>;
}
export declare const apollo: <Path extends string = "/graphql">({ path, onHealthCheck, disableHealthCheck, enablePlayground, ...config }: ElysiaApolloConfig<Path>) => (app: Elysia) => import("elysia/dist/types").ElysiaRoute<"POST", {
    response: import("@sinclair/typebox").TObject<{
        data: import("@sinclair/typebox").TObject<{}>;
    }>;
    body: import("@sinclair/typebox").TObject<{
        query: import("@sinclair/typebox").TString<string>;
        operationName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString<string>>;
        variables: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{}>>;
    }>;
}, {
    request: {};
    store: Record<typeof import("elysia").SCHEMA, {}> & Record<typeof import("elysia").SCHEMA, Record<Path, Record<"GET", Omit<import("elysia").TypedSchemaToRoute<import("elysia/dist/types").MergeSchema<{}, {}>>, "params"> & {
        params: Record<import("elysia/dist/types").ExtractPath<Path>, string>;
    } & {
        response: Response;
    }>>>;
    schema: {};
}, Path, any>;
export { jit };
export { gql } from 'apollo-server';
export default apollo;
