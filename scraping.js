const cheerio = require("cheerio");
const axios = require("axios");
const NodeCache = require("node-cache");
const myCache = new NodeCache();

require("dotenv").config();

const apiKey = process.env.TMDB_API_KEY;

const axiosFetch = async (url) => {
  do {
    var axiosResponse = await axios.request({
      method: "GET",
      url: url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
    });
  } while (axiosResponse.length === 0);

  return axiosResponse;
};

//main fuction
exports.scrapingLetterboxd = async (user, month, year) => {
  try {
    let pagesQt = 1;
    const arrayMovies = [];

    for (let i = 0; i < pagesQt; i++) {
      const axiosResponse = await axiosFetch(
        `https://letterboxd.com/${user}/films/diary/for/${year}/${month}/page/${
          i + 1
        }`
      );

      const $ = cheerio.load(axiosResponse.data);

      const theresPages = $(".paginate-pages");

      if (theresPages.length) {
        for (element of theresPages) {
          const list = $(element).find("li");
          for (element of list) {
            const text = $(element).text();
            pagesQt = parseInt(text);
          }
        }
      }

      for (element of $(".diary-entry-row")) {
        const day = $(element).find(".td-day").text();
        const movieName = $(element).find(".headline-3").text();
        let pageLink = $(element).find(".headline-3").find("a").attr("href");
        let movieRating = $(element).find(".rating").attr("class");
        const isLiked = $(element).find(".icon-liked").length;
        const isRewatched = !$(element)
          .find(".td-rewatch")
          .attr()
          .class.includes("off");
        let result = pageLink.split("/");
        pageLink = result[3];

        movieRating = parseInt(movieRating.slice(13));

        const isHalf = movieRating % 2 !== 0 && movieRating ? true : false;
        isHalf ? movieRating-- : "";
        movieRating /= 2;

        objMovie = {
          day,
          movieName,
          movieRating,
          isLiked,
          isHalf,
          isRewatched,
          pageLink,
        };

        arrayMovies.push(objMovie);
      }
    }

    for (let movie of arrayMovies) {
      const { pageLink, movieName } = movie;
      let moviePoster;

      let value = myCache.get(pageLink);
      if (value == undefined) {
        //fetch id
        const axiosResponse = await axiosFetch(
          `https://letterboxd.com/film/${pageLink}/`
        );

        const $ = cheerio.load(axiosResponse.data);

        let movieId =
          $(".micro-button:eq(1)").attr("href") ||
          $(".micro-button:eq(0)").attr("href");
        let result = movieId.split("/");
        movieId = result[4];
        let type = result[3];

        //fetch cover
        const res = await fetch(
          `https://api.themoviedb.org/3/${type}/${movieId}?api_key=${apiKey}`
        );
        const json = await res.json();
        moviePoster = json.poster_path;

        //exceptions
        if (movieName === "Twin Peaks: The Return") {
          moviePoster = "/lA9CNSdo50iQPZ8A2fyVpMvJZAf.jpg";
        }

        myCache.set(pageLink, moviePoster, 600);
      } else {
        moviePoster = value;
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
    let errorMessage;
    if (e.response.status == 404) {
      errorMessage = "User not found";
    } else {
      errorMessage = e.message;
    }
    return [
      {
        error: errorMessage,
      },
    ];
  }
};
