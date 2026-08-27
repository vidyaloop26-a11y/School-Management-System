import React, { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Bus, AlertTriangle, MapPin, Clock } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

const VEHICLE_TYPE_STYLES = {
  Bus: "bg-blue-50 text-blue-700 border-blue-200",
  Van: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Auto: "bg-amber-50 text-amber-700 border-amber-200",
};

function getExpiryStatus(dateStr) {
  if (!dateStr) return { label: "No Date", color: "bg-slate-100 text-slate-600 border-slate-200" };
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", color: "bg-red-50 text-red-700 border-red-200" };
  if (diffDays <= 30) return { label: `Expiring in ${diffDays}d`, color: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Valid", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export default function Transport() {
  const [activeTab, setActiveTab] = useState("routes");
  const [loading, setLoading] = useState(true);

  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [routeForm, setRouteForm] = useState({ name: "", stops: [{ name: "", time: "" }] });
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: "",
    type: "Bus",
    capacity: "",
    driverName: "",
    driverPhone: "",
    permitExpiry: "",
    insuranceExpiry: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [routesRes, vehiclesRes] = await Promise.all([
        api.getTransportRoutes().catch(() => ({ routes: [] })),
        api.getVehicles().catch(() => ({ vehicles: [] })),
      ]);
      setRoutes(routesRes?.routes || []);
      setVehicles(vehiclesRes?.vehicles || []);
    } catch (err) {
      toast.error("Failed to load transport data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!routeForm.name.trim()) {
      toast.error("Route name is required");
      return;
    }
    const validStops = routeForm.stops.filter((s) => s.name.trim());
    if (validStops.length === 0) {
      toast.error("Add at least one stop");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createTransportRoute({ name: routeForm.name, stops: validStops });
      setRoutes((prev) => [...prev, res?.route || { id: Date.now(), name: routeForm.name, stops: validStops, assignedStudents: 0, vehicle: "" }]);
      toast.success("Route created successfully");
      setRouteForm({ name: "", stops: [{ name: "", time: "" }] });
      setRouteDialogOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create route");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoute = async (id) => {
    try {
      await api.deleteTransportRoute(id);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
      toast.success("Route deleted");
    } catch (err) {
      toast.error("Failed to delete route");
    }
    setDeleteConfirm(null);
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.plateNumber.trim()) {
      toast.error("Plate number is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createVehicle(vehicleForm);
      setVehicles((prev) => [...prev, res?.vehicle || { id: Date.now(), ...vehicleForm }]);
      toast.success("Vehicle added successfully");
      setVehicleForm({ plateNumber: "", type: "Bus", capacity: "", driverName: "", driverPhone: "", permitExpiry: "", insuranceExpiry: "" });
      setVehicleDialogOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await api.deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success("Vehicle removed");
    } catch (err) {
      toast.error("Failed to delete vehicle");
    }
    setDeleteConfirm(null);
  };

  const addStop = () => {
    setRouteForm((prev) => ({ ...prev, stops: [...prev.stops, { name: "", time: "" }] }));
  };

  const removeStop = (index) => {
    setRouteForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  };

  const updateStop = (index, field, value) => {
    setRouteForm((prev) => ({
      ...prev,
      stops: prev.stops.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const alertCount = vehicles.filter((v) => {
    const permit = getExpiryStatus(v.permitExpiry);
    const insurance = getExpiryStatus(v.insuranceExpiry);
    return permit.label !== "Valid" || insurance.label !== "Valid";
  }).length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Transport"
        title="Transport Management"
        subtitle="Manage bus routes, vehicles, and document compliance for school transport."
        right={
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[12.5px] font-semibold">
                <AlertTriangle className="h-4 w-4" />
                {alertCount} Alert{alertCount > 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={() => (activeTab === "routes" ? setRouteDialogOpen(true) : setVehicleDialogOpen(true))}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {activeTab === "routes" ? "Add Route" : "Add Vehicle"}
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Routes</span>
            <MapPin className="h-5 w-5 text-[#29ABE2]" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">{routes.length}</div>
          <div className="text-[12px] text-slate-500 mt-1">Active school routes</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Vehicles</span>
            <Bus className="h-5 w-5 text-[#29ABE2]" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">{vehicles.length}</div>
          <div className="text-[12px] text-slate-500 mt-1">Registered fleet</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expiry Alerts</span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">{alertCount}</div>
          <div className="text-[12px] text-slate-500 mt-1">Vehicles need attention</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100/80 p-1 rounded-xl">
            <TabsTrigger value="routes" className="rounded-lg text-[12.5px] gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Routes
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="rounded-lg text-[12.5px] gap-1.5">
              <Bus className="h-3.5 w-3.5" /> Vehicles
            </TabsTrigger>
          </TabsList>

          {/* Routes Tab */}
          <TabsContent value="routes">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
              </div>
            ) : routes.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No Routes Yet"
                hint="Create your first transport route to assign students and vehicles."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map((route) => (
                  <div key={route.id} className="border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition bg-white/60">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-[15px]">{route.name}</h3>
                        <div className="text-[12px] text-slate-500 mt-0.5">
                          {route.stops?.length || 0} stop{(route.stops?.length || 0) !== 1 ? "s" : ""} &middot; {route.assignedStudents || 0} students
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirm({ type: "route", id: route.id, name: route.name })}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition"
                        title="Delete route"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {route.vehicle && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-[11.5px] font-medium text-slate-700 mb-3">
                        <Bus className="h-3 w-3" /> {route.vehicle}
                      </div>
                    )}

                    {route.stops && route.stops.length > 0 && (
                      <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-3">
                        {route.stops.map((stop, i) => (
                          <div key={i} className="flex items-center gap-2 text-[12px]">
                            <span className="h-5 w-5 rounded-full bg-[#29ABE2]/10 text-[#29ABE2] text-[10px] font-bold grid place-items-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-slate-700 font-medium">{stop.name}</span>
                            {stop.time && (
                              <span className="text-slate-400 flex items-center gap-0.5 ml-auto">
                                <Clock className="h-3 w-3" /> {stop.time}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
              </div>
            ) : vehicles.length === 0 ? (
              <EmptyState
                icon={Bus}
                title="No Vehicles Registered"
                hint="Add vehicles to manage your school transport fleet and track document compliance."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      <th className="pb-3 px-3">Vehicle</th>
                      <th className="pb-3 px-3">Type</th>
                      <th className="pb-3 px-3">Driver</th>
                      <th className="pb-3 px-3">Capacity</th>
                      <th className="pb-3 px-3">Permit</th>
                      <th className="pb-3 px-3">Insurance</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicles.map((v) => {
                      const permitStatus = getExpiryStatus(v.permitExpiry);
                      const insuranceStatus = getExpiryStatus(v.insuranceExpiry);
                      return (
                        <tr key={v.id} className="hover:bg-white/60 transition">
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-800 font-mono">{v.plateNumber}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${VEHICLE_TYPE_STYLES[v.type] || VEHICLE_TYPE_STYLES.Bus}`}>
                              {v.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="text-slate-700 font-medium">{v.driverName || "-"}</div>
                            {v.driverPhone && <div className="text-[11px] text-slate-500">{v.driverPhone}</div>}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium">{v.capacity || "-"}</td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${permitStatus.color}`}>
                              {(permitStatus.label === "Expired" || permitStatus.label?.startsWith("Expiring")) && <AlertTriangle className="h-3 w-3" />}
                              {permitStatus.label}
                            </span>
                            {v.permitExpiry && <div className="text-[10.5px] text-slate-400 mt-0.5">{fmtDate(v.permitExpiry)}</div>}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${insuranceStatus.color}`}>
                              {(insuranceStatus.label === "Expired" || insuranceStatus.label?.startsWith("Expiring")) && <AlertTriangle className="h-3 w-3" />}
                              {insuranceStatus.label}
                            </span>
                            {v.insuranceExpiry && <div className="text-[10.5px] text-slate-400 mt-0.5">{fmtDate(v.insuranceExpiry)}</div>}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => setDeleteConfirm({ type: "vehicle", id: v.id, name: v.plateNumber })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-[12px] font-medium transition shadow-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Route Dialog */}
      <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
        <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Create New Route</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRoute} className="space-y-4 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Route Name</label>
              <input
                type="text"
                placeholder="e.g. North Colony Loop"
                value={routeForm.name}
                onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-slate-700">Stops</label>
                <button
                  type="button"
                  onClick={addStop}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#29ABE2]/10 text-[#29ABE2] text-[12px] font-semibold hover:bg-[#29ABE2]/20 transition"
                >
                  <Plus className="h-3 w-3" /> Add Stop
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {routeForm.stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold grid place-items-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Stop name"
                      value={stop.name}
                      onChange={(e) => updateStop(i, "name", e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                    />
                    <input
                      type="text"
                      placeholder="Time (e.g. 7:30 AM)"
                      value={stop.time}
                      onChange={(e) => updateStop(i, "time", e.target.value)}
                      className="w-32 px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                    />
                    {routeForm.stops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStop(i)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setRouteDialogOpen(false)} className="px-4 py-2 text-slate-600 font-medium">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Route
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Vehicle Dialog */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add New Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateVehicle} className="space-y-4 py-2 text-[13px]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH-12-AB-1234"
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={vehicleForm.type}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                >
                  <option value="Bus">Bus</option>
                  <option value="Van">Van</option>
                  <option value="Auto">Auto</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Capacity (Seats)</label>
                <input
                  type="number"
                  placeholder="e.g. 40"
                  value={vehicleForm.capacity}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  placeholder="Driver full name"
                  value={vehicleForm.driverName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Driver Phone</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={vehicleForm.driverPhone}
                onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Permit Expiry Date</label>
                <input
                  type="date"
                  value={vehicleForm.permitExpiry}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, permitExpiry: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Insurance Expiry Date</label>
                <input
                  type="date"
                  value={vehicleForm.insuranceExpiry}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/30"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setVehicleDialogOpen(false)} className="px-4 py-2 text-slate-600 font-medium">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Vehicle
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-[13px] text-slate-600">
            Are you sure you want to delete{" "}
            <strong className="text-slate-800">{deleteConfirm?.name}</strong>
            {deleteConfirm?.type === "vehicle" ? " from your fleet" : " route"}? This action cannot be undone.
          </div>
          <DialogFooter>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-slate-600 font-medium">
              Cancel
            </button>
            <button
              onClick={() =>
                deleteConfirm?.type === "route"
                  ? handleDeleteRoute(deleteConfirm.id)
                  : handleDeleteVehicle(deleteConfirm.id)
              }
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
