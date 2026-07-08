import mongoose from 'mongoose';

const sitePhotoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const progressLogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Progress log must belong to a project'],
    },
    type: {
      type: String,
      enum: ['daily', 'weekly'],
      required: [true, 'Log type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Log date is required'],
      default: Date.now,
    },
    workSummary: {
      type: String,
      required: [true, 'Work summary is required'],
      maxlength: 3000,
    },
    weatherConditions: {
      type: String,
      trim: true,
      default: '',
    },
    laborCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    issuesReported: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, 'Completion percentage is required'],
    },
    sitePhotos: [sitePhotoSchema],
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

progressLogSchema.index({ project: 1, date: -1 });
progressLogSchema.index({ type: 1 });

const Progress = mongoose.model('Progress', progressLogSchema);

export default Progress;
