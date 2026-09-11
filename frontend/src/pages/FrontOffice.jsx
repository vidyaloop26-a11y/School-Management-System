import React, { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/lib/AuthContext";
import { useStaff } from "@/lib/queries";
import {
  Loader2, Plus, Trash2, UserCheck, UserX, DoorOpen, MapPin, Clock, QrCode, ShieldCheck,
  ShieldX, ScanLine, UserPlus, RefreshCw, CheckCircle2, XCircle, Hourglass,
} from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import {
  PURPOSES, APPROVAL_OPTIONS, approvalStyles, pickupStyles, gatePassStatusStyles, passQrUrl, checkInKioskUrl,
} from "@/lib/frontOfficeConstants";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-";

const statusStyles = {
  CHECKED_IN: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CHECKED_OUT: "bg-slate-100 text-slate-600 border border-slate-200",
  FLAGGED: "bg-rose-50 text-rose-700 border border-rose-200",
};

const purposeLabel = (v) => PURPOSES.find((p) => p.value === v)?.label || v || "-";

const PickupBadge = ({ status }) =>
  status ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${pickupStyles[status] || pickupStyles.PENDING}`}>
      {status}
    </span>
  ) : (
    <span className="text-slate-300">-</span>
  );

const ApprovalBadge = ({ status }) =>
  status && status !== "PENDING" ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${approvalStyles[status] || approvalStyles.PENDING}`}>
      {status}
    </span>
  ) : (
    <span className="text-slate-300">-</span>
  );

