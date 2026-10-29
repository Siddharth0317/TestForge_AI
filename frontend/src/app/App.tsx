import React from 'react';
import { ShieldCheck, Cpu, PlayCircle, Layers } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Layers className="h-6 w-6 text-indigo-400" />
          <span className="font-bold text-xl tracking-tight text-white">TestForge AI</span>
          <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded border border-indigo-500/20 font-medium">
            v1.0.0 Foundation
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Foundation Ready</span>
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            From Requirements to Verified Tests
          </h1>
          <p className="text-slate-400 mt-2 text-base max-w-2xl">
            An intelligent NLP- and LLM-powered platform for deterministic test case generation, 
            quality evaluation, and controlled browser automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-lg text-white">Deterministic Gates</h2>
            </div>
            <p className="text-sm text-slate-400">
              Dual Zod & Pydantic validation, explicit requirement traceability, and strict action allowlists.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Cpu className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-lg text-white">Hybrid AI & ML</h2>
            </div>
            <p className="text-sm text-slate-400">
              Linguistic feature extraction with spaCy, scikit-learn requirement classification, and structured LLM generation.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <PlayCircle className="h-5 w-5" />
              </div>
              <h2 className="font-semibold text-lg text-white">Controlled Execution</h2>
            </div>
            <p className="text-sm text-slate-400">
              Restricted Selenium browser automation against authorized target applications and CI fixtures.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        TestForge AI — Greenfield Monorepo Foundation (Phase 1 Baseline)
      </footer>
    </div>
  );
};

