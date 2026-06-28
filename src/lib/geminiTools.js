import api from './axios'

// Compact line-item schema reused across orders / invoices / POs
const ITEM = {
  type: 'object',
  properties: {
    productId:   { type: 'string' },
    description: { type: 'string' },
    qty:         { type: 'number' },
    unit:        { type: 'string' },
    unitPrice:   { type: 'number' },
    taxRate:     { type: 'number' },
    amount:      { type: 'number' },
  },
  required: ['qty', 'unitPrice', 'amount'],
}

const STR  = { type: 'string' }
const NUM  = { type: 'number' }
const BOOL = { type: 'boolean' }
const DATE = { type: 'string', description: 'YYYY-MM-DD' }
const ITEMS = { type: 'array', items: ITEM }

// Status enums
const INV_STATUS    = { type: 'string', enum: ['draft','sent','paid','overdue','cancelled'] }
const PO_STATUS     = { type: 'string', enum: ['draft','sent','partial','received','cancelled'] }
const SO_STATUS     = { type: 'string', enum: ['draft','sent','confirmed','partial','delivered','cancelled'] }
const GO_STATUS     = { type: 'string', enum: ['draft','sent','confirmed','partial','received','delivered','cancelled'] }
const RECEIPT_STATUS = { type: 'string', enum: ['complete','partial'] }

