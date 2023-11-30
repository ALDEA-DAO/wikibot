const axios = require("axios").default;
const cheerio = require("cheerio");
const pretty = require("pretty");
const { EnterTerms, NoResults } = require("./responses");

const searchWiki = async (searchTerms,ctx) => {
  if (searchTerms.length === 0) {
    // Handle empty search.
    ctx.reply(EnterTerms);
  }

  if (searchTerms.substring(0, 8) === "/search ") {
	  var Terms = searchTerms.substring(8)
	  console.log('BUSCANDO: ' + Terms);
	  axios.get(`http://aldeawiki.org/w/index.php`, {
		params: { 
				fulltext: '0', 
				search: Terms
				},
		headers:{
				'accept-encoding': 'null'
				}
	},
	{
      responseType: 'text',
    })
	.then(response => {
    const contentType = response.headers["content-type"];
		
	
	const WebResponse = cheerio.load(response.data);
	//console.log(WebResponse);
	const UrlParser = WebResponse(".mw-page-title-main");
	const prettyUrlParser = pretty(UrlParser.html());
	const cleanUrlParser = prettyUrlParser.replace(' ','_');
	
	console.log(pretty(UrlParser.html()));
	ctx.reply(`Resultado: ` + prettyUrlParser + 
	`
	https://aldeawiki.org/` + cleanUrlParser);
	
//	if (data.query.searchinfo.totalhits == 0) {
//		console.log(NoResults);
//		ctx.reply(NoResults);			
//	} else {
	//	console.log('Hay Resultados');
//		console.log('Results: ' + data.query.searchinfo.totalhits + 
//					' Showing: ' + data.query.search.length)
//		for (i=0;i<data.query.search.length;i++) {
			//console.log(data.query.search[i]);

			//ctx.reply(data.query.search[i]);
			//Reply with search results
//			ctx.reply(data.query.search[i]['title'] + `
//			\"https://aldeawiki.org/` + data.query.search[i]['title'] + `\"
//			` + data.query.search[i]['snippet']);
//		}
		
//		var results = data.query.search.map(function(item) {
//			console.log(item['title']);
//			ctx.reply(item['title'] + `
//			\"https://aldeawiki.org/` + item['title'] + `\"
//			` + item['snippet']);
//		});
//	}
	})
	.catch((err) => console.log(`Error: ${err}`))
	};
};

module.exports = {
  searchWiki,
};