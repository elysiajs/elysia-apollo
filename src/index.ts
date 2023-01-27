import { t } from 'elysia'
import type { Context, Elysia, Handler, TypedRoute } from 'elysia'

import {
    ApolloServer,
    BaseContext,
    ContextThunk,
    type ApolloServerOptions
} from '@apollo/server'
import {
    ApolloServerPluginLandingPageLocalDefault,
    ApolloServerPluginLandingPageProductionDefault
} from '@apollo/server/plugin/landingPage/default'
import { ApolloServerPluginLandingPageGraphQLPlayground } from '@apollo/server-plugin-landing-page-graphql-playground'
import { type StartStandaloneServerOptions } from '@apollo/server/standalone'

export interface ServerRegistration<Path extends string = '/graphql'>
    extends StartStandaloneServerOptions<any> {
    path?: Path
    enablePlayground: boolean
}

export type ElysiaApolloConfig<
    Path extends string = '/graphql',
    TContext extends BaseContext = BaseContext
> = ApolloServerOptions<TContext> &
    Omit<ServerRegistration<Path>, 'enablePlayground'> &
    Partial<Pick<ServerRegistration, 'enablePlayground'>>

const getQuery = (url: string) => url.slice(url.indexOf('?', 9) + 1)

export class ElysiaApolloServer<
    Context extends BaseContext = BaseContext
> extends ApolloServer<Context> {
    public async createHandler<Path extends string = '/graphql'>({
        path = '/graphql' as Path,
        enablePlayground,
        context
    }: ServerRegistration<Path>) {
        const landing = enablePlayground
            ? ApolloServerPluginLandingPageGraphQLPlayground({
                  endpoint: path
              })
            : process.env.ENV === 'production'
            ? ApolloServerPluginLandingPageProductionDefault({
                  footer: false
              })
            : ApolloServerPluginLandingPageLocalDefault({
                  footer: false
              })

        await this.start()

        // @ts-ignore
        const contextValue = await this._ensureStarted().then(
            // @ts-ignore
            async ({ schema, schemaHash, documentStore }) => {
                const createContext = context ?? (async (a: any) => ({}))
                // @ts-ignore
                return await createContext({})
            }
        )

        const landingPage = await landing!.serverWillStart!(contextValue).then(
            async (r) =>
                r?.renderLandingPage
                    ? await r.renderLandingPage().then((r) => r.html)
                    : null
        )

        const getContext = () => contextValue

        return (app: Elysia) => {
            if (landingPage)
                app.get(
                    path,
                    () =>
                        new Response(landingPage, {
                            headers: {
                                'Content-Type': 'text/html'
                            }
                        })
                )

            return app.post(
                path,
                (context) => {
                    return this.executeHTTPGraphQLRequest({
                        httpGraphQLRequest: {
                            method: context.request.method,
                            body: context.body,
                            search: getQuery(context.request.url),
                            request: context.request,
                            // @ts-ignore
                            headers: context.request.headers
                        },
                        context: getContext
                    })
                        .then((res) => {
                            if (Object.keys(res.headers ?? {}).length > 2)
                                Object.assign(context.set.headers, res.headers)

                            if (res.body.kind === 'complete')
                                return new Response(res.body.string, {
                                    status: res.status ?? 200,
                                    headers: context.set.headers
                                })

                            return new Response('')
                        })
                        .catch((error) => {
                            if (error instanceof Error) throw error

                            if (error.headers)
                                Object.assign(
                                    context.set.headers,
                                    error.headers
                                )

                            return new Response(error.message, {
                                status: error.statusCode,
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                        })
                },
                {
                    schema: {
                        body: t.Object(
                            {
                                operationName: t.Optional(
                                    t.Union([t.String(), t.Null()])
                                ),
                                query: t.String(),
                                variables: t.Optional(
                                    t.Object(
                                        {},
                                        {
                                            additionalProperties: true
                                        }
                                    )
                                )
                            },
                            {
                                additionalProperties: true
                            }
                        )
                    }
                }
            )

            return app
        }
    }
}

export const apollo = async <Path extends string = '/graphql'>({
    path,
    enablePlayground = process.env.ENV !== 'production',
    context,
    ...config
}: ElysiaApolloConfig<Path>) =>
    new ElysiaApolloServer(config).createHandler<Path>({
        context,
        path,
        enablePlayground
    })

export { gql } from 'graphql-tag'

export default apollo
