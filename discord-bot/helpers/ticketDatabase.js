const Ticket = require('../models/Ticket');

/**
 * Database helper functions for ticket management
 * Provides CRUD operations and common queries for tickets
 */

/**
 * Create a new ticket in the database
 * @param {Object} ticketData - Ticket data object
 * @returns {Promise<Object>} Created ticket document
 */
async function createTicket(ticketData) {
    try {
        const ticket = new Ticket(ticketData);
        await ticket.save();
        console.log(`✅ Ticket created in DB: ${ticket.ticketId}`);
        return ticket;
    } catch (error) {
        console.error(`❌ Error creating ticket in DB:`, error);
        throw error;
    }
}

/**
 * Get a ticket by its ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<Object|null>} Ticket document or null if not found
 */
async function getTicket(ticketId) {
    try {
        const ticket = await Ticket.findOne({ ticketId });
        return ticket;
    } catch (error) {
        console.error(`❌ Error fetching ticket ${ticketId}:`, error);
        throw error;
    }
}

/**
 * Update a ticket
 * @param {string} ticketId - Ticket ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated ticket document or null if not found
 */
async function updateTicket(ticketId, updates) {
    try {
        // Update lastActivityAt on any modification
        updates.lastActivityAt = new Date();

        const ticket = await Ticket.findOneAndUpdate(
            { ticketId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (ticket) {
            console.log(`✅ Ticket updated in DB: ${ticketId}`);
        } else {
            console.warn(`⚠️  Ticket not found for update: ${ticketId}`);
        }

        return ticket;
    } catch (error) {
        console.error(`❌ Error updating ticket ${ticketId}:`, error);
        throw error;
    }
}

/**
 * Delete a ticket
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteTicket(ticketId) {
    try {
        const result = await Ticket.deleteOne({ ticketId });

        if (result.deletedCount > 0) {
            console.log(`✅ Ticket deleted from DB: ${ticketId}`);
            return true;
        } else {
            console.warn(`⚠️  Ticket not found for deletion: ${ticketId}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error deleting ticket ${ticketId}:`, error);
        throw error;
    }
}

/**
 * Get tickets by team and status
 * @param {string} team - Team name (dev, comercial, coordenacao, recrutamento)
 * @param {string} status - Ticket status (open, progress, resolved)
 * @returns {Promise<Array>} Array of ticket documents
 */
async function getTicketsByStatus(team, status) {
    try {
        const tickets = await Ticket.find({ team, status })
            .sort({ createdAt: -1 });
        return tickets;
    } catch (error) {
        console.error(`❌ Error fetching tickets for ${team}/${status}:`, error);
        throw error;
    }
}

/**
 * Get all tickets for a team
 * @param {string} team - Team name
 * @returns {Promise<Array>} Array of ticket documents
 */
async function getTicketsByTeam(team) {
    try {
        const tickets = await Ticket.find({ team })
            .sort({ createdAt: -1 });
        return tickets;
    } catch (error) {
        console.error(`❌ Error fetching tickets for ${team}:`, error);
        throw error;
    }
}

/**
 * Get all active (non-resolved) tickets
 * @returns {Promise<Array>} Array of ticket documents
 */
async function getAllActiveTickets() {
    try {
        const tickets = await Ticket.find({
            status: { $ne: 'resolved' }
        }).sort({ createdAt: -1 });
        return tickets;
    } catch (error) {
        console.error(`❌ Error fetching active tickets:`, error);
        throw error;
    }
}

/**
 * Get all resolved tickets
 * @param {number} limit - Maximum number of tickets to return (default: 100)
 * @returns {Promise<Array>} Array of ticket documents
 */
async function getResolvedTickets(limit = 100) {
    try {
        const tickets = await Ticket.find({ status: 'resolved' })
            .sort({ resolvedAt: -1 })
            .limit(limit);
        return tickets;
    } catch (error) {
        console.error(`❌ Error fetching resolved tickets:`, error);
        throw error;
    }
}

/**
 * Search tickets with flexible query parameters
 * @param {Object} query - Query object with filters
 * @param {string} query.team - Team filter (optional)
 * @param {string} query.status - Status filter (optional)
 * @param {string} query.creator - Creator ID filter (optional)
 * @param {string} query.assignee - Assignee ID filter (optional)
 * @param {string} query.priority - Priority key filter (optional)
 * @param {Array<string>} query.tags - Tags to filter by (optional)
 * @param {Date} query.createdAfter - Created after date (optional)
 * @param {Date} query.createdBefore - Created before date (optional)
 * @param {boolean} query.slaBreached - SLA breached filter (optional)
 * @param {number} query.limit - Maximum results (default: 100)
 * @returns {Promise<Array>} Array of ticket documents
 */
async function searchTickets(query = {}) {
    try {
        const filters = {};

        // Build filter object
        if (query.team) filters.team = query.team;
        if (query.status) filters.status = query.status;
        if (query.creator) filters.creator = query.creator;
        if (query.assignee) filters.assignee = query.assignee;
        if (query.priority) filters.priorityKey = query.priority;
        if (query.slaBreached !== undefined) filters.slaBreached = query.slaBreached;

        // Tags filter (ticket must have all specified tags)
        if (query.tags && query.tags.length > 0) {
            filters.tags = { $all: query.tags };
        }

        // Date range filters
        if (query.createdAfter || query.createdBefore) {
            filters.createdAt = {};
            if (query.createdAfter) filters.createdAt.$gte = query.createdAfter;
            if (query.createdBefore) filters.createdAt.$lte = query.createdBefore;
        }

        const limit = query.limit || 100;

        const tickets = await Ticket.find(filters)
            .sort({ createdAt: -1 })
            .limit(limit);

        return tickets;
    } catch (error) {
        console.error(`❌ Error searching tickets:`, error);
        throw error;
    }
}

/**
 * Get tickets by assignee
 * @param {string} assigneeId - Discord user ID
 * @returns {Promise<Array>} Array of ticket documents
 */
async function getTicketsByAssignee(assigneeId) {
    try {
        const tickets = await Ticket.find({ assignee: assigneeId })
            .sort({ createdAt: -1 });
        return tickets;
    } catch (error) {
        console.error(`❌ Error fetching tickets for assignee ${assigneeId}:`, error);
        throw error;
    }
}

/**
 * Get tickets by creator
 * @param {string} creatorId - Discord user ID
 * @returns {Promise<Array>} Array of ticket documents
 */
async function getTicketsByCreator(creatorId) {
    try {
        const tickets = await Ticket.find({ creator: creatorId })
            .sort({ createdAt: -1 });
        return tickets;
    } catch (error) {
        console.error(`❌ Error fetching tickets for creator ${creatorId}:`, error);
        throw error;
    }
}

/**
 * Get tickets that need SLA attention (breached or close to breach)
 * @param {number} warningThresholdPercent - Percentage of SLA time remaining to trigger warning (default: 20)
 * @returns {Promise<Array>} Array of ticket documents
 */
async function getTicketsNeedingSLAAttention(warningThresholdPercent = 20) {
    try {
        const now = new Date();

        // Get all non-resolved tickets with SLA deadlines
        const tickets = await Ticket.find({
            status: { $ne: 'resolved' },
            slaDeadline: { $ne: null }
        });

        // Filter tickets that are breached or in warning zone
        const needsAttention = tickets.filter(ticket => {
            if (!ticket.slaDeadline) return false;

            const deadline = ticket.slaDeadline.getTime();
            const created = ticket.createdAt.getTime();
            const totalSLA = deadline - created;
            const remaining = deadline - now.getTime();
            const percentRemaining = (remaining / totalSLA) * 100;

            // Include if breached or below warning threshold
            return remaining <= 0 || percentRemaining <= warningThresholdPercent;
        });

        return needsAttention;
    } catch (error) {
        console.error(`❌ Error fetching tickets needing SLA attention:`, error);
        throw error;
    }
}

/**
 * Get tickets inactive for auto-close monitoring
 * @param {number} inactiveHours - Hours of inactivity to check
 * @returns {Promise<Array>} Array of ticket documents
 */
async function getInactiveTickets(inactiveHours = 24) {
    try {
        const threshold = new Date(Date.now() - (inactiveHours * 60 * 60 * 1000));

        const tickets = await Ticket.find({
            status: 'resolved',
            lastActivityAt: { $lte: threshold }
        }).sort({ lastActivityAt: 1 });

        return tickets;
    } catch (error) {
        console.error(`❌ Error fetching inactive tickets:`, error);
        throw error;
    }
}

/**
 * Add a tag to a ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} tag - Tag to add
 * @returns {Promise<Object|null>} Updated ticket or null
 */
async function addTicketTag(ticketId, tag) {
    try {
        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) return null;

        await ticket.addTag(tag);
        return ticket;
    } catch (error) {
        console.error(`❌ Error adding tag to ticket ${ticketId}:`, error);
        throw error;
    }
}

/**
 * Remove a tag from a ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} tag - Tag to remove
 * @returns {Promise<Object|null>} Updated ticket or null
 */
async function removeTicketTag(ticketId, tag) {
    try {
        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) return null;

        await ticket.removeTag(tag);
        return ticket;
    } catch (error) {
        console.error(`❌ Error removing tag from ticket ${ticketId}:`, error);
        throw error;
    }
}

