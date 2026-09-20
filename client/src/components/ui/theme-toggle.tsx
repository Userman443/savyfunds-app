import { useEffect } from "react"
import { Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  // On component mount, ensure light mode is always applied
  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove any theme classes and set to light mode
    root.classList.remove("dark", "system")
    root.classList.add("light")
    
    // Clear any stored theme preference
    localStorage.removeItem("theme")
  }, [])

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="relative h-9 w-9 hidden"
      aria-hidden="true"
    >
      <Sun className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Light Theme (Default)</span>
    </Button>
  )
}