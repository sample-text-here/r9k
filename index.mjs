import Discord from "discord.js";
import fs from "fs";
const db = "messages.txt";
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

// init message db
if(!fs.existsSync(db)) fs.writeFileSync(db, "");
const stream = fs.createWriteStream(db, { flags: "a" });
const messages = fs.readFileSync(db, "utf8").split("\x00");

// init mutes
const mutefile = "mutes.txt";
const mutes = new Map();
const muted = "894095301042901063";

client.on("messageCreate", (msg) => {
	if(msg.channel.id !== "887111296665931820") return;
	if(!msg.content) return;
	if(messages.includes(msg.content)) {
		const { id } = msg.author;
		const length = mutes.has(id) ? mutes.get(id).length * 4 : 2000;
		const timeout = setTimeout(() => {
			msg.member.roles.remove(muted);
			updateMutes();
		}, length);

		if(!mutes.has(id)) updateMutes();
		msg.member.roles.add(muted);
		mutes.set(id, { length, timeout });
		return;
	}

	stream.write(msg.content + "\x00");
	messages.push(msg.content);
});

setInterval(() => {
	for(let [, mute] in mutes) mute.length /= 2;
}, 1000 * 60 * 15);

function updateMutes() {
	fs.writeFileSync(mutefile, [...mutes.keys()].join(","));
}

client.login("ODk0MDkyODQ2MzI2NTAxMzg2.YVk-2g.uejPZSvgQr7mHirdtHOueg9KP6E");

