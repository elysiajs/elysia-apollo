const resolvers = {
    Query: {
        books: (parent, args, context, info) => {
            return [
                {
                    title: 'Elysia',
                    author: 'saltyAom'
                }
            ]
        }
    }
}

export default resolvers
