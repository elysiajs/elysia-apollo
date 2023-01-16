import { t } from 'elysia'
import type { Context, Elysia, Handler, TypedRoute } from 'elysia'

import {
    ApolloServer,
    type ApolloServerOptions,
    BaseContext,
    ContextThunk
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

export class ElysiaApolloServer<
    Context extends BaseContext = BaseContext
> extends ApolloServer<Context> {
    public createHandler<Path extends string = '/graphql'>({
        // @ts-ignore
        path = '/graphql',
        enablePlayground,
        context
    }: ServerRegistration<Path>) {
        return (app: Elysia) => {
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

            // ! This is a hack
            const landingPage = Bun.peek(
                // @ts-ignore
                Bun.peek(
                    // @ts-ignore
                    landing!.serverWillStart!()
                    // @ts-ignore
                ).renderLandingPage()
            )

            this.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests()

            let contextValue: ContextThunk<Context>

            // @ts-ignore
            this._ensureStarted().then(
                // @ts-ignore
                async ({ schema, schemaHash, documentStore }) => {
                    const createContext = context ?? (async (a: any) => ({}))
                    // @ts-ignore
                    const contextInner = await createContext({})

                    contextValue = () => contextInner
                }
            )

            return app
                .get(
                    path,
                    () =>
                        new Response(landingPage.html, {
                            headers: {
                                'Content-Type': 'text/html'
                            }
                        })
                )
                .post(
                    path,
                    (context) => {
                        return this.executeHTTPGraphQLRequest({
                            httpGraphQLRequest: {
                                method: context.request.method,
                                body: context.body,
                                search: '',
                                // @ts-ignore
                                request: context.request,
                                // @ts-ignore
                                headers: context.request.headers
                            },
                            context: contextValue
                        })
                            .then((res) => {
                                if (Object.keys(res.headers ?? {}).length > 2)
                                    Object.assign(
                                        context.set.headers,
                                        res.headers
                                    )

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
        }
    }
}

export const apollo = <Path extends string = '/graphql'>({
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

// gateway: {
//     async load() {
//         return jit()
//     },
//     onSchemaLoadOrUpdate() {
//         return () => {}
//     },
//     async stop() {}
// },
