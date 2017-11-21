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

//=========================================================
// IntentDialogオブジェクトの用意
//=========================================================

// 認識に指定するLUIS APIのURLを指定
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/8baa6be4-7058-4a67-987e-ba9fa4f49b85?subscription-key=d9b1431a2da143d7948d551952a757ef&verbose=true&timezoneOffset=0&q=');

bot.recognizer(recognizer);

//状態
var meetingSts;



// Main menu
var menuItems = { 
	"はい": {
item: "yes"
	},
	"いいえ": {
item: "no"
	},
}
bot.dialog('SetupMeeting', [
		function (session, args, next) {

		var meeting = builder.EntityRecognizer.findEntity(args.intent.entities, '会議');
		session.send("intent = SetupMeeting." );

		var data2 = JSON.stringify(args);
		session.send("data = %s.", data2);
		//var data2 = JSON.stringify(meeting);
		//session.send("data = %s.", data2);
		// 「場所」エンティティが認識できた場合の処理
		if (meeting) 
		{
		builder.Prompts.confirm(session, "打ち合わせ調整しますか?(yes or no)");
		//builder.Prompts.choice(session, "打ち合わせ調整しますか?", menuItems);
		// city entity detected, continue to next step
		meetingSts = 'meeting';
		//next({ response: meeting.entity });
		}
		else {
		session.send("error.");
		}
		},
		function (session, results) {
			var data2 = JSON.stringify(results);
			session.send("results= %s.", data2);

			if ( results.response == true ){
				session.send("調整しましょう!!!%d", results.response.index);
				session.send("場所はどこにしますか？%d", results.response.index);
			} else {
				session.send("やめておきましょう!!!%d", results.response.index);
			}
/*			//choiceを使用した場合
			if ( results.response.index == 0 ){
				session.send("調整しましょう!!!%d", results.response.index);
				session.send("場所はどこにしますか？%d", results.response.index);
			} else {
				session.send("やめておきましょう!!!%d", results.response.index);
			}
*/
			// End
			session.endDialog();
		}
]) .triggerAction({
matches: 'SetupMeeting',
////onInterrupted: function (session) {
////session.send('Please provide a destination');
////}
//confirmPrompt: "This will cancel your request. Are you sure?"
});

bot.dialog('MeetingSpace', [
		function (session, args, next) {

		var place = builder.EntityRecognizer.findEntity(args.intent.entities, '場所');
		session.send("intent = MeetingSpace." );

		// 「場所」エンティティが認識できた場合の処理
		if (place) 
		{
		session.send("場所は %s ですね？.",place.entity);
		builder.Prompts.choice(session, "Select Menu:", menuItems);
		// city entity detected, continue to next step
		session.dialogData.searchType = 'space';
		//next({ response: meeting.entity });
		}
		},
		function (session, results) {
			if ( results.response.index == 0 ){
				session.send("人数は?%d", results.response.index);
			} else {
				session.send("調整をおわります!!!%d", results.response.index);
			}
			// End
			session.endDialog();
		}
]) .triggerAction({
matches: 'MeetingSpace',
});

// IntentDialogオブジェクトを作成
//var intents = new builder.IntentDialog({
//recognizers: [recognizer]
//});

// 会話の処理
//=========================================================

//初期ダイアログを、intentDialogとして使用する
//bot.dialog('/', intents);
//
//// インテントと処理の結びつけ
//intents
//.matches('SetupMeeting', function (session, args) {
//
//		// インテントが 'intentA' だったときの処理をここに記述します。
//
//		// EntityRecognizerを使うと、指定したエンティティの内容を抽出できます。
//		var meeting = builder.EntityRecognizer.findEntity(args.entities, '会議');
//
//		var data = JSON.stringify(meeting);
//		session.send("data = %s.", data);
//		// 「場所」エンティティが認識できた場合の処理
//		if (meeting) 
//		{
//		session.send("打ち合わせ調整しますか?%s.", session.message.text);
//		}
//
//})
//
