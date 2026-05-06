import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  children: React.ReactNode
  text: string
  delay?: number
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ 
  children, 
  text, 
  delay = 500,
  position = 'top' 
}: TooltipProps) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShow(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-black',
    left: 'left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-black',
    right: 'right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black'
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && (
        <div 
          className={`absolute ${positionClasses[position]} px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none shadow-lg`}
        >
          {text}
          <div className={`absolute ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  )
}
