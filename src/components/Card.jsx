import React from 'react'

const Card = ({movie}) => {

  function  onFavorateClick () {
        alert("clicked")
    };

  return (
    <>
    <div className="movie-card">
        <div className="movie-poster">
            <img src={movie.url} alt={movie.title} />
            <div className="movie-overlay">
                <button className="favorate-button " onClick={onFavorateClick}>
                    ❤️
                </button>
            </div>
        </div>
        <div className="movie-info">
            <h3 className="">{movie.title}</h3>
            <p className="">{movie.release_date}</p>
        </div>
    </div>
    </>
  )
}

export default Card