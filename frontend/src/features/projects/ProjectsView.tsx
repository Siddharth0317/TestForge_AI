import React, { useState, useEffect } from 'react';
import { projectsService, ProjectItem } from '../../services/projects';
import { FolderPlus, Layers, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ApiError } from '../../services/api';

interface ProjectsViewProps {
  onSelectProject: (project: ProjectItem) => void;
  selectedProjectId?: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectProject, selectedProjectId }) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await projectsService.listProjects();
      setProjects(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to load projects from server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmitting(true);

    try {
      const newProj = await projectsService.createProject({
        name,
        description
      });
      setProjects([newProj, ...projects]);
      setName('');
      setDescription('');
      setIsCreating(false);
      onSelectProject(newProj);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setCreateError(err.message);
      } else {
        setCreateError('Failed to create project.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Test Projects</h2>
          <p className="text-sm text-slate-400">Select an active workspace or initialize a new project</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 px-3.5 rounded-lg transition"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Project Creation Form */}
      {isCreating && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-md">
          <h3 className="font-semibold text-white text-base mb-3">Create New Project</h3>
          {createError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}
          <form onSubmit={handleCreateProject} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Payments Gateway Integration"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of application scope and test criteria..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Create Project</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-xl">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Loading project repositories...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMsg && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
          <p className="text-rose-300 text-sm">{errorMsg}</p>
          <button
            onClick={fetchProjects}
            className="text-xs font-semibold px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && projects.length === 0 && (
        <div className="text-center py-12 px-4 bg-slate-900 border border-dashed border-slate-800 rounded-xl">
          <Layers className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Projects Found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Create your first project workspace to begin defining software requirements and generating automated test cases.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 px-4 rounded-lg inline-flex items-center space-x-2"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Create First Project</span>
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !errorMsg && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const isSelected = selectedProjectId === proj._id;
            return (
              <div
                key={proj._id}
                onClick={() => onSelectProject(proj)}
                className={`cursor-pointer rounded-xl border p-5 transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/30 border-indigo-500/60 shadow-indigo-500/10 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-base tracking-tight truncate pr-2">
                      {proj.name}
                    </h3>
                    {isSelected && (
                      <span className="flex items-center text-xs text-indigo-400 font-medium shrink-0">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="capitalize">
                    Priority: <span className="text-slate-300">{proj.settings?.default_priority || 'medium'}</span>
                  </span>
                  <span className="flex items-center text-indigo-400 font-medium group">
                    <span>Open Studio</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

