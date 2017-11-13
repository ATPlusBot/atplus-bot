'use strict';

const localPort = 3978;
const botURL = 'https://atplus-bot.azurewebsites.net';
const OUTLOOK_CLIENT_ID = process.env.MICROSOFT_APP_ID;
const OUTLOOK_CLIENT_SECRET = process.env.MICROSOFT_APP_PASSWORD;

const restify = require('restify');
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
	baseUrl: botURL
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


bot.dialog('/', [].concat(
	(session, args, next) => {
		session.send('Hello!');
		next({});
	},
	botAuthenticator.authenticate('outlook'),
	(session, results) => {
		let user = botAuthenticator.profile(session, 'outlook');
		session.send(`Welcome ${user.displayName}`);
		session.send(`User: ${JSON.stringify(user)}`);
		session.endDialog('session end.');
	}
));

server.listen(port);

