import React from 'react';

const PageLoader: React.FC<{ label?: string }> = ({ label = 'Loading workspace…' }) => {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="app-surface flex min-w-[240px] flex-col items-center gap-4 px-8 py-10 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export default PageLoader;
