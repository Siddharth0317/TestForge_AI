import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Requirement } from '../models/Requirement';
import { TargetEnvironment } from '../models/TargetEnvironment';
import { logger } from '../utils/logger';

export async function populateSeedData(): Promise<void> {
  logger.info('Starting database seed procedure...');

  // 1. Create or ensure Seed Users
  const usersToSeed = [
    {
      email: 'admin@testforge.local',
      password: 'AdminPassword123!',
      role: 'admin' as const
    },
    {
      email: 'qa@testforge.local',
      password: 'QAPassword123!',
      role: 'qa_engineer' as const
    },
    {
      email: 'viewer@testforge.local',
      password: 'ViewerPassword123!',
      role: 'viewer' as const
    }
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of usersToSeed) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const password_hash = await bcrypt.hash(u.password, 10);
      user = await User.create({
        email: u.email,
        password_hash,
        role: u.role,
        status: 'active'
      });
      logger.info({ email: u.email, role: u.role }, 'Seeded user created.');
    }
    createdUsers[u.role] = user;
  }

  // 2. Create or ensure Default Demo Project
  let demoProject = await Project.findOne({ name: 'Demo E-Commerce Project' });
  if (!demoProject) {
    demoProject = await Project.create({
      name: 'Demo E-Commerce Project',
      description: 'E-commerce web application test suite covering auth, cart, and checkout.',
      owner_id: createdUsers.admin._id,
      members: [
        { user_id: createdUsers.admin._id, role: 'admin' },
        { user_id: createdUsers.qa_engineer._id, role: 'qa_engineer' },
        { user_id: createdUsers.viewer._id, role: 'viewer' }
      ],
      settings: {
        default_priority: 'high',
        require_approval_for_execution: true
      }
    });
    logger.info({ projectId: demoProject._id }, 'Seeded demo project created.');
  }

  // 3. Create or ensure Seed Requirement
  const existingReq = await Requirement.findOne({ project_id: demoProject._id });
  if (!existingReq) {
    const rawReq = 'When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes and display an informative lockout message.';
    await Requirement.create({
      project_id: demoProject._id,
      version: 1,
      original_text: rawReq,
      normalized_text: rawReq.trim().replace(/\s+/g, ' '),
      source_metadata: {
        jira_key: 'SEC-101',
        author: 'System Admin'
      },
      status: 'analyzed',
      nlp_analysis: {
        actors: ['customer'],
        actions: ['enter', 'lock', 'display'],
        entities: ['password', 'login form', 'lockout message'],
        conditions: ['When a customer enters an incorrect password three consecutive times'],
        constraints: ['15 minutes', 'three consecutive times'],
        outcomes: ['the login form must be locked for 15 minutes', 'display an informative lockout message'],
        explicit_negations: [],
        ambiguity_findings: [],
        evidence_spans: [
          { category: 'actor', text: 'customer', start_char: 7, end_char: 15, confidence: 0.9 },
          { category: 'constraint', text: '15 minutes', start_char: 94, end_char: 104, confidence: 0.95 }
        ],
        processing_version: 'spacy-3.8-rule-v1'
      },
      created_by: createdUsers.qa_engineer._id
    });
    logger.info('Seeded initial requirement created with spaCy NLP analysis.');
  }

  // 4. Create or ensure Local CI Target Environment
  const existingEnv = await TargetEnvironment.findOne({ project_id: demoProject._id, name: 'Local CI Fixture' });
  if (!existingEnv) {
    await TargetEnvironment.create({
      project_id: demoProject._id,
      name: 'Local CI Fixture',
      base_url: 'http://localhost:8080',
      allowed_hosts: ['localhost', '127.0.0.1'],
      environment_type: 'local',
      is_active: true,
      timeouts: {
        page_load_seconds: 15,
        implicit_wait_seconds: 3
      },
      locators: [
        {
          key: 'username_input',
          page: 'login',
          strategy: 'id',
          value: 'username',
          description: 'Login username field'
        },
        {
          key: 'password_input',
          page: 'login',
          strategy: 'id',
          value: 'password',
          description: 'Login password field'
        },
        {
          key: 'login_button',
          page: 'login',
          strategy: 'id',
          value: 'login_button',
          description: 'Login submit button'
        },
        {
          key: 'alert_box',
          page: 'login',
          strategy: 'id',
          value: 'alert_box',
          description: 'Alert message banner'
        }
      ]
    });
    logger.info('Seeded target environment created.');
  }

  logger.info('Database seeding completed successfully.');
}

export async function seedDatabase(): Promise<void> {
  await connectDatabase();
  await populateSeedData();
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seed failed:', err);
      await disconnectDatabase();
      process.exit(1);
    });
}
