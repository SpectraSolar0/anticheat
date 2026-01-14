const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

/**
 * Logger AntiCheat
 * @param {Client} client
 * @param {Object} options
 */
module.exports = async function logger(client, options) {
  const {
    guild,
    action,
    user,
    channel,
    messageContent,
    extra = "",
    color = 0xff0000
  } = options;

  const logChannel = guild.channels.cache.get(config.logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle("🛡️ AntiCheat — Log")
    .setColor(color)
    .setTimestamp()
    .addFields(
      { name: "📌 Action", value: action, inline: false },
      { name: "👤 Utilisateur", value: `${user.tag} (${user.id})`, inline: false },
      { name: "📍 Salon", value: `${channel.name} (${channel.id})`, inline: false }
    );

  if (messageContent) {
    embed.addFields({
      name: "💬 Message",
      value: `\`\`\`${messageContent.slice(0, 900)}\`\`\``
    });
  }

  if (extra) {
    embed.addFields({
      name: "ℹ️ Détails",
      value: extra
    });
  }

  logChannel.send({ embeds: [embed] });
};
