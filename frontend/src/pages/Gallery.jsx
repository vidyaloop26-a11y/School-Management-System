import React, { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Images, Eye, Lock, Globe } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Public", icon: Globe, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "STAFF_ONLY", label: "Staff Only", icon: Eye, color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "PRIVATE", label: "Private", icon: Lock, color: "bg-rose-100 text-rose-700 border-rose-200" },
];

function VisibilityBadge({ visibility }) {
  const opt = VISIBILITY_OPTIONS.find((v) => v.value === visibility) || VISIBILITY_OPTIONS[0];
  const Icon = opt.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${opt.color}`}>
      <Icon className="h-3 w-3" /> {opt.label}
    </span>
  );
}

function CreateAlbumDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "", eventDate: "", visibility: "PUBLIC" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setLoading(true);
    try {
      await api.createAlbum(form);
      toast.success("Album created");
      setForm({ title: "", description: "", eventDate: "", visibility: "PUBLIC" });
      onOpenChange(false);
      onCreated();
    } catch {
      toast.error("Failed to create album");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Create Album</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Annual Day 2026"
              className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/40 focus:border-[#29ABE2]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the event..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/40 focus:border-[#29ABE2] resize-none"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Event Date</label>
            <input
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-[13.5px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/40 focus:border-[#29ABE2]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Visibility</label>
            <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl bg-[#29ABE2] hover:bg-[#2196c4] text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPhotoDialog({ open, onOpenChange, albumId, onAdded }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return toast.error("Image URL is required");
    setLoading(true);
    try {
      await api.addPhoto(albumId, { url: url.trim(), caption: caption.trim() });
      toast.success("Photo added");
      setUrl("");
      setCaption("");
      onOpenChange(false);
      onAdded();
    } catch {
      toast.error("Failed to add photo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Photo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Image URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/40 focus:border-[#29ABE2]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1">Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption..."
              className="w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#29ABE2]/40 focus:border-[#29ABE2]"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-xl bg-[#29ABE2] hover:bg-[#2196c4] text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Add Photo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({ open, onOpenChange, title, message, onConfirm, loading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-[13.5px] text-slate-600">{message}</p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlbumDetailView({ albumId, onBack }) {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addPhotoOpen, setAddPhotoOpen] = useState(false);
  const [confirmPhoto, setConfirmPhoto] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAlbum = async () => {
    setLoading(true);
    try {
      const res = await api.getAlbumById(albumId);
      setAlbum(res.album || null);
    } catch {
      setAlbum(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlbum(); }, [albumId]);

  const handleDeletePhoto = async () => {
    if (!confirmPhoto) return;
    setDeleting(true);
    try {
      await api.deletePhoto(confirmPhoto);
      toast.success("Photo deleted");
      setConfirmPhoto(null);
      fetchAlbum();
    } catch {
      toast.error("Failed to delete photo");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 border-2 border-[#29ABE2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="glass rounded-2xl p-5">
        <EmptyState icon={Images} title="Album not found" hint="This album may have been deleted." />
        <div className="text-center mt-4">
          <Button variant="ghost" onClick={onBack} className="rounded-xl text-[#29ABE2]">Back to Gallery</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl glass grid place-items-center text-slate-600 hover:text-slate-900 transition shrink-0"
        >
          &larr;
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[22px] sm:text-[28px] font-bold text-slate-900 truncate">{album.title}</h2>
          {album.description && <p className="text-[13px] text-slate-500 mt-0.5 truncate">{album.description}</p>}
        </div>
        <VisibilityBadge visibility={album.visibility} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-[12px] text-slate-500">
          {album.photos?.length || 0} photo{(album.photos?.length || 0) !== 1 ? "s" : ""}
          {album.eventDate && <> &middot; {new Date(album.eventDate).toLocaleDateString()}</>}
        </div>
        <Button onClick={() => setAddPhotoOpen(true)} className="rounded-xl bg-[#29ABE2] hover:bg-[#2196c4] text-white text-[13px] h-9">
          <Plus className="h-4 w-4 mr-1.5" /> Add Photo
        </Button>
      </div>

      {!album.photos || album.photos.length === 0 ? (
        <div className="glass rounded-2xl p-5">
          <EmptyState icon={Images} title="No photos yet" hint="Add photos to this album using the button above." />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {album.photos.map((photo) => (
            <div key={photo.id} className="group relative glass rounded-2xl overflow-hidden aspect-square">
              {photo.url ? (
                <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sky-100 to-blue-50 flex items-center justify-center">
                  <Images className="h-8 w-8 text-sky-300" />
                </div>
              )}
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-6">
                  <p className="text-white text-[11.5px] font-medium truncate">{photo.caption}</p>
                </div>
              )}
              <button
                onClick={() => setConfirmPhoto(photo.id)}
                className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-white/90 backdrop-blur grid place-items-center text-slate-500 hover:text-rose-500 hover:bg-white transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddPhotoDialog open={addPhotoOpen} onOpenChange={setAddPhotoOpen} albumId={albumId} onAdded={fetchAlbum} />
      <ConfirmDialog
        open={!!confirmPhoto}
        onOpenChange={() => setConfirmPhoto(null)}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        onConfirm={handleDeletePhoto}
        loading={deleting}
      />
    </div>
  );
}

export default function Gallery() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [confirmAlbum, setConfirmAlbum] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await api.getAlbums();
      setAlbums(res.albums || []);
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlbums(); }, []);

  const handleDeleteAlbum = async () => {
    if (!confirmAlbum) return;
    setDeleting(true);
    try {
      await api.deleteAlbum(confirmAlbum);
      toast.success("Album deleted");
      setConfirmAlbum(null);
      if (selectedAlbum === confirmAlbum) setSelectedAlbum(null);
      fetchAlbums();
    } catch {
      toast.error("Failed to delete album");
    } finally {
      setDeleting(false);
    }
  };

  if (selectedAlbum) {
    return (
      <div data-testid="gallery-page" className="max-w-[1400px] mx-auto">
        <AlbumDetailView albumId={selectedAlbum} onBack={() => setSelectedAlbum(null)} />
      </div>
    );
  }

  return (
    <div data-testid="gallery-page" className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="MEDIA"
        title="Photo Gallery"
        subtitle="Browse and manage school event photos and albums."
        right={
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl bg-[#29ABE2] hover:bg-[#2196c4] text-white text-[13px] h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New Album
          </Button>
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5 reveal">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 border-2 border-[#29ABE2] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : albums.length === 0 ? (
          <EmptyState
            icon={Images}
            title="No albums yet"
            hint="Create your first album to start organizing school event photos."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                className="group glass rounded-2xl overflow-hidden hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedAlbum(album.id)}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-sky-100 to-blue-50 relative flex items-center justify-center">
                  <Images className="h-10 w-10 text-sky-300" />
                  <div className="absolute top-2.5 left-2.5">
                    <VisibilityBadge visibility={album.visibility} />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmAlbum(album.id); }}
                    className="absolute top-2.5 right-2.5 h-7 w-7 rounded-lg bg-white/90 backdrop-blur grid place-items-center text-slate-500 hover:text-rose-500 hover:bg-white transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-3.5">
                  <h3 className="font-display font-semibold text-[14px] text-slate-800 truncate">{album.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-[11.5px] text-slate-500">
                    <span>{album.photoCount ?? album.photos?.length ?? 0} photos</span>
                    {album.eventDate && (
                      <>
                        <span>&middot;</span>
                        <span>{new Date(album.eventDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateAlbumDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchAlbums} />
      <ConfirmDialog
        open={!!confirmAlbum}
        onOpenChange={() => setConfirmAlbum(null)}
        title="Delete Album"
        message="Are you sure you want to delete this album and all its photos? This action cannot be undone."
        onConfirm={handleDeleteAlbum}
        loading={deleting}
      />
    </div>
  );
}
