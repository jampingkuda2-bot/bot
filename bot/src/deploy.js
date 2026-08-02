const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

/**
 * Registers all slash commands found in src/commands with Discord.
 * Can be called manually (npm run deploy) or automatically on bot startup.
 *
 * @param {object} options
 * @param {string} options.token - Discord bot token
 * @param {string} options.clientId - Discord application (client) ID
 * @param {string} [options.guildId] - If set, registers instantly to this guild only.
 *                                     If omitted, registers globally (up to 1h to propagate).
 */
async function deployCommands({ token, clientId, guildId }) {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

  const commands = commandFiles.map((file) => {
    const command = require(path.join(commandsPath, file));
    return command.data.toJSON();
  });

  const rest = new REST().setToken(token);

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`✅ Registered ${commands.length} slash command(s) to guild ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`✅ Registered ${commands.length} global slash command(s) (may take up to 1h to appear)`);
  }

  return commands.length;
}

module.exports = { deployCommands };
