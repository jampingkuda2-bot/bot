const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Make the bot join your current voice channel'),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ You need to join a voice channel first!', ephemeral: true });
    }

    if (client.kazagumo.players.get(interaction.guildId)) {
      return interaction.reply({ content: 'ℹ️ I am already connected to a voice channel here.', ephemeral: true });
    }

    await client.kazagumo.createPlayer({
      guildId: interaction.guildId,
      textId: interaction.channelId,
      voiceId: voiceChannel.id,
      shardId: interaction.guild.shardId ?? 0,
      deaf: true,
    });

    await interaction.reply(`✅ Joined **${voiceChannel.name}**`);
  },
};
