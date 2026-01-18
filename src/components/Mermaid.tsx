import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import clsx from 'clsx';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral', // Use 'neutral' theme for cleaner, lighter look
  securityLevel: 'loose',
  fontFamily: '"Noto Serif SC", sans-serif'
});

interface MermaidProps {
  chart: string;
  className?: string;
}

export function Mermaid({ chart, className }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart) return;

    const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
    
    mermaid.render(id, chart)
      .then((result) => {
        setSvg(result.svg);
        setError(null);
      })
      .catch((err) => {
        console.error('Mermaid render error:', err);
        setError('Failed to render diagram');
        setSvg('');
      });
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200 text-sm font-mono">
        {error}
        <pre className="mt-2 text-xs opacity-70 whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={clsx("mermaid-diagram flex justify-center my-4 overflow-x-auto", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}