const mongoose = require('mongoose');

const studyPartnerSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending',
  },
  matchScore: { type: Number, min: 0, max: 100 },
  sharedSubjects: [String],
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyGroup' },
}, {
  timestamps: true,
});

studyPartnerSchema.index({ requester: 1, recipient: 1 }, { unique: true });

const studyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  isActive: { type: Boolean, default: true },
  maxMembers: { type: Number, default: 10 },
}, {
  timestamps: true,
});

const StudyPartner = mongoose.model('StudyPartner', studyPartnerSchema);
const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);

module.exports = { StudyPartner, StudyGroup };
