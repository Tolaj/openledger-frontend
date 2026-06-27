import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2, CheckCircle, ShoppingCart } from 'lucide-react'
import { useScanReceipt } from '../../hooks/useAI'
import useGroupStore from '../../store/groupStore'
import useCartStore from '../../store/cartStore'
import { useGroup } from '../../hooks/useGroups'
import Button from '../ui/Button'
import BottomSheet from '../ui/BottomSheet'

export default function ReceiptScanner({ open, onClose }) {
  const [preview, setPreview]   = useState(null)   // data URL for display
  const [b64, setB64]           = useState(null)    // raw base64
  const [mime, setMime]         = useState(null)
  const [result, setResult]     = useState(null)
  const [selected, setSelected] = useState([])
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const groupId  = useGroupStore((s) => s.activeGroupId)
  const { data: group } = useGroup(groupId)
  const groupMembers = (group?.members || []).map((m) => String(m._id || m))
  const { addItem } = useCartStore()
  const { mutate: scan, isPending } = useScanReceipt()

  const reset = () => { setPreview(null); setB64(null); setMime(null); setResult(null); setSelected([]) }
  const handleClose = () => { reset(); onClose() }

  const processFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setPreview(dataUrl)
      const base64 = dataUrl.split(',')[1]
      setB64(base64)
      setMime(file.type || 'image/jpeg')
    }
    reader.readAsDataURL(file)
  }

  const handleScan = () => {
    if (!b64) return
    scan({ imageBase64: b64, mimeType: mime, groupId }, {
      onSuccess: (data) => {
        setResult(data)
        setSelected(data.items.map((_, i) => i))
      },
    })
  }

  const toggleItem = (i) =>
    setSelected((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i])

  const addToCart = () => {
    const items = result.items.filter((_, i) => selected.includes(i))
    for (const item of items) {
      addItem(
        {
          _id: item.matchedProductId || `adhoc-${Date.now()}-${Math.random()}`,
          name: item.description,
          price: item.unitPrice,
          unit: item.unit,
          inventory: false,
        },
        item.unit,
        'equal',
        groupMembers,
        groupMembers,
        item.qty,
      )
    }
    handleClose()
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="Scan Receipt">
      <div className="flex flex-col gap-4">
        {!result ? (
          <>
            {/* Image picker */}
            {!preview ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-zinc-500">Take a photo or upload an image of your receipt. Gemini will extract the items automatically.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex flex-col items-center gap-2 py-6 rounded-2xl border-2 border-dashed border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 active:bg-zinc-50 transition-colors"
                  >
                    <Camera size={28} />
                    <span className="text-sm font-medium">Camera</span>
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex flex-col items-center gap-2 py-6 rounded-2xl border-2 border-dashed border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 active:bg-zinc-50 transition-colors"
                  >
                    <Upload size={28} />
                    <span className="text-sm font-medium">Upload</span>
                  </button>
                </div>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => processFile(e.target.files?.[0])} />
                <input ref={fileRef}   type="file" accept="image/*"                       className="hidden" onChange={(e) => processFile(e.target.files?.[0])} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={preview} alt="Receipt" className="w-full max-h-64 object-contain bg-zinc-100" />
                  <button onClick={reset} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
                <Button fullWidth onClick={handleScan} loading={isPending}>
                  {isPending ? 'Scanning with Gemini…' : 'Extract Items'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results */}
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{result.storeName || 'Receipt'}</p>
                {result.date && <p className="text-xs text-zinc-400">{result.date}</p>}
              </div>
              {result.grandTotal && (
                <p className="ml-auto text-sm font-bold text-zinc-900 flex-shrink-0">₹{result.grandTotal.toFixed(2)}</p>
              )}
            </div>

            <p className="text-xs text-zinc-500">Select items to add to cart:</p>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {result.items.map((item, i) => (
                <label key={i} className={[
                  'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                  selected.includes(i) ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200',
                ].join(' ')}>
                  <input type="checkbox" checked={selected.includes(i)} onChange={() => toggleItem(i)} className="w-4 h-4 accent-zinc-900 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{item.description}</p>
                    <p className="text-xs text-zinc-400">{item.qty} {item.unit} × ₹{item.unitPrice.toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-700 flex-shrink-0">₹{(item.qty * item.unitPrice).toFixed(2)}</p>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={reset}>Scan Again</Button>
              <Button className="flex-1" onClick={addToCart} disabled={selected.length === 0}>
                <ShoppingCart size={15} /> Add {selected.length} to Cart
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
