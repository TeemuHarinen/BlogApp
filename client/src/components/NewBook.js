import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ALL_BOOKS, CREATE_BOOK, EDIT_AUTHOR_BIRTHYEAR } from './queries'
import Select from 'react-select'


const NewBook = ({ show, setError, authors }) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])
  const [born, bornToEdit] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)

  const options = authors.map(a => {
    return { value: a.name, label: a.name }
  })

  const [ createBook ] = useMutation(CREATE_BOOK, {
    refetchQueries: [ { query: ALL_BOOKS } ],
    onError: (error) => {
      const messages = error.graphQLErrors.map((error) => error.message).join('\n')
      setError(messages)
    }
  })

  const [ editAuthor ] = useMutation(EDIT_AUTHOR_BIRTHYEAR, {
    onError: (error) => {
      const messages = error.graphQLErrors.map((error) => error.message).join('\n')
      setError(messages)
    }
  })

  if (!show) {
    return null
  }

  const submit = async (event) => {
    event.preventDefault()

    createBook({  variables: { title, author, published , genres } })

    setTitle('')
    setPublished('')
    setAuthor('')
    setGenres([])
    setGenre('')
  }

  const addGenre = () => {
    setGenres(genres.concat(genre))
    setGenre('')
  }

  const updateAuthor = async (event) => {
    event.preventDefault()
    editAuthor({ variables: { name: selectedOption.value, setBornTo: parseInt(born) } })
    console.log('Author birthyear updated with', selectedOption.value, born)
    setPublished('')
    setAuthor('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor((target.value))}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(parseInt(target.value))}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type="submit">create book</button>
      </form>
      <h2>Set birthyear</h2>
      <form onSubmit={updateAuthor}>
        <div>
          <Select
            value={selectedOption}
            onChange={setSelectedOption}
            options={options}
          />
        </div>
        <div>
          born
          <input
            type="number"
            value={born}
            onChange={({ target }) => bornToEdit(parseInt(target.value))}
          />
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  )
}
export default NewBook