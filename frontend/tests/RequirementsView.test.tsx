import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequirementsView } from '../src/features/requirements/RequirementsView';
import { requirementsService, RequirementItem } from '../src/services/requirements';
import { ProjectItem } from '../src/services/projects';

vi.mock('../src/services/requirements');

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
});

