require('dotenv').config();
const { deployCommands } = require('./deploy');

// Standalone manual deploy script (optional).
// Not required anymore for normal use — src/index.js auto-deploys on every
// startup. Kept here in case you want to register commands without
// starting the whole bot (e.g. in a CI step).
deployCommands({
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
}).catch((error) => {
  console.error('❌ Failed to deploy commands:', error);
  process.exit(1);
});
