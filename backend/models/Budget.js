import mongoose from 'mongoose';

const budgetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['labor', 'materials', 'equipment', 'permits', 'transportation', 'miscellaneous'],
    },
    allocatedAmount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const budgetSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Budget must belong to a project'],
      unique: true, // one budget document per project
    },
    totalEstimated: {
      type: Number,
      required: [true, 'Total estimated budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    categories: [budgetCategorySchema],
    contingencyPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 10,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ project: 1 }, { unique: true });

// Virtual: contingency amount computed from percentage
budgetSchema.virtual('contingencyAmount').get(function contingencyAmount() {
  return (this.totalEstimated * this.contingencyPercentage) / 100;
});

budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
