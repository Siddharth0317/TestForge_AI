import React, { useState, useEffect } from 'react';
import {
  FileText,
  Send,
  Loader2,
  AlertCircle,
  Edit3,
  Check,
  X,
  Tag,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Brain,
  Wand2,
  ListOrdered,
  Layers,
  HelpCircle
} from 'lucide-react';
import { ProjectItem } from '../../services/projects';
import { requirementsService, RequirementItem } from '../../services/requirements';
import { generationService, IGenerationJob, ICandidateTestCase } from '../../services/generation';

interface RequirementsViewProps {
  project: ProjectItem;
}

export const RequirementsView: React.FC<RequirementsViewProps> = ({ project }) => {
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New requirement form state
  const [rawText, setRawText] = useState<string>('');
  const [jiraKey, setJiraKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Edit requirement state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // NLP analysis loading state & expanded details state
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedNlpId, setExpandedNlpId] = useState<string | null>(null);

  // Generation jobs state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [expandedCandidatesId, setExpandedCandidatesId] = useState<string | null>(null);
  const [generationJobs, setGenerationJobs] = useState<Record<string, IGenerationJob>>({});

  const fetchRequirements = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await requirementsService.listRequirements(project._id);
      setRequirements(data);

      // Load latest generation jobs for each requirement
      for (const req of data) {
        try {
          const jobs = await generationService.getGenerationJobs(project._id, req._id);
          if (jobs.length > 0) {
            setGenerationJobs((prev) => ({ ...prev, [req._id]: jobs[0] }));
          }
        } catch {
          // Non-blocking for list view
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load project requirements.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [project._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawText.trim().length < 5) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const newReq = await requirementsService.createRequirement(project._id, {
        original_text: rawText.trim(),
        source_metadata: jiraKey.trim() ? { jira_key: jiraKey.trim() } : undefined
      });
      setRequirements([newReq, ...requirements]);
      setRawText('');
      setJiraKey('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit requirement.');
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
      const updatedReq = await requirementsService.updateRequirement(reqId, editText.trim());
      setRequirements(requirements.map((r) => (r._id === reqId ? updatedReq : r)));
      setEditingId(null);
      setEditText('');
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAnalyzeRequirement = async (reqId: string) => {
    setAnalyzingId(reqId);
    try {
      const analyzedReq = await requirementsService.analyzeRequirement(reqId);
      setRequirements(requirements.map((r) => (r._id === reqId ? analyzedReq : r)));
      setExpandedNlpId(reqId);
    } catch (err: any) {
      alert(`NLP Analysis failed: ${err.message}`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleGenerateTestCases = async (req: RequirementItem) => {
    setGeneratingId(req._id);
    try {
      const job = await generationService.generateTestCases(project._id, req._id, {
        max_cases: 4
      });
      setGenerationJobs((prev) => ({ ...prev, [req._id]: job }));
      setExpandedCandidatesId(req._id);
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const toggleNlpExpand = (id: string) => {
    setExpandedNlpId(expandedNlpId === id ? null : id);
  };

  const toggleCandidatesExpand = (id: string) => {
    setExpandedCandidatesId(expandedCandidatesId === id ? null : id);
  };

  const getScenarioBadgeClass = (scenario: string) => {
    switch (scenario) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'negative':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'boundary':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'authorization':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'error_handling':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'state_transition':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
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
          Submit natural-language software specifications for deterministic spaCy NLP extraction, ML categorization, and structured LLM candidate test case generation.
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
              placeholder="e.g. When a customer enters an incorrect password three consecutive times, the login form must be locked for 15 minutes and display an informative lockout message."
              maxLength={4000}
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
              <span>Supports Gherkin, user stories, and acceptance criteria</span>
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
              <span>Save & Analyze Requirement</span>
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
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Registered Requirements ({requirements.length})
          </h3>
          {requirements.map((req) => {
            const hasAnalysis = Boolean(req.nlp_analysis && req.status === 'analyzed');
            const ambiguityCount = req.nlp_analysis?.ambiguity_findings?.length || 0;
            const isNlpExpanded = expandedNlpId === req._id;
            const latestJob = generationJobs[req._id];
            const candidateCount = latestJob?.candidates?.length || 0;
            const isCandidatesExpanded = expandedCandidatesId === req._id;

            return (
              <div
                key={req._id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      v{req.version}
                    </span>
                    <span
                      className={`text-xs uppercase font-medium px-2 py-0.5 rounded ${
                        req.status === 'analyzed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {req.status}
                    </span>
                    {req.source_metadata?.jira_key && (
                      <span className="flex items-center text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <Tag className="h-3 w-3 mr-1" />
                        {req.source_metadata.jira_key}
                      </span>
                    )}
                    {req.ml_classification && req.ml_classification.category && (
                      <span className="flex items-center text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-medium">
                        <Brain className="h-3 w-3 mr-1 text-purple-400" />
                        <span className="capitalize">{(req.ml_classification.category || '').replace('_', ' ')}</span>
                        <span className="text-[10px] text-purple-400 ml-1">
                          ({Math.round((req.ml_classification.confidence ?? 0) * 100)}%)
                        </span>
                        {req.ml_classification.is_uncertain && (
                          <span className="ml-1 text-[10px] text-amber-400" title="Low classification certainty">⚠️</span>
                        )}
                      </span>
                    )}
                    {hasAnalysis && ambiguityCount > 0 && (
                      <span className="flex items-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {ambiguityCount} {ambiguityCount === 1 ? 'ambiguity finding' : 'ambiguity findings'}
                      </span>
                    )}
                    {latestJob && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium flex items-center space-x-1 border ${
                          latestJob.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        <Layers className="h-3 w-3" />
                        <span>{candidateCount} Generated Cases</span>
                        {latestJob.provider === 'mock' && (
                          <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-300 ml-1">Mock</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Generate Test Cases Button */}
                    <button
                      onClick={() => handleGenerateTestCases(req)}
                      disabled={generatingId === req._id}
                      className="text-xs text-emerald-300 hover:text-white flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 disabled:opacity-50 transition"
                      title="Generate candidate test cases using structured LLM"
                    >
                      {generatingId === req._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3 text-emerald-400" />
                      )}
                      <span>{generatingId === req._id ? 'Generating...' : 'Generate Cases'}</span>
                    </button>

                    {req.status === 'draft' && (
                      <button
                        onClick={() => handleAnalyzeRequirement(req._id)}
                        disabled={analyzingId === req._id}
                        className="text-xs text-indigo-300 hover:text-white flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60"
                      >
                        {analyzingId === req._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        <span>Run NLP Analysis</span>
                      </button>
                    )}

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

                {/* NLP Analysis Findings Accordion */}
                {hasAnalysis && req.nlp_analysis && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => toggleNlpExpand(req._id)}
                      className="w-full flex items-center justify-between text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1"
                    >
                      <div className="flex items-center space-x-1.5">
                        <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                        <span>spaCy Linguistic Extractions & Quality Findings</span>
                      </div>
                      {isNlpExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isNlpExpanded && (
                      <div className="mt-2.5 space-y-3 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {req.nlp_analysis.actors?.length > 0 && (
                            <div>
                              <span className="text-slate-400 font-semibold block mb-1">Actors:</span>
                              <div className="flex flex-wrap gap-1">
                                {req.nlp_analysis.actors.map((actor, idx) => (
                                  <span key={idx} className="bg-sky-500/10 border border-sky-500/20 text-sky-300 px-2 py-0.5 rounded">
                                    {actor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {req.nlp_analysis.actions?.length > 0 && (
                            <div>
                              <span className="text-slate-400 font-semibold block mb-1">Actions (Verbs):</span>
                              <div className="flex flex-wrap gap-1">
                                {req.nlp_analysis.actions.map((act, idx) => (
                                  <span key={idx} className="bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                                    {act}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {req.nlp_analysis.entities?.length > 0 && (
                            <div>
                              <span className="text-slate-400 font-semibold block mb-1">Target Objects / Entities:</span>
                              <div className="flex flex-wrap gap-1">
                                {req.nlp_analysis.entities.map((ent, idx) => (
                                  <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                                    {ent}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {req.nlp_analysis.constraints?.length > 0 && (
                            <div>
                              <span className="text-slate-400 font-semibold block mb-1">Constraints & Bounds:</span>
                              <div className="flex flex-wrap gap-1">
                                {req.nlp_analysis.constraints.map((cst, idx) => (
                                  <span key={idx} className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
                                    {cst}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {req.nlp_analysis.conditions?.length > 0 && (
                          <div className="pt-1">
                            <span className="text-slate-400 font-semibold block mb-1">Conditions:</span>
                            <div className="space-y-1">
                              {req.nlp_analysis.conditions.map((cond, idx) => (
                                <div key={idx} className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-2 py-1 rounded">
                                  {cond}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {req.nlp_analysis.outcomes?.length > 0 && (
                          <div className="pt-1">
                            <span className="text-slate-400 font-semibold block mb-1">Expected Outcomes:</span>
                            <div className="space-y-1">
                              {req.nlp_analysis.outcomes.map((out, idx) => (
                                <div key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 px-2 py-1 rounded">
                                  {out}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {req.nlp_analysis.ambiguity_findings?.length > 0 && (
                          <div className="pt-2 border-t border-slate-800">
                            <span className="text-amber-400 font-semibold flex items-center space-x-1 mb-1.5">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Ambiguity & Testability Findings:</span>
                            </span>
                            <div className="space-y-1.5">
                              {req.nlp_analysis.ambiguity_findings.map((f, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded bg-amber-500/5 border border-amber-500/20 text-amber-300 flex items-start space-x-2"
                                >
                                  <span className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200 font-semibold">
                                    "{f.phrase}"
                                  </span>
                                  <span className="text-slate-300">{f.reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Candidate Test Cases Accordion */}
                {latestJob && Array.isArray(latestJob.candidates) && latestJob.candidates.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => toggleCandidatesExpand(req._id)}
                      className="w-full flex items-center justify-between text-xs text-emerald-400 hover:text-emerald-300 font-medium py-1"
                    >
                      <div className="flex items-center space-x-1.5">
                        <Wand2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Candidate Test Cases ({latestJob.candidates.length})</span>
                        {latestJob.provider === 'mock' && (
                          <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                            Mock Provider (Offline/Testing)
                          </span>
                        )}
                      </div>
                      {isCandidatesExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {isCandidatesExpanded && (
                      <div className="mt-2.5 space-y-3">
                        {latestJob.provider === 'mock' && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-center space-x-2">
                            <HelpCircle className="h-4 w-4 shrink-0 text-amber-400" />
                            <span>
                              <strong>Mock Generation Mode:</strong> Test cases were generated using the deterministic mock provider. Provider credentials remain secure and server-side.
                            </span>
                          </div>
                        )}

                        <div className="space-y-2.5">
                          {latestJob.candidates.map((tc: ICandidateTestCase, idx: number) => (
                            <div
                              key={tc.test_case_id || idx}
                              className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-0.5 rounded uppercase font-semibold text-[10px] border ${getScenarioBadgeClass(tc.scenario_type || 'positive')}`}>
                                    {tc.scenario_type || 'positive'}
                                  </span>
                                  <span className="font-semibold text-white text-xs">{tc.title || 'Untitled Test Case'}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                                  <span className="capitalize px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded">
                                    Priority: <strong className="text-white">{tc.priority || 'medium'}</strong>
                                  </span>
                                  <span className="font-mono text-slate-500">{tc.test_case_id || `tc-${idx}`}</span>
                                </div>
                              </div>

                              {Array.isArray(tc.preconditions) && tc.preconditions.length > 0 && (
                                <div className="text-slate-400">
                                  <span className="font-semibold text-slate-300">Preconditions: </span>
                                  <span>{tc.preconditions.join('; ')}</span>
                                </div>
                              )}

                              {/* Test Steps */}
                              <div className="space-y-1 pt-1">
                                <span className="font-semibold text-slate-300 flex items-center space-x-1">
                                  <ListOrdered className="h-3 w-3 text-indigo-400" />
                                  <span>Execution Steps ({Array.isArray(tc.steps) ? tc.steps.length : 0}):</span>
                                </span>
                                <div className="space-y-1 bg-slate-900/60 p-2 rounded border border-slate-850">
                                  {Array.isArray(tc.steps) && tc.steps.map((st) => (
                                    <div key={st.step_number} className="flex items-center space-x-2 text-[11px]">
                                      <span className="text-slate-500 font-mono w-4">{st.step_number}.</span>
                                      <span className="bg-slate-800 text-indigo-300 px-1.5 py-0.2 rounded font-mono font-medium">
                                        {st.action}
                                      </span>
                                      <span className="text-slate-300 font-mono">{st.target_ref}</span>
                                      {st.value_ref && (
                                        <span className="text-emerald-300 font-mono">"{st.value_ref}"</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Expected Result */}
                              <div className="pt-1">
                                <span className="font-semibold text-slate-300">Expected Result: </span>
                                <span className="text-emerald-300">{tc.expected_result}</span>
                              </div>

                              {/* Unsupported Assumptions Callout */}
                              {Array.isArray(tc.assumptions) && tc.assumptions.length > 0 && (
                                <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded text-amber-300 text-[11px] space-y-1">
                                  <span className="font-semibold flex items-center space-x-1 text-amber-400">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Unsupported Model Assumptions (Review Required):</span>
                                  </span>
                                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                                    {tc.assumptions.map((asm, aIdx) => (
                                      <li key={aIdx}>{asm}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Evidence Span Traceability */}
                              {Array.isArray(tc.source_evidence) && tc.source_evidence.length > 0 && (
                                <div className="text-[11px] text-slate-500 pt-1">
                                  <span>Evidence Span: </span>
                                  <span className="italic text-slate-400">
                                    "{typeof tc.source_evidence[0] === 'string' ? tc.source_evidence[0] : tc.source_evidence[0]?.requirement_span || ''}"
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Created: {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}</span>
                  <span className="text-slate-400 font-mono text-[11px]">ID: {req._id ? req._id.slice(-6) : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
