'use strict';

const fs = require('fs');

const server = require('../server.js');
const databases = require('../databases.js');

const WIFI_ROOM = 'wifi';
const BREEDING_ROOM = 'breeding';
const special = {KIDA: server.url, WIFIFORUM: "http://showdownwifi.freeforums.org/", BREEDINGSITE: "http://psbreeding.weebly.com/"};

let faqdata;

function loadFaqs() {
	let data;
	try {
		data = require('../data/faqs.json');
	} catch (e) {}

	if (typeof data !== 'object' || Array.isArray(data)) data = {};

	return data;
}

function writeFaqs() {
	let toWrite = JSON.stringify(faqdata);
	fs.writeFileSync('./data/faqs.json', toWrite);
}

databases.addDatabase('faqs', loadFaqs, writeFaqs);
faqdata = databases.getDatabase('faqs');

module.exports = {
	commands: {
		faq(message) {
			if (!this.canUse(1)) return this.pmreply("Permission denied.");
			if (!this.room) this.room = WIFI_ROOM;
			let faqList = {};
			if (this.room === WIFI_ROOM) {
				faqList = faqdata.wifi;
			} else if (this.room === BREEDING_ROOM) {
				faqList = faqdata.breeding;
			} else {
				return this.pmreply("This command can only be used in the wifi or breeding room.");
			}

			if (!message) return this.reply("Usage: ``.faq <topic>``. For a list of topics, use ``.faq help``.");
			message = toId(message);
			if (!(message in faqList)) return this.pmreply("Invalid option for topic.");

			return this.reply(faqList[message]);
		},
		addfaq(message) {
			let split = message.split(',').map(param => param.trim());
			if (!this.room) {
				if (split.length < 3) return this.pmreply("Invalid amount of arguments.");
				this.room = toId(split.splice(0, 1)[0]);
				if (this.room !== WIFI_ROOM && this.room !== BREEDING_ROOM) return this.pmreply("This command can only be used in the wifi or breeding room.");
				if (!this.getRoomAuth(this.room)) return;
			}
			if (!this.canUse(5)) return this.pmreply("Permission denied.");
			let faqList = {};
			if (this.room === WIFI_ROOM) {
				faqList = faqdata.wifi;
			} else if (this.room === BREEDING_ROOM) {
				faqList = faqdata.breeding;
			} else {
				return this.pmreply("This command can only be used in the wifi or breeding room.");
			}

			if (split.length < 2) return this.pmreply("Invalid amount of arguments.");
			let faqMessage = split[1];
			for (let i in special) {
				faqMessage.replace('{' + i + '}', special[i]);
			}
			faqList[toId(split[0])] = faqMessage;
			databases.writeDatabase('faqs');
			return this.reply("Faq topic " + split[0] + " added.");
		},
		removefaq(message) {
			let split = message.split(',').map(param => param.trim());
			if (!this.room) {
				if (split.length < 2) return this.pmreply("Invalid amount of arguments.");
				this.room = toId(split.splice(0, 1)[0]);
				if (this.room !== WIFI_ROOM && this.room !== BREEDING_ROOM) return this.pmreply("This command can only be used in the wifi or breeding room.");
				if (!this.getRoomAuth(this.room)) return;
			}
			if (!this.canUse(5)) return this.pmreply("Permission denied.");
			let faqList = {};
			if (this.room === WIFI_ROOM) {
				faqList = faqdata.wifi;
			} else if (this.room === BREEDING_ROOM) {
				faqList = faqdata.breeding;
			} else {
				return this.pmreply("This command can only be used in the wifi or breeding room.");
			}

			split[0] = toId(split[0]);
			if (!(split[0] in faqList)) return this.pmreply("Invalid option for topic.");
			delete faqList[split[0]];
			databases.writeDatabase('faqs');
			return this.reply("Faq topic " + split[0] + " deleted.");
		},
	},
};