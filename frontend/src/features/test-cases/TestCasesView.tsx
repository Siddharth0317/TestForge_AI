import React, { useState, useEffect } from 'react';
import {
  TestCaseItem,
  AuditEventItem,
  fetchProjectTestCases,
  approveTestCase,
  rejectTestCase,
  requestChangesTestCase,
  editTestCase,
  fetchAuditEvents
} from '../../services/testCases';
import { ProjectItem } from '../../services/projects';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Edit3,
  History,
  Search,
  Check,
  X,
  AlertCircle,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

interface TestCasesViewProps {
  project: ProjectItem;
}

export const TestCasesView: React.FC<TestCasesViewProps> = ({ project }) => {
  const [testCases, setTestCases] = useState<TestCaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Audit Logs State
  const [expandedAudit, setExpandedAudit] = useState<{ [id: string]: boolean }>({});
  const [auditLogs, setAuditLogs] = useState<{ [id: string]: AuditEventItem[] }>({});
  const [auditLoading, setAuditLoading] = useState<{ [id: string]: boolean }>({});

  // Action Modals State
  const [approvingCase, setApprovingCase] = useState<TestCaseItem | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  const [rejectingCase, setRejectingCase] = useState<TestCaseItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [requestingChangesCase, setRequestingChangesCase] = useState<TestCaseItem | null>(null);
  const [changesNotes, setChangesNotes] = useState('');

  const [editingCase, setEditingCase] = useState<TestCaseItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editExpectedResult, setEditExpectedResult] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTestCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProjectTestCases(project._id, {
        review_status: statusFilter,
        scenario_type: scenarioFilter,
        priority: priorityFilter
      });
      setTestCases(res.test_cases);
    } catch (err: any) {
      setError(err.message || 'Failed to load test cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestCases();
  }, [project._id, statusFilter, scenarioFilter, priorityFilter]);

  const toggleAuditTrail = async (tcId: string) => {
    const isExpanded = !!expandedAudit[tcId];
    if (isExpanded) {
      setExpandedAudit((prev) => ({ ...prev, [tcId]: false }));
      return;
    }

    setExpandedAudit((prev) => ({ ...prev, [tcId]: true }));
    if (!auditLogs[tcId]) {
      try {
        setAuditLoading((prev) => ({ ...prev, [tcId]: true }));
        const res = await fetchAuditEvents(project._id, tcId);
        setAuditLogs((prev) => ({ ...prev, [tcId]: res.audit_events }));
      } catch (err) {
        console.error('Failed to load audit events', err);
      } finally {
        setAuditLoading((prev) => ({ ...prev, [tcId]: false }));
      }
    }
  };

  // Approval Action
  const handleApprove = async () => {
    if (!approvingCase) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await approveTestCase(approvingCase._id, approvalNotes.trim() || undefined);
      setApprovingCase(null);
      setApprovalNotes('');
      await loadTestCases();
    } catch (err: any) {
      setActionError(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Rejection Action
  const handleReject = async () => {
    if (!rejectingCase || !rejectionReason.trim()) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await rejectTestCase(rejectingCase._id, rejectionReason.trim());
      setRejectingCase(null);
      setRejectionReason('');
      await loadTestCases();
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Request Changes Action
  const handleRequestChanges = async () => {
    if (!requestingChangesCase || !changesNotes.trim()) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await requestChangesTestCase(requestingChangesCase._id, changesNotes.trim());
      setRequestingChangesCase(null);
      setChangesNotes('');
      await loadTestCases();
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (tc: TestCaseItem) => {
    setEditingCase(tc);
    setEditTitle(tc.title);
    setEditExpectedResult(tc.expected_result);
    setEditPriority(tc.priority);
    setActionError(null);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingCase || !editTitle.trim() || !editExpectedResult.trim()) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await editTestCase(editingCase._id, {
        title: editTitle.trim(),
        expected_result: editExpectedResult.trim(),
        priority: editPriority,
        expected_version: editingCase.version
      });
      setEditingCase(null);
      await loadTestCases();
    } catch (err: any) {
      setActionError(err.message || 'Edit failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter by search query
  const filteredCases = testCases.filter((tc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tc.title.toLowerCase().includes(q) ||
      tc.expected_result.toLowerCase().includes(q) ||
      tc.scenario_type.toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const totalCount = testCases.length;
  const pendingCount = testCases.filter((c) => c.review_status === 'pending').length;
  const approvedCount = testCases.filter((c) => c.review_status === 'approved').length;
  const changesCount = testCases.filter((c) => c.review_status === 'needs_changes').length;
  const rejectedCount = testCases.filter((c) => c.review_status === 'rejected').length;
  const duplicateCount = testCases.filter((c) => c.is_duplicate).length;

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

  const getReviewBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'needs_changes':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'rejected':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-indigo-400" />
            <span>Test Case Explorer & Review Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic validation, review workflows, traceability, and versioning for project: <strong className="text-slate-200">{project.name}</strong>
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
          <div className="text-lg font-bold text-white mt-0.5">{totalCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Pending</span>
          <div className="text-lg font-bold text-amber-300 mt-0.5">{pendingCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Approved</span>
          <div className="text-lg font-bold text-emerald-300 mt-0.5">{approvedCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">Needs Changes</span>
          <div className="text-lg font-bold text-sky-300 mt-0.5">{changesCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Rejected</span>
          <div className="text-lg font-bold text-rose-300 mt-0.5">{rejectedCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <span className="text-[11px] font-medium text-amber-300 uppercase tracking-wider">Duplicates</span>
          <div className="text-lg font-bold text-amber-300 mt-0.5">{duplicateCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Status Pills */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {['all', 'pending', 'approved', 'needs_changes', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
                }`}
              >
                {st === 'all' ? 'All Status' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title or steps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Secondary Selectors */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span>Scenario:</span>
            <select
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs"
            >
              <option value="all">All Scenarios</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="boundary">Boundary</option>
              <option value="authorization">Authorization</option>
              <option value="error_handling">Error Handling</option>
              <option value="state_transition">State Transition</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Test Cases List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
          Loading test cases...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
          <CheckCircle className="h-10 w-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-white">No Test Cases Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            {testCases.length === 0
              ? 'No test cases have been imported yet. Open the Requirement Studio to generate candidate test cases and import them.'
              : 'No test cases match the currently selected filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((tc) => {
            const hasErrors = tc.validation_findings?.some((f) => f.severity === 'error');
            const isApproved = tc.review_status === 'approved';

            return (
              <div
                key={tc._id}
                className={`bg-slate-900 border rounded-xl p-5 space-y-4 transition ${
                  tc.is_duplicate ? 'border-amber-500/40 bg-slate-900/90' : 'border-slate-800'
                }`}
              >
                {/* Top Row: Scenario Badge, Title, Version, Priority Score, Review Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`px-2 py-0.5 rounded uppercase font-semibold text-[10px] border ${getScenarioBadgeClass(tc.scenario_type)}`}>
                      {tc.scenario_type}
                    </span>
                    <span className="font-bold text-white text-sm">{tc.title}</span>
                    <span className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-indigo-300 text-[10px] font-mono rounded">
                      v{tc.version}
                    </span>
                    {tc.is_duplicate && (
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] rounded font-medium flex items-center space-x-1">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        <span>Duplicate</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Rule-Based Priority Score */}
                    <div
                      className="text-right px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px]"
                      title={tc.priority_rationale || 'Rule-based prioritization'}
                    >
                      <span className="text-slate-500 mr-1">Score:</span>
                      <strong className="text-indigo-300 font-mono">{tc.priority_score ?? 50}/100</strong>
                      <span className="capitalize text-slate-400 ml-1">({tc.priority})</span>
                    </div>

                    {/* Review Status Badge */}
                    <span className={`px-2.5 py-1 rounded text-xs uppercase font-bold border ${getReviewBadgeClass(tc.review_status)}`}>
                      {tc.review_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Duplicate Notification Callout */}
                {tc.is_duplicate && tc.duplicate_reason && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span><strong>Duplicate Notice:</strong> {tc.duplicate_reason}</span>
                  </div>
                )}

                {/* Preconditions & Expected Result */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                  <div>
                    <span className="font-semibold text-slate-400 block mb-0.5">Preconditions:</span>
                    <span className="text-slate-300">
                      {tc.preconditions && tc.preconditions.length > 0
                        ? tc.preconditions.join('; ')
                        : 'None specified'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 block mb-0.5">Expected Result:</span>
                    <span className="text-slate-200 font-medium">{tc.expected_result}</span>
                  </div>
                </div>

                {/* Steps and Assertions List */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Execution Sequence ({tc.steps?.length || 0} steps, {tc.assertions?.length || 0} assertions):</span>
                  </span>
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-850 space-y-1.5 text-xs">
                    {tc.steps?.map((st) => (
                      <div key={st.step_number} className="flex items-center space-x-2 text-slate-300">
                        <span className="text-slate-600 font-mono w-4">{st.step_number}.</span>
                        <span className="px-1.5 py-0.5 rounded font-mono font-medium text-[11px] bg-slate-800 text-indigo-300">
                          {st.action}
                        </span>
                        <span className="font-mono text-slate-400">target: {st.target_ref}</span>
                        {st.value_ref && (
                          <span className="font-mono text-slate-500">value: "{st.value_ref}"</span>
                        )}
                      </div>
                    ))}

                    {/* Explicit Assertions */}
                    {tc.assertions?.map((as, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-emerald-300 pt-0.5 border-t border-slate-900">
                        <span className="text-emerald-500 font-mono w-4">✓</span>
                        <span className="px-1.5 py-0.5 rounded font-mono font-medium text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                          {as.type}
                        </span>
                        <span className="font-mono text-slate-400">target: {as.target_ref}</span>
                        {as.expected_value && (
                          <span className="font-mono text-slate-500">expected: "{as.expected_value}"</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Findings Banner */}
                {tc.validation_findings && tc.validation_findings.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400">Quality & Schema Findings:</span>
                    <div className="space-y-1">
                      {tc.validation_findings.map((f, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-xs flex items-center space-x-2 border ${
                            f.severity === 'error'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                              : f.severity === 'warning'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                          }`}
                        >
                          {f.severity === 'error' ? (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                          ) : f.severity === 'warning' ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          ) : (
                            <Info className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                          )}
                          <span><strong>[{f.rule}]:</strong> {f.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Traceability Row: Source Requirement and Evidence */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>Source Req v{tc.requirement_version}</span>
                    {tc.source_evidence && tc.source_evidence.length > 0 && (
                      <span className="text-slate-400 italic">
                        Evidence: "{tc.source_evidence[0].requirement_span}"
                      </span>
                    )}
                  </div>

                  {tc.reviewed_at && (
                    <div className="text-[11px] text-slate-400">
                      Reviewed on {new Date(tc.reviewed_at).toLocaleDateString()}
                      {tc.review_notes && <span> ({tc.review_notes})</span>}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {/* Approve Button */}
                    <button
                      onClick={() => setApprovingCase(tc)}
                      disabled={hasErrors || isApproved}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                        hasErrors
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          : isApproved
                          ? 'bg-emerald-900/30 text-emerald-400/60 border border-emerald-800/40 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                      title={hasErrors ? 'Cannot approve test case with blocking validation errors' : undefined}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{isApproved ? 'Approved' : 'Approve'}</span>
                    </button>

                    {/* Reject Button */}
                    <button
                      onClick={() => setRejectingCase(tc)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>

                    {/* Request Changes */}
                    <button
                      onClick={() => setRequestingChangesCase(tc)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-sky-900/40 text-slate-300 hover:text-sky-300 border border-slate-700 hover:border-sky-700/50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Request Changes</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(tc)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-900/40 text-slate-300 hover:text-indigo-300 border border-slate-700 hover:border-indigo-700/50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Case</span>
                    </button>
                  </div>

                  {/* Audit Trail Toggle */}
                  <button
                    onClick={() => toggleAuditTrail(tc._id)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white text-xs font-medium flex items-center space-x-1 transition"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Audit Trail</span>
                    {expandedAudit[tc._id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {/* Audit Trail Accordion Drawer */}
                {expandedAudit[tc._id] && (
                  <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
                    <span className="font-semibold text-slate-400 block mb-1">Audit Event History:</span>
                    {auditLoading[tc._id] ? (
                      <div className="text-slate-500 py-1">Loading audit history...</div>
                    ) : auditLogs[tc._id]?.length ? (
                      <div className="space-y-1.5">
                        {auditLogs[tc._id].map((ev) => (
                          <div key={ev._id} className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-900">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-indigo-400 uppercase">{ev.action.replace('test_case_', '')}</span>
                              <span className="text-slate-500">by {ev.actor_email}</span>
                              {ev.details?.notes && <span className="text-slate-300 italic">"{ev.details.notes}"</span>}
                              {ev.details?.reason && <span className="text-rose-300 italic">"{ev.details.reason}"</span>}
                            </div>
                            <span className="text-slate-600">{new Date(ev.timestamp).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 py-1">No recorded audit events.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      {approvingCase && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Check className="h-5 w-5 text-emerald-400" />
              <span>Approve Test Case</span>
            </h3>
            <p className="text-xs text-slate-400">
              You are approving <strong>"{approvingCase.title}"</strong> (v{approvingCase.version}). This marks it ready for automated execution.
            </p>
            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
                {actionError}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Approval Notes (Optional):
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g., Verified locators and assertions for staging environment..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setApprovingCase(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
              >
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingCase && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <X className="h-5 w-5 text-rose-400" />
              <span>Reject Test Case</span>
            </h3>
            <p className="text-xs text-slate-400">
              Document why <strong>"{rejectingCase.title}"</strong> is being rejected. Rejected cases are retained for audit history.
            </p>
            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
                {actionError}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Rejection Reason (Required):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Unsupported assumptions about password reset timeout..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectingCase(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {requestingChangesCase && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <RotateCcw className="h-5 w-5 text-sky-400" />
              <span>Request Changes</span>
            </h3>
            <p className="text-xs text-slate-400">
              Provide feedback for <strong>"{requestingChangesCase.title}"</strong>.
            </p>
            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
                {actionError}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Feedback Notes (Required):
              </label>
              <textarea
                value={changesNotes}
                onChange={(e) => setChangesNotes(e.target.value)}
                placeholder="e.g., Update submit locator to use ID rather than generic button selector..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRequestingChangesCase(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={actionLoading || !changesNotes.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Case Modal */}
      {editingCase && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Edit3 className="h-5 w-5 text-indigo-400" />
              <span>Edit Test Case (v{editingCase.version})</span>
            </h3>

            {editingCase.review_status === 'approved' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs space-y-1">
                <span className="font-semibold flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Version Bump Notice:</span>
                </span>
                <p>
                  This test case is currently <strong>Approved</strong>. Saving edits will create revision <strong>v{editingCase.version + 1}</strong> and reset review status to <strong>Pending</strong>.
                </p>
              </div>
            )}

            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Expected Result:</label>
                <textarea
                  value={editExpectedResult}
                  onChange={(e) => setEditExpectedResult(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Priority Tier:</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingCase(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading || !editTitle.trim() || !editExpectedResult.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
