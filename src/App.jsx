// App.jsx
import { useState, useEffect } from "react"
import DrawingCanvas from "./components/DrawingCanvas"
import ImageUploader from "./components/ImageUploader"
import ResultDisplay from "./components/ResultDisplay"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Moon, Sun, Upload, Palette, Pi } from "lucide-react"
import { Analytics } from "@vercel/analytics/react"

function App() {
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("draw")
  const [darkMode, setDarkMode] = useState(false)
  const [comment, setComment] = useState('');

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setDarkMode(prefersDark)
    if (prefersDark) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleSubmit = async (imageData) => {
    setIsLoading(true)
    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:6277/calculate"
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageData, comment }),
      })

      if (!response.ok) throw new Error("Failed to get response from server")

      const data = await response.json()
      setResult(data)
      setActiveTab("result")
    } catch (error) {
      console.error("Error submitting:", error)
      alert("Failed to process your input. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="border-b">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" aria-hidden="true" />
            <span>Numicube AI</span>
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ?
              <Sun className="h-5 w-5" aria-hidden="true" /> :
              <Moon className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-center mb-8 text-muted-foreground text-lg sr-only">
          Problem solving through drawing or image upload
        </h2>

        <div className="w-full max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw" className="gap-2" aria-label="Drawing tab">
                <Palette className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only md:not-sr-only">Draw</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2" aria-label="Upload tab">
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only md:not-sr-only">Upload</span>
              </TabsTrigger>
              <TabsTrigger
                value="result"
                disabled={!result}
                aria-label="Solution results"
              >
                <Pi className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only md:not-sr-only">Solution</span>
              </TabsTrigger>
            </TabsList>

            {/* TabsContent remains same but with added aria-live regions */}
            <TabsContent value="draw" aria-live="polite">
              <Card>
                <CardHeader>
                  <CardTitle id="drawing-title">Draw Your Problem</CardTitle>
                  <CardDescription id="drawing-description">
                    Use the tools below to sketch your problem
                  </CardDescription>
                </CardHeader>
                <CardContent aria-describedby="drawing-description">
                  <DrawingCanvas onSubmit={handleSubmit} isLoading={isLoading} comment={comment} setComment={setComment} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" aria-live="polite">
              <Card>
                <CardHeader>
                  <CardTitle id="upload-title">Upload Image</CardTitle>
                  <CardDescription id="upload-description">
                    Upload an image of your problem
                  </CardDescription>
                </CardHeader>
                <CardContent aria-describedby="upload-description">
                  <ImageUploader onSubmit={handleSubmit} isLoading={isLoading} comment={comment} setComment={setComment} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="result" aria-live="polite">
              <Card>
                <CardHeader>
                  <CardTitle id="result-title">AI Solution</CardTitle>
                  <CardDescription id="result-description">
                    Step-by-step explanation
                  </CardDescription>
                </CardHeader>
                <CardContent aria-describedby="result-description">
                  <ResultDisplay result={result?.result} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>Numicube AI © {new Date().getFullYear()}</p>
          <p>AI-Powered Calculator by Varun</p>
        </div>
      </footer>
      <Analytics />
    </div>
  )
}

export default App