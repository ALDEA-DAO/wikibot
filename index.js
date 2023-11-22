const { getStakeAddress } = require("./lib/getStake");
const { getAdaHandleAddress } = require("./lib/handle");
const { searchWiki } = require("./lib/searchWiki");
const stakeTable = require("./lib/db");
const express = require("express");
const app = express();
const port = process.env.PORT || 30001;

app.use(express.json());
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers"
  );
  next();
});

app.get("/searchWiki", (req, res) => {
  const searchTerms = req.query.searchTerms;
  searchWiki(searchTerms)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
