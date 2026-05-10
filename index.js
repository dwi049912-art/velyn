const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Web server jalan");
});

const {
  Client,
  GatewayIntentBits
} = require("discord.js");

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

const GUILD_ID = "ISI_ID_SERVER";
const VOICE_CHANNEL_ID = "ISI_ID_VOICE_CHANNEL";

let connection;

async function joinVC() {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);

    if (!guild) {
      return console.log("Guild tidak ditemukan");
    }

    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);

    if (!channel) {
      return console.log("Voice channel tidak ditemukan");
    }

    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    console.log(`Bot masuk ke VC: ${channel.name}`);

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      console.log("Bot disconnect, mencoba reconnect...");

      try {
        await entersState(
          connection,
          VoiceConnectionStatus.Signalling,
          5000
        );
      } catch (err) {
        console.log("Reconnect gagal, mencoba join ulang...");

        setTimeout(() => {
          joinVC();
        }, 5000);
      }
    });

  } catch (err) {
    console.log("Error join VC:");
    console.log(err);
  }
}

client.once("ready", async () => {
  console.log(`${client.user.tag} online!`);

  joinVC();
});

client.login(process.env.TOKEN);
