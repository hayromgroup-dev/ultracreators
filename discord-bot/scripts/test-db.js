require('dotenv').config();
const { connectDatabase } = require('./database');
const Ticket = require('./models/Ticket');

async function test() {
    console.log('🧪 Starting database tests...\n');

    // Connect to database
    await connectDatabase();

    // Test 1: Create a ticket
    console.log('📝 Test 1: Creating test ticket...');
    const testTicket = new Ticket({
        ticketId: 'test-' + Date.now(),
        team: 'dev',
        type: 'bug',
        title: 'Test Ticket',
        description: 'Testing database connection',
        priority: 'baixa',
        status: 'open',
        creator: '123456789',
        channelId: '987654321',
        messageId: '111222333'
    });

    await testTicket.save();
    console.log('✅ Test ticket created:', testTicket.ticketId);

    // Test 2: Read the ticket
    console.log('\n📖 Test 2: Reading test ticket...');
    const found = await Ticket.findOne({ ticketId: testTicket.ticketId });
    console.log('✅ Test ticket found:', found.title);
    console.log('   - Team:', found.team);
    console.log('   - Status:', found.status);
    console.log('   - Priority:', found.priority);

    // Test 3: Update the ticket
    console.log('\n✏️  Test 3: Updating test ticket...');
    await Ticket.updateOne(
        { ticketId: testTicket.ticketId },
        { $set: { status: 'progress', assignee: '999888777' } }
    );
    const updated = await Ticket.findOne({ ticketId: testTicket.ticketId });
    console.log('✅ Test ticket updated:');
    console.log('   - Status:', updated.status);
    console.log('   - Assignee:', updated.assignee);

    // Test 4: Query tickets
    console.log('\n🔍 Test 4: Querying tickets...');
    const count = await Ticket.countDocuments({ team: 'dev' });
    console.log('✅ Found', count, 'dev team ticket(s)');

    // Test 5: Delete the ticket
    console.log('\n🗑️  Test 5: Deleting test ticket...');
    await Ticket.deleteOne({ ticketId: testTicket.ticketId });
    const deleted = await Ticket.findOne({ ticketId: testTicket.ticketId });
    console.log('✅ Test ticket deleted:', deleted === null ? 'YES' : 'NO');

    console.log('\n✅ All database tests passed!');
    console.log('🎉 Your database is ready to use!\n');

    process.exit(0);
}

test().catch(err => {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
});
