import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Tag, Heart, Package, ShoppingCart, Pencil, Trash2, ShoppingBasket, ChevronDown } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import PageHeader from '../components/layout/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import ProductForm from '../components/features/ProductForm'
import CategoryForm from '../components/features/CategoryForm'
import { useProducts, useDeleteProduct } from '../hooks/useProducts'
import { useCategories, useDeleteCategory } from '../hooks/useCategories'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'

// ── SplitAmong dropdown ───────────────────────────────────────────────────────
function SplitDropdown({ members = [] }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('Even')
  const btnRef = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const [rect, setRect] = useState(null)
  const toggle = () => {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect())
    setOpen((o) => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold whitespace-nowrap"
      >
        {mode} <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && rect && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: 120, zIndex: 9999 }}
          className="bg-white border border-zinc-200 rounded-xl shadow-lg py-1"
        >
          {['Even', 'Custom'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
            >
              <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${mode === m ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300'}`}>
                {mode === m && <span className="text-white text-[8px]">✓</span>}
              </span>
              {m}
            </button>
          ))}
          {members.length > 0 && (
            <>
              <div className="h-px bg-zinc-100 my-1" />
              {members.map((name, i) => (
                <button key={i} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50">
                  <span className="w-3.5 h-3.5 rounded border border-zinc-300" />
                  {name}
                </button>
              ))}
            </>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

// ── Products List tab ─────────────────────────────────────────────────────────
function ProductsListTab({ products, categories, loading, onEdit, onDelete }) {
  const { addItem, items } = useCartStore()
  const [qty, setQty] = useState({})        // productId -> quantity
  const [filters, setFilters] = useState({ name: '', description: '', category: '', price: '', unit: '', manufacturer: '' })

  const getQty = (id) => qty[id] ?? 1
  const setQ = (id, val) => setQty((prev) => ({ ...prev, [id]: Math.max(1, val) }))

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  const filtered = products.filter((p) => {
    const catName = (p.category?.name || '').toLowerCase()
    return (
      p.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      (p.description || '').toLowerCase().includes(filters.description.toLowerCase()) &&
      catName.includes(filters.category.toLowerCase()) &&
      String(p.price).includes(filters.price) &&
      (p.unit || '').toLowerCase().includes(filters.unit.toLowerCase()) &&
      (p.manufacturer || '').toLowerCase().includes(filters.manufacturer.toLowerCase())
    )
  })

  const cartCount = (id) => items.find((i) => i.product._id === id)?.count ?? 0

  if (loading) return <Spinner className="py-12" />
  if (products.length === 0) return (
    <EmptyState icon={Tag} title="No products yet" description="Add your first product" />
  )

  // ── Mobile: card list ──────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.map((p) => (
          <div key={p._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: p.category?.color ? `${p.category.color}22` : '#f4f4f5' }}
            >
              {p.category?.icon || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate">{p.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm font-medium text-zinc-700">${parseFloat(p.price).toFixed(2)}</span>
                <span className="text-xs text-zinc-400">/ {p.unit}</span>
                {p.category?.name && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{p.category.name}</span>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => addItem(p, p.unit)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                <ShoppingBasket size={15} />
              </button>
              <button onClick={() => onEdit(p)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
                <Pencil size={15} />
              </button>
              <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p._id) }} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200">
              {[
                { key: 'name', label: 'name' },
                { key: 'description', label: 'description' },
                { key: 'category', label: 'category' },
                { key: 'price', label: 'price' },
                { key: 'unit', label: 'unit' },
                { key: null, label: 'splitAmong' },
                { key: 'manufacturer', label: 'manufacturer' },
                { key: null, label: 'Action' },
              ].map(({ label }, i, arr) => (
                <th
                  key={label}
                  className={`px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide whitespace-nowrap ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}
                >
                  {label}
                </th>
              ))}
            </tr>
            {/* Filter row */}
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {['name', 'description', 'category', 'price', 'unit', null, 'manufacturer', null].map((key, i, arr) => (
                <td key={i} className={`px-3 py-2 ${i < arr.length - 1 ? 'border-r border-zinc-200' : ''}`}>
                  {key && (
                    <input
                      value={filters[key]}
                      onChange={(e) => setFilter(key, e.target.value)}
                      placeholder="Filter…"
                      className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:border-zinc-900 placeholder-zinc-400"
                    />
                  )}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">No products match the filter</td>
              </tr>
            ) : filtered.map((p) => (
              <tr key={p._id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                {/* name */}
                <td className="px-4 py-3 border-r border-zinc-100 font-medium text-zinc-900 max-w-[140px] truncate">{p.name}</td>
                {/* description */}
                <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500 max-w-[160px] truncate">{p.description || '—'}</td>
                {/* category */}
                <td className="px-4 py-3 border-r border-zinc-100">
                  {p.category ? (
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: p.category.color ? `${p.category.color}22` : '#f4f4f5' }}
                      >
                        {p.category.icon}
                      </span>
                      <span className="text-zinc-700 text-xs">{p.category.name}</span>
                    </span>
                  ) : '—'}
                </td>
                {/* price with stepper */}
                <td className="px-4 py-3 border-r border-zinc-100">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <button
                      onClick={() => setQ(p._id, getQty(p._id) - 1)}
                      className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-bold leading-none"
                    >−</button>
                    <span className="text-sm font-semibold text-zinc-900 w-10 text-center">{parseFloat(p.price).toFixed(2)}</span>
                    <button
                      onClick={() => setQ(p._id, getQty(p._id) + 1)}
                      className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-bold leading-none"
                    >+</button>
                  </div>
                </td>
                {/* unit with qty stepper */}
                <td className="px-4 py-3 border-r border-zinc-100">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <button
                      onClick={() => setQ(p._id, getQty(p._id) - 1)}
                      className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-bold leading-none"
                    >−</button>
                    <span className="text-sm text-zinc-700 w-10 text-center">{p.unit}</span>
                    <button
                      onClick={() => setQ(p._id, getQty(p._id) + 1)}
                      className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-bold leading-none"
                    >+</button>
                  </div>
                </td>
                {/* splitAmong */}
                <td className="px-4 py-3 border-r border-zinc-100">
                  <SplitDropdown />
                </td>
                {/* manufacturer */}
                <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500 max-w-[120px] truncate">{p.manufacturer || '—'}</td>
                {/* actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <button
                      onClick={() => addItem(p, p.unit)}
                      className="p-1.5 rounded-lg bg-zinc-900 text-white active:bg-zinc-700"
                      title="Add to cart"
                    >
                      <ShoppingBasket size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 active:bg-zinc-100"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${p.name}"?`)) onDelete(p._id) }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:bg-zinc-100"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Category tab ──────────────────────────────────────────────────────────────
function CategoryTab({ categories, products, loading, onEdit, onDelete }) {
  if (loading) return <Spinner className="py-12" />
  if (categories.length === 0) return (
    <EmptyState icon={Tag} title="No categories yet" description="Create a category to organise your products" />
  )
  return (
    <div className="flex flex-col gap-2 md:grid md:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <div key={c._id} className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: `${c.color}22` }}
          >
            {c.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{c.name}</p>
            <p className="text-xs text-zinc-400">
              {products.filter((p) => p.category?._id === c._id || p.category === c._id).length} products
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => onEdit(c)} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-zinc-700">
              <Pencil size={15} />
            </button>
            <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) onDelete(c._id) }} className="p-2 rounded-xl text-zinc-400 active:bg-zinc-100 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'products',   label: 'Products List' },
  { key: 'category',   label: 'Category'      },
  { key: 'wishlist',   label: 'Wish List'     },
  { key: 'inventory',  label: 'Inventory'     },
  { key: 'orders',     label: 'Orders'        },
]

export default function Products() {
  const { data: products = [], isLoading: loadingProducts } = useProducts()
  const { data: categories = [], isLoading: loadingCats } = useCategories()
  const { mutate: deleteProduct } = useDeleteProduct()
  const { mutate: deleteCategory } = useDeleteCategory()

  const [tab, setTab] = useState('products')
  const [productSheet, setProductSheet] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categorySheet, setCategorySheet] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  const openAddProduct  = () => { setEditingProduct(null);  setProductSheet(true) }
  const openEditProduct = (p) => { setEditingProduct(p);    setProductSheet(true) }
  const openAddCategory  = () => { setEditingCategory(null);  setCategorySheet(true) }
  const openEditCategory = (c) => { setEditingCategory(c);    setCategorySheet(true) }

  const addBtn = tab === 'products'
    ? <Button size="sm" onClick={openAddProduct}><Plus size={16} /> Add product</Button>
    : tab === 'category'
    ? <Button size="sm" onClick={openAddCategory}><Plus size={16} /> Add category</Button>
    : null

  const mobileAddFn = tab === 'products' ? openAddProduct : tab === 'category' ? openAddCategory : null

  return (
    <>
      <TopBar title="Products" right={
        mobileAddFn && (
          <button onClick={mobileAddFn} className="p-2 rounded-xl active:bg-zinc-100">
            <Plus size={20} />
          </button>
        )
      } />

      <div className="px-4 py-5 md:px-0 md:py-0">
        <PageHeader title="Products" subtitle="Your catalogue" action={addBtn} />

        {/* Tabs — underline style, wrapping */}
        <div className="flex flex-wrap gap-x-6 border-b border-zinc-200 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'pb-3 text-sm font-medium transition-colors whitespace-nowrap',
                tab === t.key
                  ? 'text-zinc-900 border-b-2 border-zinc-900 -mb-px'
                  : 'text-zinc-400 hover:text-zinc-600',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <ProductsListTab
            products={products}
            categories={categories}
            loading={loadingProducts}
            onEdit={openEditProduct}
            onDelete={(id) => deleteProduct(id)}
          />
        )}

        {tab === 'category' && (
          <CategoryTab
            categories={categories}
            products={products}
            loading={loadingCats}
            onEdit={openEditCategory}
            onDelete={(id) => deleteCategory(id)}
          />
        )}

        {tab === 'wishlist' && (
          <EmptyState icon={Heart} title="Wishlist is empty" description="Save items you want to buy later" />
        )}

        {tab === 'inventory' && (
          <EmptyState icon={Package} title="Nothing in stock" description="Stock levels will appear here" />
        )}

        {tab === 'orders' && (
          <EmptyState icon={ShoppingCart} title="No orders yet" description="Your shopping trips will appear here" />
        )}
      </div>

      <ProductForm
        open={productSheet}
        onClose={() => setProductSheet(false)}
        editing={editingProduct}
      />
      <CategoryForm
        open={categorySheet}
        onClose={() => setCategorySheet(false)}
        editing={editingCategory}
      />
    </>
  )
}
