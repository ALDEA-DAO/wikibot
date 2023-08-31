const axios = require("axios").default;

const getStakeAddress = async (address) => {
  if (address.length === 0) {
    // Handle error.
    return "";
  }

  let network = "mainnet";

  if (address.substring(0, 10) === "addr_test1") {
    network = "preprod";
  }

  // Fetch matching address for the asset.
  const data = await axios.get(
    `https://cardano-${network}.blockfrost.io/api/v0/addresses/${address}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        project_id: process.env.BLOCKFROST_PROJECT_ID,
      },
    }
  );

  if (data.data.stake_address === undefined) {
    return "";
  }

  return data.data.stake_address;
};

module.exports = {
  getStakeAddress,
};
