var file = require('fs');
var path = require('path');
var util = require("util");
var http = require("http");

var JSONdb = require("./lib/db");
var Bot = require("./lib/irc");

var f00bert = function(profile) {
	this.db = new JSONdb();
	this.db.init(path.join(__dirname, "f00bot-db.json"));
	Bot.call(this, profile);
	this.set_log_level(this.LOG_ALL);
	this.set_trigger("!");
};


util.inherits(f00bert, Bot);

f00bert.prototype.init = function() {

	Bot.prototype.init.call(this);

	var urls = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
	this.register_listener( urls, this.grab_url );

	this.register_command('tldr', this.tldr);

};

f00bert.prototype.gifmanager = function(context, text){

};

f00bert.prototype.grab_url = function(context, text){
	//#####################
	// save this link to the json db
	//#####################
	if (!this.db.collection.urls) {
		this.db.collection.urls = [];
	}

	if (this.db.collection.dupes.indexOf(text) !== -1) {
		return;
	} else {
		var death = Math.floor(new Date().getTime()/1000);
		this.db.collection.urls.push({user: context.sender.name, url: text, death: (death + 2000)});
		this.db.collection.dupes.push(text);
		this.db.activity();
	}
		
};

f00bert.prototype.tldr = function(context, text){
	var links = [], limit = 10, last;
	var stamp = Math.floor(new Date().getTime()/1000);

	for (var i = 0; i < this.db.collection.urls.length; i++) {
		if (stamp > this.db.collection.urls[i].death) {
			this.db.collection.urls.remove(i);
			this.db.collection.dupes.remove(i);
		} else {
			console.log('item still fresh', stamp, this.db.collection.urls[i]);
		}

		if (this.db.collection.urls[i].url && this.db.collection.urls[i].url !== last) {
			links.push(this.db.collection.urls[i].user + ' linked to: ' + this.db.collection.urls[i].url + ' \n');
			last = this.db.collection.urls[i].url;
		} else {
			break;
		}
	}

	var reply = '';
	for (i = 0; i < links.length; i++) {
		reply += links[i];
	}
	context.channel.echo(reply);
};




var profile = [{
	host: "downtown.tx.us.synirc.net",
	port: 6667,
	nick: "f00bot",
	user: "f00bot",
	real: "f00bot",
	channels: ["#f00"]
}];


(new f00bert(profile)).init();


if (!Array.prototype.indexOf) {

	Array.prototype.indexOf = function(searchElement /*, fromIndex */) {

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0)
      return -1;

    var n = 0;
    if (arguments.length > 0) {
      n = Number(arguments[1]);
      if (n !== n)
        n = 0;
      else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }

    if (n >= len)
      return -1;

	var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);

	for (; k < len; k++) {
		if (k in t && t[k] === searchElement)
			return k;
		}
		return -1;
	};

}

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};