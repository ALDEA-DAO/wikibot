require("dotenv").config();
//const { searchWiki } = require("./lib/searchWiki");
const axios = require("axios").default;
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const express = require("express");
const app = express();
const port = process.env.PORT || 30001;


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

app.get("/searchWiki", (req, res) => {
  const searchTerms = req.query.searchTerms;
  searchWiki(searchTerms)
    .then((response) => {
      res.status(200).send(response);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error);
    });
});

const searchWiki = async (searchTerms,ctx) => {
  if (searchTerms.length === 0) {
    // Handle error.
    return "Por favor ingrese el texto a buscar";
  }

  if (searchTerms.substring(0, 8) === "/search ") {
	  var Terms = searchTerms.substring(8)
	  console.log('BUSCANDO: ' + Terms);
	  axios.get(`http://aldeawiki.org/w/api.php`, {
        params: { 
				action: 'query', 
				list: 'search',
				srwhat: 'text',
				srlimit: '25',
				srnamespace: '0,4,14',
				format: 'json',
				utf8: '',
				srsearch: Terms
				},
	   headers:	{
				'accept-encoding': 'null'
	   }
	},
	{
      responseType: 'json',
    })
	.then(response => {
    //console.log("Example of an API returning an JSON response")
    const contentType = response.headers["content-type"];
    const data = response.data;
	
    //console.log("Type of response data is:", contentType)
    //console.log(data)
	
	if (data.query.searchinfo.totalhits == 0) {
		console.log('No hay artículos con el término indicado');
		ctx.reply('No hay artículos con el término indicado');
		//console.log(data.query.search);
		//return data.query.search;
			
	} else {
		console.log('Hay Resultados');
		//ctx.reply('Hay Resultados');
		//console.log(data.query.search);
		
		var results = data.query.search.map(function(item) {
			console.log(item['title']);
			ctx.reply(item['title'] + `
			\"https://aldeawiki.org/` + item['title'] + `\"
			` + item['snippet']);
		});

	}
	})
	.catch((err) => console.log(`Error: ${err}`))
	};
};

let Saludo = `Bienvenido al bot de ALDEA Wiki
Por favor ingresa /search seguido del término que deseas buscar en nuestra Wiki`

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply(Saludo))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on(message('sticker'), (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('search', (ctx) => {
  // Using context shortcut
  //console.log(ctx.message.text);
  let TGreply = searchWiki(ctx.message.text,ctx)
  //ctx.reply(TGreply)
})
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))


app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
