import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequirementsView } from '../src/features/requirements/RequirementsView';
import { requirementsService, RequirementItem } from '../src/services/requirements';
import { generationService, IGenerationJob } from '../src/services/generation';
import { ProjectItem } from '../src/services/projects';

vi.mock('../src/services/requirements');
vi.mock('../src/services/generation');

describe('RequirementsView Component States', () => {
  const dummyProject: ProjectItem = {
    _id: 'proj_123',
    name: 'Authentication Testing',
    description: 'Testing user login flows',
    owner_id: 'usr_1',
    settings: { default_priority: 'medium', require_approval_for_execution: true },
    created_at: '2026-10-29T00:00:00Z',
    updated_at: '2026-10-29T00:00:00Z'
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(requirementsService.listRequirements).mockReturnValue(new Promise(() => {}));

    render(<RequirementsView project={dummyProject} />);

    expect(screen.getByText('Loading requirements...')).toBeInTheDocument();
  });

  it('renders empty state when no requirements exist', async () => {
    vi.mocked(requirementsService.listRequirements).mockResolvedValue([]);

    render(<RequirementsView project={dummyProject} />);

    await waitFor(() => {
      expect(screen.getByText('No Requirements Registered')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/When a customer enters an incorrect password/i)).toBeInTheDocument();
      expect(screen.getByText('0 / 4000 chars')).toBeInTheDocument();
    });
  });

  it('renders requirement list with version badge', async () => {
    const mockRequirements: RequirementItem[] = [
      {
        _id: 'req_1',
        project_id: 'proj_123',
        version: 1,
        original_text: 'Invalid login credentials must display a red error message.',
        normalized_text: 'Invalid login credentials must display a red error message.',
        status: 'draft',
        source_metadata: { jira_key: 'AUTH-101' },
        created_at: '2026-10-29T00:00:00Z',
        updated_at: '2026-10-29T00:00:00Z'
      }
    ];

    vi.mocked(requirementsService.listRequirements).mockResolvedValue(mockRequirements);

    render(<RequirementsView project={dummyProject} />);

    await waitFor(() => {
      expect(screen.getByText('v1')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
      expect(screen.getByText('AUTH-101')).toBeInTheDocument();
      expect(screen.getByText('Invalid login credentials must display a red error message.')).toBeInTheDocument();
    });
  });

  it('renders analyzed requirement with ambiguity finding badge', async () => {
    const mockRequirements: RequirementItem[] = [
      {
        _id: 'req_2',
        project_id: 'proj_123',
        version: 1,
        original_text: 'The portal must be fast and intuitive.',
        normalized_text: 'The portal must be fast and intuitive.',
        status: 'analyzed',
        nlp_analysis: {
          actors: ['user'],
          actions: ['load'],
          entities: ['portal'],
          conditions: [],
          constraints: [],
          outcomes: ['portal must be fast'],
          ambiguity_findings: [
            { phrase: 'fast', reason: 'Vague performance descriptor', severity: 'warning' },
            { phrase: 'intuitive', reason: 'Subjective term', severity: 'warning' }
          ],
          processing_version: 'spacy-3.8-rule-v1'
        },
        ml_classification: {
          category: 'authentication',
          confidence: 0.88,
          model_version: 'v1.0.0-baseline',
          is_uncertain: false
        },
        created_at: '2026-10-29T00:00:00Z',
        updated_at: '2026-10-29T00:00:00Z'
      }
    ];

    vi.mocked(requirementsService.listRequirements).mockResolvedValue(mockRequirements);

    render(<RequirementsView project={dummyProject} />);

    await waitFor(() => {
      expect(screen.getByText('v1')).toBeInTheDocument();
      expect(screen.getByText('analyzed')).toBeInTheDocument();
      expect(screen.getByText(/2 ambiguity findings/i)).toBeInTheDocument();
      expect(screen.getByText('authentication')).toBeInTheDocument();
      expect(screen.getByText('(88%)')).toBeInTheDocument();
      expect(screen.getByText('The portal must be fast and intuitive.')).toBeInTheDocument();
    });
  });

  it('generates test cases and displays candidate cards on action button click', async () => {
    const mockRequirements: RequirementItem[] = [
      {
        _id: 'req_gen',
        project_id: 'proj_123',
        version: 1,
        original_text: 'User must enter password with at least 8 characters.',
        normalized_text: 'User must enter password with at least 8 characters.',
        status: 'analyzed',
        created_at: '2026-10-29T00:00:00Z',
        updated_at: '2026-10-29T00:00:00Z'
      }
    ];

    const mockJob: IGenerationJob = {
      _id: 'job_1',
      project_id: 'proj_123',
      requirement_id: 'req_gen',
      requirement_version: 1,
      requesting_user: 'usr_1',
      status: 'completed',
      provider: 'mock',
      model_name: 'mock-llm-v1',
      prompt_template_version: '1.0.0',
      schema_version: '1.0',
      retry_count: 0,
      duration_ms: 120,
      token_usage: { prompt_tokens: 50, completion_tokens: 150, total_tokens: 200 },
      candidates: [
        {
          schema_version: '1.0',
          test_case_id: 'tc-gen-001',
          requirement_id: 'req_gen',
          requirement_version: 1,
          title: 'Verify password with 8 characters is accepted',
          category: 'validation',
          scenario_type: 'positive',
          preconditions: ['System is available'],
          test_data: { password: 'ValidPass8!' },
          steps: [
            { step_number: 1, action: 'navigate', target_ref: 'signup_page', value_ref: null },
            { step_number: 2, action: 'enter_text', target_ref: 'pwd_field', value_ref: 'ValidPass8!' }
          ],
          expected_result: 'Password accepted without error',
          priority: 'high',
          automation_status: 'requires_configuration',
          assumptions: ['Assumes password field ID is pwd_field'],
          source_evidence: [{ requirement_span: 'at least 8 characters' }],
          review_status: 'pending'
        }
      ],
      created_at: '2026-10-29T00:00:00Z',
      updated_at: '2026-10-29T00:00:00Z'
    };

    vi.mocked(requirementsService.listRequirements).mockResolvedValue(mockRequirements);
    vi.mocked(generationService.getGenerationJobs).mockResolvedValue([]);
    vi.mocked(generationService.generateTestCases).mockResolvedValue(mockJob);

    render(<RequirementsView project={dummyProject} />);

    await waitFor(() => {
      expect(screen.getByText('Generate Cases')).toBeInTheDocument();
    });

    const generateBtn = screen.getByText('Generate Cases');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('1 Generated Cases')).toBeInTheDocument();
      expect(screen.getByText('Verify password with 8 characters is accepted')).toBeInTheDocument();
      expect(screen.getByText('Mock Provider (Offline/Testing)')).toBeInTheDocument();
      expect(screen.getByText(/Unsupported Model Assumptions/i)).toBeInTheDocument();
      expect(screen.getByText('Password accepted without error')).toBeInTheDocument();
    });
  });
});

