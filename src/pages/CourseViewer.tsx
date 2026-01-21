import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Menu, Maximize2, Minimize2, Save, Eye, EyeOff, ChevronLeft, Monitor, X, Pen } from 'lucide-react';
import { ApiResponse, UnitContent } from '@/types';
import { Mermaid } from '@/components/Mermaid';
import { CanvasBoard } from '@/components/CanvasBoard';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import clsx from 'clsx';

export function CourseViewer() {
  const { courseName, unitName } = useParams();
  const navigate = useNavigate();
  const [units, setUnits] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [content, setContent] = useState<UnitContent | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'canvas'>('notes');
  const [noteContent, setNoteContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBrowserFull, setIsBrowserFull] = useState(false);
  const [showNotePreview, setShowNotePreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number | undefined>(undefined);

  // Auto-hide sidebar when entering browser full screen
  useEffect(() => {
    if (isBrowserFull) {
        setSidebarOpen(false);
    } else {
        setSidebarOpen(true);
        // Turn off marking mode when exiting full screen
        setIsMarking(false);
    }
  }, [isBrowserFull]);

  // Fetch units
  useEffect(() => {
    if (!courseName) return;
    fetch(`/api/courses/${encodeURIComponent(courseName)}`)
      .then(res => res.json())
      .then((data: ApiResponse<string[]>) => {
        if (data.success) {
          setUnits(data.data);
          // Redirect to first unit if none selected
          if (!unitName && data.data.length > 0) {
            navigate(`/course/${encodeURIComponent(courseName)}/${encodeURIComponent(data.data[0])}`, { replace: true });
          }
        }
      });
  }, [courseName, unitName, navigate]);

  // Fetch content
  useEffect(() => {
    if (!courseName || !unitName) return;
    
    // Reset content while loading
    setContent(null);
    setIframeHeight(undefined);
    
    fetch(`/api/courses/${encodeURIComponent(courseName)}/${encodeURIComponent(unitName)}`)
      .then(res => res.json())
      .then((data: ApiResponse<UnitContent>) => {
        if (data.success) {
          setContent(data.data);
          setNoteContent(data.data.update);
        }
      });
  }, [courseName, unitName]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC: Reset to standard layout
      if (e.key === 'Escape') {
        const isStandard = sidebarOpen && !isFullscreen && !isBrowserFull && activeTab === 'notes';
        if (!isStandard) {
          setSidebarOpen(true);
          setIsFullscreen(false);
          setIsBrowserFull(false);
          setActiveTab('notes');
        }
      }

      // Shift + ArrowUp/ArrowDown: Navigate units
      if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        if (!courseName || !unitName || units.length === 0) return;
        
        e.preventDefault(); // Prevent default scrolling
        
        const currentIndex = units.indexOf(unitName);
        if (currentIndex === -1) return;

        if (e.key === 'ArrowUp' && currentIndex > 0) {
          const prevUnit = units[currentIndex - 1];
          navigate(`/course/${encodeURIComponent(courseName)}/${encodeURIComponent(prevUnit)}`);
        } else if (e.key === 'ArrowDown' && currentIndex < units.length - 1) {
          const nextUnit = units[currentIndex + 1];
          navigate(`/course/${encodeURIComponent(courseName)}/${encodeURIComponent(nextUnit)}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, isFullscreen, isBrowserFull, activeTab, units, unitName, courseName, navigate]);

  const saveNotes = async () => {
    if (!courseName || !unitName) return;
    setSaving(true);
    try {
      await fetch(`/api/courses/${encodeURIComponent(courseName)}/${encodeURIComponent(unitName)}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent })
      });
      // Optionally show toast
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleIframeLoad = (e: any) => {
    try {
        const iframe = e.target;
        if (iframe.contentWindow?.document?.body) {
             // Add a small buffer or use scrollHeight
             const height = iframe.contentWindow.document.body.scrollHeight;
             setIframeHeight(height);
        }
    } catch (err) {
        console.error("Failed to access iframe content", err);
    }
  };

  const handleMenuClick = () => {
    const isStandard = sidebarOpen && !isFullscreen && !isBrowserFull && activeTab === 'notes';
    
    if (isStandard) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
      setIsFullscreen(false);
      setIsBrowserFull(false);
      setActiveTab('notes');
    }
  };

  if (!courseName) return null;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-zinc-900 overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <div 
        className={clsx(
          "bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 transition-all duration-500 ease-in-out flex flex-col overflow-hidden",
          (sidebarOpen && !isFullscreen && !isBrowserFull) ? "w-64 opacity-100" : "w-0 opacity-0"
        )}
      >
        <div className="flex flex-col h-full min-w-[16rem]"> {/* Prevent content reflow during transition */}
          <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between bg-gray-50 dark:bg-zinc-800">
            <h2 className="font-bold truncate" title={courseName}>{courseName}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {units.map(unit => (
              <Link
                key={unit}
                to={`/course/${encodeURIComponent(courseName)}/${encodeURIComponent(unit)}`}
                className={clsx(
                  "block p-2 rounded mb-1 truncate text-sm transition-colors",
                  unit === unitName 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 font-medium" 
                    : "hover:bg-gray-100 dark:hover:bg-zinc-700"
                )}
              >
                {unit}
              </Link>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
              <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                  <ChevronLeft size={16} /> Back to Courses
              </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header / Toolbar - Hide in Full Browser Mode */}
        {!isBrowserFull && (
            <div className="h-12 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center px-4 gap-4 shadow-sm z-10">
            <button onClick={handleMenuClick} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors">
                <Menu size={20} />
            </button>
            <div className="flex-1 font-medium text-lg">{unitName}</div>
            </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Image Viewer (Left 30% -> 70%) */}
          <div 
            className={clsx(
              "bg-black transition-all duration-500 ease-in-out relative shrink-0",
              isBrowserFull ? "fixed inset-0 z-50 w-screen h-screen" : "relative",
              !isBrowserFull && (isFullscreen ? "w-[70%]" : "w-[30%]")
            )}
          >
            <div className="absolute inset-0 overflow-auto">
              <div className="min-h-full min-w-full flex items-center justify-center relative">
                  {content?.html ? (
                  <iframe
                      src={content.html}
                      className="w-full border-none bg-white block"
                      style={{ height: iframeHeight ? `${iframeHeight}px` : '100%' }}
                      title="Presentation Content"
                      onLoad={handleIframeLoad}
                      scrolling="no"
                  />
                  ) : content?.image ? (
                  <img 
                      src={content.image} 
                      alt="Presentation" 
                      className="max-w-full object-contain pointer-events-none select-none block"
                      style={{ maxHeight: isMarking ? 'none' : '100%' }}
                  />
                  ) : (
                  <div className="text-gray-500">No Content</div>
                  )}
                  
                  {/* Marking Overlay */}
                  {isMarking && (
                      <div className="absolute inset-0 z-40 pointer-events-auto">
                          <ReactSketchCanvas
                              style={{ border: 'none' }}
                              width="100%"
                              height="100%"
                              strokeWidth={4}
                              strokeColor="red"
                              canvasColor="transparent"
                          />
                      </div>
                  )}
              </div>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-2 z-50">
              {/* Marking Toggle - Show only in Full Browser Mode */}
              {isBrowserFull && (
                  <button 
                    onClick={() => setIsMarking(!isMarking)}
                    className={clsx(
                        "p-2 rounded transition-colors text-white",
                        isMarking ? "bg-red-600 hover:bg-red-700" : "bg-black/50 hover:bg-black/70"
                    )}
                    title={isMarking ? "Exit Marking Mode" : "Start Marking"}
                  >
                    <Pen size={20} />
                  </button>
              )}

              {/* View Controls - Show when NOT in Full Browser Mode */}
              {!isBrowserFull && (
                <>
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
                    title={isFullscreen ? "Restore Width" : "Expand Width"}
                  >
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                  
                  <button 
                    onClick={() => setIsBrowserFull(true)}
                    className="p-2 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
                    title="Full Browser Screen"
                  >
                     <Monitor size={20} />
                  </button>
                </>
              )}

              {/* Close button - Show ONLY in Full Browser Mode */}
              {isBrowserFull && (
                 <button 
                    onClick={() => setIsBrowserFull(false)}
                    className="p-2 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
                    title="Exit Full Screen"
                  >
                    <X size={20} />
                  </button>
              )}
            </div>
          </div>

          {/* Right Tabs (Remaining width) */}
          <div className={clsx("flex-1 flex flex-col bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-700 transition-all duration-500 ease-in-out min-w-0")}>
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
              <button 
                className={clsx("px-6 py-3 text-sm font-medium transition-colors focus:outline-none", activeTab === 'notes' ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                onClick={() => setActiveTab('notes')}
              >
                Notes
              </button>
              <button 
                className={clsx("px-6 py-3 text-sm font-medium transition-colors focus:outline-none", activeTab === 'canvas' ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                onClick={() => setActiveTab('canvas')}
              >
                Canvas
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'notes' && (
                <div className="h-full flex flex-col p-4">
                    <div className="mb-2 flex justify-between items-center">
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setShowNotePreview(!showNotePreview)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-200 dark:bg-zinc-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                             >
                                 {showNotePreview ? <><EyeOff size={14}/> Edit</> : <><Eye size={14}/> Preview</>}
                             </button>
                        </div>
                        <button 
                            onClick={saveNotes}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                    {showNotePreview ? (
                        <div className="prose dark:prose-invert max-w-none flex-1 overflow-auto border border-gray-200 dark:border-zinc-700 p-4 rounded bg-gray-50 dark:bg-zinc-800/50">
                             <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                     pre({ children }: any) {
                                       if (children?.props?.className?.includes('language-mermaid')) {
                                         return <>{children}</>;
                                       }
                                       return <pre>{children}</pre>;
                                     },
                                     code({ node, inline, className, children, ...props }: any) {
                                       const match = /language-(\w+)/.exec(className || '');
                                       if (!inline && match && match[1] === 'mermaid') {
                                         return (
                                           <div className="bg-transparent">
                                             <Mermaid chart={String(children).replace(/\n$/, '')} />
                                           </div>
                                         );
                                       }
                                       return (
                                         <code className={className} {...props}>
                                           {children}
                                         </code>
                                       );
                                     }
                                   }}
                             >
                                {noteContent}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <textarea 
                            className="flex-1 w-full p-4 border border-gray-200 dark:border-zinc-700 rounded resize-none dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Type your notes here... (Markdown supported)"
                        />
                    )}
                </div>
              )}
              {activeTab === 'canvas' && (
                  <CanvasBoard courseName={courseName} unitName={unitName} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
