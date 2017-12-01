'use strict';

const localPort = 3978;
const botURL = 'https://atplus-bot.azurewebsites.net';
const OUTLOOK_CLIENT_ID = process.env.MICROSOFT_APP_ID;
const OUTLOOK_CLIENT_SECRET = process.env.MICROSOFT_APP_PASSWORD;

const url = require('url');
const restify = require('restify');
const clients = require('restify-clients');
const builder = require('botbuilder');
const botauth = require('botauth');
const OutlookStrategy = require('passport-outlook').Strategy;

const port = process.env.port || process.env.PORT || localPort;

const server = restify.createServer();
server.use(restify.plugins.queryParser({mapParams: false}));

const connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector);

const botAuthenticator = new botauth.BotAuthenticator(server, bot, {
	secret: 'something secret',
	baseUrl: botURL,
	scope: [
		'openid',
		'profile',
		'offline_access',
		'https://outlook.office.com/Mail.Read',
		'https://outlook.office.com/calendars.readwrite',
		'https://outlook.office.com/calendars.read.shared'
	]
});

botAuthenticator.provider('outlook', (options) => {
	return new OutlookStrategy(
		{
			clientID: OUTLOOK_CLIENT_ID,
			clientSecret: OUTLOOK_CLIENT_SECRET,
			callbackURL: options.callbackURL
		},
		(accessToken, refreshToken, profile, done) => {
			profile.acessToken = accessToken;
			profile.refreshToken = refreshToken;
			return done(null, profile);
		}
	);
});

server.listen(port);

//認証権限
let user;

//=========================================================
// IntentDialogオブジェクトの用意
//=========================================================

// 認識に指定するLUIS APIのURLを指定
var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/8baa6be4-7058-4a67-987e-ba9fa4f49b85?subscription-key=d9b1431a2da143d7948d551952a757ef&verbose=true&timezoneOffset=0&q=');

bot.recognizer(recognizer);

// Main menu
var menuItems = { 
	"はい": {
item: "yes"
	},
	"いいえ": {
item: "no"
	},
}
bot.dialog('SetupMeeting', [].concat(
	function (session, args, next) {

		var meeting = builder.EntityRecognizer.findEntity(args.intent.entities, '会議');
		session.send("intent = SetupMeeting." );

		var data2 = JSON.stringify(args);
		session.send("data = %s.", data2);
		// 「場所」エンティティが認識できた場合の処理
		if (meeting) {
			builder.Prompts.confirm(session, "打ち合わせ調整しますか?(yes or no)");
		}
		else {
			session.send("error.");
		}
	},
	function (session, results,next) {
		var data2 = JSON.stringify(results);
		session.send("results= %s.", data2);

		if ( results.response == true ){
			session.send("まずは認証をお願いします!!");
			next({});
		} else {
			session.send("やめておきましょう!!!");
		}
	},
	botAuthenticator.authenticate('outlook'),
	(session) => {
		user = botAuthenticator.profile(session, 'outlook');
		session.send(`Welcome ${user.displayName}`);

		session.send("場所はどこにしますか？");
		session.endDialog();
	}
)).triggerAction({
matches: 'SetupMeeting',
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
				builder.Prompts.number(session, "人数は?");
			} else {
				session.send("調整をおわります!!!%d", results.response.index);
			}
		},
		function (session, results) {
			var data2 = JSON.stringify(results);
			session.send("data = %s.", data2);
			if ( results.response != 0 ){
				session.send("%d人ですね。", results.response);
				builder.Prompts.text(session, "どなたが参加しますか?");
			} else {
				session.send("調整をおわります!!!%d", results.response);
			}
		},
		function (session, results) {
			session.send("参加者は、 %s. ですね.予定を確認します。", results.response);

			//予定確認処理
			let u = url.parse('https://outlook.office.com/api/v2.0/me/findmeetingtimes');
			let client = clients.createJsonClient({
				url: url.resolve(u, '/'),
				headers: {
					Authorization: `Bearer ${user.acessToken}`, //actual spelling
					Prefer: `outlook.timezone="Tokyo Standard Time"`
				}
			});
			client.post(u.path,{
				"Attendees": [ 
				{ 
				"Type": "Required",  
				"EmailAddress": { 
				"Name": "fxat IMAI TOMOYA",
				"Address": "tomoya.imai@fxat.co.jp" 
				} 
				} 
				],
				"TimeConstraint": { 
				"ActivityDomain":"Unrestricted",
				"Timeslots": [ 
				{ 
					"Start": { 
						"DateTime": "2017-10-30T09:00:00",  
						"TimeZone": "Tokyo Standard Time" 
					},  
					"End": { 
						"DateTime": "2017-10-30T17:00:00",  
						"TimeZone": "Tokyo Standard Time" 
					} 
				} 
				] 
				},  
				"MeetingDuration": "PT1H" 
			}, (err, req, res, obj) => {
				if(err) {
					session.send(`error: ${err}`);
				} else {
					console.log(`results: ${JSON.stringify(res.headers)}`);
					console.log(`results: ${JSON.stringify(res.statusCode)}`);
					console.log(`results: ${JSON.stringify(obj)}`);
					session.send(`last mail: ${JSON.stringify(obj.MeetingTimeSuggestions)}`);
				}
			});

/*			//メール送信(今井君に依頼メールが毎回飛ぶためコメントアウト)
			let u2 = url.parse('https://outlook.office.com/api/v2.0/me/events');
			let client2 = clients.createJsonClient({
				url: url.resolve(u2, '/'),
				headers: {
					Authorization: `Bearer ${user.acessToken}` //actual spelling
				}
			});
			client2.post(u2.path,{
				"Subject": "REST API events 01",
				"Body": {
					"ContentType": "HTML",
					"Content": "I think it will meet our requirements!"
				},
				"Start": {
					"DateTime": "2017-12-3T10:00:00",
					"TimeZone": "Tokyo Standard Time"
				},
				"End": {
					"DateTime": "2017-12-3T11:00:00",
					"TimeZone": "Tokyo Standard Time"
				},
				"Attendees": [
					{
						"EmailAddress": {
						"Address": "tomoya.imai@fxat.co.jp", 
						"Name": "fxat IMAI TOMOYA"
					},
						"Type": "Required"
					}
				]
			}, (err, req, res, obj) => {
				if(err) {
					session.send(`error: ${err}`);
				} else {
					console.log(`results: ${JSON.stringify(res.headers)}`);
					console.log(`results: ${JSON.stringify(res.statusCode)}`);
					console.log(`results: ${JSON.stringify(obj)}`);
					session.send("送信しました.");
				}
			});
*/
			// End
			session.endDialog();
		}
]) .triggerAction({
matches: 'MeetingSpace',
});