export default function FrontOffice() {
  const { user } = useAuth();
  const { data: staffList = [] } = useStaff();
  const schoolId = user?.schoolId || user?.school?.id || "";

  const [activeTab, setActiveTab] = useState("visitors");
  const [visitors, setVisitors] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [hostMappings, setHostMappings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(null);
  const [deleteMappingLoading, setDeleteMappingLoading] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Dialogs
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [gatePassOpen, setGatePassOpen] = useState(false);
  const [hostMappingOpen, setHostMappingOpen] = useState(false);
  const [approvalFor, setApprovalFor] = useState(null);
  const [pickupFor, setPickupFor] = useState(null);
  const [qrPass, setQrPass] = useState(null);
  const [guardianOpen, setGuardianOpen] = useState(false);

  // Verify scanner
  const [verifyToken, setVerifyToken] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyAutoFill, setVerifyAutoFill] = useState(true);

  // Forms
  const [checkInForm, setCheckInForm] = useState({
    name: "", phone: "", purpose: "", hostStaffId: "", organisation: "", studentId: "", admissionClass: "", notes: "", photoUrl: "",
  });
  const [gatePassForm, setGatePassForm] = useState({
    passType: "VISITOR", visitorName: "", phone: "", studentId: "", studentName: "", staffId: "", purpose: "", approvalStatus: "APPROVED",
  });
  const [hostMappingForm, setHostMappingForm] = useState({ visitType: "", staffId: "" });
  const [approvalForm, setApprovalForm] = useState({ decision: "APPROVED", note: "" });
  const [pickupForm, setPickupForm] = useState({ decision: "VERIFIED", note: "" });
  const [guardianForm, setGuardianForm] = useState({
    studentId: "", studentLabel: "", search: "", name: "", relationship: "", phone: "", authorizedForPickup: true,
  });

  const fileRef = useRef(null);
  const [studentResults, setStudentResults] = useState([]);
  const [studentSearching, setStudentSearching] = useState(false);
  const [guardians, setGuardians] = useState([]);
  const [guardiansLoading, setGuardiansLoading] = useState(false);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await api.getVisitors();
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

  const refreshAll = () => {
    fetchVisitors();
    fetchGatePasses();
  };

  const todayVisitors = visitors.filter((v) => {
    const today = new Date().toISOString().split("T")[0];
    return v.checkInTime && new Date(v.checkInTime).toISOString().split("T")[0] === today;
  });

  // ---------- Check in ----------
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInForm.name || !checkInForm.phone || !checkInForm.purpose) {
      toast.error("Name, phone and purpose are required");
      return;
    }
    if (checkInForm.purpose === "STUDENT_PICKUP" && !checkInForm.studentId) {
      toast.error("Search and select the student being picked up");
      return;
    }
    setActionLoading("checkin");
    try {
      const res = await api.checkInVisitor({
        ...checkInForm,
        hostStaffId: checkInForm.hostStaffId || undefined,
        studentId: checkInForm.studentId || undefined,
        admissionClass: checkInForm.admissionClass || undefined,
        organisation: checkInForm.organisation || undefined,
        notes: checkInForm.notes || undefined,
        photoUrl: checkInForm.photoUrl || undefined,
      });
      toast.success("Visitor checked in successfully");
      setCheckInOpen(false);
      setCheckInForm({ name: "", phone: "", purpose: "", hostStaffId: "", organisation: "", studentId: "", admissionClass: "", notes: "", photoUrl: "" });
      fetchVisitors();
      fetchGatePasses();
      setQrPass(res.gatePass);
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-in failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (id) => {
    setCheckOutLoading(id);
    try {
      await api.checkOutVisitor(id);
      toast.success("Visitor checked out");
      fetchVisitors();
      fetchGatePasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-out failed");
    } finally {
      setCheckOutLoading(null);
    }
  };

  // ---------- Approval ----------
  const openApproval = (visitor) => {
    setApprovalForm({ decision: "APPROVED", note: "" });
    setApprovalFor(visitor);
  };

  const submitApproval = async (e) => {
    e.preventDefault();
    if (!approvalFor) return;
    setActionLoading(approvalFor.id);
    try {
      await api.approveVisitor(approvalFor.id, approvalForm);
      toast.success(`Visitor ${approvalForm.decision.toLowerCase()}d`);
      setApprovalFor(null);
      fetchVisitors();
      fetchGatePasses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ---------- Pickup verification ----------
  const openPickup = (visitor) => {
    setPickupForm({ decision: "VERIFIED", note: "" });
    setPickupFor(visitor);
  };

  const submitPickup = async (e) => {
    e.preventDefault();
    if (!pickupFor) return;
    setActionLoading(pickupFor.id);
    try {
      await api.verifyPickup(pickupFor.id, pickupForm);
      toast.success(`Pickup ${pickupForm.decision.toLowerCase()}`);
      setPickupFor(null);
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ---------- Student search (pickup + guardians + gate pass) ----------
  const searchStudents = async (q) => {
    if (!q || q.length < 2) {
      setStudentResults([]);
      return;
    }
    setStudentSearching(true);
    try {
      const res = await api.getStudents({ search: q, limit: 15 });
      setStudentResults(res?.students || []);
    } catch {
      setStudentResults([]);
    } finally {
      setStudentSearching(false);
    }
  };

  const resetStudentSearch = (setter) => {
    setStudentResults([]);
    setter((f) => ({ ...f, search: "" }));
  };

  // ---------- Guardians ----------
  const fetchGuardians = async (studentId) => {
    if (!studentId) {
      setGuardians([]);
      return;
    }
    setGuardiansLoading(true);
    try {
      const res = await api.getGuardians({ studentId });
      setGuardians(res?.guardians || []);
    } catch {
      setGuardians([]);
    } finally {
      setGuardiansLoading(false);
    }
  };

  const openGuardian = () => {
    setGuardianForm({ studentId: "", studentLabel: "", search: "", name: "", relationship: "", phone: "", authorizedForPickup: true });
    setGuardianOpen(true);
    fetchGuardians("");
  };

  const submitGuardian = async (e) => {
    e.preventDefault();
    if (!guardianForm.studentId) {
      toast.error("Select a student first");
      return;
    }
    if (!guardianForm.name) {
      toast.error("Guardian name is required");
      return;
    }
    setActionLoading("guardian");
    try {
      await api.createGuardian({
        studentId: guardianForm.studentId,
        name: guardianForm.name,
        relationship: guardianForm.relationship || undefined,
        phone: guardianForm.phone || undefined,
        authorizedForPickup: guardianForm.authorizedForPickup,
      });
      toast.success("Guardian added to pickup list");
      fetchGuardians(guardianForm.studentId);
      setGuardianForm((f) => ({ ...f, name: "", relationship: "", phone: "", authorizedForPickup: true }));
      resetStudentSearch(setGuardianForm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add guardian");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleGuardianAuth = async (g) => {
    await api.updateGuardian(g.id, { authorizedForPickup: !g.authorizedForPickup });
    fetchGuardians(guardianForm.studentId);
  };

  const handleDeleteGuardian = async (id) => {
    await api.deleteGuardian(id);
    toast.success("Guardian removed");
    fetchGuardians(guardianForm.studentId);
  };

  // ---------- Gate passes ----------
  const handleCreateGatePass = async (e) => {
    e.preventDefault();
    if (gatePassForm.passType === "VISITOR" && !gatePassForm.visitorName) {
      toast.error("Holder name is required");
      return;
    }
    if (gatePassForm.passType === "STUDENT" && !gatePassForm.studentId) {
      toast.error("Select the student");
      return;
    }
    setActionLoading("gatepass");
    try {
      const payload = {
        passType: gatePassForm.passType,
        purpose: gatePassForm.purpose || "General",
        approvalStatus: gatePassForm.approvalStatus,
      };
      if (gatePassForm.passType === "VISITOR") {
        payload.holderName = gatePassForm.visitorName;
        payload.holderId = gatePassForm.phone || undefined;
      }
      if (gatePassForm.passType === "STUDENT") {
        payload.studentId = gatePassForm.studentId;
        payload.studentName = gatePassForm.studentName;
      }
      if (gatePassForm.passType === "STAFF") {
        payload.holderId = gatePassForm.staffId;
      }
      const res = await api.createGatePass(payload);
      toast.success("Gate pass issued");
      setGatePassOpen(false);
      setGatePassForm({ passType: "VISITOR", visitorName: "", phone: "", studentId: "", studentName: "", staffId: "", purpose: "", approvalStatus: "APPROVED" });
      fetchGatePasses();
      setQrPass(res.gatePass);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to issue gate pass");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelGatePass = async (id) => {
    setActionLoading(id);
    try {
      await api.cancelGatePass(id);
      toast.success("Gate pass cancelled");
      fetchGatePasses();
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel pass");
    } finally {
      setActionLoading(null);
    }
  };

  // ---------- Pass verify scanner ----------
  const runVerify = async (t) => {
    const token = (t ?? verifyToken).trim();
    if (!token) {
      toast.error("Enter a gate pass code");
      return;
    }
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyGatePassPublic(token);
      setVerifyResult(res);
      if (!res.valid) toast.error(res.reason || "Pass not valid");
      else toast.success("Pass verified");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  // ---------- Host mappings ----------
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

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCheckInForm((f) => ({ ...f, photoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const headerActions = (
    <>
      <Button
        onClick={() => setCheckInOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
      >
        <UserCheck className="h-4 w-4" />
        Check-in Visitor
      </Button>
      {schoolId && (
        <Button
          onClick={() => setQrPass({ kiosk: true })}
          variant="outline"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[13px] font-semibold transition shadow-sm"
        >
          <QrCode className="h-4 w-4" />
          Check-in QR
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Front Office"
        subtitle="Visitor check-ins, approvals, pickup verification, and gate passes."
        right={headerActions}
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
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Gate Passes</span>
            <DoorOpen className="h-5 w-5 text-blue-500" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mt-2">
            {gatePasses.filter((g) => g.status === "ACTIVE").length}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100/80 p-1 rounded-xl flex-wrap">
            <TabsTrigger value="visitors" className="rounded-lg text-[12.5px]">Visitors</TabsTrigger>
            <TabsTrigger value="gate-passes" className="rounded-lg text-[12.5px]">Gate Passes</TabsTrigger>
            <TabsTrigger value="verify" className="rounded-lg text-[12.5px]">Verify Pass</TabsTrigger>
            <TabsTrigger value="guardians" className="rounded-lg text-[12.5px]">Pickup List</TabsTrigger>
            <TabsTrigger value="kiosk" className="rounded-lg text-[12.5px]">Check-in Kiosk</TabsTrigger>
            <TabsTrigger value="host-mappings" className="rounded-lg text-[12.5px]">Host Mappings</TabsTrigger>
          </TabsList>

          {/* ============ VISITORS ============ */}
          <TabsContent value="visitors" className="mt-4">
            <div className="flex justify-end mb-3">
              <button onClick={refreshAll} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
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
                      <th className="pb-3 px-3">Purpose</th>
                      <th className="pb-3 px-3">Contact</th>
                      <th className="pb-3 px-3">Host</th>
                      <th className="pb-3 px-3">Check-in</th>
                      <th className="pb-3 px-3">Approval</th>
                      <th className="pb-3 px-3">Pickup</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todayVisitors.map((v) => (
                      <tr key={v.id} className="hover:bg-white/60 transition">
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            {v.photoUrl ? (
                              <img src={v.photoUrl} alt={v.name} className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                            ) : null}
                            <div className="min-w-0">
                              <div className="truncate">{v.name}</div>
                              <div className="text-[11px] text-slate-400 font-normal">
                                {v.studentName ? `Student: ${v.studentName}` : purposeLabel(v.purpose)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{v.studentName ? purposeLabel(v.purpose) : <span className="text-slate-400">{purposeLabel(v.purpose)}</span>}</td>
                        <td className="py-3.5 px-3 font-mono text-slate-600">{v.phone}</td>
                        <td className="py-3.5 px-3 text-slate-600">{v.hostName || <span className="text-slate-300">-</span>}</td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono text-[12px]">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {fmtTime(v.checkInTime)}
                        </td>
                        <td className="py-3.5 px-3">
                          <ApprovalBadge status={v.approvalStatus} />
                        </td>
                        <td className="py-3.5 px-3">
                          <PickupBadge status={v.pickupStatus} />
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusStyles[v.status] || statusStyles.CHECKED_IN}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {v.qrToken && (
                              <button
                                title="Show gate pass QR"
                                onClick={() => setQrPass({ gatePass: v.gatePass || { qrToken: v.qrToken, holderName: v.name, passType: "VISITOR", purpose: v.purpose, approvalStatus: v.approvalStatus, validUntil: "" } })}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                              >
                                <QrCode className="h-4 w-4" />
                              </button>
                            )}
                            {v.purpose === "STUDENT_PICKUP" && ["PENDING", "MANUAL"].includes(v.pickupStatus) && v.status === "CHECKED_IN" && (
                              <button
                                onClick={() => openPickup(v)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11.5px] font-semibold transition"
                              >
                                Verify Pickup
                              </button>
                            )}
                            {["PENDING", "WAIT", ""].includes(v.approvalStatus) && v.status === "CHECKED_IN" && (
                              <button
                                onClick={() => openApproval(v)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11.5px] font-semibold transition"
                              >
                                Review
                              </button>
                            )}
                            {v.status === "CHECKED_IN" && (
                              <button
                                onClick={() => handleCheckOut(v.id)}
                                disabled={checkOutLoading === v.id}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11.5px] font-semibold transition disabled:opacity-50"
                              >
                                {checkOutLoading === v.id ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "Check Out"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ============ GATE PASSES ============ */}
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
                hint="Issue a gate pass for visitors, students or staff, then share the QR with the gate."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      <th className="pb-3 px-3">Holder</th>
                      <th className="pb-3 px-3">Type</th>
                      <th className="pb-3 px-3">Purpose</th>
                      <th className="pb-3 px-3">Approval</th>
                      <th className="pb-3 px-3">Valid Until</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gatePasses.map((gp) => (
                      <tr key={gp.id} className="hover:bg-white/60 transition">
                        <td className="py-3.5 px-3 font-semibold text-slate-800">{gp.holderName}</td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-bold">{gp.passType}</span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{gp.purpose}</td>
                        <td className="py-3.5 px-3">
                          <ApprovalBadge status={gp.approvalStatus} />
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 font-mono text-[12px]">
                          {gp.validUntil ? fmtTime(gp.validUntil) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${gatePassStatusStyles[gp.status] || gatePassStatusStyles.ACTIVE}`}>
                            {gp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {gp.qrToken && (
                              <button title="Show QR" onClick={() => setQrPass({ gatePass: gp })} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
                                <QrCode className="h-4 w-4" />
                              </button>
                            )}
                            {gp.status === "ACTIVE" && (
                              <button
                                onClick={() => handleCancelGatePass(gp.id)}
                                disabled={actionLoading === gp.id}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition disabled:opacity-50"
                              >
                                {actionLoading === gp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ============ VERIFY PASS ============ */}
          <TabsContent value="verify" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-[13px]">Pass Code / Token</label>
                  <input
                    value={verifyToken}
                    onChange={(e) => { setVerifyToken(e.target.value); setVerifyAutoFill(false); }}
                    onKeyDown={(e) => e.key === "Enter" && runVerify()}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none font-mono tracking-wider text-[13.5px]"
                    placeholder="e.g. VLG-NCS8YRWBQIC"
                  />
                  <p className="text-[11.5px] text-slate-400 mt-1.5">
                    Gate staff scan the QR with a phone, or paste the decoded token here.
                    {verifyAutoFill && verifyToken ? "" : ""}
                  </p>
                </div>
                <Button
                  onClick={() => runVerify()}
                  disabled={verifyLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
                >
                  {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                  Verify Pass
                </Button>

                <div className="pt-4">
                  <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Scan with your phone</p>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed">
                    Point your phone camera at the holder's QR gate pass. It opens the verification page and shows the result instantly. The scan is also logged on the pass.
                  </p>
                </div>
              </div>

              <div>
                {verifyResult ? (
                  <div className={`rounded-2xl border p-5 ${verifyResult.valid ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center justify-center h-11 w-11 rounded-full ${verifyResult.valid ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                        {verifyResult.valid ? <ShieldCheck className="h-6 w-6" /> : <ShieldX className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className={`text-[15px] font-bold ${verifyResult.valid ? "text-emerald-700" : "text-rose-700"}`}>
                          {verifyResult.valid ? "Access Granted" : "Access Denied"}
                        </p>
                        <p className="text-[12px] text-slate-500">{verifyResult.reason}</p>
                      </div>
                    </div>
                    {verifyResult.gatePass && (
                      <div className="mt-4 grid grid-cols-2 gap-2.5 text-[12.5px]">
                        <div className="rounded-xl bg-white p-3 border border-emerald-100">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Holder</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{verifyResult.gatePass.holderName}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-emerald-100">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Purpose</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{verifyResult.gatePass.purpose}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-200 h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6">
                    <ScanLine className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-[13px] text-slate-400">Verification result will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ============ GUARDIANS / PICKUP LIST ============ */}
          <TabsContent value="guardians" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button
                onClick={openGuardian}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#29ABE2] hover:bg-[#0c6a99] text-white text-[13px] font-semibold transition shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                Add Guardian
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[13px]">Find Student</label>
                <input
                  value={guardianForm.search}
                  onChange={(e) => { setGuardianForm((f) => ({ ...f, search: e.target.value })); searchStudents(e.target.value); }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#29ABE2] outline-none text-[13px]"
                  placeholder="Search by name or admission no"
                />
                {studentSearching ? (
                  <div className="flex items-center gap-2 text-slate-400 text-[12px] mt-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…</div>
                ) : studentResults.length > 0 ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 max-h-72 overflow-y-auto thin-scroll">
                    {studentResults.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setGuardianForm((f) => ({ ...f, studentId: s.id, studentLabel: `${s.name} · ${s.cls}-${s.section}`, search: `${s.name} (${s.admissionNo})` }));
                          setStudentResults([]);
                          fetchGuardians(s.id);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition"
                      >
                        <div className="font-semibold text-slate-800 text-[13px]">{s.name}</div>
                        <div className="text-[11.5px] text-slate-500">{s.cls}-{s.section} · {s.admissionNo}</div>
                      </button>
                    ))}
                  </div>
                ) : null}

                {guardianForm.studentId && (
                  <div className="mt-4 rounded-2xl bg-[#e0f2fe]/50 border border-sky-100 p-4">
                    <p className="text-[10.5px] text-sky-600 font-bold uppercase tracking-wider">Selected Student</p>
                    <p className="text-[14px] font-bold text-slate-800 mt-0.5">{guardianForm.studentLabel}</p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                {!guardianForm.studentId ? (
                  <EmptyState
                    icon={UserPlus}
                    title="Select a Student"
                    hint="Search for a student to see their authorised pickup guardians."
                  />
                ) : guardiansLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" /></div>
                ) : guardians.length === 0 ? (
                  <EmptyState
                    icon={UserCheck}
                    title="No Guardians Listed"
                    hint="Add the student's parents or authorised pickups. Only named guardians can pick up without manual verification."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                          <th className="pb-3 px-3">Name</th>
                          <th className="pb-3 px-3">Relationship</th>
                          <th className="pb-3 px-3">Phone</th>
                          <th className="pb-3 px-3">Authorized Pickup</th>
                          <th className="pb-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {guardians.map((g) => (
                          <tr key={g.id} className="hover:bg-white/60 transition">
                            <td className="py-3.5 px-3 font-semibold text-slate-800">
                              <div className="flex items-center gap-2.5">
                                {g.photoUrl && <img src={g.photoUrl} alt={g.name} className="h-7 w-7 rounded-full object-cover border border-slate-200" />}
                                {g.name}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-slate-600">{g.relationship || <span className="text-slate-300">-</span>}</td>
                            <td className="py-3.5 px-3 font-mono text-slate-600">{g.phone || <span className="text-slate-300">-</span>}</td>
                            <td className="py-3.5 px-3">
                              <button
                                onClick={() => toggleGuardianAuth(g)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${g.authorizedForPickup ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
                              >
                                {g.authorizedForPickup ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {g.authorizedForPickup ? "Authorized" : "Not Authorized"}
                              </button>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <button onClick={() => handleDeleteGuardian(g.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ============ KIOSK ============ */}
          <TabsContent value="kiosk" className="mt-4">
            {!schoolId ? (
              <EmptyState icon={QrCode} title="Kiosk Unavailable" hint="School context not loaded. Refresh the page." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white border border-slate-100 p-6 text-center">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Visitor Self Check-in</p>
                  <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200">
                    <QRCodeSVG value={checkInKioskUrl(schoolId)} size={200} level="M" />
                  </div>
                  <div className="mt-3 font-mono text-[12px] text-slate-400 break-all px-4">{checkInKioskUrl(schoolId)}</div>
                  <p className="text-[12.5px] text-slate-500 mt-3">
                    Visitors scan this with their phone to self check-in, get approval, and receive a QR gate pass.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                    <p className="text-[12px] font-semibold text-slate-700">How it works</p>
                    <ol className="mt-3 space-y-2.5 text-[12.5px] text-slate-500 list-decimal list-inside">
                      <li>Visitor scans the QR and fills name, phone and purpose.</li>
                      <li>For pickups, they search their student from your student list.</li>
                      <li>Front office gets notified and approves / rejects.</li>
                      <li>Student pickups are verified against the authorised pickup list.</li>
                      <li>Gate verifies the QR pass on exit — check out marks the pass used.</li>
                    </ol>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold transition"
                  >
                    Print Poster
                  </button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ============ HOST MAPPINGS ============ */}
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
                            {deleteMappingLoading === hm.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

      {/* ============ CHECK-IN DIALOG ============ */}
      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Check-in Visitor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCheckIn} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visitor Name</label>
              <input type="text" value={checkInForm.name} onChange={(e) => setCheckInForm({ ...checkInForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="Enter visitor name" required />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input type="text" value={checkInForm.phone} onChange={(e) => setCheckInForm({ ...checkInForm, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="Enter phone number" required />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purpose</label>
              <select value={checkInForm.purpose} onChange={(e) => setCheckInForm({ ...checkInForm, purpose: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                <option value="">Select purpose</option>
                {PURPOSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            {!["STUDENT_PICKUP", "ADMISSION_ENQUIRY"].includes(checkInForm.purpose) && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Host (Optional)</label>
                <select value={checkInForm.hostStaffId} onChange={(e) => setCheckInForm({ ...checkInForm, hostStaffId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                  <option value="">No host</option>
                  {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            {checkInForm.purpose === "STUDENT_PICKUP" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Being Picked Up</label>
                <input
                  type="text"
                  onChange={(e) => { setCheckInForm((f) => ({ ...f, studentId: "" })); searchStudents(e.target.value); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  placeholder="Type to search students"
                />
                {studentSearching ? (
                  <div className="flex items-center gap-2 text-slate-400 text-[12px] mt-2"><Loader2 className="h-3 w-3 animate-spin" /> Searching…</div>
                ) : studentResults.length > 0 ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 max-h-40 overflow-y-auto thin-scroll">
                    {studentResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setCheckInForm((f) => ({ ...f, studentId: s.id, studentName: s.name })); setStudentResults([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition"
                      >
                        <div className="font-semibold text-slate-800 text-[12.5px]">{s.name}</div>
                        <div className="text-[11px] text-slate-500">{s.cls}-{s.section} · {s.admissionNo}</div>
                      </button>
                    ))}
                  </div>
                ) : null}
                {checkInForm.studentId && checkInForm.studentName && (
                  <p className="text-[12px] text-[#0c6a99] mt-1.5 font-semibold">✓ {checkInForm.studentName}</p>
                )}
              </div>
            )}
            {checkInForm.purpose === "ADMISSION_ENQUIRY" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Applying For (optional)</label>
                <input type="text" value={checkInForm.admissionClass} onChange={(e) => setCheckInForm({ ...checkInForm, admissionClass: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="e.g. 5" />
              </div>
            )}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Organisation (Optional)</label>
              <input type="text" value={checkInForm.organisation} onChange={(e) => setCheckInForm({ ...checkInForm, organisation: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="Company / organisation" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Photo (Optional)</label>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[12px] font-semibold transition">
                  {checkInForm.photoUrl ? "Change photo" : "Take / upload photo"}
                </button>
                {checkInForm.photoUrl && <img src={checkInForm.photoUrl} alt="Visitor" className="h-9 w-9 rounded-full object-cover border border-slate-200" />}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setCheckInOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={actionLoading === "checkin"} className="bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">
                {actionLoading === "checkin" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check In"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ GATE PASS DIALOG ============ */}
      <Dialog open={gatePassOpen} onOpenChange={setGatePassOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Issue Gate Pass</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGatePass} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pass Type</label>
              <div className="flex gap-2">
                {["VISITOR", "STUDENT", "STAFF"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGatePassForm({ ...gatePassForm, passType: t })}
                    className={`flex-1 px-3 py-2 rounded-xl border text-[12.5px] font-semibold transition ${gatePassForm.passType === t ? "bg-[#29ABE2] border-[#29ABE2] text-white" : "bg-white border-slate-200 text-slate-600"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {gatePassForm.passType === "VISITOR" && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Holder Name</label>
                  <input type="text" value={gatePassForm.visitorName} onChange={(e) => setGatePassForm({ ...gatePassForm, visitorName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="Enter name" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                  <input type="text" value={gatePassForm.phone} onChange={(e) => setGatePassForm({ ...gatePassForm, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="Contact number" />
                </div>
              </>
            )}

            {gatePassForm.passType === "STUDENT" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student</label>
                <input
                  type="text"
                  onChange={(e) => { setGatePassForm((f) => ({ ...f, studentId: "", studentName: "" })); searchStudents(e.target.value); }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  placeholder="Type to search students"
                />
                {studentSearching ? (
                  <div className="flex items-center gap-2 text-slate-400 text-[12px] mt-2"><Loader2 className="h-3 w-3 animate-spin" /> Searching…</div>
                ) : studentResults.length > 0 ? (
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 max-h-40 overflow-y-auto thin-scroll">
                    {studentResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setGatePassForm((f) => ({ ...f, studentId: s.id, studentName: s.name })); setStudentResults([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition"
                      >
                        <div className="font-semibold text-slate-800 text-[12.5px]">{s.name}</div>
                        <div className="text-[11px] text-slate-500">{s.cls}-{s.section} · {s.admissionNo}</div>
                      </button>
                    ))}
                  </div>
                ) : null}
                {gatePassForm.studentId && gatePassForm.studentName && (
                  <p className="text-[12px] text-[#0c6a99] mt-1.5 font-semibold">✓ {gatePassForm.studentName}</p>
                )}
              </div>
            )}

            {gatePassForm.passType === "STAFF" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Member</label>
                <select value={gatePassForm.staffId} onChange={(e) => setGatePassForm({ ...gatePassForm, staffId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" required>
                  <option value="">Select staff member</option>
                  {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purpose</label>
              <input type="text" value={gatePassForm.purpose} onChange={(e) => setGatePassForm({ ...gatePassForm, purpose: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="Reason for gate pass" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Approval Status</label>
              <select value={gatePassForm.approvalStatus} onChange={(e) => setGatePassForm({ ...gatePassForm, approvalStatus: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
                <option value="APPROVED">Approved (active now)</option>
                <option value="PENDING">Pending approval</option>
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setGatePassOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={actionLoading === "gatepass"} className="bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">
                {actionLoading === "gatepass" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Issue Pass"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ QR VIEW DIALOG ============ */}
      <Dialog open={!!qrPass} onOpenChange={(o) => !o && setQrPass(null)}>
        <DialogContent className="max-w-sm bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {qrPass?.kiosk ? "Visitor Check-in QR" : "Gate Pass QR"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-slate-500">
              {qrPass?.kiosk
                ? "Point this at the front gate — visitors scan to self check-in."
                : "Gate staff scan this QR on exit to verify the pass."}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-3">
            <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200">
              {qrPass?.kiosk ? (
                schoolId && <QRCodeSVG value={checkInKioskUrl(schoolId)} size={190} level="M" />
              ) : (
                qrPass?.gatePass?.qrToken && <QRCodeSVG value={passQrUrl(qrPass.gatePass.qrToken)} size={190} level="M" />
              )}
            </div>
            {!qrPass?.kiosk && (
              <>
                <div className="font-mono text-[12px] text-slate-500 tracking-widest mt-3">{qrPass?.gatePass?.qrToken}</div>
                <div className="mt-2 text-[13px] text-slate-600 font-semibold">
                  {qrPass?.gatePass?.holderName || qrPass?.gatePass?.studentName || qrPass?.name}
                </div>
                <div className="text-[11.5px] text-slate-400">
                  {qrPass?.gatePass?.passType} · {purposeLabel(qrPass?.gatePass?.purpose)}
                  {qrPass?.gatePass?.validUntil ? ` · until ${fmtTime(qrPass.gatePass.validUntil)}` : ""}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setQrPass(null)} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ APPROVAL DIALOG ============ */}
      <Dialog open={!!approvalFor} onOpenChange={(o) => !o && setApprovalFor(null)}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Review Visitor</DialogTitle>
            <DialogDescription className="text-[12.5px] text-slate-500">
              {approvalFor?.name} · {purposeLabel(approvalFor?.purpose)}
              {approvalFor?.studentName ? ` · Student: ${approvalFor.studentName}` : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitApproval} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Decision</label>
              <div className="grid grid-cols-3 gap-2">
                {APPROVAL_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setApprovalForm({ ...approvalForm, decision: o.value })}
                    className={`px-3 py-2 rounded-xl border text-[12.5px] font-semibold transition ${approvalForm.decision === o.value
                      ? { APPROVED: "bg-emerald-500 border-emerald-500 text-white", REJECTED: "bg-rose-500 border-rose-500 text-white", WAIT: "bg-amber-500 border-amber-500 text-white" }[o.value]
                      : "bg-white border-slate-200 text-slate-600"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Note (Optional)</label>
              <textarea
                value={approvalForm.note}
                onChange={(e) => setApprovalForm({ ...approvalForm, note: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white resize-none"
                placeholder="e.g. Confirmed by phone with parent"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setApprovalFor(null)}>Cancel</Button>
              <Button type="submit" disabled={actionLoading === approvalFor?.id} className="bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">
                {actionLoading === approvalFor?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Decision"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ PICKUP DIALOG ============ */}
      <Dialog open={!!pickupFor} onOpenChange={(o) => !o && setPickupFor(null)}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Verify Student Pickup</DialogTitle>
            <DialogDescription className="text-[12.5px] text-slate-500">
              {pickupFor?.name} is picking up {pickupFor?.studentName || "a student"}. Confirm they are authorised.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitPickup} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Result</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ value: "VERIFIED", label: "Verified", tone: "emerald" }, { value: "UNAUTHORIZED", label: "Unauthorized", tone: "rose" }, { value: "MANUAL", label: "Ask Parent", tone: "amber" }].map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setPickupForm({ ...pickupForm, decision: o.value })}
                    className={`px-3 py-2 rounded-xl border text-[12.5px] font-semibold transition ${pickupForm.decision === o.value
                      ? { VERIFIED: "bg-emerald-500 border-emerald-500 text-white", UNAUTHORIZED: "bg-rose-500 border-rose-500 text-white", MANUAL: "bg-amber-500 border-amber-500 text-white" }[o.value]
                      : "bg-white border-slate-200 text-slate-600"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Note (Optional)</label>
              <textarea
                value={pickupForm.note}
                onChange={(e) => setPickupForm({ ...pickupForm, note: e.target.value })}
                rows="2"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white resize-none"
                placeholder="e.g. Confirmed with parent on phone"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setPickupFor(null)}>Cancel</Button>
              <Button type="submit" disabled={actionLoading === pickupFor?.id} className="bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">
                {actionLoading === pickupFor?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Result"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ GUARDIAN DIALOG ============ */}
      <Dialog open={guardianOpen} onOpenChange={setGuardianOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add Guardian to Pickup List</DialogTitle>
            <DialogDescription className="text-[12.5px] text-slate-500">
              Authorized guardians can pick up students without manual verification at the gate.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitGuardian} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student</label>
              <input
                type="text"
                value={guardianForm.search}
                onChange={(e) => { setGuardianForm((f) => ({ ...f, search: e.target.value, studentId: "" })); searchStudents(e.target.value); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                placeholder="Search student by name or admission no"
              />
              {studentSearching ? (
                <div className="flex items-center gap-2 text-slate-400 text-[12px] mt-2"><Loader2 className="h-3 w-3 animate-spin" /> Searching…</div>
              ) : studentResults.length > 0 ? (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 max-h-40 overflow-y-auto thin-scroll">
                  {studentResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setGuardianForm((f) => ({ ...f, studentId: s.id, search: `${s.name} (${s.admissionNo})` })); setStudentResults([]); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 transition"
                    >
                      <div className="font-semibold text-slate-800 text-[12.5px]">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.cls}-{s.section} · {s.admissionNo}</div>
                    </button>
                  ))}
                </div>
              ) : null}
              {guardianForm.studentId && <p className="text-[12px] text-[#0c6a99] mt-1.5 font-semibold">✓ Student selected</p>}
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Guardian Name</label>
              <input type="text" value={guardianForm.name} onChange={(e) => setGuardianForm({ ...guardianForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="e.g. Rajesh Sharma" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
                <input type="text" value={guardianForm.relationship} onChange={(e) => setGuardianForm({ ...guardianForm, relationship: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="e.g. Father" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input type="text" value={guardianForm.phone} onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" placeholder="Mobile number" />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={guardianForm.authorizedForPickup}
                onChange={(e) => setGuardianForm({ ...guardianForm, authorizedForPickup: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 accent-[#29ABE2]"
              />
              <span className="text-[13px] font-semibold text-slate-700">Authorized for pickup</span>
            </label>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setGuardianOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={actionLoading === "guardian"} className="bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">
                {actionLoading === "guardian" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Guardian"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ HOST MAPPING DIALOG ============ */}
      <Dialog open={hostMappingOpen} onOpenChange={setHostMappingOpen}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border-white/80 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Add Host Mapping</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateHostMapping} className="space-y-3 py-2 text-[13px]">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visit Type</label>
              <select value={hostMappingForm.visitType} onChange={(e) => setHostMappingForm({ ...hostMappingForm, visitType: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" required>
                <option value="">Select visit type</option>
                {PURPOSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Staff Member</label>
              <select value={hostMappingForm.staffId} onChange={(e) => setHostMappingForm({ ...hostMappingForm, staffId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" required>
                <option value="">Select staff member</option>
                {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setHostMappingOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#29ABE2] hover:bg-[#0c6a99] text-white font-semibold rounded-xl">Create Mapping</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}