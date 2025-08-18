"use client";
import React from "react";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message || "Unexpected error" };
  }
  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-lg text-center">
            <h2 className="text-xl font-semibold mb-3">Something went wrong on the page</h2>
            <p className="text-gray-300 mb-4">{this.state.message}</p>
            <button
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded"
              onClick={() => (this.setState({ hasError: false }), typeof window !== 'undefined' ? window.location.reload() : null)}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
