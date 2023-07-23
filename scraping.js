const cheerio = require("cheerio");
const axios = require("axios");

require("dotenv").config();

const apiKey = process.env.TMDB_API_KEY;

exports.scrapingLetterboxd = async (user, month) => {
  do {
    var axiosResponse = await axios.request({
      method: "GET",
      url: `https://letterboxd.com/${user}/films/diary/for/2023/${month}/`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
    });
  } while (axiosResponse.length === 0);

  const $ = cheerio.load(axiosResponse.data);

  const arrayMovies = [];

  const htmlElement = $(".diary-entry-row").each((i, element) => {
    const movieName = $(element).find(".headline-3").text();
    const movieRating = $(element).find(".rating").text();
    const movieYear = $(element).find(".td-released").text();
    const isLiked = $(element).find(".icon-liked").length;

    objMovies = {
      movieName,
      movieRating,
      movieYear,
      isLiked,
    };

    arrayMovies.push(objMovies);
  });

  for (movie of arrayMovies) {
    const { movieName, movieYear } = movie;

    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movieName}&year=${movieYear}`
    );
    const json = await res.json();
    moviePoster = json.results[0].poster_path;

    movie.moviePoster = moviePoster;
  }

  return arrayMovies;
};
