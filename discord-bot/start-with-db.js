require('dotenv').config();
const { initializeDatabase, saveTicketToDB, updateTicketStatus, saveOnboardingRequestToDB, loadTicketsFromDB } = require('./db-integration');

(async () => {
    console.log('🔄 Initializing Discord Bot with Database...');
    const connected = await initializeDatabase();
    
    global.saveTicketToDB = saveTicketToDB;
    global.updateTicketStatus = updateTicketStatus;
    global.saveOnboardingRequestToDB = saveOnboardingRequestToDB;
    global.loadTicketsFromDB = loadTicketsFromDB;
    
    // Start the main bot
    require('./multi-team-ticketing-bot.js');
    
    // Auto-save tickets to database every 2 minutes
    if (connected) {
        setInterval(async () => {
            try {
                const activeTickets = global.activeTickets || new Map();
                let savedCount = 0;
                
                for (const [ticketId, ticket] of activeTickets.entries()) {
                    if (ticket && ticket.ticketId) {
                        await saveTicketToDB(ticket);
                        savedCount++;
                    }
                }
                
                if (savedCount > 0) {
                    console.log(`💾 Auto-saved ${savedCount} tickets to database`);
                }
            } catch (error) {
                console.error('Error in auto-save:', error.message);
            }
        }, 120000); // Every 2 minutes
        
        console.log('✅ Ticket auto-save enabled (every 2 minutes)');
    }
})();
