const { Telegraf } = require('telegraf')
const config = require('./config')
const templates = require('./templates')
const { Telegram, Markup, Router, Extra } = require('telegraf')
const Jimp = require('jimp')
const guid = require('guid')
const fs = require('fs')

const bot = new Telegraf(config.telegraf_token);

var telegram = new Telegram(config.telegraf_token, null)
var username = "";
bot.telegram.getMe().then((bot_informations) => {
    bot.options.username = bot_informations.username;
    username = bot_informations.username;
    console.log("Server has initialized bot nickname. Nick: " + bot_informations.username);
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


bot.on('inline_query', ctx => {
    let command = ctx.update.inline_query.query;
    let new_arr = [{
        type: 'photo',
        photo_url: './ago.jpg',
        photo_url: './ago.jpg'
    }];
    return ctx.answerInlineQuery(new_arr, { cache_time: 0 });
})

function image(ctx, name, x, y, width, color, forceSmall = false) {
    var fileName = './templates/' + name + '.jpg';
    var imageCaption = ctx.message.text.toString().replace('/pic ' + name, '').replace('@' + username, '').trim();
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
                .write(name, () =>{
                    let extra = {
                        caption: 'from @' + ctx.from.username
                    };
                    if (ctx.message.reply_to_message != undefined)
                        extra.reply_to_message_id = ctx.message.reply_to_message.message_id;
                    ctx.replyWithPhoto({ source: name },extra).then((cx) => 
                            fs.unlink(name, (err) => {
                                if (err) throw err;
                                console.log('successfully deleted ' + name);
                            })
                        )});
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