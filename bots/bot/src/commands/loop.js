const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set the loop mode')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'none' },
          { name: 'Repeat Song', value: 'track' },
          { name: 'Repeat Queue', value: 'queue' }
        )
    ),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }

    const mode = interaction.options.getString('mode');
    player.setLoop(mode);

    const label = { none: 'Off', track: 'Repeat Song', queue: 'Repeat Queue' }[mode];
    await interaction.reply(`🔁 Loop mode set to **${label}**`);
  },
};
