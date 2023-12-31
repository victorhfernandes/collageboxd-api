const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  return res.status(200).json({ msg: "servidor rodando" });
});

require("./router")(app);

app.listen(process.env.PORT || 3000, () => {
  console.log("app rodando");
});
