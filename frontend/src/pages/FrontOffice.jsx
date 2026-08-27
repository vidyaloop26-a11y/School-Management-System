import React, { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, UserCheck, UserX, DoorOpen, MapPin, Clock } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { useStaff } from "@/lib/queries";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-";

const statusStyles = {
  CHECKED_IN: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CHECKED_OUT: "bg-slate-100 text-slate-600 border border-slate-200",
  FLAGGED: "bg-rose-50 text-rose-700 border border-rose-200",
};

const gatePassStatusStyles = {
  ACTIVE: "bg-blue-50 text-blue-700 border border-blue-200",
  USED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border border-rose-200",
};

export default function FrontOffice() {
  const [activeTab, setActiveTab] = useState("visitors");
  const [visitors, setVisitors] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [hostMappings, setHostMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [gatePassOpen, setGatePassOpen] = useState(false);
  const [hostMappingOpen, setHostMappingOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [deleteMappingLoading, setDeleteMappingLoading] = useState(null);

  const { data: staffList = [] } = useStaff();

  const [checkInForm, setCheckInForm] = useState({
    name: "",
    phone: "",
    purpose: "",
    hostStaffId: "",
    studentName: "",
  });

  const [gatePassForm, setGatePassForm] = useState({
    visitorName: "",
    studentName: "",
    purpose: "",
  });

  const [hostMappingForm, setHostMappingForm] = useState({
    visitType: "",
    staffId: "",
  });

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await api.getVisitors({ status: "CHECKED_IN" });
      setVisitors(res?.visitors || []);
    } catch {
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGatePasses = async () => {
    try {
      const res = await api.getGatePasses();
      setGatePasses(res?.gatePasses || []);
    } catch {
      setGatePasses([]);
    }
  };

  const fetchHostMappings = async () => {
    try {
      const res = await api.getHostMappings();
      setHostMappings(res?.hostMappings || []);
    } catch {
      setHostMappings([]);
    }
  };

  useEffect(() => {
    fetchVisitors();
    fetchGatePasses();
    fetchHostMappings();
  }, []);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInForm.name || !checkInForm.phone) {
      toast.error("Name and phone are required");
      return;
    }
    try {
      await api.checkInVisitor(checkInForm);
      toast.success("Visitor checked in successfully");
      setCheckInOpen(false);
      setCheckInForm({ name: "", phone: "", purpose: "", hostStaffId: "", studentName: "" });
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async (id) => {
    setCheckoutLoading(id);
    try {
      await api.checkOutVisitor(id);
      toast.success("Visitor checked out");
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-out failed");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCreateGatePass = async (e) => {
    e.preventDefault();
    if (!gatePassForm.visitorName || !gatePassForm.studentName) {
      toast.error("Visitor and student names are required");
      return;
    }
    try {
      await api.createGatePass(gatePassForm);
      toast.success("Gate pass issued");
      setGatePassOpen(false);
      setGatePassForm({ visitorName: "", studentName: "", purpose: "" });
      fetchGatePasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to issue gate pass");
    }
  };

  const handleCreateHostMapping = async (e) => {
    e.preventDefault();
    if (!hostMappingForm.visitType || !hostMappingForm.staffId) {
      toast.error("Visit type and staff are required");
      return;
    }
    try {
      await api.createHostMapping(hostMappingForm);
      toast.success("Host mapping created");
      setHostMappingOpen(false);
      setHostMappingForm({ visitType: "", staffId: "" });
      fetchHostMappings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create mapping");
    }
  };

  const handleDeleteMapping = async (id) => {
    setDeleteMappingLoading(id);
    try {
      await api.deleteHostMapping(id);
      toast.success("Mapping deleted");
      fetchHostMappings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete mapping");
    } finally {
      setDeleteMappingLoading(null);
    }
  };

  const todayVisitors = visitors.filter((v) => {
    const today = new Date().toISOString().split("T")[0];
    return v.checkInTime && new Date(v.checkInTime).toISOString().split("T")[0] === today;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Front Office"
        subtitle="Manage visitor check-ins, gate passes, and host mappings."
        action={
          <Button
            onClick={() => setCheckInOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
          >
            <UserCheck className="h-4 w-4" />
            Check-in Visitor
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Checked In</span>
            <UserCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">
            {visitors.filter((v) => v.status === "CHECKED_IN").length}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Checked Out Today</span>
            <UserX className="h-5 w-5 text-slate-400" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">
            {todayVisitors.filter((v) => v.status === "CHECKED_OUT").length}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gate Passes</span>
            <DoorOpen className="h-5 w-5 text-blue-500" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">
            {gatePasses.filter((g) => g.status === "ACTIVE").length}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100/80 p-1 rounded-xl">
            <TabsTrigger value="visitors" className="rounded-lg text-[12.5px]">Visitors</TabsTrigger>
            <TabsTrigger value="gate-passes" className="rounded-lg text-[12.5px]">Gate Passes</TabsTrigger>
            <TabsTrigger value="host-mappings" className="rounded-lg text-[12.5px]">Host Mappings</TabsTrigger>
          </TabsList>

          <TabsContent value="visitors" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
              </div>
            ) : todayVisitors.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No Visitors Today"
                hint="Check in a visitor using the button above to start tracking."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      <th className="pb-3 px-3">Name</th>
                      <th className="pb-3 px-3">Phone</th>
                      <th className="pb-3 px-3">Purpose</th>
                      <th className="pb-3 px-3">Host</th>
                      <th className="pb-3 px-3">Check-in</th>
                      <th className="pb-3 px-3">Check-out</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todayVisitors.map((v) => (
                      <tr key={v.id} className="hover:bg-white/60 transition">
                        <td className="py-3.5 px-3 font-semibold text-slate-800">{v.name}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-600">{v.phone}</td>
                        <td className="py-3.5 px-3 text-slate-600">{v.purpose}</td>
                        <td className="py-3.5 px-3 text-slate-600">{v.hostName || <span className="text-slate-300">-</span>}</td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono text-[12px]">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {fmtTime(v.checkInTime)}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono text-[12px]">
                          {v.checkOutTime ? fmtTime(v.checkOutTime) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusStyles[v.status] || statusStyles.CHECKED_IN}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {v.status === "CHECKED_IN" && (
                            <button
                              onClick={() => handleCheckOut(v.id)}
                              disabled={checkoutLoading === v.id}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11.5px] font-semibold transition disabled:opacity-50"
                            >
                              {checkoutLoading === v.id ? (
                                <Loader2 className="h-3 w-3 animate-spin inline" />
                              ) : (
                                "Check Out"
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gate-passes" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button
                onClick={() => setGatePassOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Issue Gate Pass
              </Button>
            </div>
            {gatePasses.length === 0 ? (
              <EmptyState
                icon={DoorOpen}
                title="No Gate Passes"
                hint="Issue a gate pass for visitors who need to take students off campus."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      <th className="pb-3 px-3">Visitor</th>
                      <th className="pb-3 px-3">Student</th>
                      <th className="pb-3 px-3">Purpose</th>
                      <th className="pb-3 px-3">Issued By</th>
                      <th className="pb-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gatePasses.map((gp) => (
                      <tr key={gp.id} className="hover:bg-white/60 transition">
                        <td className="py-3.5 px-3 font-semibold text-slate-800">{gp.visitorName}</td>
                        <td className="py-3.5 px-3 text-slate-600">{gp.studentName}</td>
                        <td className="py-3.5 px-3 text-slate-600">{gp.purpose}</td>
                        <td className="py-3.5 px-3 text-slate-600">{gp.issuedBy}</td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${gatePassStatusStyles[gp.status] || gatePassStatusStyles.ACTIVE}`}>
                            {gp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="host-mappings" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button
                onClick={() => setHostMappingOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Mapping
              </Button>
            </div>
            {hostMappings.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No Host Mappings"
                hint="Map visit types to staff members so the front office knows who to contact."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      <th className="pb-3 px-3">Visit Type</th>
                      <th className="pb-3 px-3">Staff Member</th>
                      <th className="pb-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hostMappings.map((hm) => (
                      <tr key={hm.id} className="hover:bg-white/60 transition">
                        <td className="py-3.5 px-3 font-semibold text-slate-800">{hm.visitType}</td>
                        <td className="py-3.5 px-3 text-slate-600">{hm.staffName}</td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteMapping(hm.id)}
                            disabled={deleteMappingLoading === hm.id}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition disabled:opacity-50"
                          >
                            {deleteMappingLoading === hm.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Check-in Visitor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCheckIn} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visitor Name</label>
              <input
                type="text"
                value={checkInForm.name}
                onChange={(e) => setCheckInForm({ ...checkInForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                placeholder="Enter visitor name"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={checkInForm.phone}
                onChange={(e) => setCheckInForm({ ...checkInForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                placeholder="Enter phone number"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purpose</label>
              <select
                value={checkInForm.purpose}
                onChange={(e) => setCheckInForm({ ...checkInForm, purpose: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">Select purpose</option>
                <option value="MEETING">Meeting</option>
                <option value="PICKUP">Student Pickup</option>
                <option value="DELIVERY">Delivery</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Host (Optional)</label>
              <select
                value={checkInForm.hostStaffId}
                onChange={(e) => setCheckInForm({ ...checkInForm, hostStaffId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">No host</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Name (Optional, for pickup)</label>
              <input
                type="text"
                value={checkInForm.studentName}
                onChange={(e) => setCheckInForm({ ...checkInForm, studentName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                placeholder="Student name if pickup"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setCheckInOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">
                Check In
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={gatePassOpen} onOpenChange={setGatePassOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Issue Gate Pass</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGatePass} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visitor Name</label>
              <input
                type="text"
                value={gatePassForm.visitorName}
                onChange={(e) => setGatePassForm({ ...gatePassForm, visitorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                placeholder="Enter visitor name"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Name</label>
              <input
                type="text"
                value={gatePassForm.studentName}
                onChange={(e) => setGatePassForm({ ...gatePassForm, studentName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                placeholder="Student being picked up"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purpose</label>
              <input
                type="text"
                value={gatePassForm.purpose}
                onChange={(e) => setGatePassForm({ ...gatePassForm, purpose: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                placeholder="Reason for gate pass"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setGatePassOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">
                Issue Pass
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={hostMappingOpen} onOpenChange={setHostMappingOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add Host Mapping</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateHostMapping} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visit Type</label>
              <select
                value={hostMappingForm.visitType}
                onChange={(e) => setHostMappingForm({ ...hostMappingForm, visitType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                required
              >
                <option value="">Select visit type</option>
                <option value="MEETING">Meeting</option>
                <option value="PICKUP">Student Pickup</option>
                <option value="DELIVERY">Delivery</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INSPECTION">Inspection</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Staff Member</label>
              <select
                value={hostMappingForm.staffId}
                onChange={(e) => setHostMappingForm({ ...hostMappingForm, staffId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                required
              >
                <option value="">Select staff member</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setHostMappingOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">
                Create Mapping
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
