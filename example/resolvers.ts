import { IBook, QueryResolvers, Resolvers } from "./types"

const queryResolvers: Pick<QueryResolvers, 'books'> = {
    books: (parent, args, context, info): IBook[] => {
        return [
            {
                title: 'Elysia',
                author: 'saltyAom'
            }
        ]
    }
}

const resolvers: Resolvers = {
    Query: queryResolvers
}

export default resolvers
