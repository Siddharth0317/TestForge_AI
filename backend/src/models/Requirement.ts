import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INLPAnalysis {
  actors: string[];
  actions: string[];
  entities: string[];
  conditions: string[];
  constraints: string[];
  outcomes: string[];
  ambiguity_findings: Array<{
    phrase: string;
    reason: string;
    severity: 'warning' | 'info';
  }>;
}

export interface IMLClassification {
  category: string;
  confidence: number;
  model_version: string;
  is_uncertain: boolean;
}

export interface IRequirement extends Document {
  project_id: mongoose.Types.ObjectId;
  version: number;
  original_text: string;
  normalized_text: string;
  source_metadata?: {
    jira_key?: string;
    author?: string;
    document_ref?: string;
  };
  nlp_analysis?: INLPAnalysis;
  ml_classification?: IMLClassification;
  status: 'draft' | 'analyzed' | 'archived';
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const RequirementSchema = new Schema<IRequirement>(
  {
    project_id: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    version: {
      type: Number,
      default: 1,
      required: true
    },
    original_text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    },
    normalized_text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    },
    source_metadata: {
      jira_key: { type: String, trim: true },
      author: { type: String, trim: true },
      document_ref: { type: String, trim: true }
    },
    nlp_analysis: {
      actors: { type: [String], default: [] },
      actions: { type: [String], default: [] },
      entities: { type: [String], default: [] },
      conditions: { type: [String], default: [] },
      constraints: { type: [String], default: [] },
      outcomes: { type: [String], default: [] },
      ambiguity_findings: {
        type: [
          {
            phrase: String,
            reason: String,
            severity: { type: String, enum: ['warning', 'info'], default: 'warning' }
          }
        ],
        default: []
      }
    },
    ml_classification: {
      category: { type: String },
      confidence: { type: Number },
      model_version: { type: String },
      is_uncertain: { type: Boolean, default: false }
    },
    status: {
      type: String,
      enum: ['draft', 'analyzed', 'archived'],
      default: 'draft',
      required: true,
      index: true
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

RequirementSchema.index({ project_id: 1, created_at: -1 });

export const Requirement: Model<IRequirement> =
  mongoose.models.Requirement || mongoose.model<IRequirement>('Requirement', RequirementSchema);

