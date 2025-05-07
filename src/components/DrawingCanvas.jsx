import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "./ui/button"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { Slider } from "./ui/slider"
import { Undo2, RotateCcw, Send, Download, Eraser, Pencil } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Green", value: "#008000" },
  { name: "Purple", value: "#800080" },
  { name: "Orange", value: "#FFA500" },
]

const TOOLS = {
  PEN: "pen",
  ERASER: "eraser",
}

function DrawingCanvas({ onSubmit, isLoading, comment, setComment }) {
  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState(COLORS[0].value)
  const [brushSize, setBrushSize] = useState(5)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [drawHistory, setDrawHistory] = useState([])
  const [currentPath, setCurrentPath] = useState([])
  const [isMobile, setIsMobile] = useState(false)
  const [activeTool, setActiveTool] = useState(TOOLS.PEN)
  const [showGrid, setShowGrid] = useState(false)
  const requestRef = useRef()
  const previousTimeRef = useRef()

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      const container = canvas.parentElement
      const width = container.clientWidth
      const height = Math.min(window.innerHeight * 0.6, 500)

      setCanvasSize({ width, height })

      canvas.width = width
      canvas.height = height

      const context = canvas.getContext("2d", { alpha: false })
      context.lineCap = "round"
      context.lineJoin = "round"
      context.strokeStyle = color
      context.lineWidth = brushSize
      contextRef.current = context

      // Redraw all paths after resize
      redrawCanvas()
    }

    updateCanvasSize()

    // Debounce resize event for better performance
    let resizeTimer
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateCanvasSize, 100)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(requestRef.current)
    }
  }, [])

  // Update brush properties when they change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = activeTool === TOOLS.ERASER ? "#000000" : color
      contextRef.current.lineWidth = brushSize
    }
  }, [color, brushSize, activeTool])

  // Draw grid if enabled
  useEffect(() => {
    if (showGrid) {
      drawGrid()
    } else {
      redrawCanvas()
    }
  }, [showGrid])

  const drawGrid = useCallback(() => {
    if (!contextRef.current || !canvasRef.current) return

    const ctx = contextRef.current
    const canvas = canvasRef.current
    const gridSize = 20

    // Save current drawing
    redrawCanvas()

    // Draw grid
    ctx.save()
    ctx.strokeStyle = "#CCCCCC"
    ctx.lineWidth = 0.5

    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    ctx.restore()
  }, [canvasRef, contextRef, canvasSize])

  const startDrawing = useCallback(
    (e) => {
      const { offsetX, offsetY } = getCoordinates(e)
      contextRef.current.beginPath()
      contextRef.current.moveTo(offsetX, offsetY)
      setIsDrawing(true)
      setCurrentPath([
        {
          x: offsetX,
          y: offsetY,
          color: activeTool === TOOLS.ERASER ? "#000000" : color,
          brushSize,
          tool: activeTool,
        },
      ])

      // Prevent scrolling on touch devices
      if (e.type === "touchstart") {
        e.preventDefault()
      }
    },
    [color, brushSize, activeTool],
  )

  const draw = useCallback(
    (e) => {
      if (!isDrawing) return

      // Prevent scrolling on touch devices
      if (e.type === "touchmove") {
        e.preventDefault()
      }

      const { offsetX, offsetY } = getCoordinates(e)

      // Use requestAnimationFrame for smoother drawing
      const animate = (time) => {
        if (previousTimeRef.current !== undefined) {
          contextRef.current.lineTo(offsetX, offsetY)
          contextRef.current.stroke()

          setCurrentPath((prev) => [
            ...prev,
            {
              x: offsetX,
              y: offsetY,
              color: activeTool === TOOLS.ERASER ? "#000000" : color,
              brushSize,
              tool: activeTool,
            },
          ])
        }
        previousTimeRef.current = time
        requestRef.current = requestAnimationFrame(animate)
      }

      cancelAnimationFrame(requestRef.current)
      requestRef.current = requestAnimationFrame(animate)
    },
    [isDrawing, color, brushSize, activeTool],
  )

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return

    contextRef.current.closePath()
    setIsDrawing(false)
    cancelAnimationFrame(requestRef.current)
    previousTimeRef.current = undefined

    if (currentPath.length > 1) {
      setDrawHistory((prev) => [...prev, currentPath])
      setCurrentPath([])
    }

    // Redraw grid if enabled
    if (showGrid) {
      drawGrid()
    }
  }, [isDrawing, currentPath, showGrid, drawGrid])

  const getCoordinates = (e) => {
    if (e.touches && e.touches[0]) {
      const rect = canvasRef.current.getBoundingClientRect()
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top,
      }
    }
    return { offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY }
  }

  const redrawCanvas = useCallback(() => {
    const context = contextRef.current
    if (!context || !canvasRef.current) return

    context.fillStyle = "#000000"
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    drawHistory.forEach((path) => {
      if (path.length < 2) return

      context.beginPath()
      context.moveTo(path[0].x, path[0].y)
      context.strokeStyle = path[0].color
      context.lineWidth = path[0].brushSize

      for (let i = 1; i < path.length; i++) {
        context.lineTo(path[i].x, path[i].y)
      }

      context.stroke()
      context.closePath()
    })

    // Reset to current color and brush size
    context.strokeStyle = activeTool === TOOLS.ERASER ? "#000000" : color
    context.lineWidth = brushSize
  }, [drawHistory, color, brushSize, activeTool])

  const handleUndo = useCallback(() => {
    if (drawHistory.length === 0) return

    const newHistory = [...drawHistory]
    newHistory.pop()
    setDrawHistory(newHistory)
    redrawCanvas()

    // Redraw grid if enabled
    if (showGrid) {
      setTimeout(drawGrid, 0)
    }
  }, [drawHistory, redrawCanvas, showGrid, drawGrid])

  const handleReset = useCallback(() => {
    setDrawHistory([])
    if (contextRef.current && canvasRef.current) {
      contextRef.current.fillStyle = "#000000"
      contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)

      // Redraw grid if enabled
      if (showGrid) {
        setTimeout(drawGrid, 0)
      }
    }
  }, [showGrid, drawGrid])

  const handleSubmit = useCallback(() => {
    if (drawHistory.length === 0) {
      alert("Please draw something first")
      return
    }

    const imageData = canvasRef.current.toDataURL("image/png")
    onSubmit(imageData)
  }, [drawHistory, onSubmit])

  const handleDownload = useCallback(() => {
    if (drawHistory.length === 0) {
      alert("Please draw something first")
      return
    }

    const link = document.createElement("a")
    link.download = "drawing.png"
    link.href = canvasRef.current.toDataURL("image/png")
    link.click()
  }, [drawHistory])


  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
        handleUndo()
      }
      // Escape for reset
      else if (e.key === "Escape") {
        e.preventDefault()
        handleReset()
      }
      // Enter for submit
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSubmit()
      }
      // E for eraser
      else if (e.key === "e") {
        e.preventDefault()
        setActiveTool(TOOLS.ERASER)
      }
      // P for pen
      else if (e.key === "p") {
        e.preventDefault()
        setActiveTool(TOOLS.PEN)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleUndo, handleReset, handleSubmit])

  return (
    <div className="flex flex-col gap-4">
      <div className="border rounded-lg overflow-hidden bg-background relative" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair"
          aria-label="Drawing canvas"
          role="img"
          aria-description="Draw your mathematical problem here"
        />

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="drawing-comment"
          className="text-sm font-medium"
        >
          Add Comment (optional):
        </label>
        <input
          id="drawing-comment"
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe your drawing..."
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
          aria-label="Add comment about your drawing"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground text-right">
          {comment.length}/200 characters
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Tools:</span>
          <TooltipProvider>
            <ToggleGroup type="single" value={activeTool} onValueChange={(value) => value && setActiveTool(value)}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value={TOOLS.PEN} aria-label="Pen tool">
                    <Pencil className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Pen (P)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem value={TOOLS.ERASER} aria-label="Eraser tool">
                    <Eraser className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Eraser (E)</TooltipContent>
              </Tooltip>
            </ToggleGroup>
          </TooltipProvider>

          <div className="h-6 border-l mx-2"></div>

          <span className="text-sm font-medium">Colors:</span>
          <ToggleGroup
            type="single"
            value={color}
            onValueChange={(value) => value && setColor(value)}
            disabled={activeTool === TOOLS.ERASER}
          >
            {COLORS.map((c) => (
              <TooltipProvider key={c.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value={c.value}
                      aria-label={c.name}
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: c.value }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{c.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium w-24">Brush Size:</span>
          <Slider
            value={[brushSize]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => setBrushSize(value[0])}
            className="flex-1 bg-gray-200"
          />
          <span className="text-sm w-8 text-right">{brushSize}px</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleUndo} disabled={drawHistory.length === 0}>
                  <Undo2 className="h-4 w-4 mr-2" />
                  Undo
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo last stroke (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleReset} disabled={drawHistory.length === 0}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear canvas (Esc)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={drawHistory.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download drawing</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="ml-auto bg-blue-700" onClick={handleSubmit} disabled={isLoading || drawHistory.length === 0}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Submit drawing (Ctrl+Enter)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          <strong>Keyboard shortcuts:</strong> Pen (P), Eraser (E), Undo (Ctrl+Z), Reset (Esc), Submit
          (Ctrl+Enter)
        </div>
      </div>
    </div>
  )
}

export default DrawingCanvas

