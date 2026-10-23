import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  UtensilsCrossed,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  IndianRupee,
  Layers,
  Sparkles,
  RefreshCw,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react'


interface Item {
  id: number
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  is_available: boolean
  created_at?: string | null
  updated_at?: string | null
}

export const ManagerItems: React.FC = () => {
  const navigate = useNavigate()
  const managerUsername = localStorage.getItem('manager_user')

  // UI state
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [submittingCreate, setSubmittingCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editIsAvailable, setEditIsAvailable] = useState(true)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!managerUsername) {
      navigate('/manager/login', { replace: true })
    }
  }, [managerUsername, navigate])

  // Fetch real items from Neon DB via FastAPI backend
  const fetchItems = useCallback(async () => {
    if (!managerUsername) return
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/manager/items', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Manager-Username': managerUsername,
        },
      })

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('manager_user')
        navigate('/manager/login', { replace: true })
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to fetch items from database.')
      }

      const data: Item[] = await response.json()
      setItems(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Failed to connect to backend server at http://127.0.0.1:8000.')
      }
    } finally {
      setLoading(false)
    }
  }, [managerUsername, navigate])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Instant Availability Status Toggle
  const handleToggleStatus = async (item: Item) => {
    if (togglingId !== null) return
    const newStatus = !item.is_available
    setTogglingId(item.id)

    try {
      const response = await fetch(`http://127.0.0.1:8000/manager/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Manager-Username': managerUsername || '',
        },
        body: JSON.stringify({
          is_available: newStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update item status.')
      }

      const updated: Item = await response.json()

      // Update state locally
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: updated.is_available } : i))
      )

      setSuccessMessage(
        `"${item.name}" status changed to ${newStatus ? 'Available' : 'Unavailable'}.`
      )
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Failed to update item availability in database.')
      }
    } finally {
      setTogglingId(null)
    }
  }

  // Handle Create Item Form Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setSuccessMessage(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setCreateError('Item Name is required.')
      return
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setCreateError('Price (₹) must be a valid number greater than or equal to 0.')
      return
    }

    setSubmittingCreate(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/manager/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Manager-Username': managerUsername || '',
        },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || null,
          price: parsedPrice,
          image_url: imageUrl.trim() || null,
          is_available: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to save item to database.')
      }

      setSuccessMessage(`Item "${data.name}" (₹${parseFloat(data.price).toFixed(2)}) successfully saved!`)
      setShowCreateForm(false)
      setName('')
      setDescription('')
      setPrice('')
      setImageUrl('')

      await fetchItems()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateError(err.message)
      } else {
        setCreateError('Failed to communicate with database server.')
      }
    } finally {
      setSubmittingCreate(false)
    }
  }

  // Open Edit Modal with current item data
  const handleOpenEdit = (item: Item) => {
    setEditingItem(item)
    setEditName(item.name)
    setEditDescription(item.description || '')
    setEditPrice(String(item.price))
    setEditImageUrl(item.image_url || '')
    setEditIsAvailable(item.is_available)
    setEditError(null)
  }

  // Handle Edit Item Form Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setEditError(null)

    const trimmedName = editName.trim()
    if (!trimmedName) {
      setEditError('Item Name is required.')
      return
    }

    const parsedPrice = parseFloat(editPrice)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setEditError('Price (₹) must be a valid number greater than or equal to 0.')
      return
    }

    setSubmittingEdit(true)

    try {
      const response = await fetch(`http://127.0.0.1:8000/manager/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Manager-Username': managerUsername || '',
        },
        body: JSON.stringify({
          name: trimmedName,
          description: editDescription.trim() || null,
          price: parsedPrice,
          image_url: editImageUrl.trim() || null,
          is_available: editIsAvailable,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update item in database.')
      }

      setSuccessMessage(`Item "${data.name}" updated successfully!`)
      setEditingItem(null)
      await fetchItems()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message)
      } else {
        setEditError('Failed to update item.')
      }
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Handle Delete Item Confirmation
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    setSubmittingDelete(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`http://127.0.0.1:8000/manager/items/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Manager-Username': managerUsername || '',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete item from database.')
      }

      setSuccessMessage(`Item "${itemToDelete.name}" was permanently deleted.`)
      setItemToDelete(null)
      await fetchItems()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Failed to delete item.')
      }
    } finally {
      setSubmittingDelete(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('manager_user')
    navigate('/manager/login')
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-3.5 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight block">Manager Portal</span>
              
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs text-slate-400 hidden md:inline">
              Signed in as <strong className="text-slate-200">{managerUsername}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-8">
        {/* Page Header: Title "Items" + "Create Item" button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Items</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time food item catalog, availability status, and pricing
            </p>
          </div>


          <div className="flex items-center gap-3">
            <button
              onClick={fetchItems}
              disabled={loading}
              title="Refresh from database"
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-amber-400 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {!showCreateForm && (
              <button
                id="create-item-btn"
                onClick={() => {
                  setShowCreateForm(true)
                  setCreateError(null)
                  setSuccessMessage(null)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Item</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/70 text-emerald-200 text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/60 border border-red-800/70 text-red-200 text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Create Item Modal / Card */}
        {showCreateForm && (
          <div className="mt-4 sm:mt-6 p-4 sm:p-8 bg-slate-900/90 border border-amber-500/30 rounded-xl sm:rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Create New Food Item</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/70 text-red-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span className="font-medium">{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="create-item-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Item Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="create-item-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter item name (e.g. Biryani)"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="create-item-price" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Price (₹) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <input
                      id="create-item-price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="create-item-image" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Image URL <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                  </label>
                  <input
                    id="create-item-image"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/item.jpg"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="create-item-description" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Description <span className="text-slate-500 text-xs font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="create-item-description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of dish or ingredients..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={submittingCreate}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submittingCreate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>Save Item</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Fetching items from database...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="mt-12 py-16 px-6 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-900/30">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4">
              <Layers className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300">No items in database</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
              There are currently no items recorded in your database. Click the button below to add your first menu item.
            </p>
            {!showCreateForm && (
              <button
                onClick={() => {
                  setShowCreateForm(true)
                  setCreateError(null)
                  setSuccessMessage(null)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Item</span>
              </button>
            )}
          </div>
        )}

        {/* Real Items Grid */}
        {!loading && items.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Menu Items ({items.length})
              </span>
              <span className="text-xs text-slate-500">
                Toggle switch to change item availability instantly
              </span>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-slate-900/70 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:shadow-black/50 relative ${
                    item.is_available ? 'border-slate-800 hover:border-slate-700/80' : 'border-slate-800/60 opacity-85'
                  }`}
                >
                  <div>
                    {item.image_url && (
                      <div className="w-full h-40 mb-4 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-white tracking-tight">{item.name}</h3>
                      
                      {/* Interactive Status Toggle Box */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.is_available}
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingId === item.id}
                          title={`Status: ${item.is_available ? 'Available (click to toggle off)' : 'Unavailable (click to toggle on)'}`}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 ${
                            item.is_available ? 'bg-emerald-600' : 'bg-slate-700'
                          }`}
                        >
                          <span className="sr-only">Toggle availability status</span>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              item.is_available ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          >
                            {togglingId === item.id && (
                              <Loader2 className="w-3 h-3 animate-spin text-slate-800" />
                            )}
                          </span>
                        </button>
                        <span className={`text-xs font-semibold select-none ${item.is_available ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>


                    {item.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Price
                      </span>
                      <span className="text-lg font-extrabold text-amber-400 flex items-center">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Item"
                        className="p-2 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700/60 hover:border-amber-500/40 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        title="Delete Item"
                        className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-8 shadow-2xl shadow-black relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Edit Food Item #{editingItem.id}</h2>
              </div>

              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/70 text-red-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span className="font-medium">{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label htmlFor="edit-item-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Item Name <span className="text-amber-400">*</span>
                </label>
                <input
                  id="edit-item-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-item-price" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Price (₹) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <input
                      id="edit-item-price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-item-image" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Image URL
                  </label>
                  <input
                    id="edit-item-image"
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-item-description" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-item-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition-all resize-none"
                />
              </div>

              {/* Status Toggle Box Inside Modal */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-sm font-semibold text-slate-200 block">Available on Menu</span>
                  <span className="text-xs text-slate-500">Toggle whether customers can view and order this dish</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editIsAvailable}
                  onClick={() => setEditIsAvailable(!editIsAvailable)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    editIsAvailable ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span className="sr-only">Toggle availability</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      editIsAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>


              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={submittingEdit}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-5 sm:p-8 shadow-2xl shadow-black relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 text-rose-400">

              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800/60 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Delete Food Item?</h2>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-100 font-semibold">"{itemToDelete.name}"</strong> (₹
              {Number(itemToDelete.price).toFixed(2)}) from the database? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={submittingDelete}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submittingDelete}
                className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
              >
                {submittingDelete ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
