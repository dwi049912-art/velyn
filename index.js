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
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

const GUILD_ID = "489687951253700619";
const VOICE_CHANNEL_ID = "1488854856633680083";
const HEIST_CHANNEL_ID = "1506218942883172392";

const ADMIN_CHANNEL_ID = "1506240501052084284";
const ADMIN_ROLE_ID = "1488133045532885132";

const FILE = "./cooldowns.json";
const MSG_FILE = "./heist-message.json";
const ADMIN_MSG_FILE = "./admin-message.json";

const HEIST_COOLDOWN = 4 * 60 * 60 * 1000;

const REGION_EMOJI = {
  libertera: "<:liber:1506205615494791219>",
  warvane: "<:warv:1506205556124160102>",
  elorioa: "<:elo:1506205490135171177>",
  ambarino: "<:amb:1506205430626390076>"
};

let connection;
let heistMessage = null;
let adminMessage = null;

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
  const now = Date.now();

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cd_libertera")
        .setLabel("Libertera")
        .setEmoji("1506205615494791219")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(regions.libertera > now),

      new ButtonBuilder()
        .setCustomId("cd_warvane")
        .setLabel("Warvane")
        .setEmoji("1506205556124160102")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(regions.warvane > now)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cd_eloria")
        .setLabel("Eloria")
        .setEmoji("1506205490135171177")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(regions.eloria > now),

      new ButtonBuilder()
        .setCustomId("cd_ambarino")
        .setLabel("Ambarino")
        .setEmoji("1506205430626390076")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(regions.ambarino > now)
    )
  ];
}

function adminButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("reset_libertera")
        .setLabel("Reset Libertera")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("reset_warvane")
        .setLabel("Reset Warvane")
        .setStyle(ButtonStyle.Danger)
    ),

    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("reset_eloria")
        .setLabel("Reset Eloria")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("reset_ambarino")
        .setLabel("Reset Ambarino")
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

async function updateHeistEmbed() {
  if (!heistMessage) return;

  const now = Date.now();

  const status = (time) => {
    const left = time - now;
    return left <= 0 ? "🟢 READY" : `🔴 ${format(left)}`;
  };

  const embed = new EmbedBuilder()
    .setColor("#d4af37")
    .setTitle("╔════════════════════╗\n   REGION HEIST COOLDOWN BY BETHLEHEM\n╚════════════════════╝")
    .setDescription(
      `${REGION_EMOJI.libertera} **Libertera**\n${status(regions.libertera)}\n\n` +
      `${REGION_EMOJI.warvane} **Warvane**\n${status(regions.warvane)}\n\n` +
      `${REGION_EMOJI.eloria} **Eloria**\n${status(regions.eloria)}\n\n` +
      `${REGION_EMOJI.ambarino} **Ambarino**\n${status(regions.ambarino)}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `⚠️ **PENGUMUMAN**\n` +
      `Panel ini masih manual, mohon gunakan dengan bijak.\n` +
      `Jangan sembarang klik tombol cooldown.\n` +
      `Gunakan seperlunya sambil menunggu sistem otomatis dirilis oleh MARUN.\n` +
      `**TERIMA KASIH.**\n\n` +
      `🟢 = READY\n` +
      `🔴 = COOLDOWN`
    )
    .setFooter({
      text: "BETLEHEM • Copyright ©️2018 - BTHL",
      iconURL: client.guilds.cache.get(GUILD_ID)?.iconURL({ dynamic: true })
    });

  await heistMessage.edit({
    embeds: [embed],
    components: heistButtons()
  }).catch(console.error);
}

async function createAdminPanel() {
  const channel = await client.channels.fetch(ADMIN_CHANNEL_ID);
  if (!channel) return;

  let msgId = null;

  if (fs.existsSync(ADMIN_MSG_FILE)) {
    try {
      msgId = JSON.parse(fs.readFileSync(ADMIN_MSG_FILE)).messageId;
    } catch {}
  }

  try {
    if (msgId) adminMessage = await channel.messages.fetch(msgId);
  } catch {}

  if (!adminMessage) {
    adminMessage = await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#992d22")
          .setTitle("ADMIN RESET PANEL")
          .setDescription("Gunakan panel ini untuk reset cooldown region.")
      ],
      components: adminButtons()
    });

    fs.writeFileSync(ADMIN_MSG_FILE, JSON.stringify({
      messageId: adminMessage.id
    }));
  }
}

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
      selfDeaf: false
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await entersState(connection, VoiceConnectionStatus.Signalling, 5000);
      } catch {
        setTimeout(joinVC, 5000);
      }
    });

  } catch (err) {
    console.error(err);
  }
}

client.once("clientReady", async () => {
  console.log(`${client.user.tag} online`);

  joinVC();

  const channel = await client.channels.fetch(HEIST_CHANNEL_ID);
  if (!channel) return;

  let msgId = null;

  if (fs.existsSync(MSG_FILE)) {
    try {
      msgId = JSON.parse(fs.readFileSync(MSG_FILE)).messageId;
    } catch {}
  }

  try {
    if (msgId) heistMessage = await channel.messages.fetch(msgId);
  } catch {}

  if (!heistMessage) {
    heistMessage = await channel.send({
      embeds: [new EmbedBuilder().setTitle("Loading...")],
      components: heistButtons()
    });

    fs.writeFileSync(MSG_FILE, JSON.stringify({
      messageId: heistMessage.id
    }));
  }

  await createAdminPanel();
  await updateHeistEmbed();

  setInterval(updateHeistEmbed, 1000);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const guildIcon = interaction.guild.iconURL({ dynamic: true });

  if (interaction.customId.startsWith("cd_")) {
    const region = interaction.customId.replace("cd_", "");
    const now = Date.now();

    if (regions[region] > now) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#e74c3c")
            .setTitle("REGION MASIH COOLDOWN")
            .setDescription(`${REGION_EMOJI[region]} **${region.toUpperCase()}**\n⏳ ${format(regions[region] - now)}`)
            .setFooter({
              text: "BETLEHEM • Copyright ©️2018 - BTHL",
              iconURL: guildIcon
            })
        ],
        flags: 64
      });
    }

    regions[region] = now + HEIST_COOLDOWN;
    saveData();

    await updateHeistEmbed();

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#2ecc71")
          .setTitle("COOLDOWN DIMULAI")
          .setDescription(`${REGION_EMOJI[region]} **${region.toUpperCase()}**\n⏰ 04:00:00`)
          .setFooter({
            text: "BETLEHEM • Copyright ©️2018 - BTHL",
            iconURL: guildIcon
          })
      ],
      flags: 64
    });
  }

  if (interaction.customId.startsWith("reset_")) {
    if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
      return interaction.reply({
        flags: 64,
        embeds: [
          new EmbedBuilder()
            .setColor("#e74c3c")
            .setTitle("AKSES DITOLAK")
            .setDescription("Dirimu tidak memiliki akses reset.")
        ]
      });
    }

    const region = interaction.customId.replace("reset_", "");
    regions[region] = 0;

    saveData();
    await updateHeistEmbed();

    return interaction.reply({
      flags: 64,
      embeds: [
        new EmbedBuilder()
          .setColor("#f1c40f")
          .setTitle("COOLDOWN DIRESET")
          .setDescription(`${REGION_EMOJI[region]} **${region.toUpperCase()}** berhasil direset.`)
          .setFooter({
            text: "BETLEHEM • Copyright ©️2018 - BTHL",
            iconURL: guildIcon
          })
      ]
    });
  }
});

client.login(process.env.TOKEN);
