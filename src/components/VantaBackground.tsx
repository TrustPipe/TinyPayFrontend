"use client"

import { useEffect, useRef } from "react"

interface VantaEffect {
  destroy: () => void;
}

export default function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<VantaEffect | null>(null)

  useEffect(() => {
    // 动态导入 THREE 和 VANTA
    let isMounted = true
    
    const loadVanta = async () => {
      try {
        const THREE = await import("three")
        const VANTA = await import("vanta/dist/vanta.fog.min")
        
        if (!isMounted || !vantaRef.current || vantaEffect.current) return
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vantaEffect.current = (VANTA as any).default({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          highlightColor: 0xffc300,
          midtoneColor: 0x9caff7,
          lowlightColor: 0x6b9ef5,
          baseColor: 0xf5e8b9,
          blurFactor: 0.6,
          zoom: 1,
          speed: 1,
        })
      } catch (error) {
        console.error("Failed to load Vanta:", error)
      }
    }
    
    loadVanta()
    
    return () => {
      isMounted = false
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
        vantaEffect.current = null
      }
    }
  }, [])

  return (
    <div 
      ref={vantaRef} 
      className="fixed top-0 left-0 w-screen"
      style={{ 
        zIndex: 0, 
        pointerEvents: 'none',
        height: '100vh',
        clipPath: 'inset(0 0 0 0)'
      }}
    />
  )
}

