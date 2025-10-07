const mongoose = require('mongoose'); // Fixed typo from 'momgoose'
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    searchHistory: [{
        searchDate: {
            type: Date,
            default: Date.now
        },
        selectedArea: String,
        budget: Number,
        preferences: [String],
        results: [{
            location: String,
            score: Number
        }]
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Add search to history
userSchema.methods.addSearchToHistory = function (searchData) {
    this.searchHistory.unshift(searchData);
    if (this.searchHistory.length > 20) {
        this.searchHistory = this.searchHistory.slice(0, 20);
    }
    return this.save();
};

// Get recent searches method
userSchema.methods.getRecentSearches = function (limit = 20) {
    if (!this.searchHistory || this.searchHistory.length === 0) {
        return [];
    }

    // Sort by searchDate (newest first) and limit results
    return this.searchHistory
        .sort((a, b) => new Date(b.searchDate) - new Date(a.searchDate))
        .slice(0, limit);
};

module.exports = mongoose.model('User', userSchema);