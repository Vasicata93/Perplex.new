import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import App from "./App";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; errorInfo: ErrorInfo | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
    // Send to my local catch server
    fetch('http://localhost:3001/error', {
       method: 'POST',
       body: JSON.stringify({ error: error.toString(), stack: error.stack, componentStack: errorInfo.componentStack }),
       headers: { 'Content-Type': 'application/json' }
    }).catch(e => console.error(e));
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, background: 'red', color: 'white', zIndex: 9999 }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error.toString()}</pre>
          <pre>{this.state.error.stack}</pre>
          <pre>{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered with scope:', registration.scope);
    }).catch(error => {
      console.error('SW registration failed:', error);
    });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
