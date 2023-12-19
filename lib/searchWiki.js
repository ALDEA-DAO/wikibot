require("dotenv").config();
const axios = require("axios").default;
const cheerio = require("cheerio");
const pretty = require("pretty");
const { EnterTerms, NoResults, VisitUsFull, TryOther, Glosario } = require("./responses");
const WikiHost = process.env.WikiHost;
var Spacer = `
`
const mysql = require('mysql');

var db_conn = mysql.createConnection({
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USER,
  password : process.env.MYSQL_PASS,
  database : process.env.MYSQL_DB,
  charset   : 'utf8mb4',
  collation : 'utf8mb4_unicode_ci'
});
db_conn.connect();

// Procesamos query recibido
const searchWiki = async (searchTerms,ctx) => {
	// DEBUGGING
	console.log('CHAT:');
	console.log(ctx.chat);

	var query = 'INSERT INTO bot_search (date,query,chat_type,from_id,from_user,group_name,group_id,from_name,group_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

	db_conn.query(query, [ctx.message.date, ctx.message.text, ctx.chat.type, ctx.from.id, ctx.from.username, ctx.chat.username, ctx.chat.id, ctx.from.first_name, ctx.chat.title], function (error, results, fields) {
	if (error) throw error;
});
	
// Responder queries vacios y salir
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
// Get content type
//const contentType = response.headers["content-type"];

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
console.log(cleanUrlParser);

if (prettyUrlParser.length === 0) { 
	prettyUrlParser = NoResults,
	A_Desc = TryOther,
	Cont_Resp = '',
	Spacer = '',
	ArtImage = ''
} else { 
	A_Desc =  VisitUsFull,
	Spacer = `
`,
	ArtImage = WebResponse('img:eq(0)').attr('src');
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
};

};

module.exports = {
  searchWiki,
};