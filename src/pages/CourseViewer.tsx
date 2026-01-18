import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Menu, Maximize2, Minimize2, Save, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { ApiResponse, UnitContent } from '@/types';
import clsx from 'clsx';

export function CourseViewer() {
  const { courseName, unitName } = useParams();
  const navigate = useNavigate();
  const [units, setUnits] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [content, setContent] = useState<UnitContent | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'notes'>('content');
  const [noteContent, setNoteContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotePreview, setShowNotePreview] = useState(false);
  const [saving, setSaving] = useState(false);

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
    
    fetch(`/api/courses/${encodeURIComponent(courseName)}/${encodeURIComponent(unitName)}`)
      .then(res => res.json())
      .then((data: ApiResponse<UnitContent>) => {
        if (data.success) {
          setContent(data.data);
          setNoteContent(data.data.update);
        }
      });
  }, [courseName, unitName]);

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

  if (!courseName) return null;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-zinc-900 overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <div 
        className={clsx(
          "bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 transition-all duration-500 ease-in-out flex flex-col overflow-hidden",
          (sidebarOpen && !isFullscreen) ? "w-64 opacity-100" : "w-0 opacity-0"
        )}
      >
        <div className="min-w-[16rem]"> {/* Prevent content reflow during transition */}
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
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 min-w-[16rem]">
            <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                <ChevronLeft size={16} /> Back to Courses
            </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header / Toolbar */}
        <div className="h-12 border-b border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center px-4 gap-4 shadow-sm z-10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex-1 font-medium text-lg">{unitName}</div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Image Viewer (Left 30% -> 70%) */}
          <div 
            className={clsx(
              "bg-black relative transition-all duration-500 ease-in-out flex items-center justify-center",
              isFullscreen ? "w-[70%]" : "w-[30%]"
            )}
          >
            {content?.image ? (
              <img 
                src={content.image} 
                alt="Presentation" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-gray-500">No Image</div>
            )}
            
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>

          {/* Right Tabs (Remaining width) */}
          <div className={clsx("flex-1 flex flex-col bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-700 transition-all duration-500 ease-in-out")}>
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
              <button 
                className={clsx("px-6 py-3 text-sm font-medium transition-colors focus:outline-none", activeTab === 'content' ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                onClick={() => setActiveTab('content')}
              >
                Content
              </button>
              <button 
                className={clsx("px-6 py-3 text-sm font-medium transition-colors focus:outline-none", activeTab === 'notes' ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                onClick={() => setActiveTab('notes')}
              >
                Notes
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'content' && (
                <div className="h-full overflow-auto p-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {content?.readme || ''}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

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
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
