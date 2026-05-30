const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  completed: {
    type: Map,
    of: Boolean,
    default: {}
  },
  streak: {
    type: Number,
    default: 0
  },
  bestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: String,
    default: null
  },
  xp: {
    type: Number,
    default: 0
  },
  heatmap: {
    type: Map,
    of: Number,
    default: {}
  },
  notes: {
    type: Map,
    of: String,
    default: {}
  },
  theme: {
    type: String,
    default: 'cyber'
  },
  studySessions: {
    type: Array,
    default: []
  },
  subjects: {
    type: [String],
    default: ['DSA', 'ML']
  },
  customResources: {
    type: Array,
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp on save
ProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Progress', ProgressSchema);
