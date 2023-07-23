module.exports = (scraping) => {
  const scrapingController = require("./controller");

  const router = require("express").Router();

  router.get("/:user/:month", scrapingController.getLetterboxdData);

  scraping.use("/api", router);
};
