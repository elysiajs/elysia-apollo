import { t } from 'elysia';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPluginLandingPageGraphQLPlayground } from '@apollo/server-plugin-landing-page-graphql-playground';
export class ElysiaApolloServer extends ApolloServer {
    createHandler({ 
    // @ts-ignore
    path = '/graphql', enablePlayground, context }) {
        return (app) => {
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
                    });
            // ! This is a hack
            const landingPage = Bun.peek(
            // @ts-ignore
            Bun.peek(
            // @ts-ignore
            landing.serverWillStart()
            // @ts-ignore
            ).renderLandingPage());
            this.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();
            let contextValue;
            // @ts-ignore
            this._ensureStarted().then(
            // @ts-ignore
            async ({ schema, schemaHash, documentStore }) => {
                const createContext = context ?? (async (a) => ({}));
                // @ts-ignore
                const contextInner = await createContext({});
                contextValue = () => contextInner;
            });
            return app
                .get(path, () => new Response(landingPage.html, {
                headers: {
                    'Content-Type': 'text/html'
                }
            }))
                .post(path, (context) => {
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
                        Object.assign(context.set.headers, res.headers);
                    if (res.body.kind === 'complete')
                        return new Response(res.body.string, {
                            status: res.status ?? 200,
                            headers: context.set.headers
                        });
                    return new Response('');
                })
                    .catch((error) => {
                    if (error instanceof Error)
                        throw error;
                    if (error.headers)
                        Object.assign(context.set.headers, error.headers);
                    return new Response(error.message, {
                        status: error.statusCode,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                });
            }, {
                schema: {
                    body: t.Object({
                        operationName: t.Optional(t.Union([t.String(), t.Null()])),
                        query: t.String(),
                        variables: t.Optional(t.Object({}, {
                            additionalProperties: true
                        }))
                    }, {
                        additionalProperties: true
                    })
                }
            });
        };
    }
}
export const apollo = ({ path, enablePlayground = process.env.ENV !== 'production', context, ...config }) => new ElysiaApolloServer(config).createHandler({
    context,
    path,
    enablePlayground
});
export { gql } from 'graphql-tag';
export default apollo;
// gateway: {
//     async load() {
//         return jit()
//     },
//     onSchemaLoadOrUpdate() {
//         return () => {}
//     },
//     async stop() {}
// },
