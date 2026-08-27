import React, { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, BookOpen, RotateCcw, AlertTriangle, Search } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import { useStudents } from "@/lib/queries";

const CATEGORIES = [
  "Fiction",
  "Non-Fiction",
  "Science",
  "Mathematics",
  "History",
  "Geography",
  "Literature",
  "Technology",
  "Reference",
  "Other",
];

const INITIAL_BOOK_FORM = {
  title: "",
  isbn: "",
  author: "",
  category: "Fiction",
  totalCopies: 1,
  location: "",
};

const INITIAL_ISSUE_FORM = {
  bookId: "",
  studentId: "",
  dueDate: "",
};

export default function Library() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const students = Array.isArray(studentsData) ? studentsData : [];

  const [showCreateBook, setShowCreateBook] = useState(false);
  const [showIssueBook, setShowIssueBook] = useState(false);
  const [bookForm, setBookForm] = useState(INITIAL_BOOK_FORM);
  const [issueForm, setIssueForm] = useState(INITIAL_ISSUE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [returningId, setReturningId] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.getBooks({ search, category: category === "all" ? undefined : category });
      setBooks(res?.books || []);
    } catch {
      toast.error("Failed to load library catalog");
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const res = await api.getLibraryIssues({ status: activeTab === "issues" ? undefined : undefined });
      setIssues(res?.issues || []);
    } catch {
      toast.error("Failed to load library issues");
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchIssues();
  }, [search, category, activeTab]);

  const totalBooks = books.reduce((sum, b) => sum + (b.totalCopies || 0), 0);
  const issuedCount = issues.filter((i) => i.status === "ISSUED").length;
  const overdueCount = issues.filter((i) => i.status === "OVERDUE").length;

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author) {
      toast.error("Title and Author are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.createBook(bookForm);
      toast.success(`Book "${bookForm.title}" added to catalog`);
      setShowCreateBook(false);
      setBookForm(INITIAL_BOOK_FORM);
      fetchBooks();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to create book");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    if (!issueForm.bookId || !issueForm.studentId || !issueForm.dueDate) {
      toast.error("Please select a book, student, and set a due date");
      return;
    }
    setSubmitting(true);
    try {
      await api.issueBook(issueForm);
      toast.success("Book issued successfully");
      setShowIssueBook(false);
      setIssueForm(INITIAL_ISSUE_FORM);
      fetchBooks();
      fetchIssues();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to issue book");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnBook = async (issue) => {
    setReturningId(issue.id);
    try {
      let fineAmount = 0;
      if (issue.status === "OVERDUE" && issue.dueDate) {
        const due = new Date(issue.dueDate);
        const now = new Date();
        const diffDays = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
        fineAmount = Math.max(0, diffDays * 5);
      }
      await api.returnBook(issue.id, { fineAmount });
      toast.success(
        fineAmount > 0
          ? `Book returned. Fine of ₹${fineAmount} collected.`
          : "Book returned successfully"
      );
      fetchBooks();
      fetchIssues();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to return book");
    } finally {
      setReturningId(null);
    }
  };

  const handleDeleteBook = async (id) => {
    try {
      await api.deleteBook(id);
      toast.success("Book removed from catalog");
      fetchBooks();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to delete book");
    }
  };

  const getStudentName = (id) => {
    const s = students.find((st) => st.id === id || st._id === id);
    return s?.name || "Unknown Student";
  };

  const getBookTitle = (id) => {
    const b = books.find((bk) => bk.id === id || bk._id === id);
    return b?.title || "Unknown Book";
  };

  return (
    <div data-testid="library-page" className="max-w-[1400px] mx-auto px-2 sm:px-4">
      <PageHeader
        eyebrow="ACADEMICS · LIBRARY"
        title="Library Management"
        subtitle="Manage book catalog, track issues, and handle returns."
        right={
          <button
            onClick={() => setShowCreateBook(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-4 py-2.5 text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Book
          </button>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div data-testid="lib-stat-total" className="glass rounded-2xl p-5 reveal">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <BookOpen className="h-3.5 w-3.5 text-[#29ABE2]" /> Total Books
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{totalBooks}</div>
          <div className="text-[12px] text-slate-500 mt-1">Across all categories</div>
        </div>
        <div data-testid="lib-stat-issued" className="glass rounded-2xl p-5 reveal d1">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <RotateCcw className="h-3.5 w-3.5 text-blue-600" /> Currently Issued
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{issuedCount}</div>
          <div className="text-[12px] text-slate-500 mt-1">Active book issues</div>
        </div>
        <div data-testid="lib-stat-overdue" className="glass rounded-2xl p-5 reveal d2">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] font-semibold text-slate-500 uppercase">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Overdue
          </div>
          <div className="font-display text-[36px] font-bold text-slate-900 mt-3 tracking-tight">{overdueCount}</div>
          <div className="text-[12px] text-slate-500 mt-1">Requires follow-up</div>
        </div>
      </div>

      {/* Main content */}
      <div className="glass rounded-2xl p-3 sm:p-5 reveal d3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          {/* Catalog Tab */}
          <TabsContent value="catalog" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2.5 shadow-xs flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
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
            ) : books.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No books in catalog"
                hint="Add your first book to get started with library management."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
                  <table className="min-w-full text-[13px]">
                    <thead className="bg-slate-50/80">
                      <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                        <th className="px-5 py-3 font-semibold">Title</th>
                        <th className="px-5 py-3 font-semibold">Author</th>
                        <th className="px-5 py-3 font-semibold">Category</th>
                        <th className="px-5 py-3 font-semibold text-center">Total</th>
                        <th className="px-5 py-3 font-semibold text-center">Available</th>
                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((b) => (
                        <tr key={b.id} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                          <td className="px-5 py-3.5 font-medium text-slate-800">{b.title}</td>
                          <td className="px-5 py-3.5 text-slate-600">{b.author}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0c6a99] border border-blue-100">
                              {b.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono font-semibold text-slate-700">{b.totalCopies}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                b.availableCopies > 0
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {b.availableCopies}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {b.availableCopies > 0 && (
                                <button
                                  onClick={() => {
                                    setIssueForm({ ...INITIAL_ISSUE_FORM, bookId: b.id });
                                    setShowIssueBook(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-3 py-1.5 text-[11px] font-semibold shadow-xs"
                                >
                                  <Plus className="h-3 w-3" /> Issue
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteBook(b.id)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 transition px-3 py-1.5 text-[11px] font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2.5">
                  {books.map((b) => (
                    <div key={b.id} className="glass-soft rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 text-[14.5px] truncate">{b.title}</div>
                          <div className="text-[12px] text-slate-500 mt-0.5">{b.author}</div>
                        </div>
                        <span
                          className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            b.availableCopies > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {b.availableCopies}/{b.totalCopies}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100/80">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0c6a99] border border-blue-100">
                          {b.category}
                        </span>
                        <div className="flex items-center gap-2">
                          {b.availableCopies > 0 && (
                            <button
                              onClick={() => {
                                setIssueForm({ ...INITIAL_ISSUE_FORM, bookId: b.id });
                                setShowIssueBook(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1] transition text-white px-3 py-1.5 text-[11px] font-semibold"
                            >
                              <Plus className="h-3 w-3" /> Issue
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBook(b.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-rose-300 hover:text-rose-600 transition px-3 py-1.5 text-[11px] font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <div className="flex items-center gap-2 text-[11px] tracking-[0.14em] font-semibold text-slate-500 uppercase">
              <RotateCcw className="h-3.5 w-3.5 text-[#29ABE2]" /> Active Issues
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 text-[#29ABE2] animate-spin" />
              </div>
            ) : issues.length === 0 ? (
              <EmptyState
                icon={RotateCcw}
                title="No active issues"
                hint="All books are in the library. Issue a book from the catalog tab."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-hidden rounded-xl border border-slate-100 bg-white/60">
                  <table className="min-w-full text-[13px]">
                    <thead className="bg-slate-50/80">
                      <tr className="text-left text-[11px] tracking-[0.14em] text-slate-500 uppercase">
                        <th className="px-5 py-3 font-semibold">Book</th>
                        <th className="px-5 py-3 font-semibold">Student</th>
                        <th className="px-5 py-3 font-semibold">Issued On</th>
                        <th className="px-5 py-3 font-semibold">Due Date</th>
                        <th className="px-5 py-3 font-semibold text-center">Status</th>
                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((iss) => (
                        <tr key={iss.id} className="border-t border-slate-100 hover:bg-[#f3faff] transition">
                          <td className="px-5 py-3.5 font-medium text-slate-800">{getBookTitle(iss.bookId)}</td>
                          <td className="px-5 py-3.5 text-slate-600">{getStudentName(iss.studentId)}</td>
                          <td className="px-5 py-3.5 text-slate-500 text-[12px]">
                            {iss.issueDate ? new Date(iss.issueDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-[12px]">
                            {iss.dueDate ? new Date(iss.dueDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                iss.status === "ISSUED"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : iss.status === "RETURNED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {iss.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {iss.status !== "RETURNED" && (
                              <button
                                disabled={returningId === iss.id}
                                onClick={() => handleReturnBook(iss)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-emerald-300 hover:text-emerald-600 transition px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50"
                              >
                                {returningId === iss.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                                Return
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2.5">
                  {issues.map((iss) => (
                    <div key={iss.id} className="glass-soft rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 text-[14.5px] truncate">
                            {getBookTitle(iss.bookId)}
                          </div>
                          <div className="text-[12px] text-slate-500 mt-0.5">{getStudentName(iss.studentId)}</div>
                        </div>
                        <span
                          className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            iss.status === "ISSUED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : iss.status === "RETURNED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {iss.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100/80">
                        <div className="text-[11px] text-slate-500">
                          Due: {iss.dueDate ? new Date(iss.dueDate).toLocaleDateString() : "—"}
                        </div>
                        {iss.status !== "RETURNED" && (
                          <button
                            disabled={returningId === iss.id}
                            onClick={() => handleReturnBook(iss)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:border-emerald-300 hover:text-emerald-600 transition px-3 py-1.5 text-[11px] font-semibold disabled:opacity-50"
                          >
                            {returningId === iss.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Return
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Book Dialog */}
      <Dialog open={showCreateBook} onOpenChange={setShowCreateBook}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Add New Book</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBook} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Title *</label>
              <input
                type="text"
                required
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                placeholder="Enter book title"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">ISBN</label>
              <input
                type="text"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                placeholder="e.g. 978-3-16-148410-0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Author *</label>
              <input
                type="text"
                required
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                placeholder="Enter author name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Category</label>
                <Select value={bookForm.category} onValueChange={(v) => setBookForm({ ...bookForm, category: v })}>
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
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Total Copies</label>
                <input
                  type="number"
                  min="1"
                  value={bookForm.totalCopies}
                  onChange={(e) => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono outline-none focus:border-[#29ABE2]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Location</label>
              <input
                type="text"
                value={bookForm.location}
                onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })}
                placeholder="e.g. Shelf A-3, Row 2"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateBook(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Add Book
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog open={showIssueBook} onOpenChange={setShowIssueBook}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px]">Issue Book</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIssueBook} className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Select Book *</label>
              <Select
                value={issueForm.bookId}
                onValueChange={(v) => setIssueForm({ ...issueForm, bookId: v })}
              >
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder="Choose a book" />
                </SelectTrigger>
                <SelectContent>
                  {books
                    .filter((b) => b.availableCopies > 0)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.title} ({b.availableCopies} available)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Select Student *</label>
              <Select
                value={issueForm.studentId}
                onValueChange={(v) => setIssueForm({ ...issueForm, studentId: v })}
                disabled={studentsLoading}
              >
                <SelectTrigger className="w-full rounded-xl bg-white text-xs">
                  <SelectValue placeholder={studentsLoading ? "Loading students..." : "Choose a student"} />
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
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={issueForm.dueDate}
                onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#29ABE2]"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowIssueBook(false)} className="rounded-full">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-full bg-[#29ABE2] hover:bg-[#0e7fb1]">
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Issue Book
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
