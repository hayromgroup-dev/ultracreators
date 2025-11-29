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
        console.log(`🔧 Fixing ticket channel permissions for: ${guild.name}\n`);

        // Find and delete old ticket creation channels
        const ticketChannelsToDelete = [
            '🎫-criar-ticket-comercial',
            '🎫-criar-ticket-coordenacao',
            '🎫-criar-ticket-recrutamento',
            '🎫-criar-ticket-dev'
        ];

        console.log('🗑️  Deleting old ticket channels...');
        for (const channelName of ticketChannelsToDelete) {
            const channel = guild.channels.cache.find(c => c.name === channelName);
            if (channel) {
                await channel.delete();
                console.log(`   ✓ Deleted: ${channelName}`);
            } else {
                console.log(`   - Not found: ${channelName}`);
            }
        }

        console.log('\n✅ Old ticket channels deleted!');
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
