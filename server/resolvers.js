const { GraphQLError } = require('graphql')
const { PubSub } = require('graphql-subscriptions')
const Book = require('./models/Book')
const Author = require('./models/Author')
const User = require('./models/User')
const jwt = require('jsonwebtoken')
const DataLoader = require('dataloader')
const pubsub = new PubSub()

const bookCountLoader = new DataLoader(async (keys) => {
  const books = await Book.find({ author: { $in: keys } })
  const bookCounts = keys.map(key => books.filter(book => book.author.toString() === key.toString()).length)
  return bookCounts
})

const resolvers = {
  Query: {
    bookCount: async () => Book.countDocuments(),
    authorCount: async () => Author.countDocuments(),
    allBooks: async (root, args) => {
      try {
        let books;
        if (args.author && args.genre) {
          const authorToFind = await Author.findOne({ name: args.author })
          books = await Book.find({ author: authorToFind._id, genres: { $in: [args.genre] } })
        } else if (args.genre) {
          books = await Book.find({ genres: { $in: [args.genre] }})
        } else if (args.author){
          const authorToFind = await Author.findOne({ name: args.author })
          books = await Book.find({ author: authorToFind._id})
        } else {
          books = await Book.find({})
        }

        await Promise.all(books.map(book => book.populate('author')))
        return books
        } catch (error) {
        throw new GraphQLError('Finding books failed', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            error
          }
        })
      }
    },
    allAuthors: async () => Author.find({}),
    me: (root, args, context) => {
      console.log(context.currentUser)
      return context.currentUser
    }
  },
  Author: {
    bookCount: async (root) => {
      //return Book.countDocuments({ author: root._id })
      return bookCountLoader.load(root._id)
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      let authorRecord = await Author.findOne({ name: args.author })
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
          }
        })
      }

      if (!authorRecord) {
        authorRecord = new Author({ name: args.author, born: null })
        try {
          await authorRecord.save()
        } catch (error) {
          throw new GraphQLError('Saving person failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        }
      }
      let book;
      try {
        book = new Book({ ...args, author: authorRecord })
        await book.save()
      } catch (error) {
        throw new GraphQLError('Saving book failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          }
        })
      }

      pubsub.publish('BOOK_ADDED', { bookAdded: book })
      return book
    },

    editAuthor: async (root, args, context) => {
      console.log(args)
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
          }
        })
      }
      try {
        const author = await Author.findOne({ name: args.name })
        if (!author) {
          return null
        }
        author.born = args.setBornTo
        await author.save()
        return author
      } catch (error) {
        throw new GraphQLError('Saving author failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          }
        })
      }
    },
    createUser: async (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
      console.log(user)
      try {
        await user.save()
        return user
      } catch (error) {
        throw new GraphQLError('Saving user failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
            error
          }
        })
      }
    },
    login: async (root, args) => {
      console.log(args)
      const user = await User.findOne({ username: args.username })
      console.log(user)
      if (!user || args.password !== 'secret') {
        throw new GraphQLError('Wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    }
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED') // lista?
    }
  }
}

module.exports = resolvers