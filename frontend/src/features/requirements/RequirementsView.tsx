import React, { useState, useEffect } from 'react';
import { requirementsService, RequirementItem } from '../../services/requirements';
import { ProjectItem } from '../../services/projects';
import { FileText, Send, AlertCircle, Loader2, Edit3, Check, X, Tag } from 'lucide-react';
import { ApiError } from '../../services/api';

interface RequirementsViewProps {
  project: ProjectItem;
}

export const RequirementsView: React.FC<RequirementsViewProps> = ({ project }) => {
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Requirement Form State
  const [rawText, setRawText] = useState('');
  const [jiraKey, setJiraKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Edit requirement state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRequirements = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await requirementsService.listRequirements(project._id);
      setRequirements(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to load project requirements.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [project._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawText.trim().length < 5) {
      setSubmitError('Requirement text must be at least 5 characters.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const newReq = await requirementsService.createRequirement(project._id, {
        original_text: rawText,
        source_metadata: jiraKey.trim() ? { jira_key: jiraKey.trim() } : undefined
      });
      setRequirements([newReq, ...requirements]);
      setRawText('');
      setJiraKey('');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to persist requirement.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (req: RequirementItem) => {
    setEditingId(req._id);
    setEditText(req.original_text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (reqId: string) => {
    if (editText.trim().length < 5) return;
    setIsUpdating(true);
    try {
      const updated = await requirementsService.updateRequirement(reqId, editText);
      setRequirements(requirements.map(r => r._id === reqId ? updated : r));
      setEditingId(null);
      setEditText('');
    } catch (err: any) {
      alert(err instanceof ApiError ? err.message : 'Failed to update requirement');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
          <span>Active Project:</span>
          <span className="text-white">{project.name}</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Requirement Studio</h2>
        <p className="text-sm text-slate-400">
          Submit natural-language software specifications for linguistic extraction and test generation
        </p>
      </div>

      {/* Requirement Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-white text-sm mb-2 flex items-center space-x-2">
          <FileText className="h-4 w-4 text-indigo-400" />
          <span>New Software Requirement</span>
        </h3>

        {submitError && (
          <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. When a user submits an order with an expired credit card, the system must display an error banner stating 'Card expired' and prevent transaction processing."
              maxLength={4000}
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
              <span>Supports Gherkin, user stories, or functional acceptance criteria</span>
              <span>{rawText.length} / 4000 chars</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="w-1/3">
              <input
                type="text"
                value={jiraKey}
                onChange={(e) => setJiraKey(e.target.value)}
                placeholder="Jira Issue Key (e.g. AUTH-102)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || rawText.trim().length < 5}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 disabled:opacity-50 transition"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span>Save & Register Requirement</span>
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <Loader2 className="h-6 w-6 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading requirements...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMsg && (
        <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-2">
          <p className="text-xs text-rose-300">{errorMsg}</p>
          <button
            onClick={fetchRequirements}
            className="text-xs px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && requirements.length === 0 && (
        <div className="text-center py-10 px-4 bg-slate-900 border border-dashed border-slate-800 rounded-xl">
          <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-white">No Requirements Registered</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Submit a natural-language requirement above to initiate the TestForge AI analysis pipeline.
          </p>
        </div>
      )}

      {/* Requirements List */}
      {!isLoading && !errorMsg && requirements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Registered Requirements ({requirements.length})
          </h3>
          {requirements.map((req) => (
            <div
              key={req._id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                    v{req.version}
                  </span>
                  <span className="text-xs uppercase font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {req.status}
                  </span>
                  {req.source_metadata?.jira_key && (
                    <span className="flex items-center text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      <Tag className="h-3 w-3 mr-1" />
                      {req.source_metadata.jira_key}
                    </span>
                  )}
                </div>
                {editingId !== req._id && (
                  <button
                    onClick={() => handleStartEdit(req)}
                    className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Version</span>
                  </button>
                )}
              </div>

              {editingId === req._id ? (
                <div className="space-y-2 mt-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-2.5 py-1 text-xs bg-slate-800 text-slate-300 rounded hover:bg-slate-700 flex items-center space-x-1"
                    >
                      <X className="h-3 w-3" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleSaveEdit(req._id)}
                      className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-500 flex items-center space-x-1"
                    >
                      {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      <span>Save as v{req.version + 1}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-200 leading-relaxed font-sans">{req.original_text}</p>
              )}

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span>Created: {new Date(req.created_at).toLocaleDateString()}</span>
                <span className="text-indigo-400 font-medium">Ready for NLP Analysis (Phase 3)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

