'use strict';

const server = require('../server.js');

server.addTemplate('linecount', 'linecount.html');

async function linecountResolver(req, res) {
	let room = req.originalUrl.split('/')[1];
	let query = server.parseURL(req.url);
	let token = query.token;
    let user = query.user;
	if (token) {
		let data = server.getAccessToken(token);
		if (!data || data.room !== room) return res.end('Invalid access token.');
        if (!user) return res.end('No user specified.');

        let linecount = await ChatLogger.getLineCount(room, toId(user));
        let total = Object.values(linecount).reduce((a, b) => a + b, 0);
		return res.end(server.renderTemplate('linecount', {room: room, user: user, total: total, data: linecount}));
	}
	return res.end('Please attach an access token. (You should get one when you type .linecount <room>, <user>)');
}

let rooms;

module.exports = {
    async init() {
	    rooms = await ChatLogger.getRooms();

		for (let i = 0; i < rooms.length; i++) {
			server.addRoute(`/${rooms[i]}/linecount`, linecountResolver);
		}
    },
	commands: {
		linecount: {
			async action(message) {
				let room = this.room;
                let user;
                if (!room) {
                    let split = message.split(',');
                    [room, user] = split.map(param => param.trim());
                    if (!(room && user)) return this.pmreply("Syntax: ``.linecount room, user``");
					if (!this.getRoomAuth(room)) return;
				} else {
                    user = message;
                    if (!(user)) return this.pmreply("Syntax: ``.linecount user``");
                }

				if (!(this.canUse(4))) return this.pmreply("Permission denied.");

                let fname = `${room}/linecount`;

                let data = {};
                data.room = room;
                let token = server.createAccessToken(data, 15);
                fname += `?token=${token}&user=${user}`;

                if (!rooms.includes(room)) {
                    let currentRooms = await ChatLogger.getRooms();

                    if (!currentRooms.includes(room)) return this.reply("Room not found in chat logs");

                    for (let i = 0; i < currentRooms.length; i++) {
                        if (!rooms.includes(currentRooms[i])) server.addRoute(`/${currentRooms[i]}/linecount`, linecountResolver);
                    }

                    rooms = currentRooms;
                }

                return this.reply(`Linecounts for ${user} in ${room}: ${server.url}${fname}`);
			},
		},
        topusers: {
            async action(message) {
                let room = this.room;
                let day = false;
                if (!room) {
                    if (message.includes(',')) {
                        [message, day] = message.split(',');
                        if (toId(day) !== 'day' && toId(day) !== 'today') day = false;
                    }
                    room = toId(message);
                    if (!room) return this.pmreply("Syntax: ``.topusers room``");
					if (!this.getRoomAuth(room)) return;
				} else {
                    if (toId(message) === 'day' || toId(message) === 'today') day = true;
                }

				if (!(this.canUse(4))) return this.pmreply("Permission denied.");

                let linecount = await ChatLogger.getUserActivity(room, day);

                if (!linecount.length) return this.reply("This room has no activity.");

                return this.reply(`Top 5 most active chatters in ${room}${day ? ' today' : ''}: ${linecount.slice(0, 5).map(val => `${val[0]} (${val[1]})`).join(', ')}`);
            }
        },
	},
    analyzer: {
        async display(room) {
			let linecount = await ChatLogger.getRoomActivity(room);
			output = `<h3>Average lines of chat per hour of the day (Times are GMT):</h3><ul>`;
            output += linecount.map(val => `<li><b>${val[0]}:00</b>: ${Math.ceil(val[1] / 30)}</li>`).join('');
            output += `</ul>`;
            output += `<h3>Total number of unique users in the past 30 days: <u>${await ChatLogger.getUniqueUsers(room)}</u></h3>`;

            return output;
		},
    }
};
