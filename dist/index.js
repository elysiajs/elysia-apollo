import { t } from 'elysia';
import { ApolloServerBase, isHttpQueryError, runHttpQuery, ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault, ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { jit } from './jit';
export class ElysiaApolloServer extends ApolloServerBase {
    // This function is used by the integrations to generate the graphQLOptions
    // from an object containing the request and other integration specific
    // options
    async getOption(
    // We ought to be able to declare this as taking ContextFunctionParams, but
    // that gets us into weird business around inheritance, since a subclass (eg
    // Lambda subclassing Express) may have a different ContextFunctionParams.
    // So it's the job of the subclass's function that calls this function to
    // make sure that its argument properly matches the particular subclass's
    // context params type.
    integrationContextArgument) {
        // @ts-ignore
        let context = this.context ? this.context : {};
        try {
            context =
                typeof context === 'function'
                    ? await context(integrationContextArgument || {})
                    : context;
        }
        catch (error) {
            // Defer context error resolution to inside of runQuery
            context = () => {
                throw error;
            };
        }
        return {
            schema: this.schema,
            schemaHash: this.schemaHash,
            // @ts-ignore
            logger: this.logger,
            plugins: this.plugins,
            documentStore: this.documentStore,
            // @ts-ignore
            context,
            // @ts-ignore
            parseOptions: this.parseOptions,
            ...this.requestOptions
        };
    }
    serverlessFramework() {
        return true;
    }
    createHandler({ 
    // @ts-ignore
    path = '/graphql', disableHealthCheck, onHealthCheck, enablePlayground }) {
        return (app) => {
            if (!disableHealthCheck)
                app.get('/.well-known/apollo/server-health', async (context) => {
                    if (onHealthCheck)
                        try {
                            await onHealthCheck(context);
                            return { status: 'pass' };
                        }
                        catch (e) {
                            context.set.status = 503;
                            return { status: 'failed' };
                        }
                    return { status: 'pass' };
                });
            const landing = enablePlayground
                ? ApolloServerPluginLandingPageGraphQLPlayground()
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
            let options;
            // @ts-ignore
            this._ensureStarted().then(
            // @ts-ignore
            async ({ schema, schemaHash, documentStore }) => {
                this.schema = schema;
                this.schemaHash = schemaHash;
                this.documentStore = documentStore;
                options = await this.getOption();
            });
            return app
                .get(path, () => new Response(landingPage.html, {
                headers: {
                    'Content-Type': 'text/html'
                }
            }))
                .post(path, (context) => runHttpQuery([], {
                options,
                method: context.request.method,
                query: context.body,
                // @ts-ignore
                request: context.request
            }, this.csrfPreventionRequestHeaders)
                .then((res) => {
                if (Object.keys(res.responseInit.headers ?? {})
                    .length > 2)
                    Object.assign(context.set.headers, res.responseInit.headers);
                if (res.responseInit.status)
                    context.set.status = res.responseInit.status;
                return JSON.parse(res.graphqlResponse);
            })
                .catch((error) => {
                if (!isHttpQueryError(error))
                    throw error;
                if (error.headers)
                    Object.assign(context.set.headers, error.headers);
                return new Response(error.message, {
                    status: error.statusCode,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }), {
                schema: {
                    response: t.Object({
                        data: t.Object({}, {
                            additionalProperties: true
                        })
                    }, {
                        additionalProperties: true
                    }),
                    body: t.Object({
                        query: t.String(),
                        operationName: t.Optional(t.String()),
                        variables: t.Optional(t.Object({}))
                    }, {
                        additionalProperties: true
                    })
                }
            });
        };
    }
}
export const apollo = ({ path, onHealthCheck, disableHealthCheck, enablePlayground = process.env.ENV !== 'production', ...config }) => new ElysiaApolloServer({
    executor: jit(),
    ...config
}).createHandler({
    path,
    onHealthCheck,
    disableHealthCheck,
    enablePlayground
});
export { jit };
export { gql } from 'apollo-server';
export default apollo;
