import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserRole } from './User';

export interface IProjectMember {
  user_id: mongoose.Types.ObjectId;
  role: UserRole;
}

export interface IProjectSettings {
  default_priority: 'low' | 'medium' | 'high' | 'critical';
  require_approval_for_execution: boolean;
}

export interface IProject extends Document {
  name: string;
  description: string;
  owner_id: mongoose.Types.ObjectId;
  members: IProjectMember[];
  settings: IProjectSettings;
  created_at: Date;
  updated_at: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'qa_engineer', 'viewer'],
      required: true
    }
  },
  { _id: false }
);

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    members: {
      type: [ProjectMemberSchema],
      default: []
    },
    settings: {
      default_priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      require_approval_for_execution: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

ProjectSchema.index({ 'members.user_id': 1 });
ProjectSchema.index({ owner_id: 1, created_at: -1 });

export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

