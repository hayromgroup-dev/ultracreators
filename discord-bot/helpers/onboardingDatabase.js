const OnboardingRequest = require('../models/OnboardingRequest');

/**
 * Database helper functions for onboarding request management
 * Provides CRUD operations and common queries for onboarding requests
 */

/**
 * Create a new onboarding request
 * @param {Object} requestData - Onboarding request data
 * @param {string} requestData.requestId - Unique request ID
 * @param {string} requestData.userId - Discord user ID
 * @param {string} requestData.username - Discord username
 * @param {string} requestData.channelId - Channel ID
 * @param {string} requestData.messageId - Message ID
 * @returns {Promise<Object>} Created request document
 */
async function createOnboardingRequest(requestData) {
    try {
        const request = new OnboardingRequest(requestData);
        await request.save();
        console.log(`✅ Onboarding request created in DB: ${request.requestId}`);
        return request;
    } catch (error) {
        console.error(`❌ Error creating onboarding request:`, error);
        throw error;
    }
}

/**
 * Get an onboarding request by ID
 * @param {string} requestId - Request ID
 * @returns {Promise<Object|null>} Request document or null if not found
 */
async function getOnboardingRequest(requestId) {
    try {
        const request = await OnboardingRequest.findOne({ requestId });
        return request;
    } catch (error) {
        console.error(`❌ Error fetching onboarding request ${requestId}:`, error);
        throw error;
    }
}

/**
 * Update an onboarding request
 * @param {string} requestId - Request ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated request document or null if not found
 */
