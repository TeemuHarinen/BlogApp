import { ME } from './queries.js'
import { useQuery } from '@apollo/client'

const FavoriteList = ({ show, favoriteBooks }) => {
  const result = useQuery(ME)
  if (!show) {
    return null
  }
  if (result.loading)  {
    return <div>loading...</div>
  }

  if (result.error) {
    return <div>Error: {result.error.message}</div>
  }

  let filteredBooks = favoriteBooks
  if (result.data.me.favoriteGenre) {
    const favoriteGenre = result.data.me.favoriteGenre
    filteredBooks = favoriteGenre === 'all' ? favoriteBooks : favoriteBooks.filter(b => b.genres.includes(favoriteGenre))
  }

  return (
    <div>
      <h2>Favorite books</h2>
      <p> (Shows books in your favorite genre: {result.data.me.favoriteGenre})</p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {filteredBooks.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}

export default FavoriteList
