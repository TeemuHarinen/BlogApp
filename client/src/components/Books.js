import { useState } from "react"
import { ALL_BOOKS_BY_GENRE } from "./queries"
import { useQuery } from "@apollo/client"

const Books = ({ show, books }) => {
  const [genre, setGenre] = useState('all')
  // Initializes genrebuttons with genres from all books
  const genres = books.map(b => b.genres).flat() // Flattens array of arrays 
  genres.push('all')
  const uniqueGenres = [...new Set(genres)]// Removes duplicates
  const resultByGenre = useQuery(ALL_BOOKS_BY_GENRE, { // GraphQL query for books by genre
    variables: { genre: genre }
  })

  if (!show) {
    return null
  }
  if (resultByGenre.loading)  {
    return <div>loading...</div>
  }

  const handleClick = (genre) => {
    setGenre(genre)
  }

  const showBooks = genre === 'all' ? books : resultByGenre.data.allBooks

  return (
    <div>
      <h2>books</h2>
      <p> in genre {genre} </p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {showBooks.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {uniqueGenres.map(g => <button key={g} onClick={() => handleClick(g)}>{g}</button>)}
    </div>
  )
}

export default Books

/*
  const genres = books.map(b => b.genres).flat() // flattens array of arrays 
  genres.push('all')
  const uniqueGenres = [...new Set(genres)]// removes duplicates
  
  books = genre === 'all' ? books : books.filter(b => b.genres.includes(genre))
*/
