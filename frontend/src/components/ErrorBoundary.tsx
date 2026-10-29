import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900 border border-rose-500/30 rounded-2xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {this.props.fallbackTitle || 'Workspace Rendering Issue'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            An unexpected error occurred while rendering this view. Your saved data is safe in the database.
          </p>
          {this.state.error && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-left text-xs font-mono text-rose-300 max-h-36 overflow-auto">
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry View</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
            >
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
