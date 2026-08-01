const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the playback volume')
    .addIntegerOption((option) =>
      option.setName('level').setDescription('Volume level (0-100)').setRequired(true).setMinValue(0).setMaxValue(100)
    ),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({ content: '❌ Nothing is playing right now.', ephemeral: true });
    }

    const level = interaction.options.getInteger('level');
    player.setVolume(level);
    await interaction.reply(`🔊 Volume set to **${level}%**`);
  },
};
