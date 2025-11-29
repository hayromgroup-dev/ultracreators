const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ]
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}\n`);

    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        console.log(`🔧 Deleting old "tickets-abertos" channels for: ${guild.name}\n`);

        // Find and delete all 🟡-tickets-abertos channels
        const channelsToDelete = guild.channels.cache.filter(c => c.name === '🟡-tickets-abertos');

        console.log(`Found ${channelsToDelete.size} channels to delete\n`);

        for (const [id, channel] of channelsToDelete) {
            await channel.delete();
            console.log(`   ✓ Deleted: ${channel.name} (in category: ${channel.parent?.name || 'No Category'})`);
        }

        console.log('\n✅ All "tickets-abertos" channels deleted!');
        console.log('\n📋 Next steps:');
        console.log('   1. Run: node setup-server.js');
        console.log('   2. Run: node multi-team-ticketing-bot.js');
        console.log('\n   This will recreate the channels with correct permissions.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
});

client.login(process.env.DISCORD_TOKEN);
