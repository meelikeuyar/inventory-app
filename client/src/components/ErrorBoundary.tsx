import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
            <p className="mb-4 text-4xl">⚠️</p>
            <h1 className="mb-2 text-xl font-bold text-brand-900">Bir Hata Oluştu</h1>
            <p className="mb-6 text-sm text-brand-400">
              Beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenileyin.
            </p>
            {this.state.error && (
              <pre className="mb-6 overflow-auto rounded-lg bg-red-50 p-3 text-left text-xs text-red-600">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
