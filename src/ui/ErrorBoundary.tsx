import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Trans } from 'react-i18next';

interface Props {
  children: ReactNode;
  /** Varian WebGL menampilkan pesan khusus 3D. */
  kind?: 'generic' | 'webgl';
  fallback?: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GymRat]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    const k = this.props.kind === 'webgl' ? 'webgl' : 'generic';
    return (
      <div
        role="alert"
        className="m-4 border border-line border-l-4 border-l-danger bg-surface p-4"
      >
        <p className="font-display text-xl font-bold uppercase">
          <Trans i18nKey={`errors.${k}Title`} />
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          <Trans i18nKey={`errors.${k}Text`} />
        </p>
        <button type="button" className="btn mt-3" onClick={() => this.setState({ error: null })}>
          <Trans i18nKey="errors.retry" />
        </button>
      </div>
    );
  }
}
