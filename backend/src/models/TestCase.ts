import mongoose, { Schema, Document, Types } from 'mongoose';

export type ScenarioType =
  | 'positive'
  | 'negative'
  | 'boundary'
  | 'authorization'
  | 'error_handling'
  | 'state_transition';

export type ActionType =
  | 'navigate'
  | 'click'
  | 'enter_text'
  | 'select_option'
  | 'wait_for_visible'
  | 'assert_text'
  | 'assert_visible'
  | 'assert_url';

export type AssertionType =
  | 'assert_visible'
  | 'assert_not_visible'
  | 'assert_text'
  | 'assert_url';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type AutomationStatus =
  | 'manual_only'
  | 'requires_configuration'
  | 'ready'
  | 'not_executable';

export type ReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_changes';

export interface ITestStep {
  step_number: number;
  action: ActionType;
  target_ref: string;
  value_ref?: string | null;
}

export interface IAssertion {
  type: AssertionType;
  target_ref: string;
  expected_value?: string | null;
  timeout_ms: number;
}

export interface ISourceEvidence {
  requirement_span: string;
}

export interface IValidationFinding {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

export interface ITestCase extends Document {
  project_id: Types.ObjectId;
  requirement_id: Types.ObjectId;
  requirement_version: number;
  version: number;
  is_current: boolean;
  title: string;
  category: string;
  scenario_type: ScenarioType;
  preconditions: string[];
  test_data: Record<string, any>;
  steps: ITestStep[];
  expected_result: string;
  assertions: IAssertion[];
  priority: Priority;
  priority_score: number;
  priority_rationale?: string;
  automation_status: AutomationStatus;
  validation_findings: IValidationFinding[];
  is_duplicate: boolean;
  duplicate_of_id?: Types.ObjectId;
  duplicate_reason?: string;
  assumptions: string[];
  ambiguity_flags: string[];
  source_evidence: ISourceEvidence[];
  review_status: ReviewStatus;
  review_notes?: string | null;
  reviewed_by?: Types.ObjectId | null;
  reviewed_at?: Date | null;
  previous_version_id?: Types.ObjectId | null;
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

const AssertionSchema = new Schema<IAssertion>(
  {
    type: {
      type: String,
      required: true,
      enum: ['assert_visible', 'assert_not_visible', 'assert_text', 'assert_url']
    },
    target_ref: { type: String, required: true, trim: true },
    expected_value: { type: String, default: null },
    timeout_ms: { type: Number, default: 5000 }
  },
  { _id: false }
);

const SourceEvidenceSchema = new Schema<ISourceEvidence>(
  {
    requirement_span: { type: String, required: true }
  },
  { _id: false }
);

const ValidationFindingSchema = new Schema<IValidationFinding>(
  {
    rule: { type: String, required: true },
    severity: { type: String, required: true, enum: ['error', 'warning', 'info'] },
    message: { type: String, required: true },
    field: { type: String }
  },
  { _id: false }
);

const TestCaseSchema = new Schema<ITestCase>(
  {
    project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    requirement_id: { type: Schema.Types.ObjectId, ref: 'Requirement', required: true, index: true },
    requirement_version: { type: Number, required: true, default: 1 },
    version: { type: Number, required: true, default: 1 },
    is_current: { type: Boolean, required: true, default: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    category: { type: String, default: 'business_logic', trim: true },
    scenario_type: {
      type: String,
      required: true,
      enum: ['positive', 'negative', 'boundary', 'authorization', 'error_handling', 'state_transition']
    },
    preconditions: { type: [String], default: [] },
    test_data: { type: Schema.Types.Mixed, default: {} },
    steps: { type: [TestStepSchema], default: [] },
    expected_result: { type: String, required: true, trim: true },
    assertions: { type: [AssertionSchema], default: [] },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    priority_score: { type: Number, default: 50, min: 0, max: 100 },
    priority_rationale: { type: String, default: '' },
    automation_status: {
      type: String,
      required: true,
      enum: ['manual_only', 'requires_configuration', 'ready', 'not_executable'],
      default: 'requires_configuration'
    },
    validation_findings: { type: [ValidationFindingSchema], default: [] },
    is_duplicate: { type: Boolean, default: false },
    duplicate_of_id: { type: Schema.Types.ObjectId, ref: 'TestCase', default: null },
    duplicate_reason: { type: String, default: null },
    assumptions: { type: [String], default: [] },
    ambiguity_flags: { type: [String], default: [] },
    source_evidence: { type: [SourceEvidenceSchema], default: [] },
    review_status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'needs_changes'],
      default: 'pending'
    },
    review_notes: { type: String, default: null },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewed_at: { type: Date, default: null },
    previous_version_id: { type: Schema.Types.ObjectId, ref: 'TestCase', default: null }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Compound Indexes for fast, tenant-isolated lookups
TestCaseSchema.index({ project_id: 1, requirement_id: 1, is_current: 1 });
TestCaseSchema.index({ project_id: 1, review_status: 1 });
TestCaseSchema.index({ project_id: 1, automation_status: 1 });
TestCaseSchema.index({ requirement_id: 1, version: 1 });

export const TestCase = mongoose.model<ITestCase>('TestCase', TestCaseSchema);
