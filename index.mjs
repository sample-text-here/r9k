import dotenv from "dotenv";
dotenv.config();

import Discord from "discord.js";
import fs from "fs";
const db = "messages.txt";
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

// init message db
if(!fs.existsSync(db)) fs.writeFileSync(db, "");
const stream = fs.createWriteStream(db, { flags: "a" });
const messages = new Set(fs.readFileSync(db, "utf8").split("\x00"));

// init mutes
const mutefile = "mutes.txt";
const mutes = new Map();
const muted = "894095301042901063";

// init reply to reaction
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
	if(!msg.content) {
		if(msg.attachments.size) await msg.delete();
		return;
	}

	for(let [trigger, emoji] of reactions) {
		if(msg.content !== trigger) continue;
		let ref = msg.reference ?
			(await msg.fetchReference()) : 
			(await getBefore(msg));
		ref.react(emoji);
		msg.delete();
		return;
	}
	
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
	fs.writeFileSync(mutefile, [...mutes.keys()].join(","));
}

async function getBefore(msg) {
	const fetched = await msg.channel.messages.fetch({
		limit: 1,
		before: msg.id,
	});
	return fetched.first();
}

client.login(process.env.TOKEN);

