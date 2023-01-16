/// <reference types="bun-types" />
import type { Elysia } from 'elysia';
import { ApolloServer, type ApolloServerOptions, BaseContext } from '@apollo/server';
import { type StartStandaloneServerOptions } from '@apollo/server/standalone';
export interface ServerRegistration<Path extends string = '/graphql'> extends StartStandaloneServerOptions<any> {
    path?: Path;
    enablePlayground: boolean;
}
export type ElysiaApolloConfig<Path extends string = '/graphql', TContext extends BaseContext = BaseContext> = ApolloServerOptions<TContext> & Omit<ServerRegistration<Path>, 'enablePlayground'> & Partial<Pick<ServerRegistration, 'enablePlayground'>>;
export declare class ElysiaApolloServer<Context extends BaseContext = BaseContext> extends ApolloServer<Context> {
    createHandler<Path extends string = '/graphql'>({ path, enablePlayground, context }: ServerRegistration<Path>): (app: Elysia) => import("elysia/dist/types").ElysiaRoute<"POST", {
        body: import("@sinclair/typebox").TObject<{
            operationName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString<string>, import("@sinclair/typebox").TNull]>>;
            query: import("@sinclair/typebox").TString<string>;
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
    }, Path, Response>;
}
export declare const apollo: <Path extends string = "/graphql">({ path, enablePlayground, context, ...config }: ElysiaApolloConfig<Path, BaseContext>) => (app: Elysia) => import("elysia/dist/types").ElysiaRoute<"POST", {
    body: import("@sinclair/typebox").TObject<{
        operationName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString<string>, import("@sinclair/typebox").TNull]>>;
        query: import("@sinclair/typebox").TString<string>;
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
}, Path, Response>;
export { gql } from 'graphql-tag';
export default apollo;
