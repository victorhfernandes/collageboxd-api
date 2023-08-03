const cheerio = require("cheerio");
const axios = require("axios");

require("dotenv").config();

const apiKey = process.env.TMDB_API_KEY;

exports.scrapingLetterboxd = async (user, month, year) => {
  try {
    do {
      var axiosResponse = await axios.request({
        method: "GET",
        url: `https://letterboxd.com/${user}/films/diary/for/${year}/${month}/`,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
        },
      });
    } while (axiosResponse.length === 0);

    const $ = cheerio.load(axiosResponse.data);

    const arrayMovies = [];

    for (element of $(".diary-entry-row")) {
      const movieName = $(element).find(".headline-3").text();
      let pageLink = $(element).find(".headline-3").find("a").attr("href");
      let movieRating = $(element).find(".rating").attr("class");
      const isLiked = $(element).find(".icon-liked").length;

      let result = pageLink.split("/");
      pageLink = result[3];

      movieRating = parseInt(movieRating.slice(13));

      const isHalf = movieRating % 2 !== 0 && movieRating ? true : false;
      isHalf ? movieRating-- : "";
      movieRating /= 2;

      objMovie = {
        movieName,
        movieRating,
        isLiked,
        isHalf,
        pageLink,
      };

      arrayMovies.push(objMovie);
    }

    for (let movie of arrayMovies) {
      const { pageLink, movieName } = movie;

      //fetch id
      do {
        var axiosResponse2 = await axios.request({
          method: "GET",
          url: `https://letterboxd.com/film/${pageLink}/`,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
          },
        });
      } while (axiosResponse2.length === 0);

      const $ = cheerio.load(axiosResponse2.data);

      let movieId =
        $(".micro-button:eq(1)").attr("href") ||
        $(".micro-button:eq(0)").attr("href");
      let result = movieId.split("/");
      movieId = result[4];

      //fetch cover
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`
      );
      const json = await res.json();
      let moviePoster = json.poster_path;

      //exceptions
      if (movieName === "Twin Peaks: The Return") {
        moviePoster = "/lA9CNSdo50iQPZ8A2fyVpMvJZAf.jpg";
      }

      movie.moviePoster = moviePoster;
      delete movie.pageLink;
    }

    if (!arrayMovies.length) {
      const objError = {
        error: "No film logs",
      };

      arrayMovies.push(objError);
    }

    return arrayMovies;
  } catch (e) {
    return [
      {
        error: e.message,
      },
    ];
  }
};
