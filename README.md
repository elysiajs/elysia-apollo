# @elysia/apollo
[Elysia](https://github.com/elysiajs/elysia) to integrate GraphQL Apollo.

## Installation
```bash
bun add @elysia/apollo @apollo/server graphql
```

## Example
```typescript
import { Elysia } from 'elysia'
import { apollo, gql } from '@elysia/apollo'

const app = new Elysia()
    .use(
        apollo({
            typeDefs: gql`
                type Book {
                    title: String
                    author: String
                }

                type Query {
                    books: [Book]
                }
            `,
            resolvers: {
                Query: {
                    books: () => {
                        return [
                            {
                                title: 'Elysia',
                                author: 'saltyAom'
                            }
                        ]
                    }
                }
            }
        })
    )
    .listen(8080)
```

## Config
This plugin extends Apollo's [ServerRegistration](https://www.apollographql.com/docs/apollo-server/api/apollo-server/#options) (which is `ApolloServer`'s' constructor parameter).

Below are the extended parameters for configuring Apollo Server with Elysia.
### path
@default "/graphql"

Path to expose Apollo Server

### landingPage
@default "process.env.ENV === 'production' ? 'Production' : 'Local'"

Determine whether should Apollo render landing page with a `'Local'` variation, `'Production'` variation, or completely `'Disabled'` it. Read more information about each variation on [Apollo's Landing Page Plugins](https://www.apollographql.com/docs/apollo-server/api/plugin/landing-pages)
