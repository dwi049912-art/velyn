const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot aktif!"));
app.listen(process.env.PORT || 3000, "0.0.0.0");

const { Client, GatewayIntentBits } = require("discord.js");

const {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const GUILD_ID = "489687951253700619";
const VOICE_CHANNEL_ID = "1488854856633680083";

let connection;

async function joinVC() {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return console.log("Guild tidak ditemukan");

    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel) return console.log("Voice channel tidak ditemukan");

    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await entersState(connection, VoiceConnectionStatus.Signalling, 5000);
      } catch {
        console.log("Rejoin voice...");
        setTimeout(joinVC, 5000);
      }
    });

    console.log("Bot masuk voice");
  } catch (err) {
    console.error(err);
  }
}

client.once("clientReady", () => {
  console.log(`${client.user.tag} online`);
  joinVC();
});

client.login(process.env.TOKEN);
