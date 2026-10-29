import React, { useState, useEffect } from 'react';
import { environmentsService, TargetEnvironmentItem } from '../../services/environments';
import { ProjectItem } from '../../services/projects';
import { Globe, Plus, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { ApiError } from '../../services/api';

interface EnvironmentsViewProps {
  project: ProjectItem;
}

export const EnvironmentsView: React.FC<EnvironmentsViewProps> = ({ project }) => {
  const [environments, setEnvironments] = useState<TargetEnvironmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [allowedHosts, setAllowedHosts] = useState('');
  const [envType, setEnvType] = useState<'local' | 'dev' | 'staging' | 'production_authorized'>('staging');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEnvironments = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await environmentsService.listEnvironments(project._id);
      setEnvironments(data);
    } catch (err: any) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Failed to load environments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, [project._id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmitting(true);

    const hosts = allowedHosts
      .split(',')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    if (hosts.length === 0) {
      setCreateError('At least one allowed host is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const created = await environmentsService.createEnvironment(project._id, {
        name,
        base_url: baseUrl,
        allowed_hosts: hosts,
        environment_type: envType
      });
      setEnvironments([created, ...environments]);
      setName('');
      setBaseUrl('');
      setAllowedHosts('');
      setIsCreating(false);
    } catch (err: any) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create environment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            <span>Project:</span>
            <span className="text-white">{project.name}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Target Environments & Locators</h2>
          <p className="text-sm text-slate-400">
            Configure authorized application environments, security host allowlists, and DOM locator registries
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-3.5 rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Target Environment</span>
          </button>
        )}
      </div>

      {/* Creation Card */}
      {isCreating && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-lg">
          <h3 className="font-semibold text-white text-sm mb-3 flex items-center space-x-2">
            <Globe className="h-4 w-4 text-indigo-400" />
            <span>Register Authorized Target Environment</span>
          </h3>

          {createError && (
            <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Environment Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Staging Web App"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Environment Type *
                </label>
                <select
                  value={envType}
                  onChange={(e) => setEnvType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="staging">Staging</option>
                  <option value="dev">Development</option>
                  <option value="local">Local CI Fixture</option>
                  <option value="production_authorized">Production (Explicitly Authorized)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Base URL *
                </label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://staging.app.example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Allowed Hostnames (comma-separated) *
                </label>
                <input
                  type="text"
                  value={allowedHosts}
                  onChange={(e) => setAllowedHosts(e.target.value)}
                  placeholder="staging.app.example.com, auth.example.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5"
              >
                {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Save Environment</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <Loader2 className="h-6 w-6 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading target environments...</p>
        </div>
      )}

      {/* Error */}
      {!isLoading && errorMsg && (
        <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-2">
          <p className="text-xs text-rose-300">{errorMsg}</p>
          <button onClick={fetchEnvironments} className="text-xs px-3 py-1 bg-rose-500/20 text-rose-200 rounded font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && environments.length === 0 && (
        <div className="text-center py-10 px-4 bg-slate-900 border border-dashed border-slate-800 rounded-xl">
          <Globe className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-white">No Target Environments Configured</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-3">
            Register your authorized target web application to enable locator mapping and browser execution.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg"
          >
            Configure First Environment
          </button>
        </div>
      )}

      {/* Environments List */}
      {!isLoading && !errorMsg && environments.length > 0 && (
        <div className="space-y-4">
          {environments.map((env) => (
            <div key={env._id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-base">{env.name}</h3>
                    <span className="text-xs uppercase bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-semibold text-[10px]">
                      {env.environment_type}
                    </span>
                    <span className="flex items-center text-xs text-emerald-400 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Allowlist Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">{env.base_url}</p>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span>Locators: <strong className="text-white">{env.locators?.length || 0}</strong></span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold block mb-1">Permitted Hostnames:</span>
                <div className="flex flex-wrap gap-1.5">
                  {env.allowed_hosts.map((host, idx) => (
                    <span key={idx} className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono text-[11px]">
                      {host}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
