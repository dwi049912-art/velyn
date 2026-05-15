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

    // background
    const bg = await loadImage("./welcome-bg.png");
    ctx.drawImage(bg, 0, 0, 900, 350);

    // avatar user
    const avatar = await loadImage(
      member.user.displayAvatarURL({ extension: "png", size: 512 })
    );

    ctx.save();
    ctx.beginPath();
    ctx.arc(450, 105, 82, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 368, 23, 164, 164);
    ctx.restore();

    // border avatar
    ctx.beginPath();
    ctx.arc(450, 105, 85, 0, Math.PI * 2);
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 5;
    ctx.stroke();

    // tulisan WELCOME (png)
    const welcomeText = await loadImage("./welcome-text.png");
    ctx.drawImage(welcomeText, 285, 185, 330, 85);

    // nama user di gambar
    const safeName = member.user.username
      .toUpperCase()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="350">
      <text x="450" y="295"
            text-anchor="middle"
            font-size="26"
            font-weight="bold"
            fill="#f1c40f"
            font-family="Arial">
        ${safeName}
      </text>
    </svg>`;

    const nameImg = await loadImage(Buffer.from(svg));
    ctx.drawImage(nameImg, 0, 0);

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
> Jika ada kendala langsung tanya kepada ADMIN/PENJAGA kami`,
      embeds: [embed],
      files: [attachment]
    });

  } catch (err) {
    console.error(err);
  }
});

client.login(process.env.TOKEN);
