import { Elysia } from 'elysia'
import { apollo } from '../src/index'
import { cors } from '@elysiajs/cors'

import typeDefs from './schema'
import resolvers from './resolvers'

interface MyContext {
    hi: string
}

const app = new Elysia()
    .use(
        cors({
            origin: 'http://localhost'
        })
    )
    .use(
        apollo<'/graphql', MyContext>({
            path: '/graphql',
            typeDefs,
            resolvers,
            enablePlayground: true,
            context: async (context) => {
                return { hi: 'there' }
            }
        })
    )
    .get('/', () => 'hi')
    .listen(3000)

console.log(
    `🦊 Now foxing at http://${app.server?.hostname}:${app.server?.port}`
)
