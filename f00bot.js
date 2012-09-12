var file = require('fs');
var path = require('path');
var util = require("util");
var http = require("http");

var Sandbox = require("./lib/sandbox");
var FactoidServer = require("./lib/factoidserv");
var FeelingLucky = require("./lib/feelinglucky");
var HTTP = require("http");
var Bot = require("./lib/irc");
var Shared = require("./shared");


var JSBot = function(profile) {
	this.sandbox = new Sandbox(path.join(__dirname, "f00bot-utils.js"));
	this.factoids = new FactoidServer(path.join(__dirname, "f00bot-factoids.json"));

	Bot.call(this, profile);
	this.set_log_level(this.LOG_ALL);
	this.set_trigger("!");
};


util.inherits(JSBot, Bot);


JSBot.prototype.init = function() {

	Bot.prototype.init.call(this);

	this.register_listener(/^((?:sm?|v8?|js?|>>?)>)([^>].*)+/, Shared.execute_js);


	this.register_command("g", Shared.google, {
		help: "Run this command with a search query to return the first Google result. Usage: !g kitten images"});

	this.register_command("google", this.google, {
		help: "Returns a link to a Google search page of the search term. Usage: !google opencourseware computational complexity"});

	this.register_command("mdn", this.mdn, {
		help: "Search the Mozilla Developer Network. Usage: !mdn bitwise operators"});
	this.register_command("mdc", "mdn");

	this.register_command("find", Shared.find);

	this.register_command("list", Shared.list);

	this.register_command("help", this.help);

	this.register_command("tldr", Shared.learn, {
		allow_intentions: false,
		help: "Add factoid to bot. Usage: !tldr ( [alias] foo = bar | foo =~ s/expression/replace/gi )"});

	this.register_command("img", Shared.learn, {
		allow_intentions: false,
		help: "Saves a link to a gif for later reuse:  !img deadhorse"
	});

	this.register_command("gtfo", Shared.forget, {
		allow_intentions: false,
		help: "Remove factoid from bot. Usage: !gtfo foo"});

	this.register_command("commands", Shared.commands);

	this.on('command_not_found', this.command_not_found);

};



JSBot.prototype.google = function(context, text) {

	if (!text) {
		context.channel.send_reply (context.sender, this.get_command_help("google"));
		return;
	}

	context.channel.send_reply (context.intent, "Google search: \""+text+"\" <http://www.google.com/search?q="+encodeURIComponent(text)+">");
};



JSBot.prototype.help = function(context, text) {

	try {
		if (!text) {
			return this.command_not_found (context, "help");
		}

		context.channel.send_reply(context.intent, this.get_command_help(text));
	} catch(e) {
		context.channel.send_reply(context.sender, e);
	}
};


JSBot.prototype.mdn = function(context, text, command) {
	if (!text) {
		return Shared.find.call (this, context, command);
	}

	Shared.google (context, "site:developer.mozilla.org "+text);
};


JSBot.prototype.command_not_found = function(context, text) {

	if (context.priv) {
		return Shared.find.call (this, context, text);
	}

	try {
		context.channel.send_reply(context.intent, this.factoids.find(text, true));
	} catch(e) {
		// Factoid not found, do nothing.
	}
};


var profile = [{
	host: "chat.ff0000.com",
	port: 6667,
	nick: "f00bot",
	user: "f00bot",
	real: "f00bot",
	channels: ["#ff0001"]
}];


(new JSBot(profile)).init();
