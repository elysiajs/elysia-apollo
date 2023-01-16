import { Elysia, SCHEMA } from 'elysia'
import { apollo } from '../src/index'

import typeDefs from './schema'
import resolvers from './resolvers'

const app = new Elysia()
    .use(
        apollo({
            typeDefs,
            resolvers,
            context: {
                hi: 'elysia'
            }
        })
    )
    .listen(3000)

console.log(
    `🦊 Now foxing at http://${app.server?.hostname}:${app.server?.port}`
)
