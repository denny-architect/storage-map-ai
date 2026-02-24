const dataPoints = [
  { label: 'Pre-training Data', value: 'PB', scale: 1000000, color: 'bg-raspberry', desc: 'Petabytes of raw text, images, code' },
  { label: 'Training Checkpoints', value: 'TB', scale: 1000, color: 'bg-orange-500', desc: 'Terabytes of model state + optimizer' },
  { label: 'Inference Logs (at scale)', value: 'TB', scale: 500, color: 'bg-blue-500', desc: 'Terabytes of request/response audit' },
  { label: 'Fine-tuning Datasets', value: 'GB', scale: 10, color: 'bg-purple-500', desc: 'Gigabytes of curated examples' },
  { label: 'Full Model Weights', value: 'GB', scale: 5, color: 'bg-teal-500', desc: '70B model ≈ 140GB in FP16' },
  { label: 'LoRA Adapters', value: 'MB', scale: 0.1, color: 'bg-green-500', desc: 'Megabytes of adapter weights' },
  { label: 'Single Inference Request', value: 'KB', scale: 0.001, color: 'bg-gray-400', desc: 'Kilobytes of prompt + response' },
]

export default function DataGravityChart() {
  const maxScale = Math.max(...dataPoints.map(d => d.scale))
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8">
      <div className="space-y-4">
        {dataPoints.map((point, index) => {
          // Use logarithmic scale for visualization
          const logScale = Math.log10(point.scale + 1) / Math.log10(maxScale + 1)
          const widthPercent = Math.max(5, logScale * 100)
          
          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{point.label}</span>
                <span className="text-sm font-bold text-gray-900">{point.value}</span>
              </div>
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full ${point.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-3`}
                  style={{ width: `${widthPercent}%` }}
                >
                  {widthPercent > 30 && (
                    <span className="text-xs text-white font-medium truncate">{point.desc}</span>
                  )}
                </div>
              </div>
              {widthPercent <= 30 && (
                <p className="text-xs text-gray-500 mt-1">{point.desc}</p>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          <span className="font-semibold">Scale:</span> Each bar uses logarithmic scaling to show relative magnitudes. 
          Pre-training data is literally millions of times larger than a single inference request.
        </p>
      </div>
    </div>
  )
}
