import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, AlertTriangle, Package, ArrowDown, ArrowUp } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

const CATEGORIES = [
  "Stationery",
  "Furniture",
  "Electronics",
  "Lab Equipment",
  "Sports",
  "Cleaning",
  "Books",
  "IT Supplies",
  "Miscellaneous",
];

const UNITS = ["pcs", "box", "kg", "ltr", "ream", "pack", "pair", "set", "roll", "bundle"];

const INITIAL_ITEM_FORM = {
  name: "",
  category: "Stationery",
  currentStock: 0,
  reorderLevel: 10,
  unitPrice: 0,
  unit: "pcs",
  location: "",
};

const INITIAL_PURCHASE_FORM = {
  itemId: "",
  quantity: 1,
  vendor: "",
  invoiceNo: "",
  totalCost: 0,
};

const INITIAL_ISSUE_FORM = {
  itemId: "",
  quantity: 1,
  department: "",
  issuedTo: "",
};

const DEPARTMENTS = [
  "Administration",
  "Science Lab",
  "Computer Lab",
  "Library",
  "Sports Dept",
  "Art Room",
  "Front Office",
  "Principal Office",
  "Staff Room",
  "Other",
];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [itemForm, setItemForm] = useState(INITIAL_ITEM_FORM);
  const [purchaseForm, setPurchaseForm] = useState(INITIAL_PURCHASE_FORM);
  const [issueForm, setIssueForm] = useState(INITIAL_ISSUE_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getInventoryItems({
        category: category === "all" ? undefined : category,
        search,
      });
      setItems(res?.items || []);
    } catch {
      toast.error("Failed to load inventory items");
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  const fetchLowStock = useCallback(async () => {
    try {
      const res = await api.getLowStockItems();
      setLowStockItems(res?.items || []);
    } catch {
      // low stock may not be supported yet
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchLowStock();
  }, [fetchItems, fetchLowStock]);

  const totalItems = items.length;
  const lowStockCount = lowStockItems.length || items.filter((i) => i.currentStock <= i.reorderLevel).length;
  const totalValue = items.reduce((sum, i) => sum + (i.currentStock || 0) * (i.unitPrice || 0), 0);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name) {
      toast.error("Item name is required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createInventoryItem(itemForm);
      toast.success(`Item "${itemForm.name}" added to inventory`);
      setShowCreateItem(false);
      setItemForm(INITIAL_ITEM_FORM);
      fetchItems();
      fetchLowStock();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to create item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.itemId || !purchaseForm.quantity) {
      toast.error("Please select an item and enter quantity");
      return;
    }
    setSubmitting(true);
    try {
      await api.recordPurchase(purchaseForm);
      toast.success("Purchase recorded successfully");
      setShowPurchase(false);
      setPurchaseForm(INITIAL_PURCHASE_FORM);
      fetchItems();
      fetchLowStock();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to record purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordIssue = async (e) => {
    e.preventDefault();
    if (!issueForm.itemId || !issueForm.quantity) {
      toast.error("Please select an item and enter quantity");
      return;
    }
    const item = items.find((i) => i.id === issueForm.itemId);
    if (item && issueForm.quantity > item.currentStock) {
      toast.error(`Only ${item.currentStock} units available in stock`);
      return;
    }
    setSubmitting(true);
    try {
      await api.recordIssue(issueForm);
      toast.success("Issue recorded successfully");
      setShowIssue(false);
      setIssueForm(INITIAL_ISSUE_FORM);
      fetchItems();
      fetchLowStock();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to record issue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await api.deleteInventoryItem(id);
      toast.success("Item removed from inventory");
      fetchItems();
      fetchLowStock();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to delete item");
    }
  };

  const filteredItems = items.filter((i) => {
    const matchesCategory = category === "all" || i.category === category;
    const matchesSearch =
      !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.location?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <div data-testid="inventory-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ADMIN · INVENTORY"
        title="Inventory Management"
        subtitle="Track stock levels, record purchases and issues, manage reorder alerts."
        right={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowIssue(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700 px-4 py-2.5 text-xs font-semibold shadow-xs"
            >
              <ArrowUp className="h-3.5 w-3.5 text-rose-500" /> Record Issue
            </button>
            <button
              onClick={() => setShowPurchase(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700 px-4 py-2.5 text-xs font-semibold shadow-xs"
            >
              <ArrowDown className="h-3.5 w-3.5 text-emerald-500" /> Record Purchase
            </button>
            <button
              onClick={() => setShowCreateItem(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div data-testid="inv-stat-total" className="glass rounded-2xl p-5 reveal">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <Package className="h-3.5 w-3.5 text-[#29ABE2]" /> Total Items
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{totalItems}</div>
          <div className="text-[12px] text-slate-500 mt-1">Across all categories</div>
        </div>
        <div data-testid="inv-stat-lowstock" className="glass rounded-2xl p-5 reveal d1">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Low Stock Alerts
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{lowStockCount}</div>
          <div className="text-[12px] text-slate-500 mt-1">Items below reorder level</div>
        </div>
        <div data-testid="inv-stat-value" className="glass rounded-2xl p-5 reveal d2">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600" /> Total Value
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{formatCurrency(totalValue)}</div>
          <div className="text-[12px] text-slate-500 mt-1">Current stock valuation</div>
        </div>
      </div>

      {/* Low stock alerts banner */}
      {lowStockItems.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6 border border-rose-200/60 bg-rose-50/40 reveal d2">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-rose-600 uppercase mb-3">
            <AlertTriangle className="h-3.5 w-3.5" /> Low Stock Alerts
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200"
              >
                {item.name}
                <span className="font-mono text-[11px] opacity-80">
                  ({item.currentStock}/{item.reorderLevel})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="glass rounded-2xl p-3 sm:p-5 reveal d3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2.5 shadow-xs flex-1 min-w-[200px]">
            <svg className="h-4 w-4 text-slate-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or location..."
              className="w-full bg-transparent outline-none text-xs sm:text-sm placeholder:text-slate-400"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px] rounded-full bg-white/80 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No inventory items"
            hint="Add your first item to start tracking stock levels."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
              <table className="min-w-full text-[13px]">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold text-center">Current Stock</th>
                    <th className="px-5 py-3 font-semibold text-center">Reorder Level</th>
                    <th className="px-5 py-3 font-semibold text-right">Unit Price</th>
                    <th className="px-5 py-3 font-semibold">Location</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isLow = item.currentStock <= item.reorderLevel;
                    return (
                      <tr
                        key={item.id}
                        className={`border-t border-slate-100 transition ${
                          isLow ? "bg-rose-50/60 hover:bg-rose-100/60" : "hover:bg-[#f3faff]"
                        }`}
                      >
                        <td className="px-5 py-3.5 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            {isLow && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                            {item.name}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0c6a99] border border-blue-100">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isLow
                                ? "bg-rose-100 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {item.currentStock} {item.unit || "pcs"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono font-semibold text-slate-700">
                          {item.reorderLevel}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-700">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{item.location || "—"}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setPurchaseForm({ ...INITIAL_PURCHASE_FORM, itemId: item.id });
                                setShowPurchase(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition px-3 py-1.5 text-[11px] font-semibold"
                            >
                              <ArrowDown className="h-3 w-3" /> Purchase
                            </button>
                            <button
                              onClick={() => {
                                setIssueForm({ ...INITIAL_ISSUE_FORM, itemId: item.id });
                                setShowIssue(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition px-3 py-1.5 text-[11px] font-semibold"
                            >
                              <ArrowUp className="h-3 w-3" /> Issue
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 transition px-3 py-1.5 text-[11px] font-semibold"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2.5">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.reorderLevel;
                return (
                  <div
                    key={item.id}
                    className={`glass-soft rounded-xl p-4 ${
                      isLow ? "border border-rose-200/60 bg-rose-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 text-[14.5px] truncate flex items-center gap-2">
                          {isLow && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                          {item.name}
                        </div>
                        <div className="text-[12px] text-slate-500 mt-0.5">
                          {item.category} {item.location ? `· ${item.location}` : ""}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isLow
                            ? "bg-rose-100 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {item.currentStock}/{item.reorderLevel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100/80">
                      <span className="text-[12px] font-mono font-semibold text-slate-600">
                        {formatCurrency(item.unitPrice)} / {item.unit || "pcs"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPurchaseForm({ ...INITIAL_PURCHASE_FORM, itemId: item.id });
                            setShowPurchase(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition px-3 py-1.5 text-[11px] font-semibold"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setIssueForm({ ...INITIAL_ISSUE_FORM, itemId: item.id });
                            setShowIssue(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition px-3 py-1.5 text-[11px] font-semibold"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 transition px-3 py-1.5 text-[11px] font-semibold"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create Item Dialog */}
      <Dialog open={showCreateItem} onOpenChange={setShowCreateItem}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Add Inventory Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateItem} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Item Name *</label>
              <input
                type="text"
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g. Whiteboard Marker"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Category</label>
                <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Unit</label>
                <Select value={itemForm.unit} onValueChange={(v) => setItemForm({ ...itemForm, unit: v })}>
                  <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Current Stock</label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.currentStock}
                  onChange={(e) => setItemForm({ ...itemForm, currentStock: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.reorderLevel}
                  onChange={(e) => setItemForm({ ...itemForm, reorderLevel: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={itemForm.unitPrice}
                onChange={(e) => setItemForm({ ...itemForm, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Storage Location</label>
              <input
                type="text"
                value={itemForm.location}
                onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                placeholder="e.g. Store Room A, Shelf 3"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateItem(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Purchase Dialog */}
      <Dialog open={showPurchase} onOpenChange={setShowPurchase}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Record Purchase</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPurchase} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Select Item *</label>
              <Select
                value={purchaseForm.itemId}
                onValueChange={(v) => setPurchaseForm({ ...purchaseForm, itemId: v })}
              >
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Stock: {item.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Total Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchaseForm.totalCost}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, totalCost: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Vendor</label>
              <input
                type="text"
                value={purchaseForm.vendor}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, vendor: e.target.value })}
                placeholder="e.g. Office Supplies Co."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Invoice Number</label>
              <input
                type="text"
                value={purchaseForm.invoiceNo}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNo: e.target.value })}
                placeholder="e.g. INV-2026-0847"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPurchase(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-emerald-600 hover:bg-emerald-700">
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                <ArrowDown className="h-4 w-4 mr-1" />
                Record Purchase
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Issue Dialog */}
      <Dialog open={showIssue} onOpenChange={setShowIssue}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Record Issue</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordIssue} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Select Item *</label>
              <Select
                value={issueForm.itemId}
                onValueChange={(v) => setIssueForm({ ...issueForm, itemId: v })}
              >
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Available: {item.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={issueForm.quantity}
                onChange={(e) => setIssueForm({ ...issueForm, quantity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Department *</label>
              <Select
                value={issueForm.department}
                onValueChange={(v) => setIssueForm({ ...issueForm, department: v })}
              >
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Issued To</label>
              <input
                type="text"
                value={issueForm.issuedTo}
                onChange={(e) => setIssueForm({ ...issueForm, issuedTo: e.target.value })}
                placeholder="e.g. Mr. Sharma, Lab Assistant"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowIssue(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-rose-600 hover:bg-rose-700">
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                <ArrowUp className="h-4 w-4 mr-1" />
                Record Issue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
