const axios = require("axios").default;
const cheerio = require("cheerio");
const pretty = require("pretty");
const { EnterTerms, NoResults, NoMatch, VisitUsFull, TryOther } = require("./responses");

const InlineSearch = async (searchTerms,ctx) => {
	console.log(searchTerms); 
	if (searchTerms.length === 0) {
		// Handle empty search.
		result = [
		{	type: 'article', 
			id: 1, 
			title: NoMatch, 
			url: 'https://aldeawiki.org', 
			input_message_content: {message_text: EnterTerms},
			hide_url: true,
			description: EnterTerms
		}
		]
		
		ctx.answerInlineQuery(result);
	}

	console.log('BUSCANDO: ' + searchTerms);
	axios.get(`https://aldeawiki.org/w/index.php`, {
		params: { 
				fulltext: '0', 
				search: searchTerms
				},
		headers:{
				'accept-encoding': 'null',
				'User-Agent': 'Mozilla/5.0'
				}
		},
	{
      responseType: 'text',
    })
	.then(response => {
		const contentType = response.headers["content-type"];
			
		
		const WebResponse = cheerio.load(response.data);
		console.log(WebResponse);
		const UrlParser = WebResponse(".mw-page-title-main");
		const prettyUrlParser = pretty(UrlParser.html());
		const cleanUrlParser = prettyUrlParser.replace(' ','_');
		
		if (prettyUrlParser.length === 0) {
			result = [
			{	type: 'article', 
				id: 1, 
				title: NoResults, 
				url: `https://aldeawiki.org/` + cleanUrlParser, 
				input_message_content: {message_text: NoMatch},
				hide_url: false,
				description: TryOther
			}]	
		} else {		
			console.log(pretty(UrlParser.html()));
			result = [
			{	type: 'article', 
				id: 1, 
				title: prettyUrlParser, 
				url: `https://aldeawiki.org/` + cleanUrlParser, 
				input_message_content: {message_text: prettyUrlParser},
				hide_url: false,
				description: VisitUsFull
			}]
		}
		ctx.answerInlineQuery(result);
	})
	.catch((err) => console.log(`Error: ${err}`))
};


module.exports = {
  InlineSearch,
};