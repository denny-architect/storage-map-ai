import { useState, useEffect } from 'react'

const dataPoints = [
  { label: 'Pre-training Data', value: 'PB', scale: 1000000, color: 'from-raspberry to-raspberry-dark', desc: 'Petabytes of raw text, images, code' },
  { label: 'Training Checkpoints', value: 'TB', scale: 1000, color: 'from-orange-500 to-amber-500', desc: 'Terabytes of model state + optimizer' },
  { label: 'Inference Logs (at scale)', value: 'TB', scale: 500, color: 'from-blue-500 to-blue-600', desc: 'Terabytes of request/response audit' },
  { label: 'Fine-tuning Datasets', value: 'GB', scale: 10, color: 'from-purple-500 to-purple-600', desc: 'Gigabytes of curated examples' },
  { label: 'Full Model Weights', value: 'GB', scale: 5, color: 'from-teal-500 to-cyan-500', desc: '70B model ≈ 140GB in FP16' },
  { label: 'LoRA Adapters', value: 'MB', scale: 0.1, color: 'from-emerald-500 to-green-500', desc: 'Megabytes of adapter weights' },
  { label: 'Single Inference Request', value: 'KB', scale: 0.001, color: 'from-gray-400 to-gray-500', desc: 'Kilobytes of prompt + response' },
]

export default function DataGravityChart() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const maxScale = Math.max(...dataPoints.map(d => d.scale))

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-10 shadow-lg">
      <div className="space-y-5">
        {dataPoints.map((point, index) => {
          const logScale = Math.log10(point.scale + 1) / Math.log10(maxScale + 1)
          const widthPercent = Math.max(8, logScale * 100)
          const isHovered = hoveredIndex === index
          
          return (
            <div 
              key={index} 
              className="group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold transition-colors duration-200 ${isHovered ? 'text-gray-900' : 'text-gray-700'}`}>
                  {point.label}
                </span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full transition-all duration-300 ${
                  isHovered 
                    ? `bg-gradient-to-r ${point.color} text-white shadow-lg` 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {point.value}
                </span>
              </div>
              <div className="relative h-10 bg-gray-100 rounded-xl overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)'
                }} />
                
                <div 
                  className={`absolute left-0 top-0 h-full bg-gradient-to-r ${point.color} rounded-xl flex items-center justify-end pr-4 transition-all duration-700 ease-out ${
                    isHovered ? 'shadow-lg' : ''
                  }`}
                  style={{ 
                    width: isVisible ? `${widthPercent}%` : '0%',
                    transitionDelay: `${index * 80}ms`
                  }}
                >
                  {widthPercent > 35 && (
                    <span className="text-xs text-white font-medium truncate opacity-90">
                      {point.desc}
                    </span>
                  )}
                </div>
                
                {/* Shimmer effect on hover */}
                {isHovered && (
                  <div 
                    className="absolute inset-0 shimmer rounded-xl"
                    style={{ width: `${widthPercent}%` }}
                  />
                )}
              </div>
              {widthPercent <= 35 && (
                <p className={`text-xs mt-2 transition-colors duration-200 ${isHovered ? 'text-gray-700' : 'text-gray-500'}`}>
                  {point.desc}
                </p>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Legend / Explanation */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-raspberry/10 to-raspberry/5 flex items-center justify-center">
              <svg className="w-5 h-5 text-raspberry" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Logarithmic Scale</p>
              <p className="text-xs text-gray-500">Bars represent relative magnitudes across orders of magnitude</p>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-600">
              Pre-training data is <span className="font-bold text-raspberry">1,000,000,000x</span> larger
            </p>
            <p className="text-xs text-gray-500">than a single inference request</p>
          </div>
        </div>
      </div>
    </div>
  )
}
