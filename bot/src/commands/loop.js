const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set the loop mode')
    .addStringOption((o) =>
      o
        .setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices({ name: 'Off', value: 'none' }, { name: 'Repeat Song', value: 'track' }, { name: 'Repeat Queue', value: 'queue' })
    ),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });

    const mode = interaction.options.getString('mode');
    queue.loop = mode;
    const label = { none: 'Off', track: 'Repeat Song', queue: 'Repeat Queue' }[mode];
    await interaction.reply(`🔁 Loop mode set to **${label}**`);
  },
};
