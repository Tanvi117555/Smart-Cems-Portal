const { db } = require('../config/firebase');

/**
 * Add / Record Gallery Images for Event
 */
const uploadGalleryImages = async (req, res) => {
  try {
    const event_id = req.body.event_id || req.body.eventId;
    const caption = req.body.caption || '';
    const imageUrl = req.body.imageUrl;
    const images = req.body.images || [];
    const userId = req.user.id;

    if (!event_id) {
      return res.status(400).json({ success: false, message: 'Event ID is required.' });
    }

    const eventRef = db.collection('events').doc(event_id);
    const eventDoc = await eventRef.get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const imageList = [];

    // Process files uploaded via multipart FormData (multer)
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fileUrl = `/uploads/${file.filename}`;
        imageList.push({ imageUrl: fileUrl, caption: caption || file.originalname });
      });
    }

    if (imageUrl) {
      imageList.push({ imageUrl, caption: caption || '' });
    }
    if (Array.isArray(images)) {
      images.forEach(img => {
        if (typeof img === 'string') {
          imageList.push({ imageUrl: img, caption: caption || '' });
        } else if (img && img.imageUrl) {
          imageList.push({ imageUrl: img.imageUrl, caption: img.caption || caption || '' });
        }
      });
    }

    if (imageList.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided for gallery upload.' });
    }

    const batch = db.batch();
    const created = [];
    const now = new Date().toISOString();

    for (const item of imageList) {
      const gRef = eventRef.collection('gallery').doc();
      const record = {
        eventId: event_id,
        image_path: item.imageUrl,
        imageUrl: item.imageUrl,
        caption: item.caption,
        uploaded_by: userId,
        uploader_name: req.user.name,
        created_at: now
      };
      batch.set(gRef, record);
      created.push({ id: gRef.id, ...record });
    }

    await batch.commit();

    return res.status(201).json({
      success: true,
      message: `Added ${created.length} image(s) to the event gallery.`,
      images: created
    });
  } catch (error) {
    console.error('UploadGalleryImages Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record gallery images.' });
  }
};

/**
 * Get Gallery Images for an Event
 */
const getEventGallery = async (req, res) => {
  try {
    const { eventId } = req.params;

    const snapshot = await db.collection('events').doc(eventId)
      .collection('gallery')
      .get();

    const images = [];
    snapshot.forEach(doc => {
      images.push({ id: doc.id, ...doc.data() });
    });

    images.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({ success: true, images });
  } catch (error) {
    console.error('GetEventGallery Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch event gallery.' });
  }
};

/**
 * Get Global Campus Event Gallery
 */
const getGlobalGallery = async (req, res) => {
  try {
    const eventsSnapshot = await db.collection('events').get();
    const allImages = [];

    for (const doc of eventsSnapshot.docs) {
      const gSnap = await doc.ref.collection('gallery').limit(5).get();
      gSnap.forEach(gDoc => {
        allImages.push({
          id: gDoc.id,
          event_title: doc.data().title,
          category_name: doc.data().category,
          ...gDoc.data()
        });
      });
    }

    allImages.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return res.json({ success: true, images: allImages.slice(0, 30) });
  } catch (error) {
    console.error('GetGlobalGallery Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch campus gallery.' });
  }
};

/**
 * Delete Gallery Image
 */
const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    let eventId = req.query.eventId || req.query.event_id;

    let targetDocRef = null;

    if (eventId) {
      const imgRef = db.collection('events').doc(eventId).collection('gallery').doc(id);
      const doc = await imgRef.get();
      if (doc.exists) {
        targetDocRef = imgRef;
      }
    } else {
      // Find across events
      const eventsSnap = await db.collection('events').get();
      for (const evDoc of eventsSnap.docs) {
        const potentialRef = evDoc.ref.collection('gallery').doc(id);
        const doc = await potentialRef.get();
        if (doc.exists) {
          targetDocRef = potentialRef;
          eventId = evDoc.id;
          break;
        }
      }
    }

    if (!targetDocRef) {
      return res.status(404).json({ success: false, message: 'Image not found in gallery.' });
    }

    const imgDoc = await targetDocRef.get();
    if (req.user.role !== 'admin' && imgDoc.data().uploaded_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this photo.' });
    }

    await targetDocRef.delete();

    return res.json({ success: true, message: 'Photo deleted from gallery.' });
  } catch (error) {
    console.error('DeleteGalleryImage Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete photo.' });
  }
};

module.exports = {
  uploadGalleryImages,
  getEventGallery,
  getGlobalGallery,
  deleteGalleryImage
};
