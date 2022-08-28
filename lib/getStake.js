const axios = require('axios').default;

const getStakeAddress = async (address) => {

    if (address.length === 0) {
        // Handle error.
        return "";
    }

    let network = "mainnet";

    if(address.substring(0,10) === "addr_test1") {
        network = "testnet";
    };

    // Fetch matching address for the asset.
    const data = await axios.get(
    `https://cardano-${network}.tangocrypto.com/${process.env.TANGO_APP_ID}/v1/addresses/${address}`,
    {
        method: "GET",
        headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TANGO_API_KEY
        }
    })

    if(data.data.stake_address === undefined) {
        return "";
    }
    
    return data.data.stake_address;
    
}

module.exports = {
    getStakeAddress
}