import { useState, useEffect, useRef } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { Maximize2, Minimize2, Save, Eraser, Trash2, Pen, Square, Circle, Minus } from 'lucide-react';
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

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line';

export function CanvasBoard({ courseName, unitName }: CanvasBoardProps) {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Drawing State
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(5);
    const [tool, setTool] = useState<Tool>('pen');

    // Shape Drawing State
    const [isDrawingShape, setIsDrawingShape] = useState(false);
    const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
    const [currentPoint, setCurrentPoint] = useState<{x: number, y: number} | null>(null);

    const [canvasBaseSize, setCanvasBaseSize] = useState({ width: 1920, height: 1080 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Monitor resize to update scale or canvas base size
    useEffect(() => {
        if (!containerRef.current) return;
        
        const updateSize = () => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            
            if (isFullscreen) {
                // In fullscreen, ensure base size covers the screen
                setCanvasBaseSize(prev => {
                    if (width > prev.width || height > prev.height) {
                        return {
                            width: Math.max(prev.width, width),
                            height: Math.max(prev.height, height)
                        };
                    }
                    return prev;
                });
                setScale(1);
            } else {
                // In preview, scale down to fit
                // We use a small timeout to ensure state is up to date, though not strictly necessary in effect
                const scaleX = width / canvasBaseSize.width;
                const scaleY = height / canvasBaseSize.height;
                setScale(Math.min(scaleX, scaleY));
            }
        };

        const observer = new ResizeObserver(updateSize);
        observer.observe(containerRef.current);
        
        // Initial call
        updateSize();

        return () => observer.disconnect();
    }, [isFullscreen, canvasBaseSize.width, canvasBaseSize.height]);

    // Apply eraser mode
    useEffect(() => {
        canvasRef.current?.eraseMode(tool === 'eraser');
    }, [tool]);

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

    // Shape Generation
    const generateShapePoints = (type: Tool, start: {x: number, y: number}, end: {x: number, y: number}) => {
        const points = [];
        
        // Helper to interpolate points for straighter lines
        const interpolate = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            const steps = Math.max(2, Math.ceil(dist / 5)); // At least 2 steps, or every 5px
            const result = [];
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                result.push({
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t
                });
            }
            return result;
        };

        if (type === 'line') {
            points.push(...interpolate(start, end));
        } else if (type === 'rectangle') {
            const p1 = start;
            const p2 = { x: end.x, y: start.y };
            const p3 = end;
            const p4 = { x: start.x, y: end.y };
            
            // Add segments with interpolation to prevent smoothing into ellipse
            points.push(...interpolate(p1, p2));
            points.push(...interpolate(p2, p3).slice(1));
            points.push(...interpolate(p3, p4).slice(1));
            points.push(...interpolate(p4, p1).slice(1));
        } else if (type === 'circle') {
            const cx = (start.x + end.x) / 2;
            const cy = (start.y + end.y) / 2;
            const rx = Math.abs(end.x - start.x) / 2;
            const ry = Math.abs(end.y - start.y) / 2;
            const steps = 72;
            for (let i = 0; i <= steps; i++) {
                const theta = (i / steps) * 2 * Math.PI;
                points.push({
                    x: cx + rx * Math.cos(theta),
                    y: cy + ry * Math.sin(theta)
                });
            }
        }
        return points;
    };

    const onShapePointerDown = (e: React.PointerEvent) => {
        if (!['rectangle', 'circle', 'line'].includes(tool)) return;
        e.preventDefault(); // Prevent scrolling
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPoint({x, y});
        setCurrentPoint({x, y});
        setIsDrawingShape(true);
    };

    const onShapePointerMove = (e: React.PointerEvent) => {
        if (!isDrawingShape) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentPoint({x, y});
    };

    const onShapePointerUp = async (e: React.PointerEvent) => {
        if (!isDrawingShape || !startPoint || !currentPoint) return;
        setIsDrawingShape(false);
        
        const points = generateShapePoints(tool, startPoint, currentPoint);
        
        if (points.length > 0 && canvasRef.current) {
             try {
                 const currentPaths = await canvasRef.current.exportPaths();
                 const newPath = {
                     drawMode: true,
                     strokeColor: strokeColor,
                     strokeWidth: strokeWidth,
                     paths: points,
                     strokeLinecap: 'round',
                     strokeLinejoin: 'round',
                     startTimestamp: 0,
                     endTimestamp: 0
                 };
                 // @ts-ignore - types might be slightly off for paths vs CanvasPath
                 canvasRef.current.loadPaths([...currentPaths, newPath]);
             } catch (err) {
                 console.error("Error adding shape path:", err);
             }
        }
        setStartPoint(null);
        setCurrentPoint(null);
    };

    // Helper to render preview SVG
    const renderPreviewShape = () => {
        if (!isDrawingShape || !startPoint || !currentPoint) return null;
        
        // Calculate SVG path data
        const points = generateShapePoints(tool, startPoint, currentPoint);
        if (points.length === 0) return null;

        const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        
        return (
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                <path 
                    d={d} 
                    fill="none" 
                    stroke={strokeColor} 
                    strokeWidth={strokeWidth} 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
            </svg>
        );
    };

    return (
        <div className={clsx(
            "flex flex-col bg-white",
            isFullscreen ? "fixed inset-0 z-50" : "h-full w-full relative"
        )}>
            {/* Toolbar - Only visible/interactive in Fullscreen */}
            {isFullscreen && (
                <div className="flex items-center gap-4 p-2 border-b bg-gray-50 shadow-sm z-10 overflow-x-auto">
                    {/* Tools */}
                    <div className="flex items-center gap-2 border-r pr-4">
                        <button 
                            onClick={() => setTool('pen')}
                            className={clsx("p-2 rounded hover:bg-gray-200", tool === 'pen' && "bg-blue-100 text-blue-600")}
                            title="Pen"
                        >
                            <Pen size={20} />
                        </button>
                        <button 
                            onClick={() => setTool('rectangle')}
                            className={clsx("p-2 rounded hover:bg-gray-200", tool === 'rectangle' && "bg-blue-100 text-blue-600")}
                            title="Rectangle"
                        >
                            <Square size={20} />
                        </button>
                        <button 
                            onClick={() => setTool('circle')}
                            className={clsx("p-2 rounded hover:bg-gray-200", tool === 'circle' && "bg-blue-100 text-blue-600")}
                            title="Circle"
                        >
                            <Circle size={20} />
                        </button>
                        <button 
                            onClick={() => setTool('line')}
                            className={clsx("p-2 rounded hover:bg-gray-200", tool === 'line' && "bg-blue-100 text-blue-600")}
                            title="Line"
                        >
                            <Minus size={20} />
                        </button>
                        <button 
                            onClick={() => setTool('eraser')}
                            className={clsx("p-2 rounded hover:bg-gray-200", tool === 'eraser' && "bg-blue-100 text-blue-600")}
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
                                    if (tool === 'eraser') setTool('pen');
                                }}
                                className={clsx(
                                    "w-6 h-6 rounded-full border border-gray-300 shadow-sm transition-transform hover:scale-110",
                                    strokeColor === c.value && tool !== 'eraser' && "ring-2 ring-blue-500 ring-offset-1"
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
            <div className="flex-1 relative bg-white overflow-hidden cursor-crosshair" ref={containerRef}>
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

                <div
                    style={{
                        width: isFullscreen ? '100%' : canvasBaseSize.width,
                        height: isFullscreen ? '100%' : canvasBaseSize.height,
                        transform: isFullscreen ? 'none' : `translate(-50%, -50%) scale(${scale})`,
                        position: isFullscreen ? 'static' : 'absolute',
                        top: isFullscreen ? 'auto' : '50%',
                        left: isFullscreen ? 'auto' : '50%',
                        transformOrigin: 'center center',
                    }}
                >
                    {/* Shape Overlay - Only active when tool is shape and in fullscreen */}
                    {isFullscreen && ['rectangle', 'circle', 'line'].includes(tool) && (
                        <div 
                            className="absolute inset-0 z-20"
                            onPointerDown={onShapePointerDown}
                            onPointerMove={onShapePointerMove}
                            onPointerUp={onShapePointerUp}
                            onPointerLeave={onShapePointerUp}
                            style={{ touchAction: 'none' }}
                        >
                            {renderPreviewShape()}
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
        </div>
    );
}
