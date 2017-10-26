'use strict';

const restify = require('restify');
const builder = require('botbuilder');

const port = process.env.port || process.env.PORT || 3978;
const server = restify.createServer();
server.listen(port);

const connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());
//bot.dialog('/', [(session) => {
//	session.send('I said: %s.', session.message.text);
//}]);

//=========================================================
// IntentDialogオブジェクトの用意
//=========================================================

// 認識に指定するLUIS APIのURLを指定
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/8baa6be4-7058-4a67-987e-ba9fa4f49b85?subscription-key=d9b1431a2da143d7948d551952a757ef&verbose=true&timezoneOffset=0&q=');

// IntentDialogオブジェクトを作成
var intents = new builder.IntentDialog({
  recognizers: [recognizer]
});

//=========================================================
// 会話の処理
//=========================================================

// 初期ダイアログを、intentDialogとして使用する
bot.dialog('/', intents);

// インテントと処理の結びつけ
intents
.matches("会議", function (session, args) {

		// インテントが 'intentA' だったときの処理をここに記述します。
				session.send("会議しますか?%s.", session.message.text);

		})
.matches('会議', function (session, args) {

		// インテントが 'intentB' だったときの処理をここに記述します。
				session.send("会議する?%s.", session.message.text);

		})






