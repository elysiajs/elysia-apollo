import { Elysia, t } from 'elysia'

import {
	ApolloServer,
	BaseContext,
	type ApolloServerOptions
} from '@apollo/server'
import {
	ApolloServerPluginLandingPageLocalDefault,
	ApolloServerPluginLandingPageProductionDefault
} from '@apollo/server/plugin/landingPage/default'
import { ApolloServerPluginLandingPageGraphQLPlayground } from '@apollo/server-plugin-landing-page-graphql-playground'
import { type StartStandaloneServerOptions } from '@apollo/server/standalone'

export interface ServerRegistration<
	Path extends string = '/graphql',
	TContext extends BaseContext = BaseContext
> extends Omit<StartStandaloneServerOptions<any>, 'context'> {
	path?: Path
	enablePlayground: boolean
	context?: (context: TContext) => Promise<TContext>
}

export type ElysiaApolloConfig<
	Path extends string = '/graphql',
	TContext extends BaseContext = BaseContext
> = ApolloServerOptions<TContext> &
	Omit<ServerRegistration<Path, TContext>, 'enablePlayground'> &
	Partial<Pick<ServerRegistration, 'enablePlayground'>>

const getQueryString = (url: string) => url.slice(url.indexOf('?', 11) + 1)

export class ElysiaApolloServer<
	Context extends BaseContext = BaseContext
> extends ApolloServer<Context> {
	public async createHandler<Path extends string = '/graphql'>({
		path = '/graphql' as Path,
		enablePlayground,
		context: apolloContext = async () => ({}) as any
	}: ServerRegistration<Path, Context>) {
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
		const landingPage = await landing!.serverWillStart!({}).then((r) =>
			r?.renderLandingPage
				? r.renderLandingPage().then((r) => r.html)
				: null
		)

		const executeHTTPGraphQLRequest =
			this.executeHTTPGraphQLRequest.bind(this)

		const app = new Elysia()

		if (landingPage)
			app.get(
				path,
				new Response(landingPage as string, {
					headers: {
						'Content-Type': 'text/html'
					}
				})
			)

		return app.post(
			path,
			async function handleGraph(context) {
				const {
					body,
					request,
					request: { method, url, headers },
					set
				} = context

				const res = await executeHTTPGraphQLRequest({
					httpGraphQLRequest: {
						method,
						body,
						search: getQueryString(url),
						request,
						// @ts-ignore
						headers
					},
					// @ts-ignore
					context: () => apolloContext(context)
				}).catch((x) => x)

				if (res.body.kind !== 'complete') return ''

				return new Response(res.body.string, {
					status: res.status ?? 200,
					// @ts-ignore
					headers: res.headers
				})
			},
			{
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
		)
	}
}

export const apollo = async <
	Path extends string = '/graphql',
	TContext extends BaseContext = BaseContext
>({
	path,
	enablePlayground = process.env.ENV !== 'production',
	context,
	...config
}: ElysiaApolloConfig<Path, TContext>) =>
	new ElysiaApolloServer<TContext>(config).createHandler<Path>({
		context,
		path,
		enablePlayground
	})

export { gql } from 'graphql-tag'

export default apollo
