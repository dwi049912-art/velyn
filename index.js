const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot aktif!"));
app.listen(process.env.PORT || 3000, "0.0.0.0");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder
} = require("discord.js");

const {
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus
} = require("@discordjs/voice");

const { createCanvas, loadImage } = require("@napi-rs/canvas");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

const GUILD_ID = "489687951253700619";
const VOICE_CHANNEL_ID = "1488854856633680083";
const WELCOME_CHANNEL_ID = "1504467268799565945";
const README_ID = "1488136899297153176";
const ROLE_ID = "1488135944371572866";
const INTRO_ID = "1492441547583524954";

let connection;

async function joinVC() {
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return;

  const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
  if (!channel) return;

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await entersState(connection, VoiceConnectionStatus.Signalling, 5000);
    } catch {
      setTimeout(joinVC, 5000);
    }
  });
}

client.once("ready", () => {
  console.log(`${client.user.tag} online`);
  joinVC();
});

client.on("guildMemberAdd", async (member) => {
  try {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const canvas = createCanvas(900, 350);
    const ctx = canvas.getContext("2d");

    const bg = await loadImage("./welcome-bg.png");
    ctx.drawImage(bg, 0, 0, 900, 350);

    const avatar = await loadImage(
      member.user.displayAvatarURL({ extension: "png", size: 512 })
    );

    // FOTO USER
    ctx.save();
    ctx.beginPath();
    ctx.arc(450, 105, 82, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 368, 23, 164, 164);
    ctx.restore();

    // BORDER EMAS
    ctx.beginPath();
    ctx.arc(450, 105, 85, 0, Math.PI * 2);
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 5;
    ctx.stroke();

    // OVERLAY GELAP
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(220, 200, 460, 115);

    // RESET SHADOW
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // WELCOME
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "center";
    ctx.font = "bold 68px Arial";
    ctx.fillText("WELCOME", 450, 255);

    // USERNAME
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.fillText(member.user.username.toUpperCase(), 450, 300);

    const attachment = new AttachmentBuilder(await canvas.encode("png"), {
      name: "welcome.png"
    });

    const embed = new EmbedBuilder()
      .setColor("#f1c40f")
      .setImage("attachment://welcome.png")
      .setFooter({
        text: `Copyright ©️2018 - BTHL | ${new Date().toLocaleString("id-ID")}`
      });

    await channel.send({
      content:
`Halo ${member} Selamat datang di BETHLEHEM!

> Baca <#${README_ID}> terlebih dahulu dan ambil role disini <#${ROLE_ID}>
> Jangan lupa mengisi data diri kalian di sini <#${INTRO_ID}> ya.
> Jika ada kendala langsung tanya kepada **ADMIN/PENJAGA** kami`,
      embeds: [embed],
      files: [attachment]
    });

  } catch (err) {
    console.log(err);
  }
});

client.login(process.env.TOKEN);