// ── Tool declarations (kept minimal to reduce tokens sent to Gemini) ──────────
export const TOOL_DECLARATIONS = [

  // Finance
  { name:'get_spending_summary',   description:'Financial summary (income/expense/loan/investment/net) for optional date range.', parameters:{ type:'object', properties:{ startDate:DATE, endDate:DATE }, required:[] } },
  { name:'get_finance_entries',    description:'List finance transactions. Filter by type and/or date.', parameters:{ type:'object', properties:{ type:{ type:'string', enum:['income','expense','loan','investment'] }, startDate:DATE, endDate:DATE }, required:[] } },
  { name:'create_finance_entry',   description:'Add income/expense/loan/investment entry.', parameters:{ type:'object', properties:{ type:{ type:'string', enum:['income','expense','loan','investment'] }, amount:NUM, description:STR, date:DATE, categoryId:STR, notes:STR }, required:['type','amount','description'] } },
  { name:'update_finance_entry',   description:'Edit a finance entry by id.', parameters:{ type:'object', properties:{ id:STR, type:{ type:'string', enum:['income','expense','loan','investment'] }, amount:NUM, description:STR, date:DATE, categoryId:STR, notes:STR }, required:['id'] } },
  { name:'delete_finance_entry',   description:'Delete a finance entry by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Orders
  { name:'get_orders',      description:'List purchase orders with items.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_order',    description:'Create a purchase order. Use get_products first for product ids.', parameters:{ type:'object', properties:{ name:STR, date:DATE, totalPrice:STR, splitType:{ type:'string', enum:['equal','custom'], description:'How cost is split among members, default equal' }, splitAmong:{ type:'array', items:{ type:'string' }, description:'Member ids to split among — omit to split among all group members' }, items:{ type:'array', items:{ type:'object', properties:{ productId:STR, unit:STR, price:STR, count:STR }, required:['productId','unit','price','count'] } } }, required:['name','date','totalPrice','items'] } },
  { name:'delete_order',    description:'Delete an order by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Products
  { name:'get_products',    description:'List product catalog.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_product',  description:'Add a product. Use get_categories first for categoryId.', parameters:{ type:'object', properties:{ name:STR, categoryId:STR, price:STR, unit:STR, description:STR, manufacturer:STR, taxRate:NUM, trackInventory:BOOL }, required:['name','categoryId','price','unit'] } },
  { name:'update_product',  description:'Update a product by id.', parameters:{ type:'object', properties:{ id:STR, name:STR, categoryId:STR, price:STR, unit:STR, description:STR, taxRate:NUM, trackInventory:BOOL }, required:['id'] } },
  { name:'delete_product',  description:'Delete a product by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Categories
  { name:'get_categories',   description:'List categories.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_category',  description:'Create a category.', parameters:{ type:'object', properties:{ name:STR, description:STR, icon:STR, color:STR }, required:['name'] } },
  { name:'delete_category',  description:'Delete a category by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Budgets
  { name:'get_budgets',    description:'List budgets with allocated/spent/remaining by category.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_budget',  description:'Create a budget plan.', parameters:{ type:'object', properties:{ name:STR, totalAmount:NUM, startDate:DATE, endDate:DATE, notes:STR, categories:{ type:'array', items:{ type:'object', properties:{ name:STR, categoryRefId:STR, allocatedAmount:NUM }, required:['name','allocatedAmount'] } } }, required:['name','totalAmount','startDate','endDate'] } },
  { name:'update_budget',  description:'Update a budget by id.', parameters:{ type:'object', properties:{ id:STR, name:STR, totalAmount:NUM, startDate:DATE, endDate:DATE, notes:STR }, required:['id'] } },
  { name:'delete_budget',  description:'Delete a budget by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Inventory & Stock
  { name:'get_inventory',           description:'List current stock levels.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'get_stock_movements',     description:'List stock movement history.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_stock_adjustment', description:'Manually adjust stock (+in/-out). Use get_products for productId.', parameters:{ type:'object', properties:{ productId:STR, change:NUM, reason:{ type:'string', enum:['damage','write-off','recount','other'] }, notes:STR }, required:['productId','change','reason'] } },

  // Wishlists
  { name:'get_wishlists',   description:'List wishlists (planned purchases).', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_wishlist', description:'Create a wishlist. Use get_products for product ids.', parameters:{ type:'object', properties:{ name:STR, date:DATE, totalPrice:STR, items:{ type:'array', items:{ type:'object', properties:{ productId:STR, unit:STR, price:STR, count:STR }, required:['productId','unit','price','count'] } } }, required:['name','date','totalPrice','items'] } },
  { name:'delete_wishlist', description:'Delete a wishlist by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Recurring
  { name:'get_recurring',    description:'List recurring payment/invoice schedules.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_recurring', description:'Create a recurring schedule. Use get_recipients for recipientId.', parameters:{ type:'object', properties:{ name:STR, recipientId:STR, direction:{ type:'string', enum:['payable','receivable'] }, frequency:{ type:'string', enum:['daily','weekly','monthly','quarterly','yearly'] }, nextRunDate:DATE, autoCreate:BOOL, grandTotal:NUM, notes:STR, items:ITEMS }, required:['name','direction','frequency','nextRunDate'] } },
  { name:'update_recurring', description:'Update a recurring schedule by id (status: active/paused/cancelled).', parameters:{ type:'object', properties:{ id:STR, name:STR, frequency:STR, nextRunDate:DATE, status:{ type:'string', enum:['active','paused','cancelled'] }, grandTotal:NUM, notes:STR }, required:['id'] } },
  { name:'delete_recurring', description:'Delete a recurring schedule by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Recipients
  { name:'get_recipients',   description:'List recipients/contacts.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_recipient', description:'Add a recipient.', parameters:{ type:'object', properties:{ name:STR, email:STR, phone:STR, type:{ type:'string', enum:['payee','payer','both'] }, notes:STR }, required:['name'] } },
  { name:'update_recipient', description:'Update a recipient by id.', parameters:{ type:'object', properties:{ id:STR, name:STR, email:STR, phone:STR, type:STR, notes:STR }, required:['id'] } },
  { name:'delete_recipient', description:'Delete a recipient by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // General Orders
  { name:'get_general_orders',    description:'List general orders (payable/receivable, no vendor/customer system).', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_general_order',  description:'Create a general order. Use get_recipients for recipientId.', parameters:{ type:'object', properties:{ goNumber:STR, recipientId:STR, direction:{ type:'string', enum:['payable','receivable'] }, status:GO_STATUS, orderDate:DATE, notes:STR, items:ITEMS, subtotal:NUM, taxAmount:NUM, grandTotal:NUM }, required:['goNumber','recipientId','direction','items','grandTotal'] } },
  { name:'update_general_order',  description:'Update a general order by id.', parameters:{ type:'object', properties:{ id:STR, status:GO_STATUS, notes:STR, orderDate:DATE }, required:['id'] } },
  { name:'delete_general_order',  description:'Delete a general order by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // General Invoices
  { name:'get_general_invoices',   description:'List general invoices.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_general_invoice', description:'Create a general invoice. Use get_recipients for recipientId.', parameters:{ type:'object', properties:{ invoiceNumber:STR, recipientId:STR, generalOrderId:STR, direction:{ type:'string', enum:['income','expense'] }, status:INV_STATUS, invoiceDate:DATE, dueDate:DATE, notes:STR, items:ITEMS, subtotal:NUM, taxAmount:NUM, grandTotal:NUM }, required:['invoiceNumber','recipientId','direction','items','grandTotal'] } },
  { name:'update_general_invoice', description:'Update a general invoice by id.', parameters:{ type:'object', properties:{ id:STR, status:INV_STATUS, dueDate:DATE, notes:STR }, required:['id'] } },
  { name:'delete_general_invoice', description:'Delete a general invoice by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Vendors (business)
  { name:'get_vendors',    description:'List vendors.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_vendor',  description:'Add a vendor.', parameters:{ type:'object', properties:{ name:STR, contactPerson:STR, phone:STR, email:STR, address:STR, gstin:STR, currency:STR, notes:STR }, required:['name'] } },
  { name:'update_vendor',  description:'Update a vendor by id.', parameters:{ type:'object', properties:{ id:STR, name:STR, contactPerson:STR, phone:STR, email:STR, address:STR, gstin:STR, notes:STR }, required:['id'] } },
  { name:'delete_vendor',  description:'Delete a vendor by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Customers (business)
  { name:'get_customers',   description:'List customers.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_customer', description:'Add a customer.', parameters:{ type:'object', properties:{ name:STR, contactPerson:STR, phone:STR, email:STR, address:STR, gstin:STR, currency:STR, notes:STR }, required:['name'] } },
  { name:'update_customer', description:'Update a customer by id.', parameters:{ type:'object', properties:{ id:STR, name:STR, contactPerson:STR, phone:STR, email:STR, address:STR, gstin:STR, notes:STR }, required:['id'] } },
  { name:'delete_customer', description:'Delete a customer by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Purchase Orders (business)
  { name:'get_purchase_orders',   description:'List purchase orders (business).', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_purchase_order', description:'Create a PO. Use get_vendors for vendorId.', parameters:{ type:'object', properties:{ poNumber:STR, vendorId:STR, status:PO_STATUS, expectedDate:DATE, notes:STR, items:ITEMS, subtotal:NUM, taxAmount:NUM, grandTotal:NUM }, required:['poNumber','vendorId','items','grandTotal'] } },
  { name:'update_purchase_order', description:'Update a PO by id.', parameters:{ type:'object', properties:{ id:STR, status:PO_STATUS, expectedDate:DATE, notes:STR }, required:['id'] } },
  { name:'delete_purchase_order', description:'Delete a PO by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Sales Orders (business)
  { name:'get_sales_orders',   description:'List sales orders (business).', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_sales_order', description:'Create a SO. Use get_customers for customerId.', parameters:{ type:'object', properties:{ soNumber:STR, customerId:STR, status:SO_STATUS, deliveryDate:DATE, notes:STR, items:ITEMS, subtotal:NUM, taxAmount:NUM, grandTotal:NUM }, required:['soNumber','customerId','items','grandTotal'] } },
  { name:'update_sales_order', description:'Update a SO by id.', parameters:{ type:'object', properties:{ id:STR, status:SO_STATUS, deliveryDate:DATE, notes:STR }, required:['id'] } },
  { name:'delete_sales_order', description:'Delete a SO by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Purchase Invoices (business)
  { name:'get_purchase_invoices',   description:'List purchase invoices (bills from vendors).', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_purchase_invoice', description:'Create a purchase invoice. Use get_vendors for vendorId.', parameters:{ type:'object', properties:{ invoiceNumber:STR, vendorId:STR, purchaseOrderId:STR, grnId:STR, status:INV_STATUS, invoiceDate:DATE, dueDate:DATE, notes:STR, items:ITEMS, subtotal:NUM, taxAmount:NUM, grandTotal:NUM }, required:['invoiceNumber','vendorId','items','grandTotal'] } },
  { name:'update_purchase_invoice', description:'Update a purchase invoice by id (e.g. mark paid).', parameters:{ type:'object', properties:{ id:STR, status:INV_STATUS, dueDate:DATE, notes:STR }, required:['id'] } },
  { name:'delete_purchase_invoice', description:'Delete a purchase invoice by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Sales Invoices (business)
  { name:'get_sales_invoices',   description:'List sales invoices (bills to customers).', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_sales_invoice', description:'Create a sales invoice. Use get_customers for customerId.', parameters:{ type:'object', properties:{ invoiceNumber:STR, customerId:STR, salesOrderId:STR, deliveryId:STR, status:INV_STATUS, invoiceDate:DATE, dueDate:DATE, notes:STR, items:ITEMS, subtotal:NUM, taxAmount:NUM, grandTotal:NUM }, required:['invoiceNumber','customerId','items','grandTotal'] } },
  { name:'update_sales_invoice', description:'Update a sales invoice by id.', parameters:{ type:'object', properties:{ id:STR, status:INV_STATUS, dueDate:DATE, notes:STR }, required:['id'] } },
  { name:'delete_sales_invoice', description:'Delete a sales invoice by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // GRNs (business)
  { name:'get_grns',    description:'List Goods Receipt Notes.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_grn',  description:'Record goods received from vendor. Auto-updates stock. Use get_purchase_orders for purchaseOrderId.', parameters:{ type:'object', properties:{ grnNumber:STR, purchaseOrderId:STR, status:RECEIPT_STATUS, receivedDate:DATE, notes:STR, items:{ type:'array', items:{ type:'object', properties:{ productId:STR, description:STR, qtyOrdered:NUM, qtyReceived:NUM, unit:STR, unitPrice:NUM }, required:['qtyReceived'] } } }, required:['grnNumber','purchaseOrderId','items'] } },
  { name:'delete_grn',  description:'Delete a GRN by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Deliveries (business)
  { name:'get_deliveries',   description:'List delivery records.', parameters:{ type:'object', properties:{}, required:[] } },
  { name:'create_delivery',  description:'Record goods dispatched to customer. Use get_sales_orders for salesOrderId.', parameters:{ type:'object', properties:{ deliveryNumber:STR, salesOrderId:STR, status:RECEIPT_STATUS, deliveredDate:DATE, notes:STR, items:{ type:'array', items:{ type:'object', properties:{ productId:STR, description:STR, qtyOrdered:NUM, qtyDelivered:NUM, unit:STR, unitPrice:NUM }, required:['qtyDelivered'] } } }, required:['deliveryNumber','salesOrderId','items'] } },
  { name:'delete_delivery',  description:'Delete a delivery by id.', parameters:{ type:'object', properties:{ id:STR }, required:['id'] } },

  // Clarification (UI only — never hits the backend)
  {
    name: 'clarify',
    description: 'Ask the user a clarifying question ONLY when you are about to perform a write/create/update/delete and the exact action or target is genuinely ambiguous. Do NOT use this for read/list/count queries — just answer those directly.',
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to ask the user' },
        options:  { type: 'array', items: { type: 'string' }, description: '2-4 short option labels the user can click' },
      },
      required: ['question', 'options'],
    },
  },
]

// ── Helper to map AI line items to backend shape ──────────────────────────────
const mapItems = (items = []) =>
  items.map((it) => ({
    product:     it.productId || undefined,
    description: it.description || undefined,
    qty:         it.qty,
    unit:        it.unit,
    unitPrice:   it.unitPrice,
    taxRate:     it.taxRate || 0,
    amount:      it.amount,
  }))

export async function runTool(name, args, groupId) {
  const g = groupId // shorthand

  try {
    switch (name) {

      // ── FINANCE ──────────────────────────────────────────────────────────

      case 'get_spending_summary': {
        const params = { groupId: g }
        if (args.startDate) params.startDate = args.startDate
        if (args.endDate)   params.endDate   = args.endDate
        const res = await api.get('/finance/summary', { params })
        return res.data
      }

      case 'get_finance_entries': {
        const params = { groupId: g }
        if (args.type)      params.type      = args.type
        if (args.startDate) params.startDate = args.startDate
        if (args.endDate)   params.endDate   = args.endDate
        const res = await api.get('/finance', { params })
        return (res.data || []).slice(0, 50).map((e) => ({
          id:          e._id,
          type:        e.type,
          amount:      e.amount,
          description: e.description,
          category:    e.category?.name || null,
          date:        e.date,
          notes:       e.notes || null,
        }))
      }

      case 'create_finance_entry': {
        const body = {
          type:        args.type,
          amount:      args.amount,
          description: args.description,
          date:        args.date || new Date().toISOString().slice(0, 10),
          group:       g,
        }
        if (args.categoryId) body.category = args.categoryId
        if (args.notes)      body.notes    = args.notes
        const res = await api.post('/finance', body)
        return { id: res.data._id, message: `Finance entry created: ${args.type} of ${args.amount}` }
      }

      case 'update_finance_entry': {
        const body = {}
        if (args.type)       body.type        = args.type
        if (args.amount)     body.amount      = args.amount
        if (args.description)body.description = args.description
        if (args.date)       body.date        = args.date
        if (args.categoryId) body.category    = args.categoryId
        if (args.notes)      body.notes       = args.notes
        const res = await api.put(`/finance/${args.id}`, body)
        return { id: res.data._id, message: 'Finance entry updated.' }
      }

      case 'delete_finance_entry': {
        await api.delete(`/finance/${args.id}`)
        return { message: 'Finance entry deleted.' }
      }

      // ── ORDERS ────────────────────────────────────────────────────────────

      case 'get_orders': {
        const res = await api.get('/orders', { params: { groupId: g } })
        return (res.data || []).slice(0, 30).map((o) => ({
          id:         o._id,
          name:       o.name,
          date:       o.date,
          totalPrice: o.totalPrice,
          items:      (o.items || []).map((it) => ({
            product:  it.product?.name || 'Unknown',
            qty:      it.count,
            price:    it.price,
            unit:     it.unit,
          })),
        }))
      }

      case 'create_order': {
        // Fetch group members to resolve splitAmong
        let memberIds = []
        try {
          const groupRes = await api.get(`/groups/${g}`)
          memberIds = (groupRes.data?.members || []).map((m) => String(m._id || m))
        } catch (_) {}
        const splitAmong = (args.splitAmong?.length ? args.splitAmong : memberIds)
        const splitType  = args.splitType || 'equal'
        const body = {
          name:       args.name,
          date:       args.date,
          totalPrice: args.totalPrice,
          groupId:    g,
          items: (args.items || []).map((it) => ({
            product:    it.productId,
            unit:       it.unit,
            price:      it.price,
            count:      it.count,
            splitType,
            splitAmong,
          })),
        }
        const res = await api.post('/orders', body)
        return { id: res.data._id, message: `Order "${args.name}" created successfully.` }
      }

      case 'delete_order': {
        await api.delete(`/orders/${args.id}`)
        return { message: 'Order deleted.' }
      }

      // ── PRODUCTS ──────────────────────────────────────────────────────────

      case 'get_products': {
        const res = await api.get('/products', { params: { groupId: g } })
        return (res.data || []).map((p) => ({
          id:          p._id,
          name:        p.name,
          price:       p.price,
          unit:        p.unit,
          category:    p.category?.name || null,
          categoryId:  p.category?._id  || null,
          description: p.description    || null,
          taxRate:     p.taxRate         || 0,
          trackInventory: p.inventory   || false,
        }))
      }

      case 'create_product': {
        const body = {
          name:     args.name,
          category: args.categoryId,
          price:    args.price,
          unit:     args.unit,
          groupId:  g,
        }
        if (args.description)  body.description  = args.description
        if (args.manufacturer) body.manufacturer = args.manufacturer
        if (args.taxRate)      body.taxRate      = args.taxRate
        if (args.trackInventory !== undefined) body.inventory = args.trackInventory
        const res = await api.post('/products', body)
        return { id: res.data._id, message: `Product "${args.name}" created.` }
      }

      case 'update_product': {
        const body = {}
        if (args.name)         body.name         = args.name
        if (args.categoryId)   body.category     = args.categoryId
        if (args.price)        body.price        = args.price
        if (args.unit)         body.unit         = args.unit
        if (args.description)  body.description  = args.description
        if (args.manufacturer) body.manufacturer = args.manufacturer
        if (args.taxRate !== undefined) body.taxRate = args.taxRate
        if (args.trackInventory !== undefined) body.inventory = args.trackInventory
        const res = await api.put(`/products/${args.id}`, body)
        return { id: res.data._id, message: 'Product updated.' }
      }

      case 'delete_product': {
        await api.delete(`/products/${args.id}`)
        return { message: 'Product deleted.' }
      }

      // ── CATEGORIES ────────────────────────────────────────────────────────

      case 'get_categories': {
        const res = await api.get('/categories', { params: { groupId: g } })
        return (res.data || []).map((c) => ({
          id:    c._id,
          name:  c.name,
          icon:  c.icon  || null,
          color: c.color || null,
        }))
      }

      case 'create_category': {
        const body = { name: args.name, groupId: g }
        if (args.description) body.description = args.description
        if (args.icon)        body.icon        = args.icon
        if (args.color)       body.color       = args.color
        const res = await api.post('/categories', body)
        return { id: res.data._id, message: `Category "${args.name}" created.` }
      }

      case 'delete_category': {
        await api.delete(`/categories/${args.id}`)
        return { message: 'Category deleted.' }
      }

      // ── BUDGETS ───────────────────────────────────────────────────────────

      case 'get_budgets': {
        const res = await api.get('/budgets', { params: { groupId: g } })
        return (res.data || []).map((b) => ({
          id:              b._id,
          name:            b.name,
          totalAmount:     b.totalAmount,
          amountSpent:     b.amountSpent,
          amountRemaining: b.amountRemaining,
          startDate:       b.startDate,
          endDate:         b.endDate,
          categories:      (b.categories || []).map((c) => ({
            name:      c.name,
            allocated: c.allocatedAmount,
            spent:     c.spentAmount,
            remaining: c.allocatedAmount - c.spentAmount,
          })),
        }))
      }

      case 'create_budget': {
        const body = {
          name:        args.name,
          totalAmount: args.totalAmount,
          startDate:   args.startDate,
          endDate:     args.endDate,
          group:       g,
        }
        if (args.notes) body.notes = args.notes
        if (args.categories) {
          body.categories = args.categories.map((c) => ({
            name:            c.name,
            categoryRef:     c.categoryRefId || undefined,
            allocatedAmount: c.allocatedAmount,
          }))
        }
        const res = await api.post('/budgets', body)
        return { id: res.data._id, message: `Budget "${args.name}" created.` }
      }

      case 'update_budget': {
        const body = {}
        if (args.name)        body.name        = args.name
        if (args.totalAmount) body.totalAmount = args.totalAmount
        if (args.startDate)   body.startDate   = args.startDate
        if (args.endDate)     body.endDate     = args.endDate
        if (args.notes)       body.notes       = args.notes
        await api.put(`/budgets/${args.id}`, body)
        return { message: 'Budget updated.' }
      }

      case 'delete_budget': {
        await api.delete(`/budgets/${args.id}`)
        return { message: 'Budget deleted.' }
      }

      // ── INVENTORY & STOCK ─────────────────────────────────────────────────

      case 'get_inventory': {
        const res = await api.get('/inventory', { params: { groupId: g } })
        return (res.data || []).map((i) => ({
          id:       i._id,
          product:  i.product?.name || 'Unknown',
          productId:i.product?._id  || i.product,
          qty:      i.quantityAvailable,
          unit:     i.unit,
          price:    i.price,
        }))
      }

      case 'get_stock_movements': {
        const res = await api.get('/stock-movements', { params: { groupId: g } })
        return (res.data || []).slice(0, 50).map((m) => ({
          id:         m._id,
          product:    m.product?.name || m.product,
          change:     m.change,
          qtyAfter:   m.qtyAfter,
          sourceType: m.sourceType,
          sourceRef:  m.sourceRef,
          reason:     m.reason,
          date:       m.createdAt,
        }))
      }

      case 'create_stock_adjustment': {
        const body = {
          productId: args.productId,
          change:    args.change,
          reason:    args.reason,
          notes:     args.notes || '',
        }
        await api.post('/stock-movements/adjustment', body, { params: { groupId: g } })
        return { message: `Stock adjusted by ${args.change > 0 ? '+' : ''}${args.change} units.` }
      }

      // ── WISHLISTS ─────────────────────────────────────────────────────────

      case 'get_wishlists': {
        const res = await api.get('/wishlists', { params: { groupId: g } })
        return (res.data || []).map((w) => ({
          id:         w._id,
          name:       w.name,
          date:       w.date,
          totalPrice: w.totalPrice,
          items:      (w.items || []).map((it) => ({
            product: it.product?.name || 'Unknown',
            qty:     it.count,
            price:   it.price,
          })),
        }))
      }

      case 'create_wishlist': {
        const body = {
          name:       args.name,
          date:       args.date,
          totalPrice: args.totalPrice,
          groupId:    g,
          items:      (args.items || []).map((it) => ({
            product: it.productId,
            unit:    it.unit,
            price:   it.price,
            count:   it.count,
          })),
        }
        const res = await api.post('/wishlists', body)
        return { id: res.data._id, message: `Wishlist "${args.name}" created.` }
      }

      case 'delete_wishlist': {
        await api.delete(`/wishlists/${args.id}`)
        return { message: 'Wishlist deleted.' }
      }

      // ── RECURRING ─────────────────────────────────────────────────────────

      case 'get_recurring': {
        const res = await api.get('/recurring', { params: { groupId: g } })
        return (res.data || []).map((r) => ({
          id:          r._id,
          name:        r.name,
          direction:   r.direction,
          frequency:   r.frequency,
          nextRunDate: r.nextRunDate,
          status:      r.status,
          grandTotal:  r.grandTotal,
          autoCreate:  r.autoCreate,
        }))
      }

      case 'create_recurring': {
        const body = {
          name:        args.name,
          direction:   args.direction,
          frequency:   args.frequency,
          nextRunDate: args.nextRunDate,
          autoCreate:  args.autoCreate || false,
          grandTotal:  args.grandTotal || 0,
          group:       g,
        }
        if (args.recipientId) body.recipient = args.recipientId
        if (args.notes)       body.notes     = args.notes
        if (args.items)       body.items     = args.items.map((it) => ({
          product:     it.productId || undefined,
          description: it.description || undefined,
          qty:         it.qty,
          unit:        it.unit,
          unitPrice:   it.unitPrice,
          taxRate:     it.taxRate || 0,
          amount:      it.amount,
        }))
        const res = await api.post('/recurring', body, { params: { groupId: g } })
        return { id: res.data._id, message: `Recurring "${args.name}" created.` }
      }

      case 'update_recurring': {
        const body = {}
        if (args.name)        body.name        = args.name
        if (args.frequency)   body.frequency   = args.frequency
        if (args.nextRunDate) body.nextRunDate = args.nextRunDate
        if (args.status)      body.status      = args.status
        if (args.grandTotal)  body.grandTotal  = args.grandTotal
        if (args.notes)       body.notes       = args.notes
        await api.put(`/recurring/${args.id}`, body, { params: { groupId: g } })
        return { message: 'Recurring updated.' }
      }

      case 'delete_recurring': {
        await api.delete(`/recurring/${args.id}`, { params: { groupId: g } })
        return { message: 'Recurring deleted.' }
      }

      // ── RECIPIENTS ────────────────────────────────────────────────────────

      case 'get_recipients': {
        const res = await api.get('/recipients', { params: { groupId: g } })
        return (res.data || []).map((r) => ({
          id:    r._id,
          name:  r.name,
          email: r.email,
          phone: r.phone,
          type:  r.type,
        }))
      }

      case 'create_recipient': {
        const body = { name: args.name, group: g }
        if (args.email) body.email = args.email
        if (args.phone) body.phone = args.phone
        if (args.type)  body.type  = args.type
        if (args.notes) body.notes = args.notes
        const res = await api.post('/recipients', body, { params: { groupId: g } })
        return { id: res.data._id, message: `Recipient "${args.name}" created.` }
      }

      case 'update_recipient': {
        const body = {}
        if (args.name)  body.name  = args.name
        if (args.email) body.email = args.email
        if (args.phone) body.phone = args.phone
        if (args.type)  body.type  = args.type
        if (args.notes) body.notes = args.notes
        await api.put(`/recipients/${args.id}`, body, { params: { groupId: g } })
        return { message: 'Recipient updated.' }
      }

      case 'delete_recipient': {
        await api.delete(`/recipients/${args.id}`, { params: { groupId: g } })
        return { message: 'Recipient deleted.' }
      }

      // ── GENERAL ORDERS ────────────────────────────────────────────────────

      case 'get_general_orders': {
        const res = await api.get('/general-orders', { params: { groupId: g } })
        return (res.data || []).map((o) => ({
          id:         o._id,
          goNumber:   o.goNumber,
          recipient:  o.recipient?.name || null,
          direction:  o.direction,
          status:     o.status,
          grandTotal: o.grandTotal,
          orderDate:  o.orderDate,
        }))
      }

      case 'create_general_order': {
        const body = {
          goNumber:   args.goNumber,
          recipient:  args.recipientId,
          direction:  args.direction,
          status:     args.status || 'draft',
          grandTotal: args.grandTotal,
          subtotal:   args.subtotal || 0,
          taxAmount:  args.taxAmount || 0,
          group:      g,
          items:      mapItems(args.items),
        }
        if (args.orderDate) body.orderDate = args.orderDate
        if (args.notes)     body.notes     = args.notes
        const res = await api.post('/general-orders', body, { params: { groupId: g } })
        return { id: res.data._id, message: `General order ${args.goNumber} created.` }
      }

      case 'update_general_order': {
        const body = {}
        if (args.status)    body.status    = args.status
        if (args.notes)     body.notes     = args.notes
        if (args.orderDate) body.orderDate = args.orderDate
        await api.put(`/general-orders/${args.id}`, body, { params: { groupId: g } })
        return { message: 'General order updated.' }
      }

      case 'delete_general_order': {
        await api.delete(`/general-orders/${args.id}`, { params: { groupId: g } })
        return { message: 'General order deleted.' }
      }

      // ── GENERAL INVOICES ──────────────────────────────────────────────────

      case 'get_general_invoices': {
        const res = await api.get('/general-invoices', { params: { groupId: g } })
        return (res.data || []).map((i) => ({
          id:            i._id,
          invoiceNumber: i.invoiceNumber,
          recipient:     i.recipient?.name || null,
          direction:     i.direction,
          status:        i.status,
          grandTotal:    i.grandTotal,
          invoiceDate:   i.invoiceDate,
          dueDate:       i.dueDate,
        }))
      }

      case 'create_general_invoice': {
        const body = {
          invoiceNumber: args.invoiceNumber,
          recipient:     args.recipientId,
          direction:     args.direction,
          status:        args.status || 'draft',
          grandTotal:    args.grandTotal,
          subtotal:      args.subtotal || 0,
          taxAmount:     args.taxAmount || 0,
          group:         g,
          items:         mapItems(args.items),
        }
        if (args.generalOrderId) body.generalOrder = args.generalOrderId
        if (args.invoiceDate)    body.invoiceDate  = args.invoiceDate
        if (args.dueDate)        body.dueDate      = args.dueDate
        if (args.notes)          body.notes        = args.notes
        const res = await api.post('/general-invoices', body, { params: { groupId: g } })
        return { id: res.data._id, message: `General invoice ${args.invoiceNumber} created.` }
      }

      case 'update_general_invoice': {
        const body = {}
        if (args.status)  body.status  = args.status
        if (args.dueDate) body.dueDate = args.dueDate
        if (args.notes)   body.notes   = args.notes
        await api.put(`/general-invoices/${args.id}`, body, { params: { groupId: g } })
        return { message: 'General invoice updated.' }
      }

      case 'delete_general_invoice': {
        await api.delete(`/general-invoices/${args.id}`, { params: { groupId: g } })
        return { message: 'General invoice deleted.' }
      }

      // ── VENDORS ───────────────────────────────────────────────────────────

      case 'get_vendors': {
        const res = await api.get('/vendors', { params: { groupId: g } })
        return (res.data || []).map((v) => ({
          id:            v._id,
          name:          v.name,
          contactPerson: v.contactPerson,
          phone:         v.phone,
          email:         v.email,
          gstin:         v.gstin,
        }))
      }

      case 'create_vendor': {
        const body = { name: args.name, group: g }
        ;['contactPerson','phone','email','address','gstin','currency','notes']
          .forEach((k) => { if (args[k]) body[k] = args[k] })
        const res = await api.post('/vendors', body, { params: { groupId: g } })
        return { id: res.data._id, message: `Vendor "${args.name}" created.` }
      }

      case 'update_vendor': {
        const body = {}
        ;['name','contactPerson','phone','email','address','gstin','notes']
          .forEach((k) => { if (args[k]) body[k] = args[k] })
        await api.put(`/vendors/${args.id}`, body, { params: { groupId: g } })
        return { message: 'Vendor updated.' }
      }

      case 'delete_vendor': {
        await api.delete(`/vendors/${args.id}`, { params: { groupId: g } })
        return { message: 'Vendor deleted.' }
      }

      // ── CUSTOMERS ─────────────────────────────────────────────────────────

      case 'get_customers': {
        const res = await api.get('/customers', { params: { groupId: g } })
        return (res.data || []).map((c) => ({
          id:            c._id,
          name:          c.name,
          contactPerson: c.contactPerson,
          phone:         c.phone,
          email:         c.email,
          gstin:         c.gstin,
        }))
      }

      case 'create_customer': {
        const body = { name: args.name, group: g }
        ;['contactPerson','phone','email','address','gstin','currency','notes']
          .forEach((k) => { if (args[k]) body[k] = args[k] })
        const res = await api.post('/customers', body, { params: { groupId: g } })
        return { id: res.data._id, message: `Customer "${args.name}" created.` }
      }

      case 'update_customer': {
        const body = {}
        ;['name','contactPerson','phone','email','address','gstin','notes']
          .forEach((k) => { if (args[k]) body[k] = args[k] })
        await api.put(`/customers/${args.id}`, body, { params: { groupId: g } })
        return { message: 'Customer updated.' }
      }

      case 'delete_customer': {
        await api.delete(`/customers/${args.id}`, { params: { groupId: g } })
        return { message: 'Customer deleted.' }
      }

      // ── PURCHASE ORDERS ───────────────────────────────────────────────────

      case 'get_purchase_orders': {
        const res = await api.get('/purchase-orders', { params: { groupId: g } })
        return (res.data || []).map((p) => ({
          id:           p._id,
          poNumber:     p.poNumber,
          vendor:       p.vendor?.name || null,
          status:       p.status,
          grandTotal:   p.grandTotal,
          expectedDate: p.expectedDate,
          itemCount:    (p.items || []).length,
        }))
      }

      case 'create_purchase_order': {
        const body = {
          poNumber:   args.poNumber,
          vendor:     args.vendorId,
          status:     args.status || 'draft',
          grandTotal: args.grandTotal,
          subtotal:   args.subtotal || 0,
          taxAmount:  args.taxAmount || 0,
          group:      g,
          items:      mapItems(args.items),
        }
        if (args.expectedDate) body.expectedDate = args.expectedDate
        if (args.notes)        body.notes        = args.notes
        const res = await api.post('/purchase-orders', body, { params: { groupId: g } })
        return { id: res.data._id, message: `Purchase order ${args.poNumber} created.` }
      }

      case 'update_purchase_order': {
        const body = {}
        if (args.status)       body.status       = args.status
        if (args.expectedDate) body.expectedDate = args.expectedDate
        if (args.notes)        body.notes        = args.notes
        await api.put(`/purchase-orders/${args.id}`, body, { params: { groupId: g } })
        return { message: 'Purchase order updated.' }
      }

      case 'delete_purchase_order': {
        await api.delete(`/purchase-orders/${args.id}`, { params: { groupId: g } })
        return { message: 'Purchase order deleted.' }
      }

      // ── SALES ORDERS ──────────────────────────────────────────────────────

      case 'get_sales_orders': {
        const res = await api.get('/sales-orders', { params: { groupId: g } })
        return (res.data || []).map((s) => ({
          id:           s._id,
          soNumber:     s.soNumber,
          customer:     s.customer?.name || null,
          status:       s.status,
          grandTotal:   s.grandTotal,
          deliveryDate: s.deliveryDate,
          itemCount:    (s.items || []).length,
        }))
      }

      case 'create_sales_order': {
        const body = {
          soNumber:   args.soNumber,
          customer:   args.customerId,
          status:     args.status || 'draft',
          grandTotal: args.grandTotal,
          subtotal:   args.subtotal || 0,
          taxAmount:  args.taxAmount || 0,
          group:      g,
          items:      mapItems(args.items),
        }
        if (args.deliveryDate) body.deliveryDate = args.deliveryDate
        if (args.notes)        body.notes        = args.notes
        const res = await api.post('/sales-orders', body, { params: { groupId: g } })
        return { id: res.data._id, message: `Sales order ${args.soNumber} created.` }
      }

      case 'update_sales_order': {
        const body = {}
        if (args.status)       body.status       = args.status
        if (args.deliveryDate) body.deliveryDate = args.deliveryDate
        if (args.notes)        body.notes        = args.notes
        await api.put(`/sales-orders/${args.id}`, body, { params: { groupId: g } })
        return { message: 'Sales order updated.' }
      }

      case 'delete_sales_order': {
        await api.delete(`/sales-orders/${args.id}`, { params: { groupId: g } })
        return { message: 'Sales order deleted.' }
      }

      // ── PURCHASE INVOICES ─────────────────────────────────────────────────

      case 'get_purchase_invoices': {
        const res = await api.get('/purchase-invoices', { params: { groupId: g } })
        return (res.data || []).map((i) => ({
          id:            i._id,
          invoiceNumber: i.invoiceNumber,
          vendor:        i.vendor?.name || null,
          status:        i.status,
          grandTotal:    i.grandTotal,
          invoiceDate:   i.invoiceDate,
          dueDate:       i.dueDate,
        }))
      }

      case 'create_purchase_invoice': {
        const body = {
          invoiceNumber: args.invoiceNumber,
          vendor:        args.vendorId,
          status:        args.status || 'draft',
          grandTotal:    args.grandTotal,
          subtotal:      args.subtotal || 0,
          taxAmount:     args.taxAmount || 0,
          group:         g,
          items:         mapItems(args.items),
        }
        if (args.purchaseOrderId) body.purchaseOrder = args.purchaseOrderId
        if (args.grnId)           body.grn           = args.grnId
        if (args.invoiceDate)     body.invoiceDate   = args.invoiceDate
        if (args.dueDate)         body.dueDate       = args.dueDate
        if (args.notes)           body.notes         = args.notes
        const res = await api.post('/purchase-invoices', body, { params: { groupId: g } })
        return { id: res.data._id, message: `Purchase invoice ${args.invoiceNumber} created.` }
      }

      case 'update_purchase_invoice': {
        const body = {}
        if (args.status)  body.status  = args.status
        if (args.dueDate) body.dueDate = args.dueDate
        if (args.notes)   body.notes   = args.notes
        await api.put(`/purchase-invoices/${args.id}`, body, { params: { groupId: g } })
        return { message: 'Purchase invoice updated.' }
      }

      case 'delete_purchase_invoice': {
        await api.delete(`/purchase-invoices/${args.id}`, { params: { groupId: g } })
        return { message: 'Purchase invoice deleted.' }
      }

      // ── SALES INVOICES ────────────────────────────────────────────────────

      case 'get_sales_invoices': {
        const res = await api.get('/sales-invoices', { params: { groupId: g } })
        return (res.data || []).map((i) => ({
          id:            i._id,
          invoiceNumber: i.invoiceNumber,
          customer:      i.customer?.name || null,
          status:        i.status,
          grandTotal:    i.grandTotal,
          invoiceDate:   i.invoiceDate,
          dueDate:       i.dueDate,
        }))
      }

      case 'create_sales_invoice': {
        const body = {
          invoiceNumber: args.invoiceNumber,
          customer:      args.customerId,
          status:        args.status || 'draft',
          grandTotal:    args.grandTotal,
          subtotal:      args.subtotal || 0,
          taxAmount:     args.taxAmount || 0,
          group:         g,
          items:         mapItems(args.items),
        }
        if (args.salesOrderId)  body.salesOrder = args.salesOrderId
        if (args.deliveryId)    body.delivery   = args.deliveryId
        if (args.invoiceDate)   body.invoiceDate = args.invoiceDate
        if (args.dueDate)       body.dueDate    = args.dueDate
        if (args.notes)         body.notes      = args.notes
        const res = await api.post('/sales-invoices', body, { params: { groupId: g } })
        return { id: res.data._id, message: `Sales invoice ${args.invoiceNumber} created.` }
      }

      case 'update_sales_invoice': {
        const body = {}
        if (args.status)  body.status  = args.status
        if (args.dueDate) body.dueDate = args.dueDate
        if (args.notes)   body.notes   = args.notes
        await api.put(`/sales-invoices/${args.id}`, body, { params: { groupId: g } })
        return { message: 'Sales invoice updated.' }
      }

      case 'delete_sales_invoice': {
        await api.delete(`/sales-invoices/${args.id}`, { params: { groupId: g } })
        return { message: 'Sales invoice deleted.' }
      }

      // ── GRNs ──────────────────────────────────────────────────────────────

      case 'get_grns': {
        const res = await api.get('/grns', { params: { groupId: g } })
        return (res.data || []).map((r) => ({
          id:              r._id,
          grnNumber:       r.grnNumber,
          purchaseOrder:   r.purchaseOrder?.poNumber || r.purchaseOrder,
          status:          r.status,
          receivedDate:    r.receivedDate,
          itemCount:       (r.items || []).length,
        }))
      }

      case 'create_grn': {
        const body = {
          grnNumber:     args.grnNumber,
          purchaseOrder: args.purchaseOrderId,
          status:        args.status || 'complete',
          group:         g,
          items:         (args.items || []).map((it) => ({
            product:     it.productId || undefined,
            description: it.description || undefined,
            qtyOrdered:  it.qtyOrdered || 0,
            qtyReceived: it.qtyReceived,
            unit:        it.unit,
            unitPrice:   it.unitPrice || 0,
          })),
        }
        if (args.receivedDate) body.receivedDate = args.receivedDate
        if (args.notes)        body.notes        = args.notes
        const res = await api.post('/grns', body, { params: { groupId: g } })
        return { id: res.data._id, message: `GRN ${args.grnNumber} created. Stock updated automatically.` }
      }

      case 'delete_grn': {
        await api.delete(`/grns/${args.id}`, { params: { groupId: g } })
        return { message: 'GRN deleted.' }
      }

      // ── DELIVERIES ────────────────────────────────────────────────────────

      case 'get_deliveries': {
        const res = await api.get('/deliveries', { params: { groupId: g } })
        return (res.data || []).map((d) => ({
          id:             d._id,
          deliveryNumber: d.deliveryNumber,
          salesOrder:     d.salesOrder?.soNumber || d.salesOrder,
          status:         d.status,
          deliveredDate:  d.deliveredDate,
          itemCount:      (d.items || []).length,
        }))
      }

      case 'create_delivery': {
        const body = {
          deliveryNumber: args.deliveryNumber,
          salesOrder:     args.salesOrderId,
          status:         args.status || 'complete',
          group:          g,
          items:          (args.items || []).map((it) => ({
            product:      it.productId || undefined,
            description:  it.description || undefined,
            qtyOrdered:   it.qtyOrdered || 0,
            qtyDelivered: it.qtyDelivered,
            unit:         it.unit,
            unitPrice:    it.unitPrice || 0,
          })),
        }
        if (args.deliveredDate) body.deliveredDate = args.deliveredDate
        if (args.notes)         body.notes         = args.notes
        const res = await api.post('/deliveries', body, { params: { groupId: g } })
        return { id: res.data._id, message: `Delivery ${args.deliveryNumber} recorded.` }
      }

      case 'delete_delivery': {
        await api.delete(`/deliveries/${args.id}`, { params: { groupId: g } })
        return { message: 'Delivery deleted.' }
      }

      default:
        return { error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Tool failed'
    return { error: msg }
  }
}
