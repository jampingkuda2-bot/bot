const { SlashCommandBuilder } = require('discord.js');
const { getQueue, createQueue } = require('../lib/queueManager');

module.exports = {
  data: new SlashCommandBuilder().setName('join').setDescription('Make the bot join your current voice channel'),
  async execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ You need to join a voice channel first!', ephemeral: true });
    }
    if (getQueue(interaction.guildId)) {
      return interaction.reply({ content: 'ℹ️ I am already connected to a voice channel here.', ephemeral: true });
    }

    await interaction.deferReply();
    try {
      await createQueue(interaction.guildId, voiceChannel, interaction.channel);
      await interaction.editReply(`✅ Joined **${voiceChannel.name}**`);
    } catch (error) {
      console.error(error);
      await interaction.editReply(`❌ Could not join: \`${error.message}\``);
    }
  },
};
