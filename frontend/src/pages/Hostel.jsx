import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Building2, BedDouble, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { useStudents } from "@/lib/queries";

const BUILDING_TYPES = ["Hostel", "Academic", "Admin"];
const ROOM_TYPES = ["Single", "Double", "Triple", "Dormitory"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const INITIAL_BUILDING_FORM = { name: "", type: "Hostel", floors: 1 };
const INITIAL_ROOM_FORM = { buildingId: "", floor: 1, roomNumber: "", bedCount: 1, roomType: "Double" };
const INITIAL_BED_FORM = { roomId: "", bedNumber: 1, studentId: "" };
const INITIAL_MAINTENANCE_FORM = { roomId: "", description: "", priority: "MEDIUM" };

export default function Hostel() {
  const [activeTab, setActiveTab] = useState("buildings");
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const students = Array.isArray(studentsData) ? studentsData : [];

  const [showCreateBuilding, setShowCreateBuilding] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showAssignBed, setShowAssignBed] = useState(false);
  const [showCreateMaintenance, setShowCreateMaintenance] = useState(false);

  const [buildingForm, setBuildingForm] = useState(INITIAL_BUILDING_FORM);
  const [roomForm, setRoomForm] = useState(INITIAL_ROOM_FORM);
  const [bedForm, setBedForm] = useState(INITIAL_BED_FORM);
  const [maintenanceForm, setMaintenanceForm] = useState(INITIAL_MAINTENANCE_FORM);

  const fetchBuildings = useCallback(async () => {
    try {
      const res = await api.getBuildings();
      setBuildings(res?.buildings || []);
    } catch {
      toast.error("Failed to load buildings");
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const params = filterBuilding !== "all" ? { buildingId: filterBuilding } : {};
      const res = await api.getHostelRooms(params);
      setRooms(res?.rooms || []);
    } catch {
      toast.error("Failed to load rooms");
    }
  }, [filterBuilding]);

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await api.getMaintenanceRequests();
      setMaintenanceRequests(res?.requests || []);
    } catch {
      toast.error("Failed to load maintenance requests");
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBuildings(), fetchRooms(), fetchMaintenance()]);
    setLoading(false);
  }, [fetchBuildings, fetchRooms, fetchMaintenance]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (activeTab === "rooms") fetchRooms();
  }, [filterBuilding, activeTab, fetchRooms]);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED").length;
  const totalBeds = rooms.reduce((sum, r) => sum + (r.bedCount || 0), 0);
  const occupiedBeds = rooms.reduce((sum, r) => sum + (r.occupiedBeds || 0), 0);
  const openRequests = maintenanceRequests.filter((r) => r.status !== "COMPLETED").length;

  const getBuildingName = (id) => {
    const b = buildings.find((b) => b.id === id || b._id === id);
    return b?.name || "Unknown Building";
  };

  const getStudentName = (id) => {
    const s = students.find((st) => st.id === id || st._id === id);
    return s?.name || "Unknown Student";
  };

  // --- Buildings ---
  const handleCreateBuilding = async (e) => {
    e.preventDefault();
    if (!buildingForm.name) {
      toast.error("Building name is required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createBuilding(buildingForm);
      toast.success(`Building "${buildingForm.name}" created`);
      setShowCreateBuilding(false);
      setBuildingForm(INITIAL_BUILDING_FORM);
      fetchBuildings();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to create building");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBuilding = async (id) => {
    try {
      await api.deleteBuilding(id);
      toast.success("Building deleted");
      fetchBuildings();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to delete building");
    }
  };

  // --- Rooms ---
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.buildingId || !roomForm.roomNumber) {
      toast.error("Building and room number are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createHostelRoom(roomForm);
      toast.success(`Room "${roomForm.roomNumber}" created`);
      setShowCreateRoom(false);
      setRoomForm(INITIAL_ROOM_FORM);
      fetchRooms();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to create room");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Bed Assignment ---
  const handleAssignBed = async (e) => {
    e.preventDefault();
    if (!bedForm.roomId || !bedForm.studentId) {
      toast.error("Room and student are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.assignBed(bedForm);
      toast.success("Bed assigned successfully");
      setShowAssignBed(false);
      setBedForm(INITIAL_BED_FORM);
      fetchRooms();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to assign bed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignBed = async (assignmentId) => {
    try {
      await api.unassignBed(assignmentId);
      toast.success("Bed unassigned");
      fetchRooms();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to unassign bed");
    }
  };

  // --- Maintenance ---
  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.description) {
      toast.error("Description is required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createMaintenanceRequest(maintenanceForm);
      toast.success("Maintenance request created");
      setShowCreateMaintenance(false);
      setMaintenanceForm(INITIAL_MAINTENANCE_FORM);
      fetchMaintenance();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMaintenanceStatus = async (id, status) => {
    try {
      await api.updateMaintenanceRequest(id, { status });
      toast.success("Status updated");
      fetchMaintenance();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to update status");
    }
  };

  const roomStatusStyle = (status) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "OCCUPIED": return "bg-blue-50 text-blue-700 border border-blue-200";
      case "MAINTENANCE": return "bg-amber-50 text-amber-700 border border-amber-200";
      default: return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const priorityStyle = (priority) => {
    switch (priority) {
      case "LOW": return "bg-slate-50 text-slate-700 border border-slate-200";
      case "MEDIUM": return "bg-amber-50 text-amber-700 border border-amber-200";
      case "HIGH": return "bg-red-50 text-red-700 border border-red-200";
      default: return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const maintenanceStatusStyle = (status) => {
    switch (status) {
      case "PENDING": return "bg-amber-50 text-amber-700 border border-amber-200";
      case "IN_PROGRESS": return "bg-blue-50 text-blue-700 border border-blue-200";
      case "COMPLETED": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div data-testid="hostel-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="INFRASTRUCTURE · HOSTEL"
        title="Building & Hostel"
        subtitle="Manage buildings, rooms, bed assignments, and maintenance requests."
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateBuilding(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:border-[#29ABE2] hover:text-[#29ABE2] transition px-4 py-2.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" /> Building
            </button>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:border-[#29ABE2] hover:text-[#29ABE2] transition px-4 py-2.5 text-xs font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" /> Room
            </button>
          </div>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <div data-testid="hostel-stat-buildings" className="glass rounded-2xl p-5 reveal">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <Building2 className="h-3.5 w-3.5 text-[#29ABE2]" /> Buildings
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{buildings.length}</div>
          <div className="text-[12px] text-slate-500 mt-1">Registered structures</div>
        </div>
        <div data-testid="hostel-stat-rooms" className="glass rounded-2xl p-5 reveal d1">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <BedDouble className="h-3.5 w-3.5 text-blue-600" /> Rooms
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{totalRooms}</div>
          <div className="text-[12px] text-slate-500 mt-1">{occupiedRooms} occupied</div>
        </div>
        <div data-testid="hostel-stat-beds" className="glass rounded-2xl p-5 reveal d2">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <BedDouble className="h-3.5 w-3.5 text-emerald-600" /> Beds
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{occupiedBeds}/{totalBeds}</div>
          <div className="text-[12px] text-slate-500 mt-1">Beds assigned</div>
        </div>
        <div data-testid="hostel-stat-maintenance" className="glass rounded-2xl p-5 reveal d3">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <Wrench className="h-3.5 w-3.5 text-amber-600" /> Maintenance
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{openRequests}</div>
          <div className="text-[12px] text-slate-500 mt-1">Open requests</div>
        </div>
      </div>

      {/* Main content */}
      <div className="glass rounded-2xl p-3 sm:p-5 reveal d4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="buildings">
              <Building2 className="h-3.5 w-3.5 mr-1.5" /> Buildings
            </TabsTrigger>
            <TabsTrigger value="rooms">
              <BedDouble className="h-3.5 w-3.5 mr-1.5" /> Rooms
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="h-3.5 w-3.5 mr-1.5" /> Maintenance
            </TabsTrigger>
          </TabsList>

          {/* ─── Buildings Tab ─── */}
          <TabsContent value="buildings" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
              </div>
            ) : buildings.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No buildings yet"
                hint="Add your first building to start managing hostel infrastructure."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
                  <table className="min-w-full text-[13px]">
                    <thead className="bg-slate-50/80">
                      <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                        <th className="px-5 py-3 font-semibold">Name</th>
                        <th className="px-5 py-3 font-semibold">Type</th>
                        <th className="px-5 py-3 font-semibold text-center">Floors</th>
                        <th className="px-5 py-3 font-semibold text-center">Rooms</th>
                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildings.map((b) => {
                        const roomCount = rooms.filter((r) => (r.buildingId === b.id || r.buildingId === b._id)).length;
                        return (
                          <tr key={b.id || b._id} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                            <td className="px-5 py-3.5 font-medium text-slate-800">{b.name}</td>
                            <td className="px-5 py-3.5">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0c6a99] border border-blue-100">
                                {b.type}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono font-semibold text-slate-700">{b.floors}</td>
                            <td className="px-5 py-3.5 text-center font-mono font-semibold text-slate-700">{roomCount}</td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleDeleteBuilding(b.id || b._id)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 transition px-3 py-1.5 text-[11px] font-semibold"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2.5">
                  {buildings.map((b) => {
                    const roomCount = rooms.filter((r) => (r.buildingId === b.id || r.buildingId === b._id)).length;
                    return (
                      <div key={b.id || b._id} className="glass-soft rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 text-[14.5px] truncate">{b.name}</div>
                            <div className="text-[12px] text-slate-500 mt-0.5">{b.type}</div>
                          </div>
                          <span className="shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0c6a99] border border-blue-100">
                            {b.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100/80">
                          <div className="text-[11px] text-slate-500">
                            {b.floors} floors &middot; {roomCount} rooms
                          </div>
                          <button
                            onClick={() => handleDeleteBuilding(b.id || b._id)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 transition px-3 py-1.5 text-[11px] font-semibold"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* ─── Rooms Tab ─── */}
          <TabsContent value="rooms" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                <SelectTrigger className="w-[200px] rounded-full bg-white/80 text-xs">
                  <SelectValue placeholder="Filter by building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buildings</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.id || b._id} value={b.id || b._id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => { setBedForm(INITIAL_BED_FORM); setShowAssignBed(true); }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 text-xs font-semibold shadow-xs"
              >
                <Plus className="h-4 w-4" /> Assign Bed
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <EmptyState
                icon={BedDouble}
                title="No rooms found"
                hint="Create a room or adjust your building filter."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <div key={room.id || room._id} className="glass-soft rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 text-[14.5px]">
                          Room {room.roomNumber}
                        </div>
                        <div className="text-[12px] text-slate-500 mt-0.5">
                          {getBuildingName(room.buildingId)} &middot; Floor {room.floor}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold ${roomStatusStyle(room.status)}`}>
                        {room.status || "AVAILABLE"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-[12px] text-slate-600">
                      <span>{room.roomType || "Standard"}</span>
                      <span>&middot;</span>
                      <span>{room.occupiedBeds || 0}/{room.bedCount || 0} beds</span>
                    </div>
                    {room.assignments && room.assignments.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100/80 space-y-1.5">
                        {room.assignments.map((a) => (
                          <div key={a.id || a._id} className="flex items-center justify-between gap-2">
                            <span className="text-[12px] text-slate-600 truncate">
                              Bed {a.bedNumber}: {getStudentName(a.studentId)}
                            </span>
                            <button
                              onClick={() => handleUnassignBed(a.id || a._id)}
                              className="shrink-0 inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 transition px-2 py-1 text-[10px] font-semibold"
                            >
                              <Trash2 className="h-2.5 w-2.5" /> Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Maintenance Tab ─── */}
          <TabsContent value="maintenance" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">
                <Wrench className="h-3.5 w-3.5 text-[#29ABE2]" /> Maintenance Requests
              </div>
              <button
                onClick={() => setShowCreateMaintenance(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 text-xs font-semibold shadow-xs"
              >
                <Plus className="h-4 w-4" /> New Request
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
              </div>
            ) : maintenanceRequests.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No maintenance requests"
                hint="All clear! Create a request when an issue is reported."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
                  <table className="min-w-full text-[13px]">
                    <thead className="bg-slate-50/80">
                      <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                        <th className="px-5 py-3 font-semibold">Description</th>
                        <th className="px-5 py-3 font-semibold">Room</th>
                        <th className="px-5 py-3 font-semibold text-center">Priority</th>
                        <th className="px-5 py-3 font-semibold text-center">Status</th>
                        <th className="px-5 py-3 font-semibold">Reported</th>
                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceRequests.map((req) => (
                        <tr key={req.id || req._id} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                          <td className="px-5 py-3.5 font-medium text-slate-800 max-w-[220px] truncate">{req.description}</td>
                          <td className="px-5 py-3.5 text-slate-600">{req.roomId ? `Room ${req.roomNumber || ""}` : "—"}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${priorityStyle(req.priority)}`}>
                              {req.priority}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${maintenanceStatusStyle(req.status)}`}>
                              {req.status === "IN_PROGRESS" ? "In Progress" : req.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-[12px]">
                            {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {req.status === "PENDING" && (
                                <button
                                  onClick={() => handleUpdateMaintenanceStatus(req.id || req._id, "IN_PROGRESS")}
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 transition px-3 py-1.5 text-[11px] font-semibold"
                                >
                                  Start
                                </button>
                              )}
                              {req.status === "IN_PROGRESS" && (
                                <button
                                  onClick={() => handleUpdateMaintenanceStatus(req.id || req._id, "COMPLETED")}
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-emerald-300 hover:text-emerald-600 transition px-3 py-1.5 text-[11px] font-semibold"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2.5">
                  {maintenanceRequests.map((req) => (
                    <div key={req.id || req._id} className="glass-soft rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 text-[14.5px] line-clamp-2">{req.description}</div>
                          <div className="text-[12px] text-slate-500 mt-0.5">
                            {req.roomId ? `Room ${req.roomNumber || ""}` : "No specific room"} &middot; {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}
                          </div>
                        </div>
                        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold ${maintenanceStatusStyle(req.status)}`}>
                          {req.status === "IN_PROGRESS" ? "In Progress" : req.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100/80">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${priorityStyle(req.priority)}`}>
                          {req.priority}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {req.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateMaintenanceStatus(req.id || req._id, "IN_PROGRESS")}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 transition px-3 py-1.5 text-[11px] font-semibold"
                            >
                              Start
                            </button>
                          )}
                          {req.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => handleUpdateMaintenanceStatus(req.id || req._id, "COMPLETED")}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-emerald-300 hover:text-emerald-600 transition px-3 py-1.5 text-[11px] font-semibold"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Create Building Dialog ─── */}
      <Dialog open={showCreateBuilding} onOpenChange={setShowCreateBuilding}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Add New Building</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBuilding} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Building Name *</label>
              <input
                type="text"
                required
                value={buildingForm.name}
                onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                placeholder="e.g. Boys Hostel A"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Type</label>
                <Select value={buildingForm.type} onValueChange={(v) => setBuildingForm({ ...buildingForm, type: v })}>
                  <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Floors</label>
                <input
                  type="number"
                  min="1"
                  value={buildingForm.floors}
                  onChange={(e) => setBuildingForm({ ...buildingForm, floors: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateBuilding(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create Building
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Create Room Dialog ─── */}
      <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Add New Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRoom} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Building *</label>
              <Select value={roomForm.buildingId} onValueChange={(v) => setRoomForm({ ...roomForm, buildingId: v })}>
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id || b._id} value={b.id || b._id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Floor</label>
                <input
                  type="number"
                  min="1"
                  value={roomForm.floor}
                  onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="e.g. 101"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Bed Count</label>
                <input
                  type="number"
                  min="1"
                  value={roomForm.bedCount}
                  onChange={(e) => setRoomForm({ ...roomForm, bedCount: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Room Type</label>
                <Select value={roomForm.roomType} onValueChange={(v) => setRoomForm({ ...roomForm, roomType: v })}>
                  <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                    <SelectValue placeholder="Room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateRoom(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Create Room
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Assign Bed Dialog ─── */}
      <Dialog open={showAssignBed} onOpenChange={setShowAssignBed}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Assign Bed</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignBed} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Room *</label>
              <Select value={bedForm.roomId} onValueChange={(v) => setBedForm({ ...bedForm, roomId: v })}>
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.filter((r) => (r.status === "AVAILABLE" || r.status === "OCCUPIED") && (r.occupiedBeds || 0) < (r.bedCount || 0)).map((r) => (
                    <SelectItem key={r.id || r._id} value={r.id || r._id}>
                      Room {r.roomNumber} ({getBuildingName(r.buildingId)}) &mdash; {r.bedCount - (r.occupiedBeds || 0)} beds free
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Bed Number</label>
              <input
                type="number"
                min="1"
                value={bedForm.bedNumber}
                onChange={(e) => setBedForm({ ...bedForm, bedNumber: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Student *</label>
              <Select value={bedForm.studentId} onValueChange={(v) => setBedForm({ ...bedForm, studentId: v })} disabled={studentsLoading}>
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder={studentsLoading ? "Loading students..." : "Select a student"} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id || s._id} value={s.id || s._id}>
                      {s.name} (Class {s.cls || s.class}-{s.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAssignBed(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Assign Bed
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Create Maintenance Request Dialog ─── */}
      <Dialog open={showCreateMaintenance} onOpenChange={setShowCreateMaintenance}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">New Maintenance Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMaintenance} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Room (optional)</label>
              <Select value={maintenanceForm.roomId} onValueChange={(v) => setMaintenanceForm({ ...maintenanceForm, roomId: v })}>
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder="Select a room (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id || r._id} value={r.id || r._id}>
                      Room {r.roomNumber} &mdash; {getBuildingName(r.buildingId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Description *</label>
              <textarea
                required
                rows={3}
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                placeholder="Describe the issue..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2] resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Priority</label>
              <Select value={maintenanceForm.priority} onValueChange={(v) => setMaintenanceForm({ ...maintenanceForm, priority: v })}>
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateMaintenance(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
