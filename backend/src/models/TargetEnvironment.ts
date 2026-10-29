import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILocatorEntry {
  key: string;
  page: string;
  strategy: 'id' | 'css' | 'xpath' | 'name' | 'test_id';
  value: string;
  description?: string;
}

export interface ITargetEnvironment extends Document {
  project_id: mongoose.Types.ObjectId;
  name: string;
  base_url: string;
  allowed_hosts: string[];
  environment_type: 'local' | 'dev' | 'staging' | 'production_authorized';
  is_active: boolean;
  timeouts: {
    page_load_seconds: number;
    implicit_wait_seconds: number;
  };
  locators: ILocatorEntry[];
  auth_config?: {
    login_url_ref?: string;
    username_locator_ref?: string;
    password_locator_ref?: string;
    secret_key_ref?: string;
  };
  created_at: Date;
  updated_at: Date;
}

const LocatorEntrySchema = new Schema<ILocatorEntry>(
  {
    key: { type: String, required: true, trim: true },
    page: { type: String, required: true, trim: true },
    strategy: {
      type: String,
      enum: ['id', 'css', 'xpath', 'name', 'test_id'],
      required: true
    },
    value: { type: String, required: true, trim: true },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const TargetEnvironmentSchema = new Schema<ITargetEnvironment>(
  {
    project_id: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    base_url: {
      type: String,
      required: true,
      trim: true
    },
    allowed_hosts: {
      type: [String],
      required: true,
      default: []
    },
    environment_type: {
      type: String,
      enum: ['local', 'dev', 'staging', 'production_authorized'],
      default: 'staging',
      required: true
    },
    is_active: {
      type: Boolean,
      default: true
    },
    timeouts: {
      page_load_seconds: { type: Number, default: 30 },
      implicit_wait_seconds: { type: Number, default: 5 }
    },
    locators: {
      type: [LocatorEntrySchema],
      default: []
    },
    auth_config: {
      login_url_ref: { type: String },
      username_locator_ref: { type: String },
      password_locator_ref: { type: String },
      secret_key_ref: { type: String }
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

TargetEnvironmentSchema.index({ project_id: 1, name: 1 }, { unique: true });

export const TargetEnvironment: Model<ITargetEnvironment> =
  mongoose.models.TargetEnvironment ||
  mongoose.model<ITargetEnvironment>('TargetEnvironment', TargetEnvironmentSchema);

