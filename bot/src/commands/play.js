const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue, createQueue, playNext } = require('../lib/queueManager');
const { resolve } = require('../lib/search');
const { formatDuration } = require('../lib/format');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube/SoundCloud (link or search term)')
    .addStringOption((o) => o.setName('query').setDescription('Song name or URL').setRequired(true)),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ You need to join a voice channel first!', ephemeral: true });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({ content: '❌ I need permission to join and speak in your voice channel.', ephemeral: true });
    }

    await interaction.deferReply();

    let queue = getQueue(interaction.guildId);
    if (!queue) {
      try {
        queue = await createQueue(interaction.guildId, voiceChannel, interaction.channel);
      } catch (error) {
        console.error(error);
        return interaction.editReply(`❌ Could not join voice channel: \`${error.message}\``);
      }
    }

    try {
      const info = await resolve(query);
      const song = {
        title: info.title,
        url: info.url,
        thumbnail: info.thumbnail,
        durationText: formatDuration(info.duration * 1000),
        requester: `${interaction.user}`,
        requesterTag: interaction.user.tag,
        requesterAvatar: interaction.user.displayAvatarURL(),
      };
      queue.songs.push(song);

      const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setDescription(`✅ Added **[${song.title}](${song.url})** to the queue`)
        .setThumbnail(song.thumbnail || null)
        .setFooter({ text: `Position in queue: ${queue.songs.length}` });

      await interaction.editReply({ embeds: [embed] });
      if (!queue.playing) playNext(interaction.guildId);
    } catch (error) {
      console.error(error);
      await interaction.editReply(`❌ Could not find that: \`${(error.message || 'unknown error').slice(0, 250)}\``);
    }
  },
};
