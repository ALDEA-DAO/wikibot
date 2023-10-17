const { getStakeAddress } = require("./lib/getStake");
const { getAdaHandleAddress } = require("./lib/handle");
const stakeTable = require("./lib/db");
const express = require("express");
const app = express();
const port = process.env.PORT || 3001;

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

app.get("/getRewards", (req, res) => {
  const stakeAddress = req.query.stakeAddress;
  stakeTable
    .getRewards(stakeAddress)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.get("/getStakeAddress", (req, res) => {
  const adaAddress = req.query.adaAddress;
  getStakeAddress(adaAddress)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

app.get("/getAdaHandle", (req, res) => {
  const handleName = req.query.handleName;
  getAdaHandleAddress(handleName)
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
