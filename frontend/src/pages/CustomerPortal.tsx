import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  UtensilsCrossed,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'
import { BACKEND_URL } from '../config/api'

interface Item {
  id: number
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  is_available: boolean
}

interface CartItem {
  item: Item
  quantity: number
}

interface OrderItemSnapshot {
  id: number
  item_id?: number | null
  item_name: string
  unit_price: number
  quantity: number
  subtotal: number
}

interface OrderConfirmation {
  id: number
  order_status: string
  total_amount: number
  created_at?: string | null
  items: OrderItemSnapshot[]
}

export const CustomerPortal: React.FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Order Placement & Confirmation State
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null)

  // Fetch real available items from backend API
  const fetchAvailableItems = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`${BACKEND_URL}/items`)
      if (!response.ok) {
        throw new Error('Failed to load menu items from restaurant database.')
      }

      const data: Item[] = await response.json()
      setItems(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage(`Failed to connect to restaurant server at ${BACKEND_URL}.`)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvailableItems()
  }, [fetchAvailableItems])

  // Cart Operations
  const handleAddToCart = (item: Item) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id)
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  const handleUpdateQuantity = (itemId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.item.id === itemId) {
            const newQty = ci.quantity + delta
            return newQty > 0 ? { ...ci, quantity: newQty } : null
          }
          return ci
        })
        .filter((ci): ci is CartItem => ci !== null)
    })
  }

  const handleRemoveFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId))
  }

  // Calculated totals
  const totalCartItems = cart.reduce((sum, ci) => sum + ci.quantity, 0)
  const totalCartAmount = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0)

  // Place Order Handler (Calls real backend API)
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isSubmittingOrder) return
    setIsSubmittingOrder(true)
    setOrderError(null)

    try {
      const payload = {
        items: cart.map((ci) => ({
          item_id: ci.item.id,
          quantity: ci.quantity,
        })),
      }

      const response = await fetch(`${BACKEND_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to place order. Please review your cart.')
      }

      // Backend confirmed order created in database
      setConfirmedOrder(data)
      setCart([]) // Clear cart only after backend confirms
      setIsConfirmingOrder(false)
      setIsCartOpen(false)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setOrderError(err.message)
      } else {
        setOrderError('Failed to communicate with database server.')
      }
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 px-3.5 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Restaurant Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight">
                Gourmet Dining
              </h1>
              <p className="text-[10px] sm:text-[11px] text-amber-400/90 font-medium">
                Customer Ordering Portal
              </p>
            </div>
          </div>

          {/* Right Header Navigation: Manager Portal Link & Cart */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/manager/login"
              className="text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-slate-800/80 border border-transparent hover:border-slate-700 cursor-pointer shrink-0"
            >
              Manager Login
            </Link>

            {/* Shopping Cart Button */}
            <button
              id="view-cart-button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs sm:text-sm border border-slate-700/80 hover:border-amber-500/40 transition-all cursor-pointer shadow-lg shadow-black/40 shrink-0 min-h-[38px]"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden xs:inline">Cart</span>
              {totalCartItems > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-4.5 sm:min-w-[20px] sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs font-bold rounded-full bg-amber-500 text-slate-950 shadow-sm animate-in zoom-in">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900/60 to-slate-950 border-b border-slate-800/60 px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div>
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5 mb-2.5">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Live Database Menu
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Freshly Prepared Dishes
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 sm:mt-2 max-w-xl">
              Select dishes created and priced by restaurant management. Add items to your cart and confirm your order in real-time.
            </p>
          </div>


          <button
            onClick={fetchAvailableItems}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Menu</span>
          </button>
        </div>
      </section>

      {/* Main Content: Food Menu Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-10">
        {/* Loading State */}
        {loading && (
          <div className="py-20 sm:py-28 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs sm:text-sm font-medium">Fetching real-time menu from database...</p>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !loading && (
          <div className="p-4 sm:p-6 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs sm:text-sm flex items-start gap-3 max-w-2xl mx-auto my-6">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-100">Unable to load menu</h3>
              <p className="mt-1">{errorMessage}</p>
              <button
                onClick={fetchAvailableItems}
                className="mt-3 px-4 py-1.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !errorMessage && items.length === 0 && (
          <div className="py-16 sm:py-24 px-4 sm:px-6 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center bg-slate-900/20 max-w-xl mx-auto my-4 sm:my-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3.5 sm:mb-4">
              <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-200">No items currently available</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1.5 sm:mt-2 mb-5 sm:mb-6 leading-relaxed">
              Our kitchen has not listed any dishes for ordering right now. Please check back shortly or check the manager portal if you manage items.
            </p>
            <button
              onClick={fetchAvailableItems}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Again</span>
            </button>
          </div>
        )}

        {/* Available Food Items Grid */}
        {!loading && items.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-400">
                Available Dishes ({items.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {items.map((item) => {
                const inCart = cart.find((ci) => ci.item.id === item.id)

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-black/60 group"
                  >

                    <div>
                      {item.image_url ? (
                        <div className="w-full h-44 mb-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 relative">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-24 mb-4 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-center text-slate-600">
                          <UtensilsCrossed className="w-7 h-7 text-slate-700" />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                          {item.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shrink-0">
                          Available
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                          Price
                        </span>
                        <span className="text-xl font-extrabold text-amber-400 flex items-center">
                          ₹{Number(item.price).toFixed(2)}
                        </span>
                      </div>

                      {/* Add to Cart or Quantity Controls */}
                      {inCart ? (
                        <div className="flex items-center gap-2 bg-slate-950 px-2 py-1.5 rounded-xl border border-amber-500/40">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-amber-400 px-1 min-w-[18px] text-center">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Add to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Slide-over Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Cart Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Your Cart</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
                  <ShoppingCart className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-base font-semibold text-slate-400">Your cart is empty</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Browse the menu and add dishes to get started with your order.
                  </p>
                </div>
              ) : (
                cart.map((ci) => {
                  const subtotal = ci.item.price * ci.quantity

                  return (
                    <div
                      key={ci.item.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{ci.item.name}</h4>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          ₹{Number(ci.item.price).toFixed(2)} × {ci.quantity}
                        </span>
                        <span className="text-xs font-semibold text-amber-400 block mt-1">
                          Subtotal: ₹{subtotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Quantity & Delete Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-800">
                          <button
                            onClick={() => handleUpdateQuantity(ci.item.id, -1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1 min-w-[16px] text-center">
                            {ci.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(ci.item.id, 1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveFromCart(ci.item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Cart Footer / Checkout Summary */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Items Total ({totalCartItems})</span>
                    <span>₹{totalCartAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800/80">
                    <span>Order Total</span>
                    <span className="text-amber-400 text-xl">₹{totalCartAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  id="confirm-order-button"
                  onClick={() => setIsConfirmingOrder(true)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Confirm Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Summary & Confirmation Modal */}
      {isConfirmingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-8 shadow-2xl shadow-black relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg sm:text-xl font-bold text-white">Review & Confirm Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmingOrder(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderError && (
              <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-xl bg-red-950/60 border border-red-800/70 text-red-200 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span className="font-medium">{orderError}</span>
              </div>
            )}

            {/* Items Breakdown Table */}
            <div className="max-h-52 sm:max-h-60 overflow-y-auto mb-4 sm:mb-5 space-y-2 pr-1">
              {cart.map((ci) => (
                <div
                  key={ci.item.id}
                  className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-950/80 border border-slate-800/80"
                >
                  <div className="pr-2">
                    <span className="font-bold text-slate-100 block">{ci.item.name}</span>
                    <span className="text-slate-500">
                      ₹{Number(ci.item.price).toFixed(2)} × {ci.quantity}
                    </span>
                  </div>
                  <span className="font-bold text-amber-400 shrink-0">
                    ₹{(ci.item.price * ci.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-amber-500/20 mb-5 sm:mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-xs uppercase font-semibold text-slate-400 block">
                  Total Amount (calculated on server)
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-white flex items-center">
                  ₹{totalCartAmount.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-amber-400 font-semibold px-2 sm:px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                Payment on Service
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmingOrder(false)}
                disabled={isSubmittingOrder}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Back to Cart
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmittingOrder}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-5 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <span>Place Order</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Order Confirmed Screen Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 sm:p-8 shadow-2xl shadow-black relative text-center max-h-[92vh] overflow-y-auto">

            <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-extrabold text-white">Order Confirmed!</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Your order has been recorded in the restaurant database.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-5 text-left space-y-2">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Order ID:</span>
                <strong className="text-white font-mono text-sm">#{confirmedOrder.id}</strong>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {confirmedOrder.order_status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Total Confirmed:</span>
                <span className="text-base font-extrabold text-amber-400">
                  ₹{Number(confirmedOrder.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Items Purchased Snapshot */}
            <div className="mb-6 text-left max-h-40 overflow-y-auto space-y-1 pr-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                Ordered Items Snapshot:
              </span>
              {confirmedOrder.items.map((oi) => (
                <div key={oi.id} className="text-xs text-slate-300 flex justify-between py-1">
                  <span>
                    {oi.item_name} × {oi.quantity}
                  </span>
                  <span className="text-slate-400">₹{Number(oi.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setConfirmedOrder(null)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Continue Ordering
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
