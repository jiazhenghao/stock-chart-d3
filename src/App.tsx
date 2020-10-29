import React, { useEffect } from 'react'
import drawChart from '@/components/d3'
import '@/assets/css/global.css'

export default function App() {
  const vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  )

  useEffect(() => {
    if (document.getElementById('root')) {
      const root = document.getElementById('root') as HTMLElement
      const xmlns = 'http://www.w3.org/2000/svg'
      const svgElem = document.createElementNS(xmlns, 'svg')
      svgElem.id = 'container'
      root.appendChild(svgElem)

      handleResize()
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleResize() {
    if (document.getElementById('root')) {
      if (vw > 1024) {
        drawChart()
      } else if (vw > 768) {
        drawChart(vw - 40)
      } else {
        drawChart(vw - 40, 400)
      }
    }
  }

  return (
    <>
      <h1>Stock Price Demo</h1>
      <h2>Zoom In/Out to See Details</h2>
    </>
  )
}