/**
 * Add a note to a ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} author - Author user ID
 * @param {string} content - Note content
 * @param {boolean} isPrivate - Whether note is private (default: false)
 * @returns {Promise<Object|null>} Updated ticket or null
 */
async function addTicketNote(ticketId, author, content, isPrivate = false) {
    try {
        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) return null;

        await ticket.addNote(author, content, isPrivate);
        return ticket;
    } catch (error) {
        console.error(`❌ Error adding note to ticket ${ticketId}:`, error);
        throw error;
    }
}

/**
 * Get ticket statistics for a team
 * @param {string} team - Team name
 * @returns {Promise<Object>} Statistics object
 */
async function getTeamStatistics(team) {
    try {
        const [total, open, progress, resolved, breached] = await Promise.all([
            Ticket.countDocuments({ team }),
            Ticket.countDocuments({ team, status: 'open' }),
            Ticket.countDocuments({ team, status: 'progress' }),
            Ticket.countDocuments({ team, status: 'resolved' }),
            Ticket.countDocuments({ team, slaBreached: true })
        ]);

        return {
            total,
            open,
            progress,
            resolved,
            breached,
            active: open + progress
        };
    } catch (error) {
        console.error(`❌ Error fetching team statistics for ${team}:`, error);
        throw error;
    }
}

module.exports = {
    createTicket,
    getTicket,
    updateTicket,
    deleteTicket,
    getTicketsByStatus,
    getTicketsByTeam,
    getAllActiveTickets,
    getResolvedTickets,
    searchTickets,
    getTicketsByAssignee,
    getTicketsByCreator,
    getTicketsNeedingSLAAttention,
    getInactiveTickets,
    addTicketTag,
    removeTicketTag,
    addTicketNote,
    getTeamStatistics
};
