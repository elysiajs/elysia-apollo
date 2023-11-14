import { Elysia } from 'elysia'
import { apollo } from '../src'
import resolvers from '../example/resolvers'
import typeDefs from '../example/schema'

import { describe, expect, it } from 'bun:test'
import { GraphQLResolveInfo } from 'graphql'

const path = '/graphql'

const req = () => new Request(path)
const gql = (query: string, pathname = path) =>
    new Request(`http://localhost${pathname}`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            query
        })
    })

describe('Apollo', () => {
    it('query', async () => {
        const app = new Elysia().use(
            apollo({
                path,
                typeDefs,
                resolvers
            })
        )

        await app.modules

        const res = await app
            .handle(
                await gql(`query {
            books {
                title
                author
            }
        }`)
            )
            .then((r) => r.json())
        expect(res).toEqual({
            data: {
                books: resolvers?.Query?.books?.(
                    {},
                    {},
                    {},
                    {} as GraphQLResolveInfo,
                )
            }
        })
    })

    it('custom path', async () => {
        const app = new Elysia().use(
            apollo({
                path: '/v2/graphql',
                typeDefs,
                resolvers
            })
        )

        await app.modules

        const res = await app
            .handle(
                await gql(
                    `query {
            books {
                title
                author
            }
        }`,
                    '/v2/graphql'
                )
            )
            .then((r) => r.json())

        expect(res).toEqual({
            data: {
                books: resolvers?.Query?.books?.(
                    {},
                    {},
                    {},
                    {} as GraphQLResolveInfo,
                )
            }
        })
    })
})
