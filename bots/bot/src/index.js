require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { Kazagumo } = require('kazagumo');
const { Connectors } = require('shoukaku');
const { deployCommands } = require('./deploy');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ---- Load slash commands ----
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// ---- Setup Lavalink node(s) via Kazagumo/Shoukaku ----
const Nodes = [
  {
    name: 'main',
    url: `${process.env.LAVALINK_HOST}:${process.env.LAVALINK_PORT || 2333}`,
    auth: process.env.LAVALINK_PASSWORD,
    secure: process.env.LAVALINK_SECURE === 'true',
  },
];

client.kazagumo = new Kazagumo(
  {
    defaultSearchEngine: 'youtube',
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  },
  new Connectors.DiscordJS(client),
  Nodes,
  {
    moveOnDisconnect: false,
    resumable: false,
    resumableTimeout: 30,
    reconnectTries: 5,
    restTimeout: 10000,
  }
);

// ---- Lavalink node connection events ----
client.kazagumo.shoukaku.on('ready', (name) => console.log(`✅ Lavalink node "${name}" connected`));
client.kazagumo.shoukaku.on('error', (name, error) => console.error(`❌ Lavalink node "${name}" error:`, error));
client.kazagumo.shoukaku.on('close', (name, code, reason) =>
  console.warn(`⚠️ Lavalink node "${name}" closed. Code ${code}, reason: ${reason || 'none'}`)
);
client.kazagumo.shoukaku.on('disconnect', (name) => console.warn(`⚠️ Lavalink node "${name}" disconnected`));

// ---- Player (music) events ----
client.kazagumo
  .on('playerStart', (player, track) => {
    const channel = client.channels.cache.get(player.textId);
    channel?.send({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setDescription(`🎶 Now playing **${track.title}** - \`${formatDuration(track.length)}\`\nRequested by: ${track.requester}`),
      ],
    });
  })
  .on('playerEmpty', (player) => {
    const channel = client.channels.cache.get(player.textId);
    channel?.send('👋 Queue finished and voice channel idle, leaving...');
    player.destroy();
  })
  .on('playerException', (player, error) => {
    console.error('Player exception:', error);
    const channel = client.channels.cache.get(player.textId);
    channel?.send(`❌ Playback error: \`${(error?.exception?.message || error?.reason || 'unknown error').toString().slice(0, 300)}\``);
  })
  .on('playerStuck', (player) => {
    const channel = client.channels.cache.get(player.textId);
    channel?.send('⚠️ Player got stuck, skipping to the next song...');
    player.skip();
  })
  .on('playerClosed', (player) => {
    const channel = client.channels.cache.get(player.textId);
    channel?.send('🔌 Voice connection closed.');
  });

function formatDuration(ms) {
  if (!ms || ms <= 0) return 'LIVE';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
client.formatDuration = formatDuration;

// ---- Discord client events ----
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setActivity('/play | music bot', { type: 2 }); // type 2 = LISTENING

  // Auto-register slash commands every time the bot starts.
  try {
    await deployCommands({
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.CLIENT_ID || client.user.id,
      guildId: process.env.GUILD_ID, // omit in production for global commands
    });
  } catch (error) {
    console.error('❌ Auto-deploy of slash commands failed:', error);
  }
});

// Kazagumo/Shoukaku needs raw gateway payloads to track voice state - discord.js
// forwards these automatically through the Connectors.DiscordJS adapter above.

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Error executing /${interaction.commandName}:`, error);
    const payload = { content: '❌ There was an error executing that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN);
