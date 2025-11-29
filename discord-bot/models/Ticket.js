const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    team: {
        type: String,
        required: true,
        enum: ['dev', 'comercial', 'coordenacao', 'recrutamento']
    },
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true,
        enum: ['alta', 'media', 'baixa']
    },
    status: {
        type: String,
        required: true,
        enum: ['open', 'progress', 'resolved'],
        default: 'open'
    },
    creator: {
        type: String,
        required: true
    },
    assignee: {
        type: String,
        default: null
    },
    channelId: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true
    },
    threadId: {
        type: String,
        default: null
    },
    workChannelId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    assignedAt: {
        type: Date,
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    slaBreached: {
        type: Boolean,
        default: false
    },
    // SLA Management Fields
    slaDeadline: {
        type: Date,
        default: null
    },
    slaHours: {
        type: Number,
        default: null
    },
    slaPaused: {
        type: Boolean,
        default: false
    },
    slaPausedAt: {
        type: Date,
        default: null
    },
    slaPausedDuration: {
        type: Number,
        default: 0,
        description: 'Total paused time in milliseconds'
    },
    slaStatus: {
        type: String,
        enum: ['on-track', 'warning', 'critical', 'breached'],
        default: 'on-track'
    },
    slaDueDate: {
        type: Date,
        default: null
    },
    // Ticket Management Fields
    priorityKey: {
        type: String,
        enum: ['p0', 'p1', 'p2', 'p3'],
        default: 'p2'
    },
    tags: {
        type: [String],
        default: [],
        description: 'Ticket categorization tags (urgent, blocked, etc.)'
    },
    template: {
        type: String,
        default: null,
        description: 'Template used for ticket creation'
    },
    notes: {
        type: [{
            author: {
                type: String,
                required: true
            },
            content: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            private: {
                type: Boolean,
                default: false
            }
        }],
        default: [],
        description: 'Staff notes on the ticket'
    },
    attachments: {
        type: [String],
        default: [],
        description: 'File attachment URLs'
    },
    // Escalation and Activity Tracking
    escalationLevel: {
        type: Number,
        default: 0,
        description: 'Number of times ticket has been escalated'
    },
    escalatedAt: {
        type: Date,
        default: null
    },
    lastActivityAt: {
        type: Date,
        default: Date.now
    },
    autoCloseWarned: {
        type: Boolean,
        default: false,
        description: 'Whether auto-close warning has been sent'
    },
    autoCloseWarnedAt: {
        type: Date,
        default: null
    },
    // Response Tracking
    firstResponse: {
        type: Date,
        default: null
    },
    responseTime: {
        type: Number,
        default: null,
        description: 'Time to first response in milliseconds'
    },
    resolutionTime: {
        type: Number,
        default: null,
        description: 'Time to resolution in milliseconds'
    },
    // Related Tickets
    relatedTickets: {
        type: [String],
        default: [],
        description: 'IDs of related/duplicate tickets'
    },
    parentTicketId: {
        type: String,
        default: null,
        description: 'If this is a duplicate, ID of the primary ticket'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
ticketSchema.index({ team: 1, status: 1 });
ticketSchema.index({ creator: 1 });
ticketSchema.index({ assignee: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ slaDeadline: 1 });
ticketSchema.index({ tags: 1 });
ticketSchema.index({ priorityKey: 1 });
ticketSchema.index({ lastActivityAt: -1 });

// Virtual for checking if ticket is overdue
ticketSchema.virtual('isOverdue').get(function() {
    if (!this.slaDeadline || this.status === 'resolved') return false;
    return new Date() > this.slaDeadline;
});

// Method to calculate SLA remaining time
ticketSchema.methods.getSLARemaining = function() {
    if (!this.slaDeadline) return null;
    const now = Date.now();
    const deadline = this.slaDeadline.getTime();
    return Math.max(0, deadline - now);
};

// Method to add a note
ticketSchema.methods.addNote = function(author, content, isPrivate = false) {
    this.notes.push({
        author,
        content,
        private: isPrivate,
        createdAt: new Date()
    });
    return this.save();
};

// Method to add a tag
ticketSchema.methods.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
        this.tags.push(tag);
        return this.save();
    }
    return Promise.resolve(this);
};

// Method to remove a tag
ticketSchema.methods.removeTag = function(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
        this.tags.splice(index, 1);
        return this.save();
    }
    return Promise.resolve(this);
};

module.exports = mongoose.model('Ticket', ticketSchema);
