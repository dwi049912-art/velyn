const express = require("express");
const fs = require("fs");
const app = express();

app.get("/", (req, res) => res.send("Bot aktif!"));
app.listen(process.env.PORT || 3000, "0.0.0.0");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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

const GUILD_ID = "489687951253700619";
const VOICE_CHANNEL_ID = "1488854856633680083";
const HEIST_CHANNEL_ID = "1504467268799565945";

const FILE = "./cooldowns.json";
const MSG_FILE = "./heist-message.json";
const HEIST_COOLDOWN = 4 * 60 * 60 * 1000;

let connection;
let heistMessage = null;

let regions = {
  libertera: 0,
  warvane: 0,
  elorioa: 0,
  ambarino: 0
};

if (fs.existsSync(FILE)) {
  try {
    regions = JSON.parse(fs.readFileSync(FILE));
  } catch {}
}

function saveData() {
  fs.writeFileSync(FILE, JSON.stringify(regions, null, 2));
}

function format(ms) {
  if (ms <= 0) return "READY";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function heistButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cd_libertera").setLabel("Libertera").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("cd_warvane").setLabel("Warvane").setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("cd_elorioa").setLabel("Elorioa").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("cd_ambarino").setLabel("Ambarino").setStyle(ButtonStyle.Primary)
    )
  ];
}

async function updateHeistEmbed(channel) {
  if (!heistMessage) return;

  const now = Date.now();

  const embed = new EmbedBuilder()
    .setColor("#f1c40f")
    .setTitle("REGION HEIST COOLDOWN")
    .setDescription(
      `**Libertera** → ${format(regions.libertera - now)}\n` +
      `**Warvane** → ${format(regions.warvane - now)}\n` +
      `**Elorioa** → ${format(regions.elorioa - now)}\n` +
      `**Ambarino** → ${format(regions.ambarino - now)}`
    );

  await heistMessage.edit({
    embeds: [embed],
    components: heistButtons()
  }).catch(() => {});
}

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

client.once("clientReady", async () => {
  console.log(`${client.user.tag} online`);
  joinVC();

  const channel = await client.channels.fetch(HEIST_CHANNEL_ID);
  if (!channel) return;

  let messageId = null;

  if (fs.existsSync(MSG_FILE)) {
    try {
      messageId = JSON.parse(fs.readFileSync(MSG_FILE)).messageId;
    } catch {}
  }

  try {
    if (messageId) {
      heistMessage = await channel.messages.fetch(messageId);
    }
  } catch {}

  if (!heistMessage) {
    heistMessage = await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("REGION HEIST COOLDOWN")
          .setDescription("Loading...")
      ],
      components: heistButtons()
    });

    fs.writeFileSync(MSG_FILE, JSON.stringify({
      messageId: heistMessage.id
    }));
  }

  updateHeistEmbed(channel);

  setInterval(async () => {
    await updateHeistEmbed(channel);
  }, 1000);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("cd_")) return;

  const region = interaction.customId.replace("cd_", "");

  regions[region] = Date.now() + HEIST_COOLDOWN;
  saveData();

  await updateHeistEmbed(interaction.channel);

  await interaction.reply({
    content: `${region.toUpperCase()} cooldown dimulai (4 jam)`,
    ephemeral: true
  });
});

client.login(process.env.TOKEN);
