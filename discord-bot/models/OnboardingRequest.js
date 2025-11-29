const mongoose = require('mongoose');

const onboardingRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        description: 'Unique identifier for the onboarding request'
    },
    userId: {
        type: String,
        required: true,
        index: true,
        description: 'Discord user ID of the requester'
    },
    username: {
        type: String,
        required: true,
        description: 'Discord username of the requester'
    },
    channelId: {
        type: String,
        required: true,
        description: 'Discord channel ID where request was made'
    },
    messageId: {
        type: String,
        required: true,
        description: 'Discord message ID of the request'
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true,
        description: 'Current status of the onboarding request'
    },
    processedBy: {
        type: String,
        default: null,
        description: 'Discord user ID of the admin who processed the request'
    },
    processedByUsername: {
        type: String,
        default: null,
        description: 'Username of the admin who processed the request'
    },
    processedAt: {
        type: Date,
        default: null,
        description: 'Timestamp when request was processed'
    },
    rejectionReason: {
        type: String,
        default: null,
        description: 'Reason for rejection (if applicable)'
    },
    notes: {
        type: String,
        default: null,
        description: 'Additional notes from the admin'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Composite indexes for common queries
onboardingRequestSchema.index({ status: 1, createdAt: -1 });
onboardingRequestSchema.index({ userId: 1, status: 1 });

// Virtual for calculating pending duration
onboardingRequestSchema.virtual('pendingDuration').get(function() {
    if (this.status !== 'pending') return null;
    return Date.now() - this.createdAt.getTime();
});

// Method to approve request
onboardingRequestSchema.methods.approve = function(adminId, adminUsername, notes = null) {
    this.status = 'approved';
    this.processedBy = adminId;
    this.processedByUsername = adminUsername;
    this.processedAt = new Date();
    if (notes) this.notes = notes;
    return this.save();
};

// Method to reject request
onboardingRequestSchema.methods.reject = function(adminId, adminUsername, reason = null, notes = null) {
    this.status = 'rejected';
    this.processedBy = adminId;
    this.processedByUsername = adminUsername;
    this.processedAt = new Date();
    if (reason) this.rejectionReason = reason;
    if (notes) this.notes = notes;
    return this.save();
};

// Static method to get pending requests count
onboardingRequestSchema.statics.getPendingCount = function() {
    return this.countDocuments({ status: 'pending' });
};

// Static method to get user's pending requests
onboardingRequestSchema.statics.getUserPendingRequests = function(userId) {
    return this.find({ userId, status: 'pending' }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('OnboardingRequest', onboardingRequestSchema);