async function updateOnboardingRequest(requestId, updates) {
    try {
        const request = await OnboardingRequest.findOneAndUpdate(
            { requestId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (request) {
            console.log(`✅ Onboarding request updated in DB: ${requestId}`);
        } else {
            console.warn(`⚠️  Onboarding request not found for update: ${requestId}`);
        }

        return request;
    } catch (error) {
        console.error(`❌ Error updating onboarding request ${requestId}:`, error);
        throw error;
    }
}

/**
 * Delete an onboarding request
 * @param {string} requestId - Request ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteOnboardingRequest(requestId) {
    try {
        const result = await OnboardingRequest.deleteOne({ requestId });

        if (result.deletedCount > 0) {
            console.log(`✅ Onboarding request deleted from DB: ${requestId}`);
            return true;
        } else {
            console.warn(`⚠️  Onboarding request not found for deletion: ${requestId}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error deleting onboarding request ${requestId}:`, error);
        throw error;
    }
}

/**
 * Get all pending onboarding requests
 * @returns {Promise<Array>} Array of pending request documents
 */
async function getAllPendingRequests() {
    try {
        const requests = await OnboardingRequest.find({ status: 'pending' })
            .sort({ createdAt: 1 }); // Oldest first
        return requests;
    } catch (error) {
        console.error(`❌ Error fetching pending onboarding requests:`, error);
        throw error;
    }
}

/**
 * Get all onboarding requests by status
 * @param {string} status - Status to filter by (pending, approved, rejected)
 * @param {number} limit - Maximum number of requests to return (default: 100)
 * @returns {Promise<Array>} Array of request documents
 */
async function getRequestsByStatus(status, limit = 100) {
    try {
        const requests = await OnboardingRequest.find({ status })
            .sort({ createdAt: -1 })
            .limit(limit);
        return requests;
    } catch (error) {
        console.error(`❌ Error fetching onboarding requests with status ${status}:`, error);
        throw error;
    }
}

/**
 * Get onboarding requests by user
 * @param {string} userId - Discord user ID
 * @returns {Promise<Array>} Array of request documents
 */
async function getRequestsByUser(userId) {
    try {
        const requests = await OnboardingRequest.find({ userId })
            .sort({ createdAt: -1 });
        return requests;
    } catch (error) {
        console.error(`❌ Error fetching onboarding requests for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Get user's pending requests
 * @param {string} userId - Discord user ID
 * @returns {Promise<Array>} Array of pending request documents
 */
async function getUserPendingRequests(userId) {
    try {
        const requests = await OnboardingRequest.getUserPendingRequests(userId);
        return requests;
    } catch (error) {
        console.error(`❌ Error fetching pending requests for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Check if user has pending requests
 * @param {string} userId - Discord user ID
 * @returns {Promise<boolean>} True if user has pending requests
 */
async function hasPendingRequest(userId) {
    try {
        const count = await OnboardingRequest.countDocuments({
            userId,
            status: 'pending'
        });
        return count > 0;
    } catch (error) {
        console.error(`❌ Error checking pending requests for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Approve an onboarding request
 * @param {string} requestId - Request ID
 * @param {string} adminId - Admin user ID
 * @param {string} adminUsername - Admin username
 * @param {string} notes - Optional notes
 * @returns {Promise<Object|null>} Updated request document or null if not found
 */
async function approveRequest(requestId, adminId, adminUsername, notes = null) {
    try {
        const request = await OnboardingRequest.findOne({ requestId });
        if (!request) {
            console.warn(`⚠️  Onboarding request not found: ${requestId}`);
            return null;
        }

        await request.approve(adminId, adminUsername, notes);
        console.log(`✅ Onboarding request approved: ${requestId} by ${adminUsername}`);
        return request;
    } catch (error) {
        console.error(`❌ Error approving onboarding request ${requestId}:`, error);
        throw error;
    }
}

/**
 * Reject an onboarding request
 * @param {string} requestId - Request ID
 * @param {string} adminId - Admin user ID
 * @param {string} adminUsername - Admin username
 * @param {string} reason - Rejection reason
 * @param {string} notes - Optional additional notes
 * @returns {Promise<Object|null>} Updated request document or null if not found
 */
async function rejectRequest(requestId, adminId, adminUsername, reason = null, notes = null) {
    try {
        const request = await OnboardingRequest.findOne({ requestId });
        if (!request) {
            console.warn(`⚠️  Onboarding request not found: ${requestId}`);
            return null;
        }

        await request.reject(adminId, adminUsername, reason, notes);
        console.log(`✅ Onboarding request rejected: ${requestId} by ${adminUsername}`);
        return request;
    } catch (error) {
        console.error(`❌ Error rejecting onboarding request ${requestId}:`, error);
        throw error;
    }
}

/**
 * Get count of pending requests
 * @returns {Promise<number>} Number of pending requests
 */
async function getPendingCount() {
    try {
        const count = await OnboardingRequest.getPendingCount();
        return count;
    } catch (error) {
        console.error(`❌ Error getting pending request count:`, error);
        throw error;
    }
}

/**
 * Get onboarding statistics
 * @returns {Promise<Object>} Statistics object
 */
async function getOnboardingStatistics() {
    try {
        const [total, pending, approved, rejected] = await Promise.all([
            OnboardingRequest.countDocuments({}),
            OnboardingRequest.countDocuments({ status: 'pending' }),
            OnboardingRequest.countDocuments({ status: 'approved' }),
            OnboardingRequest.countDocuments({ status: 'rejected' })
        ]);

        // Calculate approval rate
        const processed = approved + rejected;
        const approvalRate = processed > 0 ? ((approved / processed) * 100).toFixed(2) : 0;

        return {
            total,
            pending,
            approved,
            rejected,
            processed,
            approvalRate: `${approvalRate}%`
        };
    } catch (error) {
        console.error(`❌ Error fetching onboarding statistics:`, error);
        throw error;
    }
}

/**
 * Get old pending requests (for cleanup/reminders)
 * @param {number} hoursOld - Hours threshold
 * @returns {Promise<Array>} Array of old pending request documents
 */
async function getOldPendingRequests(hoursOld = 24) {
    try {
        const threshold = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));

        const requests = await OnboardingRequest.find({
            status: 'pending',
            createdAt: { $lte: threshold }
        }).sort({ createdAt: 1 });

        return requests;
    } catch (error) {
        console.error(`❌ Error fetching old pending requests:`, error);
        throw error;
    }
}

/**
 * Search onboarding requests with flexible filters
 * @param {Object} query - Query object with filters
 * @param {string} query.status - Status filter (optional)
 * @param {string} query.userId - User ID filter (optional)
 * @param {string} query.processedBy - Processed by admin ID filter (optional)
 * @param {Date} query.createdAfter - Created after date (optional)
 * @param {Date} query.createdBefore - Created before date (optional)
 * @param {number} query.limit - Maximum results (default: 100)
 * @returns {Promise<Array>} Array of request documents
 */
async function searchRequests(query = {}) {
    try {
        const filters = {};

        if (query.status) filters.status = query.status;
        if (query.userId) filters.userId = query.userId;
        if (query.processedBy) filters.processedBy = query.processedBy;

        // Date range filters
        if (query.createdAfter || query.createdBefore) {
            filters.createdAt = {};
            if (query.createdAfter) filters.createdAt.$gte = query.createdAfter;
            if (query.createdBefore) filters.createdAt.$lte = query.createdBefore;
        }

        const limit = query.limit || 100;

        const requests = await OnboardingRequest.find(filters)
            .sort({ createdAt: -1 })
            .limit(limit);

        return requests;
    } catch (error) {
        console.error(`❌ Error searching onboarding requests:`, error);
        throw error;
    }
}

module.exports = {
    createOnboardingRequest,
    getOnboardingRequest,
    updateOnboardingRequest,
    deleteOnboardingRequest,
    getAllPendingRequests,
    getRequestsByStatus,
    getRequestsByUser,
    getUserPendingRequests,
    hasPendingRequest,
    approveRequest,
    rejectRequest,
    getPendingCount,
    getOnboardingStatistics,
    getOldPendingRequests,
    searchRequests
};
