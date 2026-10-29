import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITestStep {
  step_number: number;
  action: 'navigate' | 'click' | 'enter_text' | 'select_option' | 'wait_for_visible' | 'assert_text' | 'assert_visible' | 'assert_url';
  target_ref: string;
  value_ref?: string | null;
}

export interface ISourceEvidence {
  requirement_span: string;
}

export interface ICandidateTestCase {
  schema_version: string;
  test_case_id: string;
  requirement_id: string;
  requirement_version: number;
  title: string;
  category: string;
  scenario_type: 'positive' | 'negative' | 'boundary' | 'authorization' | 'error_handling' | 'state_transition';
  preconditions: string[];
  test_data: Record<string, any>;
  steps: ITestStep[];
  expected_result: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  automation_status: 'requires_configuration' | 'executable' | 'unsupported';
  assumptions: string[];
  source_evidence: ISourceEvidence[];
  review_status: 'pending' | 'approved' | 'rejected' | 'needs_changes';
}

export interface ITokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface IGenerationJob extends Document {
  project_id: mongoose.Types.ObjectId;
  requirement_id: mongoose.Types.ObjectId;
  requirement_version: number;
  requesting_user: mongoose.Types.ObjectId;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'needs_review' | 'cancelled';
  provider: string;
  model_name: string;
  prompt_template_version: string;
  schema_version: string;
  retry_count: number;
  duration_ms: number;
  token_usage: ITokenUsage;
  candidates: ICandidateTestCase[];
  error_code?: string;
  error_summary?: string;
  created_at: Date;
  updated_at: Date;
}

const TestStepSchema = new Schema<ITestStep>(
  {
    step_number: { type: Number, required: true },
    action: {
      type: String,
      required: true,
      enum: ['navigate', 'click', 'enter_text', 'select_option', 'wait_for_visible', 'assert_text', 'assert_visible', 'assert_url']
    },
    target_ref: { type: String, required: true, trim: true },
    value_ref: { type: String, default: null }
  },
  { _id: false }
);

const CandidateTestCaseSchema = new Schema<ICandidateTestCase>(
  {
    schema_version: { type: String, default: '1.0' },
    test_case_id: { type: String, required: true },
    requirement_id: { type: String, required: true },
    requirement_version: { type: Number, default: 1 },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    scenario_type: {
      type: String,
      required: true,
      enum: ['positive', 'negative', 'boundary', 'authorization', 'error_handling', 'state_transition']
    },
    preconditions: { type: [String], default: [] },
    test_data: { type: Schema.Types.Mixed, default: {} },
    steps: { type: [TestStepSchema], required: true },
    expected_result: { type: String, required: true },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium'
    },
    automation_status: {
      type: String,
      enum: ['requires_configuration', 'executable', 'unsupported'],
      default: 'requires_configuration'
    },
    assumptions: { type: [String], default: [] },
    source_evidence: [
      {
        requirement_span: { type: String, required: true },
        _id: false
      }
    ],
    review_status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_changes'],
      default: 'pending'
    }
  },
  { _id: false }
);

const GenerationJobSchema = new Schema<IGenerationJob>(
  {
    project_id: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    requirement_id: {
      type: Schema.Types.ObjectId,
      ref: 'Requirement',
      required: true,
      index: true
    },
    requirement_version: {
      type: Number,
      required: true,
      default: 1
    },
    requesting_user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'needs_review', 'cancelled'],
      default: 'queued',
      required: true,
      index: true
    },
    provider: {
      type: String,
      required: true
    },
    model_name: {
      type: String,
      required: true
    },
    prompt_template_version: {
      type: String,
      default: '1.0.0'
    },
    schema_version: {
      type: String,
      default: '1.0'
    },
    retry_count: {
      type: Number,
      default: 0
    },
    duration_ms: {
      type: Number,
      default: 0
    },
    token_usage: {
      prompt_tokens: { type: Number, default: 0 },
      completion_tokens: { type: Number, default: 0 },
      total_tokens: { type: Number, default: 0 }
    },
    candidates: {
      type: [CandidateTestCaseSchema],
      default: []
    },
    error_code: {
      type: String,
      trim: true
    },
    error_summary: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Compound index for querying project/requirement generation history
GenerationJobSchema.index({ project_id: 1, requirement_id: 1, created_at: -1 });

export const GenerationJob: Model<IGenerationJob> =
  (mongoose.models.GenerationJob as Model<IGenerationJob>) ||
  mongoose.model<IGenerationJob>('GenerationJob', GenerationJobSchema);
