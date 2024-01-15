require("dotenv").config();
const axios = require("axios").default;
const cheerio = require("cheerio");
const pretty = require("pretty");
const readline = require('readline');
const { stdin: input, stdout: output } = require('node:process');
const algoliasearch = require('algoliasearch')
const { EnterTerms, NoResults, VisitUsFull, TryOther, Glosario } = require("./responses");
const WikiHost = process.env.WikiHost;
var Spacer = `
`


//Inicializamos index de Algolia
const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_SECRET)
const index = client.initIndex('aldeaorg');

const algoSearch = async (searchTerms,ctx) => {
if(ctx.chat.type == 'private'){
	//Responder queries vacios y salir
	if (searchTerms.length <= 1) {
	// Handle empty search.
	ctx.reply(EnterTerms);
	return;
	}

  await index
	.search(searchTerms, {
		attributesToRetrieve: ['url', 'url_without_anchor', 'content', 'lang', 'image', '_snippetResult.text'],
		restrictSearchableAttributes: ['url_without_anchor'],
		hitsPerPage: 1,
	}).then(({ hits }) => {
		console.log(hits[0].url_without_anchor);
		axios.get(hits[0].url_without_anchor, {
			headers:{
					'accept-encoding': 'null',
					'User-Agent': 'Mozilla/5.0'
					}
		},
		{
		  responseType: 'text',
		})
		.then(response => {
		// Load search response to Cheerio
		const WebResponse = cheerio.load(response.data);

		// Ver respuestas / Debug
		//console.log(WebResponse('img:eq(0)').attr('src'));

		// Obtenemos el primer parrafo
		if ( (WebResponse('p:eq(0)').text()).startsWith(Glosario) ) { Cont_Resp = WebResponse('p:eq(1)').text();} 
		else { Cont_Resp = WebResponse('p:eq(0)').text();}

		// Obtenemos Nombre de Articulo y URL
		const UrlParser = WebResponse(".mw-page-title-main");
		var prettyUrlParser = pretty(UrlParser.html());
		const cleanUrlParser = '/' + prettyUrlParser.replaceAll(' ','_');

		if (prettyUrlParser.length === 0) { 
			prettyUrlParser = NoResults,
			A_Desc = TryOther,
			Cont_Resp = '',
			Spacer = '',
			ArtImage = ''
		} else { 
			A_Desc =  VisitUsFull,
			ArtImage = WebResponse('img:eq(0)').attr('src')
			Spacer = `
`
			if (ArtImage.includes('poweredby')) {
			ArtImage = '/w/images/thumb/e/ef/Glosario.png/300px-Glosario.png'
			}
		}

		// Construir respuesta
		const TGReply = `Resultado: ` + prettyUrlParser + Spacer + Spacer + Cont_Resp + Spacer + A_Desc + `
` + WikiHost + cleanUrlParser

		// Responder con imagen y texto.
		if (cleanUrlParser.length === 1) {
			ctx.reply(TGReply);
		} else {
			ctx.replyWithPhoto({ url: WikiHost + ArtImage }, { caption: TGReply });
		}})
		.catch((err) => console.log(`Error: ${err}`))
    })
		.catch((err) => {
		console.log(err);
    });
}};

module.exports = {
  algoSearch,
};