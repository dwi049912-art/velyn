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
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

const GUILD_ID = "489687951253700619";
const VOICE_CHANNEL_ID = "1488854856633680083";
const WELCOME_CHANNEL_ID = "1488377288092287280";

let connection;

async function joinVC() {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel) return;

    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await entersState(connection, VoiceConnectionStatus.Signalling, 5000);
      } catch {
        setTimeout(() => joinVC(), 5000);
      }
    });

  } catch (err) {
    console.log(err);
  }
}

client.once("ready", () => {
  console.log(`${client.user.tag} online!`);
  joinVC();
});

client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor("#f1c40f")
    .setImage("https://i.imgur.com/lUI9fC4.png")
    .setFooter({
      text: `© ${new Date().toLocaleString("id-ID")}`
    });

  channel.send({
    content:
`Halo ${member} Selamat datang di BETLEHEM!

> Baca <#1488136899297153176> terlebih dahulu dan ambil role disini <#1488135944371572866>
> Jangan lupa mengisi data diri kalian di sini <#1492441547583524954> ya.
> Jika ada kendala langsung tanya kepada ADMIN/PENJAGA kami`,
    embeds: [embed]
  });
});

client.login(process.env.TOKEN);
