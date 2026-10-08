import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Image as ImageIcon, Upload, Trash2, Plus, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';

const EventGalleryManager = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // 1. Fetch faculty events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events/my');
        if (res.success && res.events) {
          setEvents(res.events);
          if (!selectedEventId && res.events.length > 0) {
            setSelectedEventId(res.events[0].id.toString());
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  // 2. Fetch gallery images
  const fetchGallery = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await api.get(`/gallery/${selectedEventId}`);
      if (res.success) {
        setGalleryImages(res.images || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [selectedEventId]);

  // Handle Multi-file Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please choose at least one image file.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('event_id', selectedEventId);
      formData.append('caption', caption.trim());
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('images', selectedFiles[i]);
      }

      const res = await api.post('/gallery/upload', formData);

      if (res.success) {
        toast.success(res.message);
        setSelectedFiles([]);
        setCaption('');
        fetchGallery();
      }
    } catch (err) {
      toast.error(err.message || 'Error uploading gallery photos.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm('Delete this photo from the event gallery?')) return;

    try {
      const res = await api.delete(`/gallery/${id}`);
      if (res.success) {
        toast.success('Photo removed.');
        setGalleryImages((prev) => prev.filter((img) => img.id !== id));
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting photo.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
          Event Photo Gallery Manager
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Upload event photos and ceremony snapshots for students to view in the campus gallery.
        </p>
      </div>

      {/* Event Selector */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({new Date(e.date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* Upload Box */}
      <form onSubmit={handleUploadSubmit} className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-brand-500" />
          <span>Upload New Photos</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-slate-500">Choose Images (up to 10)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-slate-500">Optional Caption / Tag</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Winner Prize Distribution Ceremony"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || selectedFiles.length === 0}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading Images...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}</span>
        </button>
      </form>

      {/* Gallery Grid */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
          Event Photos ({galleryImages.length})
        </h3>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading gallery...</div>
        ) : galleryImages.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No gallery photos uploaded"
            description="Upload event highlights, winning teams, and keynote photos above."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="group relative h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <img
                  src={img.image_path}
                  alt={img.caption || 'Event snapshot'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                  <button
                    onClick={() => handleDeletePhoto(img.id)}
                    className="self-end p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 shadow"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[11px] text-white font-medium line-clamp-2">
                    {img.caption || 'Event highlight'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventGalleryManager;
