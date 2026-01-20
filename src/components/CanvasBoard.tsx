import { useState, useEffect, useRef } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { Maximize2, Minimize2, Save, Eraser, Trash2, Pen } from 'lucide-react';
import clsx from 'clsx';

interface CanvasBoardProps {
  courseName: string;
  unitName: string;
}

const COLORS = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'White', value: '#FFFFFF' }, // Useful for erasing or dark mode if we supported it
];

const STROKE_WIDTHS = [
    { name: 'Thin', value: 2 },
    { name: 'Medium', value: 5 },
    { name: 'Thick', value: 10 },
    { name: 'Marker', value: 20 },
];

export function CanvasBoard({ courseName, unitName }: CanvasBoardProps) {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Drawing State
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(5);
    const [eraserMode, setEraserMode] = useState(false);

    // Apply eraser mode
    useEffect(() => {
        canvasRef.current?.eraseMode(eraserMode);
    }, [eraserMode]);

    // Load initial data
    useEffect(() => {
        setLoading(true);
        fetch(`/api/courses/${encodeURIComponent(courseName)}/${encodeURIComponent(unitName)}/canvas`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data && canvasRef.current) {
                    canvasRef.current.loadPaths(data.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [courseName, unitName]);

    const handleSave = async () => {
        if (!canvasRef.current) return;
        setSaving(true);
        
        try {
            const paths = await canvasRef.current.exportPaths();
            
            await fetch(`/api/courses/${encodeURIComponent(courseName)}/${encodeURIComponent(unitName)}/canvas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: paths })
            });
            // Ideally show a toast
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear the canvas?')) {
            canvasRef.current?.clearCanvas();
        }
    };

    return (
        <div className={clsx(
            "flex flex-col bg-white",
            isFullscreen ? "fixed inset-0 z-50" : "h-full w-full relative"
        )}>
            {/* Toolbar - Only visible/interactive in Fullscreen or maybe just always visible but limited in non-fullscreen? 
                User requirement: "Non-fullscreen: show board content".
                So in non-fullscreen, we hide toolbar and disable interaction.
            */}
            
            {isFullscreen && (
                <div className="flex items-center gap-4 p-2 border-b bg-gray-50 shadow-sm z-10 overflow-x-auto">
                    {/* Tools */}
                    <div className="flex items-center gap-2 border-r pr-4">
                        <button 
                            onClick={() => setEraserMode(false)}
                            className={clsx("p-2 rounded hover:bg-gray-200", !eraserMode && "bg-blue-100 text-blue-600")}
                            title="Pen"
                        >
                            <Pen size={20} />
                        </button>
                        <button 
                            onClick={() => setEraserMode(true)}
                            className={clsx("p-2 rounded hover:bg-gray-200", eraserMode && "bg-blue-100 text-blue-600")}
                            title="Eraser"
                        >
                            <Eraser size={20} />
                        </button>
                        <button 
                            onClick={handleClear}
                            className="p-2 rounded hover:bg-red-100 text-red-600"
                            title="Clear All"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    {/* Colors */}
                    <div className="flex items-center gap-2 border-r pr-4">
                         {COLORS.map(c => (
                             <button
                                key={c.name}
                                onClick={() => {
                                    setStrokeColor(c.value);
                                    setEraserMode(false);
                                }}
                                className={clsx(
                                    "w-6 h-6 rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-110",
                                    strokeColor === c.value && !eraserMode && "ring-2 ring-blue-500 ring-offset-1"
                                )}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                             />
                         ))}
                    </div>

                    {/* Widths */}
                    <div className="flex items-center gap-2 border-r pr-4">
                        {STROKE_WIDTHS.map(w => (
                            <button
                                key={w.name}
                                onClick={() => setStrokeWidth(w.value)}
                                className={clsx(
                                    "p-2 rounded hover:bg-gray-200 flex items-center justify-center w-10",
                                    strokeWidth === w.value && "bg-blue-100"
                                )}
                                title={w.name}
                            >
                                <div 
                                    className="bg-black rounded-full" 
                                    style={{ width: Math.min(20, w.value), height: Math.min(20, w.value) }}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex-1" />
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                        onClick={() => setIsFullscreen(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        <Minimize2 size={18} /> Exit
                    </button>
                </div>
            )}

            {/* Canvas Area */}
            <div className="flex-1 relative bg-white overflow-hidden cursor-crosshair">
                {!isFullscreen && (
                    /* Overlay to prevent interaction in non-fullscreen */
                    <div className="absolute inset-0 z-10 bg-transparent flex items-center justify-center group cursor-default">
                        <button 
                            onClick={() => setIsFullscreen(true)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-6 py-3 rounded-full flex items-center gap-2 backdrop-blur-sm transform hover:scale-105"
                        >
                            <Maximize2 size={20} /> Enter Fullscreen to Draw
                        </button>
                    </div>
                )}
                
                <ReactSketchCanvas
                    ref={canvasRef}
                    style={{ border: 'none' }}
                    width="100%"
                    height="100%"
                    strokeWidth={strokeWidth}
                    strokeColor={strokeColor}
                    eraserWidth={strokeWidth * 2}
                    canvasColor="transparent"
                    className={!isFullscreen ? "pointer-events-none" : ""}
                />
            </div>
        </div>
    );
}
