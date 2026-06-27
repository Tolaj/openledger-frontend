import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react'
import { useInsights } from '../../hooks/useAI'
import { useQueryClient } from '@tanstack/react-query'
import useGroupStore from '../../store/groupStore'
import Spinner from '../ui/Spinner'

const ICONS = { info: TrendingUp, warning: AlertTriangle, tip: Lightbulb }
const COLORS = {
  info:    'bg-blue-50 border-blue-100 text-blue-700',
  warning: 'bg-amber-50 border-amber-100 text-amber-700',
  tip:     'bg-green-50 border-green-100 text-green-700',
}

export default function AIInsights() {
  const { data, isLoading, isError } = useInsights()
  const qc = useQueryClient()
  const groupId = useGroupStore((s) => s.activeGroupId)

  const refresh = () => qc.invalidateQueries({ queryKey: ['ai-insights', groupId] })

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-zinc-600" />
          <span className="text-sm font-semibold text-zinc-900">AI Insights</span>
          <span className="text-xs text-zinc-400">last 6 months</span>
        </div>
        <button onClick={refresh} title="Refresh insights" className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      {isLoading && <Spinner className="py-6" />}

      {isError && (
        <p className="text-sm text-zinc-400 text-center py-4">Could not load insights. Check your Gemini API key.</p>
      )}

      {data?.insights && (
        <div className="flex flex-col gap-2">
          {data.insights.map((ins, i) => {
            const Icon = ICONS[ins.type] || Lightbulb
            const color = COLORS[ins.type] || COLORS.tip
            return (
              <div key={i} className={`flex gap-3 p-3 rounded-xl border ${color}`}>
                <Icon size={15} className="flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold mb-0.5">{ins.title}</p>
                  <p className="text-xs leading-relaxed opacity-80">{ins.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && !data?.insights && !isError && (
        <p className="text-sm text-zinc-400 text-center py-4">Place some orders to see AI insights about your spending.</p>
      )}
    </div>
  )
}
