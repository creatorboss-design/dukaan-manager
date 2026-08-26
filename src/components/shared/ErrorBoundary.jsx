import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="font-bold text-lg mb-2 text-gray-800">Something went wrong</p>
          <p className="text-gray-500 text-sm mb-6 max-w-sm">
            An unexpected error occurred. Try reloading the app. Your data is safe in the cloud.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-700 text-white rounded-xl px-8 py-3 font-semibold shadow-lg active:scale-95 transition-all hover:bg-blue-800"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
