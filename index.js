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
.matches('SetupMeeting', function (session, args) {

		// インテントが 'intentA' だったときの処理をここに記述します。

		// EntityRecognizerを使うと、指定したエンティティの内容を抽出できます。
		var meeting = builder.EntityRecognizer.findEntity(args.entities, '会議');

		// 「場所」エンティティが認識できた場合の処理
		if (meeting) 
		{
			session => {session.beginDialog("/ask");}.
			(session,result) => {
				if( results.response.entity ==='YES'){
				session.send("打ち合わせ調整しますか?%s.", session.message.text);
				}
				else{
				session.send("打ち合わせを調整しない?%s.", session.message.text);
				}
			}



		//session.send("打ち合わせ調整しますか?%s.", session.message.text);
		//session.send("あなたが天気を知りたい場所は、" + area + "ですね！"); // この場合、「東京」が出力されます。
		}

		})

// askダイアログ
bot.dialog('/ask', [
		session => {
		builder.Prompts.choice(session, "こんにちは！何が知りたいですか?", "YES|NO");
		},
		(session, results) => {
		// askダイアログを閉じ、ルートダイアログにユーザーからの返答データを渡します。
		session.endDialogWithResult(results);
		}
]);
