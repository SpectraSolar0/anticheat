require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField
} = require("discord.js");

const config = require("./config.json");
const logger = require("./utils/logger");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("Bot Discord en ligne");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Serveur HTTP actif sur le port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const spamMap = new Map();

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const now = Date.now();
  let data = spamMap.get(message.author.id);

  if (!data) {
    data = {
      count: 1,
      last: now,
      messages: [message]
    };
  } else {
    if (now - data.last < config.antiSpam.interval) {
      data.count++;
      data.messages.push(message);
    } else {
      data.count = 1;
      data.messages = [message];
    }
    data.last = now;
  }

  spamMap.set(message.author.id, data);

  if (data.count >= config.antiSpam.maxMessages) {
    // 🧹 SUPPRESSION DE TOUS LES MESSAGES DE SPAM
    for (const msg of data.messages) {
      await msg.delete().catch(() => {});
    }

    // ⛔ TIMEOUT
    await message.member.timeout(
      config.antiSpam.timeoutMinutes * 60 * 1000,
      "Spam détecté"
    ).catch(() => {});

    // 📜 LOG DÉTAILLÉ
    await logger(client, {
      guild: message.guild,
      action: "🚫 Spam détecté",
      user: message.author,
      channel: message.channel,
      messageContent: data.messages.map(m => m.content).join("\n"),
      extra: `Messages supprimés : ${data.messages.length}`
    });

    spamMap.delete(message.author.id);
  }
});

client.login(process.env.TOKEN);
