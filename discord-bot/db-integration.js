const { connectDatabase } = require('./database');
const Ticket = require('./models/Ticket');
const OnboardingRequest = require('./models/OnboardingRequest');

let dbConnected = false;

async function initializeDatabase() {
    try {
        await connectDatabase();
        dbConnected = true;
        console.log('✅ Discord Bot connected to MongoDB');
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        return false;
    }
}

async function saveTicketToDB(ticketData) {
    if (!dbConnected) return null;
    try {
        const ticket = await Ticket.findOneAndUpdate(
            { ticketId: ticketData.ticketId },
            ticketData,
            { upsert: true, new: true }
        );
        return ticket;
    } catch (error) {
        console.error('Error saving ticket:', error.message);
        return null;
    }
}

async function loadTicketsFromDB() {
    if (!dbConnected) return [];
    try {
        const tickets = await Ticket.find({ status: { $ne: 'resolved' } });
        console.log('Loaded', tickets.length, 'active tickets from database');
        return tickets;
    } catch (error) {
        console.error('Error loading tickets:', error.message);
        return [];
    }
}

async function updateTicketStatus(ticketId, status, additionalData = {}) {
    if (!dbConnected) return null;
    try {
        const updateData = { status, ...additionalData };
        if (status === 'resolved') {
            updateData.resolvedAt = new Date();
        }
        const ticket = await Ticket.findOneAndUpdate(
            { ticketId },
            updateData,
            { new: true }
        );
        return ticket;
    } catch (error) {
        console.error('Error updating ticket:', error.message);
        return null;
    }
}

async function saveOnboardingRequestToDB(requestData) {
    if (!dbConnected) return null;
    try {
        const request = await OnboardingRequest.findOneAndUpdate(
            { requestId: requestData.requestId },
            requestData,
            { upsert: true, new: true }
        );
        return request;
    } catch (error) {
        console.error('Error saving onboarding request:', error.message);
        return null;
    }
}

module.exports = {
    initializeDatabase,
    saveTicketToDB,
    loadTicketsFromDB,
    updateTicketStatus,
    saveOnboardingRequestToDB,
    isConnected: () => dbConnected
};
