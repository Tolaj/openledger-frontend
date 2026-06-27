import { useEffect, useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import useGroupStore from '../../store/groupStore'
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useIsBusiness } from '../../hooks/useActiveGroupType'
import BottomSheet from '../ui/BottomSheet'
import Input from '../ui/Input'
import Button from '../ui/Button'

const UNITS = [
  'pcs', 'pair', 'set', 'pack', 'box', 'carton', 'dozen', 'tray', 'roll', 'ream', 'bag', 'bundle', 'bunch', 'loaf', 'jar', 'tube', 'bottle', 'can', 'cylinder', 'sheet', 'pad',
  'kg', 'g', 'mg', 'mt',
  'ltr', 'mL',
  'mtr', 'cm', 'ft', 'cft',
  'hr', 'min', 'day', 'month', 'year',
  'project', 'shipment', 'trip', 'night',
  'unit',
]

export default function ProductForm({ open, onClose, editing }) {
  const formId = useId()
  const groupId = useGroupStore((s) => s.activeGroupId)
  const isBusiness = useIsBusiness()
  const { data: categories = [] } = useCategories()
  const { mutate: create, isPending: creating } = useCreateProduct()
  const { mutate: update, isPending: updating } = useUpdateProduct()

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm()
  const trackInventory = useWatch({ control, name: 'inventory', defaultValue: false })

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        price: editing.price,
        unit: editing.unit,
        category: editing.category?._id || editing.category,
        description: editing.description || '',
        manufacturer: editing.manufacturer || '',
        taxRate: editing.taxRate ?? 0,
        inventory: editing.inventory ?? false,
      })
    } else {
      reset({ name: '', price: '', unit: 'pcs', category: '', description: '', manufacturer: '', taxRate: 0, inventory: isBusiness })
    }
  }, [editing, open, isBusiness])

  const onSubmit = (data) => {
    const payload = { ...data, groupId }
    if (editing) {
      update({ id: editing._id, data: payload }, { onSuccess: onClose })
    } else {
      create(payload, { onSuccess: onClose })
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Product' : 'New Product'}
      footer={
        <Button type="submit" form={formId} fullWidth loading={creating || updating}>
          {editing ? 'Save changes' : 'Add product'}
        </Button>
      }
    >
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Product name"
          placeholder="e.g. Whole milk"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.price?.message}
            {...register('price', { required: 'Price is required' })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">Unit</label>
            <select
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              {...register('unit', { required: true })}
            >
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <Input
            label="Tax (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="e.g. 18"
            {...register('taxRate')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Category</label>
          <select
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            {...register('category', { required: 'Category is required' })}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500">Category is required</p>}
        </div>

        <Input
          label="Description (optional)"
          placeholder="Short description"
          {...register('description')}
        />

        <Input
          label="Manufacturer (optional)"
          placeholder="Brand or maker"
          {...register('manufacturer')}
        />

        <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
          <div>
            <p className="text-sm font-medium text-zinc-900">Track In Stock</p>
            <p className="text-xs text-zinc-400">Quantity will be updated when orders are placed</p>
          </div>
          <div className="relative flex-shrink-0">
            <input type="checkbox" className="sr-only" {...register('inventory')} />
            <div className={`w-11 h-6 rounded-full transition-colors ${trackInventory ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${trackInventory ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
        </label>
      </form>
    </BottomSheet>
  )
}
