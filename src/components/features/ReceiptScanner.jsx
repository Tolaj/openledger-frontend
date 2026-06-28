import { useState, useRef } from 'react'
import { Camera, Upload, X, Loader2, CheckCircle, ShoppingCart } from 'lucide-react'
import heic2any from 'heic2any'
import useGroupStore from '../../store/groupStore'
import useCartStore from '../../store/cartStore'
import { useGroup } from '../../hooks/useGroups'
import { useClientAI, cleanGeminiError } from '../../hooks/useClientAI'
import Button from '../ui/Button'
import BottomSheet from '../ui/BottomSheet'
import { getProducts, createProduct } from '../../api/products'
import { suggestProduct } from '../../api/ai'

export default function ReceiptScanner({ open, onClose }) {
  const [preview, setPreview]       = useState(null)   // data URL for display
  const [b64, setB64]               = useState(null)    // raw base64
  const [mime, setMime]             = useState(null)
  const [result, setResult]         = useState(null)
  const [selected, setSelected]     = useState([])
  const [scanning, setScanning]     = useState(false)
  const [scanError, setScanError]   = useState(null)
  const [loadingImage, setLoadingImage] = useState(false)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const groupId  = useGroupStore((s) => s.activeGroupId)
  const { data: group } = useGroup(groupId)
  const groupMembers = (group?.members || []).map((m) => String(m._id || m))
  const { addItem } = useCartStore()
  const { scanReceipt, init, ready } = useClientAI(groupId)

  const reset = () => { setPreview(null); setB64(null); setMime(null); setResult(null); setSelected([]); setScanError(null) }
  const handleClose = () => { reset(); onClose() }

  const isHeic = async (file) => {
    // Check magic bytes: HEIC files start with ftyp box containing 'heic', 'heix', 'mif1', etc.
    const buf = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(buf)
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7])
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
    return ftyp === 'ftyp' && /heic|heix|hevc|hevx|mif1|msf1/i.test(brand)
  }

  const processFile = async (file) => {
    if (!file) return
    setLoadingImage(true)
    setPreview(null)
    let blob = file
    const typeIsHeic = file.type === 'image/heic' || file.type === 'image/heif'
    const nameIsHeic = /\.(heic|heif)$/i.test(file.name || '')
    const typeIsEmpty = !file.type
    const magicIsHeic = (typeIsEmpty || typeIsHeic) && await isHeic(file)

    if (typeIsHeic || nameIsHeic || magicIsHeic) {
      try {
        blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
      } catch (err) {
        console.error('HEIC conversion failed', err)
      }
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setPreview(dataUrl)
      setB64(dataUrl.split(',')[1])
      setMime(blob.type || 'image/jpeg')
      setLoadingImage(false)
    }
    reader.onerror = () => setLoadingImage(false)
    reader.readAsDataURL(blob)
  }

  const handleScan = async () => {
    if (!b64) return
    setScanError(null)
    setScanning(true)
    try {
      if (!ready) await init()
      // Fetch group products for matching
      let products = []
      try {
        const res = await getProducts(groupId)
        products = (res.data || []).map((p) => ({ _id: p._id, name: p.name, unit: p.unit, price: p.price }))
      } catch (_) { /* non-fatal */ }

      const data = await scanReceipt(b64, mime, products)
      const items = data?.items || []
      setResult({ ...data, items })
      setSelected(items.map((_, i) => i))
    } catch (err) {
      setScanError(cleanGeminiError(err))
    } finally {
      setScanning(false)
    }
  }

  const [addingToCart, setAddingToCart] = useState(false)

  const toggleItem = (i) =>
    setSelected((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i])

  const addToCart = async () => {
    const items = result.items.filter((_, i) => selected.includes(i))
    setAddingToCart(true)
    try {
      for (const item of items) {
        let productId = item.matchedProductId

        // For unmatched items: AI suggests category/description, then create product
        if (!productId) {
          let categoryId = null
          try {
            const suggestion = await suggestProduct({ productName: item.description, groupId })
            categoryId = suggestion.data?.categoryId || null

            const newProduct = await createProduct({
              name:        item.description,
              description: suggestion.data?.description || '',
              price:       item.unitPrice > 0 ? item.unitPrice : 0,
              unit:        suggestion.data?.unit || item.unit || 'pcs',
              category:    categoryId || undefined,
              inventory:   false,
              groupId,
            })
            productId = newProduct.data._id
          } catch (_) {
            // If product creation fails, fall back to ad-hoc
            productId = null
          }
        }

        addItem(
          {
            _id:       productId || `adhoc-${Date.now()}-${Math.random()}`,
            name:      item.description,
            price:     item.unitPrice,
            unit:      item.unit,
            inventory: false,
          },
          item.unit,
          'equal',
          groupMembers,
          groupMembers,
          item.qty,
        )
      }
    } finally {
      setAddingToCart(false)
      handleClose()
    }
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="Scan Receipt">
      <div className="flex flex-col gap-4">
        {!result ? (
          <>
            {/* Image picker */}
            {loadingImage ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
                  <Loader2 size={26} className="text-zinc-400 animate-spin" />
                </div>
                <p className="text-sm text-zinc-400">Loading image…</p>
              </div>
            ) : !preview ? (
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
                <div
                  className="relative rounded-2xl w-full h-56 bg-zinc-100 bg-center bg-contain bg-no-repeat"
                  style={{ backgroundImage: `url(${preview})` }}
                >
                  <button onClick={reset} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
                {scanError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{scanError}</p>
                )}
                <Button fullWidth onClick={handleScan} loading={scanning}>
                  {scanning ? 'Scanning with Gemini…' : 'Extract Items'}
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
              <Button variant="outline" className="flex-1" onClick={reset} disabled={addingToCart}>Scan Again</Button>
              <Button className="flex-1" onClick={addToCart} disabled={selected.length === 0 || addingToCart} loading={addingToCart}>
                {addingToCart ? 'Adding to catalog…' : <><ShoppingCart size={15} /> Add {selected.length} to Cart</>}
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  )
}
