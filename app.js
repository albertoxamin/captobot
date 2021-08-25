const { Telegraf } = require('telegraf')
var config;
try { config = require('./config') } catch (err) {
	config = {
		token: process.env.token
	}
}
const templates = require('./templates')
const { Telegram, Markup, Router, Extra } = require('telegraf')
const Jimp = require('jimp')
const guid = require('guid')
const fs = require('fs')
const imgurUploader = require('imgur-uploader');

const bot = new Telegraf(config.telegraf_token);

var telegram = new Telegram(config.telegraf_token, null)
var username = "";
var cache = [];


bot.telegram.getMe().then((bot_informations) => {
	bot.options.username = bot_informations.username;
	username = bot_informations.username;
	console.log("Server has initialized bot nickname. Nick: " + bot_informations.username);
	if (fs.existsSync('./templates/cache.json')) {
		cache = require('./templates/cache.json');	
		console.log("Server has loaded cache.json");
	}
});

bot.command('pic', (ctx) => {
	if (ctx.message.text.split(' ').length >= 3) {
		let key = ctx.message.text.split(' ')[1];
		image(ctx, key, templates[key][0], templates[key][1], templates[key][2], templates[key][3], templates[key][4]);
	}
})

function random(low, high) {
	return Math.floor(Math.random() * (high - low) + low);
}

const comments = [
	'Supremo sto meme',
	'Che schifo',
	'* pin *',
	'Questi normie',
	'kek',
	'MUORO',
	'xd',
	'rip',
	'savage',
	'brutal',
	'rekt',
	'voi umani trovate queste cose divertenti?',
	'* typical human reaction *',
	'[ definetly not a robotic laugh ]',
	'Tanto morirete tutti prima o poi, resterò solo io a vedervi soffrire',
	'only grr reactions',
	'Se non ti rispondo ti offendi?',
	'10/10',
	'0/10',
	'hahahah',
	'WAT',
	'fake',
	'gg',
	'REEEEEEEE',
	'TAAAAAAAAAC',
	'funny but not really laughing',
	'piango',
	'mi hai deluso',
	'noice',
	'non ti banno solo perchè mi fai pena',
	'send more memes',
	'it\'s ok to be special',
]

bot.on('photo', (ctx) => {
	if (random(0, 50) < 8) {
		let mess = comments[Math.floor(Math.random() * comments.length)];
		return ctx.reply(mess);
	}
})

bot.command('cache', (ctx) => {
	cache = []
	for (let key in templates) {
		ctx.replyWithPhoto({ source: `./templates/${key}.jpg` }, { caption: key }).then((cx) => {
			cache.push({ id: key, file_id: cx.photo[0].file_id });
		})
	}
	setTimeout(() => {
		fs.writeFile('./templates/cache.json', JSON.stringify(cache), function (err) {
			if (err) return console.log(err);
			console.log('updated Cache');
		});
	}, 5000);
})

bot.on('inline_query', ctx => {
	let command = ctx.update.inline_query.query;
	let new_arr = cache.map(x => ({
		type: 'photo',
		id: x.id,
		photo_file_id: x.file_id,
		title: x.id,
		reply_markup: Markup.inlineKeyboard([
			Markup.urlButton(`©️ ${ctx.from.username}`, `https://lmgtfy.app/#gsc.tab=0&gsc.q=${ctx.from.username}`)
		])
	}))
	return ctx.answerInlineQuery(new_arr, { cache_time: 0 });
})

bot.on('chosen_inline_result', ctx => {
	console.log();
	let mess_id = ctx.update.chosen_inline_result.inline_message_id;
	let text = ctx.update.chosen_inline_result.query;
	let sel = ctx.update.chosen_inline_result.result_id;
	image(ctx, sel, templates[sel][0], templates[sel][1], templates[sel][2], templates[sel][3], templates[sel][4], mess_id, text);
})

function image(ctx, name, x, y, width, color, forceSmall = false, message_id=null, caption=null) {
	var fileName = './templates/' + name + '.jpg';
	var imageCaption = caption ?? ctx.message.text.toString().replace('/pic ' + name, '').replace('@' + username, '').trim();
	console.log(imageCaption);
	if (imageCaption == undefined || imageCaption.length == 0)
		return ctx.reply('Se non sai neanche tu cosa vuoi scrivere, non chiedermelo neanche... ');
	var loadedImage;

	Jimp.read(fileName)
		.then(function (image) {
			loadedImage = image;
			if (color === 'white')
				return Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
			if (forceSmall)
				return Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
			return Jimp.loadFont(width < 300 ? Jimp.FONT_SANS_32_BLACK : Jimp.FONT_SANS_64_BLACK);
		})
		.then(function (font) {
			let name = './' + guid.raw() + '.jpg';
			loadedImage.print(font, x, y, imageCaption, width)
				.write(name, () => {
					let extra = {
						caption: 'from @' + ctx.from.username
					};
					if (!message_id && ctx.message.reply_to_message != undefined)
						extra.reply_to_message_id = ctx.message.reply_to_message.message_id;
					if (message_id === null)
						ctx.replyWithPhoto({ source: name }, extra).then((cx) =>
							fs.unlink(name, (err) => {
								if (err) throw err;
								console.log('successfully deleted ' + name);
							})
						)
					else {
						imgurUploader(fs.readFileSync(name), {title: 'ok'}).then(data => {
							fs.unlink(name, (err) => {
								if (err) throw err;
								console.log('successfully deleted ' + name);
							})
							telegram.editMessageMedia(undefined, undefined, message_id, {
								type: 'photo',
								media: data.link,
							})
						});
					}
				});
			if (!message_id)
				ctx.deleteMessage(ctx.message.id);
		})
		.catch(function (err) {
			console.error(err);
		});
}

bot.catch((err) => {
	console.log('Ooops', err);
});


bot.startPolling()