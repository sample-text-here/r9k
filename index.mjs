import dotenv from "dotenv";
dotenv.config();

import Discord from "discord.js";
import fs from "fs";
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

// init message db
const messageDb = "messages.txt";
if(!fs.existsSync(messageDb)) fs.writeFileSync(messageDb, "");
const stream = fs.createWriteStream(messageDb, { flags: "a" });
const messages = new Set(fs.readFileSync(messageDb, "utf8").split("\x00"));

// init "welcome" message
const welcomeDb = "welcomes.txt";
if(!fs.existsSync(welcomeDb)) fs.writeFileSync(welcomeDb, "");
const welcomes = new Set(fs.readFileSync(welcomeDb, "utf8").split("\x00"));
const welcomeMsg = "do not send the same message twice. and **read the pins**.";

// init mutes
const muteDb = "mutes.txt";
const mutes = new Map();
const muted = "894095301042901063";

// init reply => reaction
const reactions = new Map();
reactions.set("¯\\_(ツ)_/¯", "🤷");
reactions.set("oh no", "894300904235352124");
reactions.set("ohno", "894300904235352124");
reactions.set("good", "✅");
reactions.set("yes", "✅");
reactions.set("bad", "❌");
reactions.set("no", "❌");
reactions.set("ok", "👌");
reactions.set("k", "👌");
reactions.set("what", "❓");
reactions.set("amazing", "✨");
reactions.set("ugh", "😩");
reactions.set("oh", "😕");
reactions.set("hm", "🤔");
reactions.set("hmm", "🤔");
reactions.set("hmmm", "🤔");
reactions.set("hmmmm", "🤔");
reactions.set("h", "894343553516441660");

client.on("ready", () => {
	client.user.setStatus("invisible");
	console.log("ready!");
});

client.on("messageCreate", async (msg) => {
	// ignore system messages
	if(msg.system) return;

	// require all messages to have content
	// (too lazy to hash images)
	if(!msg.content) {
		await msg.delete();
		return;
	}

	// convert messages into emoji
	for(let [trigger, emoji] of reactions) {
		if(msg.content !== trigger) continue;
		let ref = msg.reference ?
			(await msg.fetchReference()) : 
			(await getBefore(msg));
		ref.react(emoji);
		msg.delete();
		return;
	}

	// the core code
	const content = msg.content?.trim().toLowerCase().replace(/[^a-z ]/g, "");
	if(messages.has(content)) {
		msg.delete();
		
		const { id } = msg.author;
		const length = mutes.has(id) ? mutes.get(id).length * 2 : 2000;
		const timeout = setTimeout(() => {
			msg.member.roles.remove(muted);
			updateMutes();
		}, length);

		if(!mutes.has(id)) updateMutes();
		msg.member.roles.add(muted);
		mutes.set(id, { length, timeout });

		if(!welcomes.has(msg.author.id)) {
			const chan = await msg.author.createDM();
			await chan?.send(welcomeMsg);
			welcomes.add(msg.author.id);
			updateWelcomes();
		}

		return;
	}

	stream.write(content + "\x00");
	messages.add(content);
});

setInterval(() => {
	for(let [, mute] in mutes) {
		if(mute > 2000) mute.length /= 2;
	}
}, 1000 * 60 * 30);

function updateMutes() {
	fs.writeFileSync(muteDb, [...mutes.keys()].join(","));
}

function updateWelcomes() {
	fs.writeFileSync(welcomeDb, [...welcomes].join("\x00"));
}

async function getBefore(msg) {
	const fetched = await msg.channel.messages.fetch({
		limit: 1,
		before: msg.id,
	});
	return fetched.first();
}

client.login(process.env.TOKEN);

