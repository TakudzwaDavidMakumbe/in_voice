import React from 'react'
import Card from '../components/Card'

const movies = [
    {id: 1, title: "John Wick", release_date: "2020"},
    {id: 2, title: "Terminater", release_date: "1999"},
    {id: 3, title: "The Matrix", release_date: "1998"},
]

const Home = () => {
  return (
    <>
        <div className="movie-grid">
            {movies.map((movie) => (
                <Card movie={movie} key={movie.id}/>
                ))}
        </div>
    </>
  )
}

export default Home