require("dotenv").config();
const axios = require("axios").default;
const cheerio = require("cheerio");
const pretty = require("pretty");
const { EnterTerms, NoResults, VisitUsFull, TryOther, Glosario } = require("./responses");
const WikiHost = process.env.WikiHost;
var Spacer = ` 
`

// Procesamos query recibido
const searchWiki = async (searchTerms,ctx) => {
//Responder queries vacios y salir
if (searchTerms.length < 9) {
// Handle empty search.
ctx.reply(EnterTerms);
return;
}

if ( searchTerms.substring(0, 8) === "/search " || searchTerms.substring(0, 8) === "/buscar ") {
  var Terms = searchTerms.substring(8)
  console.log('BUSCANDO: ' + Terms);
  axios.get(WikiHost + `/w/index.php`, {
	params: { 
			fulltext: '0', 
			search: Terms
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
//Get content type
const contentType = response.headers["content-type"];

// Load search response to Cheerio
const WebResponse = cheerio.load(response.data);
const $ = cheerio.load(response.data);

// Ver respuestas / Debug
//console.log(WebResponse('img:eq(0)').attr('src'));

//Obtenemos el primer parrafo
if ( (WebResponse('p:eq(0)').text()).startsWith(Glosario) ) { Cont_Resp = WebResponse('p:eq(1)').text();} 
else { Cont_Resp = WebResponse('p:eq(0)').text();}

//Obtenemos Nombre de Articulo y URL
const UrlParser = WebResponse(".mw-page-title-main");
var prettyUrlParser = pretty(UrlParser.html());
const cleanUrlParser = '/' + prettyUrlParser.replace(' ','_');

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
`}

//Construir respuesta
const TGReply = `Resultado: ` + prettyUrlParser + Spacer + Spacer + Cont_Resp + Spacer + A_Desc + `
` + WikiHost + cleanUrlParser

//Responder con imagen y texto.
if (cleanUrlParser.length === 1) {
	ctx.reply(TGReply);
} else {
ctx.replyWithPhoto({ url: WikiHost + ArtImage }, { caption: TGReply });
}})
.catch((err) => console.log(`Error: ${err}`))
};
};

module.exports = {
  searchWiki,
};