import { Elysia } from 'elysia'
import { apollo } from '../src'
import resolvers from '../example/resolvers'
import typeDefs from '../example/schema'

import { describe, expect, it } from 'bun:test'

const path = '/graphql'

const req = () => new Request(path)
const gql = (query: string) =>
    new Request(path, {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            query
        })
    })

const delay = () => new Promise((resolve) => setTimeout(resolve, 100))

describe('Apollo', () => {
    it('should get root path', async () => {
        const app = new Elysia().use(
            apollo({
                path,
                typeDefs,
                resolvers
            })
        )

        await delay()

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
                books: resolvers.Query.books(
                    undefined,
                    undefined,
                    {},
                    undefined
                )
            }
        })
    })
})
