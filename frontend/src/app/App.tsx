import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LoginForm } from '../components/LoginForm';
import { ProjectsView } from '../features/projects/ProjectsView';
import { RequirementsView } from '../features/requirements/RequirementsView';
import { TestCasesView } from '../features/test-cases/TestCasesView';
import { EnvironmentsView } from '../features/environments/EnvironmentsView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ProjectItem } from '../services/projects';
import { Layers, LogOut, User, Folder, FileText, Globe, CheckSquare, ChevronRight } from 'lucide-react';

const MainShell: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [currentTab, setCurrentTab] = useState<'projects' | 'requirements' | 'testcases' | 'environments'>('projects');

  const handleSelectProject = (project: ProjectItem) => {
    setSelectedProject(project);
    setCurrentTab('requirements');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
        <header className="flex items-center space-x-3 max-w-5xl mx-auto w-full py-4">
          <Layers className="h-6 w-6 text-indigo-400" />
          <span className="font-bold text-xl text-white">TestForge AI</span>
          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-medium">
            Phase 2 Core API & Application Shell
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center py-10">
          <LoginForm />
        </main>

        <footer className="text-center text-xs text-slate-500 py-4">
          TestForge AI — From Requirements to Verified Tests
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Application Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setCurrentTab('projects')}>
            <Layers className="h-6 w-6 text-indigo-400" />
            <span className="font-bold text-lg text-white tracking-tight">TestForge AI</span>
          </div>

          <nav className="flex items-center space-x-1 text-sm">
            <button
              onClick={() => setCurrentTab('projects')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                currentTab === 'projects'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Folder className="h-4 w-4" />
              <span>Projects</span>
            </button>

            {selectedProject && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-600" />
                <button
                  onClick={() => setCurrentTab('requirements')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    currentTab === 'requirements'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Requirement Studio</span>
                  <span className="text-xs bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300 ml-1">
                    {selectedProject.name}
                  </span>
                </button>

                <button
                  onClick={() => setCurrentTab('testcases')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    currentTab === 'testcases'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Test Cases</span>
                </button>

                <button
                  onClick={() => setCurrentTab('environments')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    currentTab === 'environments'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  <span>Environments & Locators</span>
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-200 font-medium">{user.email}</span>
            <span className="text-xs uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-semibold text-[10px]">
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        <ErrorBoundary fallbackTitle="Workspace Component Error" onReset={() => setCurrentTab('projects')}>
          {currentTab === 'projects' && (
            <ProjectsView
              onSelectProject={handleSelectProject}
              selectedProjectId={selectedProject?._id}
            />
          )}

          {currentTab === 'requirements' && selectedProject && (
            <RequirementsView
              project={selectedProject}
              onNavigateToTestCases={() => setCurrentTab('testcases')}
            />
          )}

          {currentTab === 'testcases' && selectedProject && (
            <TestCasesView project={selectedProject} />
          )}

          {currentTab === 'environments' && selectedProject && (
            <EnvironmentsView project={selectedProject} />
          )}

          {(currentTab === 'requirements' || currentTab === 'testcases' || currentTab === 'environments') && !selectedProject && (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
              <Folder className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No Project Selected</h3>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                Please select or create a project first to open this workspace.
              </p>
              <button
                onClick={() => setCurrentTab('projects')}
                className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Go to Projects
              </button>
            </div>
          )}
        </ErrorBoundary>
      </main>

      <footer className="border-t border-slate-800/80 py-3.5 px-6 text-center text-xs text-slate-500">
        TestForge AI — Core API & Persistence Foundation Verified (Phase 2 Baseline)
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainShell />
    </AuthProvider>
  );
};
