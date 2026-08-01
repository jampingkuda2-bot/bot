const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or playlist (YouTube, Spotify, SoundCloud link, or search term)')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Song name, YouTube/Spotify/SoundCloud URL')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: '❌ You need to join a voice channel first!', ephemeral: true });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({
        content: '❌ I need permission to join and speak in your voice channel.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const player =
        client.kazagumo.players.get(interaction.guildId) ??
        (await client.kazagumo.createPlayer({
          guildId: interaction.guildId,
          textId: interaction.channelId,
          voiceId: voiceChannel.id,
          shardId: interaction.guild.shardId ?? 0,
          deaf: true,
        }));

      const result = await client.kazagumo.search(query, { requester: interaction.user });

      if (!result || !result.tracks.length) {
        return interaction.editReply(`❌ No results found for **${query}**`);
      }

      if (result.type === 'PLAYLIST') {
        for (const track of result.tracks) player.queue.add(track);
        await interaction.editReply(
          `✅ Added playlist **${result.playlistName}** (${result.tracks.length} songs) to the queue`
        );
      } else {
        const track = result.tracks[0];
        player.queue.add(track);
        await interaction.editReply(`✅ Added **${track.title}** to the queue`);
      }

      if (!player.playing && !player.paused) player.play();
    } catch (error) {
      console.error(error);
      await interaction.editReply(`❌ Could not play that: \`${error.message?.slice(0, 300)}\``);
    }
  },
};
