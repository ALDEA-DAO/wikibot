require("dotenv").config();
const { Saludo, EnterTerms, NoResults } = require("./lib/responses");
const axios = require("axios").default;
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')

const searchWiki = async (searchTerms,ctx) => {
  if (searchTerms.length === 0) {
    // Handle empty search.
    return EnterTerms;
  }

  if (searchTerms.substring(0, 8) === "/search ") {
	  var Terms = searchTerms.substring(8)
	  console.log('BUSCANDO: ' + Terms);
	  axios.get(`http://aldeawiki.org/w/api.php`, {
        params: { 
				action: 'query', 
				list: 'search',
				srwhat: 'text',
				srlimit: '5',
				srnamespace: '0|4',
				format: 'json',
				utf8: '',
				srsort: 'relevance',
				srenablerewrites: 'true',
				srprop: 'snippet|sectiontitle',
				srinfo: 'totalhits',
				srqiprofile: 'classic',
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
    const contentType = response.headers["content-type"];
    const data = response.data;
		
	//console.log(data.query);
	
	if (data.query.searchinfo.totalhits == 0) {
		console.log(NoResults);
		ctx.reply(NoResults);			
	} else {
	//	console.log('Hay Resultados');
		console.log('Results: ' + data.query.searchinfo.totalhits + 
					' Showing: ' + data.query.search.length)
		for (i=0;i<data.query.search.length;i++) {
			//console.log(data.query.search[i]);

			//ctx.reply(data.query.search[i]);
			//Reply with search results
//			ctx.reply(data.query.search[i]['title'] + `
//			\"https://aldeawiki.org/` + data.query.search[i]['title'] + `\"
//			` + data.query.search[i]['snippet']);
		}
		
//		var results = data.query.search.map(function(item) {
//			console.log(item['title']);
//			ctx.reply(item['title'] + `
//			\"https://aldeawiki.org/` + item['title'] + `\"
//			` + item['snippet']);
//		});

	}
	})
	.catch((err) => console.log(`Error: ${err}`))
	};
};



const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply(Saludo))
bot.help((ctx) => ctx.reply(Saludo))
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
