import React from 'react'
import './SolarBackground.css'

export default function SolarBackground() {
  return (
    <div className="solar-bg" aria-hidden="true">
      <svg
        viewBox="0 0 680 400"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="680" height="400" fill="#fdf8f1"/>

        <g stroke="#f0a010" strokeWidth="0.7" fill="none" opacity="0.07">
          <line x1="540" y1="-20" x2="40"  y2="420"/>
          <line x1="540" y1="-20" x2="120" y2="420"/>
          <line x1="540" y1="-20" x2="220" y2="420"/>
          <line x1="540" y1="-20" x2="330" y2="420"/>
          <line x1="540" y1="-20" x2="440" y2="420"/>
          <line x1="540" y1="-20" x2="540" y2="420"/>
          <line x1="540" y1="-20" x2="640" y2="420"/>
          <line x1="540" y1="-20" x2="680" y2="280"/>
        </g>

        <circle cx="540" cy="-20" r="76" fill="#f5a623" opacity="0.06"/>
        <circle cx="540" cy="-20" r="40" fill="#f5a623" opacity="0.08"/>

        <line
          x1="0" y1="310" x2="680" y2="310"
          stroke="#3d6b4f" strokeWidth="0.5" opacity="0.12"
        />

        <g fill="none" stroke="#3d6b4f" strokeWidth="0.5" opacity="0.10">
          <path d="M20  310 Q22 298 24  310"/>
          <path d="M44  310 Q47 284 50  310"/>
          <path d="M80  310 Q83 294 86  310"/>
          <path d="M120 310 Q122 288 125 310"/>
          <path d="M160 310 Q163 296 166 310"/>
          <path d="M200 310 Q203 286 206 310"/>
          <path d="M240 310 Q243 292 246 310"/>
          <path d="M290 310 Q293 290 296 310"/>
          <path d="M336 310 Q338 296 341 310"/>
          <path d="M380 310 Q383 288 386 310"/>
          <path d="M430 310 Q433 294 436 310"/>
          <path d="M480 310 Q483 290 486 310"/>
          <path d="M530 310 Q533 296 536 310"/>
          <path d="M580 310 Q583 286 586 310"/>
          <path d="M630 310 Q633 292 636 310"/>
          <path d="M660 310 Q663 296 666 310"/>
        </g>
      </svg>
    </div>
  )
}