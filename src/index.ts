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
import { type StartStandaloneServerOptions } from '@apollo/server/standalone'

export interface ServerRegistration<
	Path extends string = '/graphql',
	TContext extends BaseContext = BaseContext
> extends Omit<StartStandaloneServerOptions<any>, 'context'> {
	path?: Path
	landingPage?: 'Local' | 'Production' | 'Disabled'
	context?: (context: TContext) => Promise<TContext>
}

export type ElysiaApolloConfig<
	Path extends string = '/graphql',
	TContext extends BaseContext = BaseContext
> = ApolloServerOptions<TContext> &
	Omit<ServerRegistration<Path, TContext>, 'landingPage'> &
	Partial<Pick<ServerRegistration, 'landingPage'>>

const getQueryString = (url: string) => url.slice(url.indexOf('?', 11) + 1)

export class ElysiaApolloServer<
	Context extends BaseContext = BaseContext
> extends ApolloServer<Context> {
	public async createHandler<Path extends string = '/graphql'>({
		path = '/graphql' as Path,
		landingPage,
		context: apolloContext = async () => ({}) as any
	}: ServerRegistration<Path, Context>) {
		await this.start()

		const executeHTTPGraphQLRequest =
			this.executeHTTPGraphQLRequest.bind(this)

		const app = new Elysia()

		if (landingPage !== 'Disabled') {
			const landingPagePlugin = (
				landingPage === 'Production'
					? ApolloServerPluginLandingPageProductionDefault
					: ApolloServerPluginLandingPageLocalDefault
			)({
				footer: false
			})

			const landingPageHtml = await landingPagePlugin?.serverWillStart!(
				// @ts-ignore
				{}
			).then((r) =>
				r?.renderLandingPage
					? // @ts-ignore
						r
							.renderLandingPage()
							.then(({ html }) =>
								typeof html === 'string' ? html : html()
							)
					: null
			)

			if (landingPageHtml)
				app.get(
					path,
					new Response(landingPageHtml, {
						headers: {
							'Content-Type': 'text/html'
						}
					})
				)
		}

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
	landingPage = process.env.ENV === 'production' ? 'Production' : 'Local',
	context,
	...config
}: ElysiaApolloConfig<Path, TContext>) =>
	new ElysiaApolloServer<TContext>(config).createHandler<Path>({
		context,
		path,
		landingPage
	})

export { gql } from 'graphql-tag'

export default apollo
