import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectsView } from '../src/features/projects/ProjectsView';
import { projectsService, ProjectItem } from '../src/services/projects';

vi.mock('../src/services/projects');

describe('ProjectsView Component States', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', async () => {
    vi.mocked(projectsService.listProjects).mockReturnValue(new Promise(() => {}));

    render(<ProjectsView onSelectProject={onSelect} />);

    expect(screen.getByText('Loading project repositories...')).toBeInTheDocument();
  });

  it('renders empty state when projects array is empty', async () => {
    vi.mocked(projectsService.listProjects).mockResolvedValue([]);

    render(<ProjectsView onSelectProject={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText('No Projects Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create first project/i })).toBeInTheDocument();
    });
  });

  it('renders project cards when projects exist', async () => {
    const mockProjects: ProjectItem[] = [
      {
        _id: 'proj_1',
        name: 'Alpha E-Commerce',
        description: 'Testing store checkout and payment gates',
        owner_id: 'usr_1',
        settings: { default_priority: 'high', require_approval_for_execution: true },
        created_at: '2026-10-29T00:00:00Z',
        updated_at: '2026-10-29T00:00:00Z'
      }
    ];

    vi.mocked(projectsService.listProjects).mockResolvedValue(mockProjects);

    render(<ProjectsView onSelectProject={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Alpha E-Commerce')).toBeInTheDocument();
      expect(screen.getByText('Testing store checkout and payment gates')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });

  it('renders error state with retry button on failure', async () => {
    vi.mocked(projectsService.listProjects).mockRejectedValue(new Error('Network error'));

    render(<ProjectsView onSelectProject={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});

