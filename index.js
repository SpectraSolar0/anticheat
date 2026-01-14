require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField
} = require("discord.js");

const config = require("./config.json");
const logger = require("./utils/logger");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const spamMap = new Map();

client.once("ready", () => {
  console.log(`✅ AntiCheat connecté : ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const now = Date.now();
  const data = spamMap.get(message.author.id) || { count: 0, last: now };

  if (now - data.last < config.antiSpam.interval) {
    data.count++;

    if (data.count >= config.antiSpam.maxMessages) {
      await message.delete().catch(() => {});

      await message.member.timeout(
        config.antiSpam.timeoutMinutes * 60 * 1000,
        "Spam détecté"
      ).catch(() => {});

      await logger(client, {
        guild: message.guild,
        action: "🚫 Spam détecté",
        user: message.author,
        channel: message.channel,
        messageContent: message.content,
        extra: `Messages envoyés trop rapidement (${data.count})`
      });

      spamMap.delete(message.author.id);
      return;
    }
  } else {
    data.count = 1;
  }

  data.last = now;
  spamMap.set(message.author.id, data);
});

/* 🤬 INSULTES */
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  if (config.insults.some(w => message.content.toLowerCase().includes(w))) {
    await message.delete().catch(() => {});

    await message.member.timeout(10 * 60 * 1000, "Insulte").catch(() => {});

    await logger(client, {
      guild: message.guild,
      action: "🤬 Insulte détectée",
      user: message.author,
      channel: message.channel,
      messageContent: message.content
    });
  }
});

client.login(process.env.TOKEN);
