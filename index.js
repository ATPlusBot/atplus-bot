'use strict';

require('dotenv').config();
const localPort = 3978;

const restify = require('restify');
const builder = require('botbuilder');
const botauth = require('botauth');
const OutlookStrategy = require('passport-outlook').Strategy;

const port = process.env.port || process.env.PORT || localPort;

const server = restify.createServer();

server.listen(port);

/*
const connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});
*/

const connector = new builder.ChatConnector({
	appId: null,
	appPassword: null
});

server.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector);

const botAuthenticator = new botauth.BotAuthenticator(server, bot, {
	secret: process.env.MICROSOFT_APP_PASSWORD,
	baseUrl: `https://localhost:${localPort}`
});

botAuthenticator.provider('outlook', (options) => {
	return new OutlookStrategy(
		{
			clientID: process.env.MICROSOFT_APP_ID,
			clientSecret: process.env.MICROSOFT_APP_PASSWORD,
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
	botAuthenticator.authenticate('outlook'),
	(session, results) => {
		let user = auth.profile(session, 'outlook');
		session.endDialog(`Welcome ${user.displayName}`);
	}
));

/*
bot.dialog('/', [
	(session) => {
		session.send('You said: %s', session.message.text);
	}
]);
*/

