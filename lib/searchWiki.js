const axios = require("axios").default;

//	axios.interceptors.request.use(request => {
//  console.log('Starting Request', JSON.stringify(request, null, 2))
//  return request
//})
//axios.interceptors.response.use(response => {
//  console.log('Response:', JSON.stringify(response, null, 2))
//  return response
//})

const searchWiki = async (searchTerms) => {
  if (searchTerms.length === 0) {
    // Handle error.
    return "Por favor ingrese el texto a buscar";
  }

  if (searchTerms.substring(0, 8) === "/search ") {
	  var Terms = searchTerms.substring(8)
	  console.log(Terms);
	  
	axios.get(`https://aldeawiki.org/w/api.php?action=query&list=search&srwhat=text&srlimit=25&srnamespace=*&format=json&srsearch=${Terms}`,
	{
      responseType: 'json',
    })
	.then(response => {
    console.log("Example of an API returning an JSON response")
    const contentType = response.headers["content-type"];
    const data = response.data;
	
    console.log("Type of response data is:", contentType)
    //console.log(data)
	
	if (data.query.searchinfo.totalhits == 0) {
		console.log("No hay artículos con el término indicado");
		//console.log(data);
		return data.query.search;
			
	} else {
		console.log("Hay Resultados");
		console.log(data.query.search);
		return data.query.search;
	}
	})
	.catch((err) => console.log(`Error: ${err}`))
	};
};

module.exports = {
  searchWiki,
};
