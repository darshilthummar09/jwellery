import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContainer — consistent padding and max-width for all dashboard pages.
 * Wrap every page's content with this.
 */
export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full ${className}`}>
      {children}
    </main>
  );
}
