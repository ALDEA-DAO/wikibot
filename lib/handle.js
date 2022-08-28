const axios = require('axios').default;

const getAdaHandleAddress = async (handleName) => {

    const policyID = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a';

    // A blank Handle name should always be ignored.
    if (handleName.length === 0) {
        // Handle error.
        return "";
    }

    // Convert handleName to hex encoding.
    const assetName = Buffer.from(handleName).toString('hex');
      
    // Fetch matching address for the asset.
    const data = await axios.get(
    `https://cardano-mainnet.tangocrypto.com/${process.env.TANGO_APP_ID}/v1/assets/${policyID}${assetName}/addresses`,
    {
        method: "GET",
        headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.TANGO_API_KEY
        }
    })

    if(data.data.data.length === 0) {
        return "";
    }
    
    return data.data.data[0].address;

}

module.exports = {
    getAdaHandleAddress
}