import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    description: { type: String, required: true },
    cost: { type: Number, default: 0, min: 0 },
    performedBy: { type: String, trim: true },
  },
  { _id: true }
);

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    type: {
      type: String,
      enum: ['equipment', 'material', 'tool', 'vehicle'],
      required: [true, 'Resource type is required'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Resource must be allocated to a project'],
    },
    vendor: {
      name: { type: String, trim: true },
      contactPerson: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 1,
    },
    unit: {
      type: String,
      enum: ['pcs', 'kg', 'ton', 'liter', 'cubic-meter', 'bag', 'unit'],
      default: 'unit',
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    status: {
      type: String,
      enum: ['available', 'in-use', 'under-maintenance', 'depleted', 'retired'],
      default: 'available',
    },
    allocatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    purchaseDate: {
      type: Date,
    },
    maintenanceRecords: [maintenanceRecordSchema],
    notes: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ project: 1 });
resourceSchema.index({ type: 1 });
resourceSchema.index({ status: 1 });
resourceSchema.index({ name: 'text' });

// Virtual: total cost = quantity * unitCost + all maintenance costs
resourceSchema.virtual('totalCost').get(function totalCost() {
  const maintenanceCost = (this.maintenanceRecords || []).reduce(
    (sum, m) => sum + (m.cost || 0),
    0
  );
  return this.quantity * this.unitCost + maintenanceCost;
});

resourceSchema.set('toJSON', { virtuals: true });
resourceSchema.set('toObject', { virtuals: true });

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
