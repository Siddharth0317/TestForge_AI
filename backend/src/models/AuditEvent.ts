import mongoose, { Schema, Document, Types } from 'mongoose';

export type AuditEntityType = 'test_case' | 'requirement' | 'generation_job' | 'target_environment' | 'project';

export interface IAuditEvent extends Document {
  project_id: Types.ObjectId;
  entity_type: AuditEntityType;
  entity_id: Types.ObjectId;
  action: string;
  actor_id: Types.ObjectId;
  actor_email: string;
  details: Record<string, any>;
  timestamp: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    entity_type: {
      type: String,
      required: true,
      enum: ['test_case', 'requirement', 'generation_job', 'target_environment', 'project']
    },
    entity_id: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, required: true, trim: true },
    actor_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actor_email: { type: String, required: true, trim: true },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: false
  }
);

// Compound indexes for audit lookups
AuditEventSchema.index({ project_id: 1, timestamp: -1 });
AuditEventSchema.index({ entity_id: 1, timestamp: -1 });

export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);

