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
  AttachmentBuilder,
  EmbedBuilder
} = require("discord.js");

const {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

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
    if (!guild) return console.log("Guild tidak ditemukan");

    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel) return console.log("Voice channel tidak ditemukan");

    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    console.log(`Bot masuk ke VC: ${channel.name}`);

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

client.once("ready", async () => {
  console.log(`${client.user.tag} online!`);
  joinVC();
});

client.on("guildMemberAdd", async (member) => {
  try {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return console.log("Channel welcome tidak ditemukan");

    const canvas = createCanvas(900, 350);
    const ctx = canvas.getContext("2d");

    // pakai gambar jika ada
    if (fs.existsSync("./welcome-bg.png")) {
      const bg = await loadImage("./welcome-bg.png");
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#1e1f22";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#f1c40f";
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 880, 330);
    }

    const avatar = await loadImage(
      member.user.displayAvatarURL({ extension: "png", size: 256 })
    );

    ctx.save();
    ctx.beginPath();
    ctx.arc(450, 110, 70, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 380, 40, 140, 140);
    ctx.restore();

    // glow text
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 10;

    ctx.font = "bold 52px Sans";
    ctx.fillStyle = "#f1c40f";
    ctx.textAlign = "center";
    ctx.fillText("WELCOME", 450, 245);

    ctx.font = "bold 28px Sans";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(member.user.username.toUpperCase(), 450, 290);

    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "welcome.png"
    });

    const embed = new EmbedBuilder()
      .setColor("#f1c40f")
      .setImage("attachment://welcome.png")
      .setFooter({
        text: `© ${new Date().toLocaleString("id-ID")}`
      });

    await channel.send({
      content: `Halo ${member}, selamat datang di server!`,
      embeds: [embed],
      files: [attachment]
    });

  } catch (err) {
    console.log(err);
  }
});

client.login(process.env.TOKEN);
