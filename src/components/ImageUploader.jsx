// components/ImageUploader.jsx
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "./ui/button"
import { Loader2, Upload } from "lucide-react"

function ImageUploader({ onSubmit, isLoading, comment, setComment }) {
    const [preview, setPreview] = useState(null)
    const [error, setError] = useState("")

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file")
            return
        }

        if (file.size > 1 * 1024 * 1024) {
            setError("File size must be less than 1MB")
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setPreview(reader.result)
            setError("")
        }
        reader.readAsDataURL(file)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg"]
        },
        maxFiles: 1,
        multiple: false
    })

    const handleSubmit = () => {
        if (!preview) {
            setError("Please select an image first")
            return
        }
        onSubmit(preview)
    }

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/30"}
          ${error ? "border-destructive" : ""}`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div>
                        <p className="font-medium">
                            {isDragActive ? "Drop image here" : "Drag image here or click to select"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Supported formats: PNG, JPG (max 1MB)
                        </p>
                    </div>
                    {preview && (
                        <div className="mt-4 relative">
                            <img
                                src={preview}
                                alt="Preview"
                                className="max-h-48 rounded-lg border shadow-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="image-comment"
                    className="text-sm font-medium"
                >
                    Add Comment (optional):
                </label>
                <input
                    id="image-comment"
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your image..."
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                    aria-label="Add comment about your image"
                    maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                    {comment.length}/200 characters
                </p>
            </div>

            {error && <p className="text-destructive text-sm text-center">{error}</p>}

            <div className="flex justify-center gap-4  w-full">
                <Button
                    onClick={handleSubmit}
                    disabled={!preview || isLoading}
                    className="w-full max-w-xs bg-blue-700 rounded-2xl"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            Submit Image
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

export default ImageUploader