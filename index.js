require("dotenv").config();
const { Saludo } = require("./lib/responses");
const { searchWiki } = require('./lib/searchWiki');
const { InlineSearch } = require('./lib/inlineQuery.js');
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply(Saludo))
bot.help((ctx) => ctx.reply(Saludo))

bot.command('search', (ctx) => {
	let TGreply = searchWiki(ctx.message.text,ctx)
})

bot.on("inline_query", async (ctx) => {
	console.log(`CTX:
	` + ctx 
	+ `
	inQuery: 
	` + ctx.inlineQuery.query);
	let TGreply = await InlineSearch(ctx.inlineQuery.query,ctx)
});

bot.launch()
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

process.on('warning', (warning) => {
  console.warn(warning.name);    // Print the warning name
  console.warn(warning.message); // Print the warning message
  console.warn(warning.stack);   // Print the stack trace
});