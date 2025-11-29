const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ]
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}\n`);

    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        console.log(`🧹 Starting cleanup for: ${guild.name}\n`);

        let totalMessagesDeleted = 0;
        let totalChannelsDeleted = 0;

        // Step 1: Clear all ticket messages from ticket channels
        console.log('📋 Step 1: Clearing ticket messages from all teams...\n');

        const ticketChannelNames = [
            '🟡-tickets-abertos',
            '⏳-tickets-andamento',
            '✅-tickets-resolvidos',
            '📋-onboarding-requests'
        ];

        for (const channelName of ticketChannelNames) {
            const channels = guild.channels.cache.filter(c => c.name === channelName);

            for (const [id, channel] of channels) {
                if (channel.isTextBased()) {
                    try {
                        const messages = await channel.messages.fetch({ limit: 100 });
                        const botMessages = messages.filter(msg => msg.author.bot);

                        if (botMessages.size > 0) {
                            console.log(`   🗑️  Deleting ${botMessages.size} messages from ${channel.name} (${channel.parent?.name})...`);

                            for (const [msgId, message] of botMessages) {
                                try {
                                    await message.delete();
                                    totalMessagesDeleted++;
                                    // Small delay to avoid rate limits
                                    await new Promise(resolve => setTimeout(resolve, 100));
                                } catch (err) {
                                    console.log(`      ⚠️  Could not delete message: ${err.message}`);
                                }
                            }
                        }
                    } catch (error) {
                        console.log(`   ⚠️  Error fetching messages from ${channel.name}: ${error.message}`);
                    }
                }
            }
        }

        // Step 2: Delete all archived work channels
        console.log('\n📦 Step 2: Deleting archived work channels...\n');

        const archiveCategory = guild.channels.cache.find(
            c => c.name === '📦 ARQUIVO DE TICKETS' && c.type === 4 // ChannelType.GuildCategory
        );

        if (archiveCategory) {
            const archivedChannels = guild.channels.cache.filter(
                c => c.parentId === archiveCategory.id
            );

            if (archivedChannels.size > 0) {
                console.log(`   Found ${archivedChannels.size} archived channels to delete...`);

                for (const [id, channel] of archivedChannels) {
                    try {
                        await channel.delete();
                        console.log(`      ✓ Deleted: ${channel.name}`);
                        totalChannelsDeleted++;
                        // Small delay to avoid rate limits
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        console.log(`      ⚠️  Could not delete ${channel.name}: ${error.message}`);
                    }
                }
            } else {
                console.log('   No archived channels found.');
            }
        } else {
            console.log('   Archive category not found.');
        }

        // Step 3: Clear dashboard messages (optional)
        console.log('\n📊 Step 3: Clearing dashboard messages...\n');

        const dashboardChannels = guild.channels.cache.filter(c => c.name === '📋-tickets-dashboard');

        for (const [id, channel] of dashboardChannels) {
            if (channel.isTextBased()) {
                try {
                    const messages = await channel.messages.fetch({ limit: 100 });
                    const botMessages = messages.filter(msg => msg.author.bot);

                    if (botMessages.size > 0) {
                        console.log(`   🗑️  Deleting ${botMessages.size} messages from ${channel.name} (${channel.parent?.name})...`);

                        for (const [msgId, message] of botMessages) {
                            try {
                                await message.delete();
                                totalMessagesDeleted++;
                                await new Promise(resolve => setTimeout(resolve, 100));
                            } catch (err) {
                                console.log(`      ⚠️  Could not delete message: ${err.message}`);
                            }
                        }
                    }
                } catch (error) {
                    console.log(`   ⚠️  Error fetching messages from ${channel.name}: ${error.message}`);
                }
            }
        }

        console.log('\n✅ Cleanup complete!\n');
        console.log(`📊 Summary:`);
        console.log(`   - Messages deleted: ${totalMessagesDeleted}`);
        console.log(`   - Channels deleted: ${totalChannelsDeleted}`);
        console.log('\n📋 Next step:');
        console.log('   Restart the bot: node multi-team-ticketing-bot.js\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
});

client.login(process.env.DISCORD_TOKEN);
