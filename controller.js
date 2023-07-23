const { scrapingLetterboxd } = require("./scraping");

exports.getLetterboxdData = async (req, res, next) => {
  let getLetterboxdData = await scrapingLetterboxd(
    req.params.user,
    req.params.month
  );
  return res.status(200).json(getLetterboxdData);
};
