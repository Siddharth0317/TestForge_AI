import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestCasesView } from '../src/features/test-cases/TestCasesView';
import * as testCasesApi from '../src/services/testCases';
import { ProjectItem } from '../src/services/projects';

vi.mock('../src/services/testCases');

describe('TestCasesView Component Tests', () => {
  const dummyProject: ProjectItem = {
    _id: 'proj_123',
    name: 'E-Commerce Platform',
    description: 'Testing store checkouts',
    owner_id: 'usr_1',
    settings: { default_priority: 'medium', require_approval_for_execution: true },
    created_at: '2026-10-29T00:00:00Z',
    updated_at: '2026-10-29T00:00:00Z'
  };

  const sampleTestCase: testCasesApi.TestCaseItem = {
    _id: 'tc_001',
    project_id: 'proj_123',
    requirement_id: 'req_001',
    requirement_version: 1,
    version: 1,
    is_current: true,
    title: 'Valid login with standard customer credentials',
    category: 'authentication',
    scenario_type: 'positive',
    preconditions: ['Customer account is active'],
    test_data: { email: 'user@test.local' },
    steps: [
      { step_number: 1, action: 'navigate', target_ref: 'login_page', value_ref: null },
      { step_number: 2, action: 'enter_text', target_ref: 'email_field', value_ref: 'user@test.local' },
      { step_number: 3, action: 'click', target_ref: 'submit_btn', value_ref: null }
    ],
    expected_result: 'Customer lands on home overview with active session.',
    assertions: [
      { type: 'assert_visible', target_ref: 'home_overview', timeout_ms: 5000 }
    ],
    priority: 'high',
    priority_score: 75,
    priority_rationale: 'Base scenario positive (+30) | Critical keywords (+20)',
    automation_status: 'requires_configuration',
    validation_findings: [
      { rule: 'unstated_assumptions', severity: 'info', message: 'Relies on 1 unstated assumption' }
    ],
    is_duplicate: false,
    assumptions: ['Assumes customer already accepted cookies'],
    ambiguity_flags: [],
    source_evidence: [{ requirement_span: 'customer can log in' }],
    review_status: 'pending',
    created_at: '2026-10-29T10:00:00Z',
    updated_at: '2026-10-29T10:00:00Z'
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(testCasesApi.fetchProjectTestCases).mockReturnValue(new Promise(() => {}));

    render(<TestCasesView project={dummyProject} />);

    expect(screen.getByText('Loading test cases...')).toBeInTheDocument();
  });

  it('renders empty state when no test cases exist', async () => {
    vi.mocked(testCasesApi.fetchProjectTestCases).mockResolvedValue({ test_cases: [], count: 0 });

    render(<TestCasesView project={dummyProject} />);

    await waitFor(() => {
      expect(screen.getByText('No Test Cases Found')).toBeInTheDocument();
      expect(screen.getByText('Test Case Explorer & Review Studio')).toBeInTheDocument();
    });
  });

  it('renders test cases with badges, priority scores, and actions', async () => {
    vi.mocked(testCasesApi.fetchProjectTestCases).mockResolvedValue({
      test_cases: [sampleTestCase],
      count: 1
    });

    render(<TestCasesView project={dummyProject} />);

    await waitFor(() => {
      expect(screen.getByText('Valid login with standard customer credentials')).toBeInTheDocument();
      expect(screen.getByText('positive')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
      expect(screen.getByText('75/100')).toBeInTheDocument();
      expect(screen.getAllByText('pending').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
      expect(screen.getByText('Request Changes')).toBeInTheDocument();
    });
  });

  it('renders duplicate warning callout when test case is flagged as duplicate', async () => {
    const duplicateTestCase: testCasesApi.TestCaseItem = {
      ...sampleTestCase,
      _id: 'tc_002',
      is_duplicate: true,
      duplicate_reason: "Matches title of existing test case 'Valid login'"
    };

    vi.mocked(testCasesApi.fetchProjectTestCases).mockResolvedValue({
      test_cases: [duplicateTestCase],
      count: 1
    });

    render(<TestCasesView project={dummyProject} />);

    await waitFor(() => {
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText(/Matches title of existing test case/i)).toBeInTheDocument();
    });
  });

  it('opens approval modal and completes approval', async () => {
    vi.mocked(testCasesApi.fetchProjectTestCases).mockResolvedValue({
      test_cases: [sampleTestCase],
      count: 1
    });
    vi.mocked(testCasesApi.approveTestCase).mockResolvedValue({
      test_case: { ...sampleTestCase, review_status: 'approved' },
      status: 'approved'
    });

    render(<TestCasesView project={dummyProject} />);

    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Approve'));

    await waitFor(() => {
      expect(screen.getByText('Approve Test Case')).toBeInTheDocument();
      expect(screen.getByText('Confirm Approval')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm Approval'));

    await waitFor(() => {
      expect(testCasesApi.approveTestCase).toHaveBeenCalledWith('tc_001', undefined);
    });
  });

  it('disables approve button when test case has blocking validation errors', async () => {
    const errorTestCase: testCasesApi.TestCaseItem = {
      ...sampleTestCase,
      _id: 'tc_003',
      validation_findings: [
        { rule: 'schema_missing_assertions', severity: 'error', message: 'No assertions defined' }
      ]
    };

    vi.mocked(testCasesApi.fetchProjectTestCases).mockResolvedValue({
      test_cases: [errorTestCase],
      count: 1
    });

    render(<TestCasesView project={dummyProject} />);

    await waitFor(() => {
      const approveBtn = screen.getByText('Approve').closest('button');
      expect(approveBtn).toBeDisabled();
      expect(screen.getByText(/No assertions defined/i)).toBeInTheDocument();
    });
  });
});
