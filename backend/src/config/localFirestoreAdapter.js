const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'firestore_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial In-Memory Seed Data
const getInitialSeedData = () => {
  return {
    departments: {
      '1': { id: '1', name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Engineering' },
      '2': { id: '2', name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
      '3': { id: '3', name: 'Electronics & Telecommunication', code: 'EXTC', description: 'Department of Electronics and Telecommunication Engineering' },
      '4': { id: '4', name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' },
      '5': { id: '5', name: 'Biotechnology', code: 'BIOTECH', description: 'Department of Biotechnology' },
      '6': { id: '6', name: 'Management & Business Studies', code: 'BMS', description: 'Department of Management Studies' }
    },
    categories: {
      '1': { id: '1', name: 'Technical', slug: 'technical', icon: 'Code', description: 'Coding, hackathons, robotics, bootcamps' },
      '2': { id: '2', name: 'Cultural', slug: 'cultural', icon: 'Music', description: 'Music, dance, drama, and campus celebrations' },
      '3': { id: '3', name: 'Sports', slug: 'sports', icon: 'Trophy', description: 'Football, cricket, basketball, track & field' },
      '4': { id: '4', name: 'Arts & Media', slug: 'arts', icon: 'Palette', description: 'Photography, sketching, graphic design' },
      '5': { id: '5', name: 'Academic', slug: 'academic', icon: 'GraduationCap', description: 'Symposiums, paper presentations, guest lectures' },
      '6': { id: '6', name: 'Competitions', slug: 'competitions', icon: 'Flame', description: 'Debates, quizzes, business pitches' }
    },
    users: {
      'admin-uid': {
        uid: 'admin-uid', id: 'admin-uid', email: 'admin@cems.edu', name: 'Dr. Rajesh Deshmukh (Admin)',
        role: 'admin', status: 'active', phone: '+91 9876543210', department_id: 1, department_name: 'Computer Science & Engineering',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        createdAt: new Date().toISOString()
      },
      'faculty-uid': {
        uid: 'faculty-uid', id: 'faculty-uid', email: 'faculty.cs@cems.edu', name: 'Dr. Priya Sharma',
        role: 'faculty', status: 'active', phone: '+91 9876543211', department_id: 1, department_name: 'Computer Science & Engineering',
        faculty_id: 'FAC-CS-101', designation: 'Associate Professor & HOD',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
        createdAt: new Date().toISOString()
      },
      'student-uid': {
        uid: 'student-uid', id: 'student-uid', email: 'student.alex@cems.edu', name: 'Alex Johnson',
        role: 'student', status: 'active', phone: '+91 9876543220', department_id: 1, department_name: 'Computer Science & Engineering',
        student_id: 'STU2023CSE045', year: '3rd Year',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
        createdAt: new Date().toISOString()
      }
    },
    events: {
      '1': {
        id: '1', title: 'CodeFest 2026: 24-Hour National Hackathon',
        description: 'A high-intensity 24-hour hackathon bringing together the sharpest minds to build AI, Web3, and Cloud solutions for real-world civic challenges. Cash prizes up to ₹1,50,000 + mentorship opportunities.',
        category_id: 1, category_name: 'Technical', category_slug: 'technical',
        department_id: 1, department_name: 'Computer Science & Engineering', department_code: 'CSE',
        organizer_id: 'faculty-uid', organizer_name: 'Dr. Priya Sharma',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200',
        date: '2026-10-15', start_time: '09:00 AM', end_time: '09:00 AM',
        venue: 'Main Campus Auditorium & Innovation Labs', room_number: 'Lab 301-304', building: 'APJ Abdul Kalam Block',
        max_participants: 200, seatsFilled: 124, seatsAvailable: 76, registered_count: 124,
        fee: 250, registration_fee: 250, is_paid: true,
        payment_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cems.fest@upi&pn=CodeFest2026&am=250',
        qr_code_image: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cems.fest@upi&pn=CodeFest2026&am=250',
        status: 'published', createdAt: '2026-09-01T09:00:00.000Z'
      },
      '2': {
        id: '2', title: 'RoboWars: Combat Robotics Championship',
        description: 'Prepare for mechanical carnage! Custom-built 15kg & 30kg combat bots battle in an armored bulletproof arena. Dual weapon systems, flippers, and spinners compete for the coveted Titan Cup.',
        category_id: 1, category_name: 'Technical', category_slug: 'technical',
        department_id: 4, department_name: 'Mechanical Engineering', department_code: 'MECH',
        organizer_id: 'faculty-uid', organizer_name: 'Dr. Priya Sharma',
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200',
        date: '2026-10-22', start_time: '10:00 AM', end_time: '05:30 PM',
        venue: 'University Open Ground Arena', room_number: 'Ground Arena', building: 'Mechanical Block Quadrangle',
        max_participants: 120, seatsFilled: 98, seatsAvailable: 22, registered_count: 98,
        fee: 500, registration_fee: 500, is_paid: true,
        status: 'published', createdAt: '2026-09-05T09:00:00.000Z'
      },
      '3': {
        id: '3', title: 'Tarang 2026: Annual Inter-College Cultural Fest',
        description: 'A 3-day extravaganza of music bands, western and folk dance battles, fashion parade, dramatic arts, and live celebrity star-night. The largest youth cultural festival in the state.',
        category_id: 2, category_name: 'Cultural', category_slug: 'cultural',
        department_id: 2, department_name: 'Information Technology', department_code: 'IT',
        organizer_id: 'faculty-uid', organizer_name: 'Dr. Priya Sharma',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200',
        date: '2026-11-05', start_time: '04:00 PM', end_time: '10:00 PM',
        venue: 'Central Amphitheater & Open Air Theater', room_number: 'Main Stage', building: 'Student Activity Center',
        max_participants: 500, seatsFilled: 412, seatsAvailable: 88, registered_count: 412,
        fee: 0, registration_fee: 0, is_paid: false,
        status: 'published', createdAt: '2026-09-10T09:00:00.000Z'
      },
      '4': {
        id: '4', title: 'Spardha 2026: Inter-University Sports Meet',
        description: 'Annual athletic championship featuring 100m/400m sprint, Football 7v7, Cricket T20, Volleyball, and Badminton singles and doubles. Medals, trophies, and university certificates.',
        category_id: 3, category_name: 'Sports', category_slug: 'sports',
        department_id: 4, department_name: 'Mechanical Engineering', department_code: 'MECH',
        organizer_id: 'faculty-uid', organizer_name: 'Dr. Priya Sharma',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200',
        date: '2026-10-28', start_time: '08:00 AM', end_time: '06:00 PM',
        venue: 'University Sports Complex', room_number: 'Stadium & Courts', building: 'Sports Directorate',
        max_participants: 350, seatsFilled: 220, seatsAvailable: 130, registered_count: 220,
        fee: 100, registration_fee: 100, is_paid: true,
        status: 'published', createdAt: '2026-09-01T09:00:00.000Z'
      }
    },
    registrations: {
      'reg-demo-1': {
        id: 'reg-demo-1',
        registrationId: 'CEMS-2026-X8K4P2Q9',
        registration_id: 'CEMS-2026-X8K4P2Q9',
        eventId: '1',
        event_id: '1',
        event_title: 'CodeFest 2026: 24-Hour National Hackathon',
        event_date: '2026-10-15',
        event_start_time: '09:00 AM',
        venue: 'Main Campus Auditorium & Innovation Labs',
        studentId: 'student-uid',
        student_id: 'student-uid',
        student_name: 'Alex Johnson',
        student_email: 'student.alex@cems.edu',
        status: 'confirmed',
        payment_status: 'verified',
        checkedIn: false,
        registeredAt: new Date().toISOString(),
        registered_at: new Date().toISOString()
      }
    },
    waitlist: {},
    payments: {},
    checkIns: {},
    feedbackForms: {},
    feedbackResponses: {},
    certificates: {},
    notifications: {
      'notif-1': {
        id: 'notif-1',
        userId: 'student-uid',
        title: 'Registration Confirmed',
        message: 'Your registration for CodeFest 2026 is confirmed! Check your pass for the entry QR code.',
        type: 'registrationSuccess',
        read: false,
        createdAt: new Date().toISOString()
      }
    }
  };
};

// Load or initialize state
let store = null;
try {
  if (fs.existsSync(DATA_FILE)) {
    store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } else {
    store = getInitialSeedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  }
} catch (e) {
  store = getInitialSeedData();
}

const saveStore = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch (e) {
    console.warn('Could not persist local store:', e.message);
  }
};

// Document Reference Representation
class LocalDocRef {
  constructor(collectionName, docId) {
    this.collectionName = collectionName;
    this.id = docId;
  }

  async get() {
    const col = store[this.collectionName] || {};
    const docData = col[this.id];
    return {
      exists: !!docData,
      id: this.id,
      data: () => (docData ? JSON.parse(JSON.stringify(docData)) : undefined)
    };
  }

  async set(data, options = {}) {
    if (!store[this.collectionName]) {
      store[this.collectionName] = {};
    }
    if (options.merge && store[this.collectionName][this.id]) {
      store[this.collectionName][this.id] = {
        ...store[this.collectionName][this.id],
        ...data,
        id: this.id
      };
    } else {
      store[this.collectionName][this.id] = {
        ...data,
        id: this.id
      };
    }
    saveStore();
    return { writeTime: new Date() };
  }

  async update(data) {
    if (!store[this.collectionName] || !store[this.collectionName][this.id]) {
      throw new Error(`Document ${this.id} does not exist in ${this.collectionName}`);
    }
    store[this.collectionName][this.id] = {
      ...store[this.collectionName][this.id],
      ...data,
      id: this.id
    };
    saveStore();
    return { writeTime: new Date() };
  }

  async delete() {
    if (store[this.collectionName] && store[this.collectionName][this.id]) {
      delete store[this.collectionName][this.id];
      saveStore();
    }
    return { writeTime: new Date() };
  }

  collection(subCollection) {
    return new LocalCollectionReference(`${this.collectionName}/${this.id}/${subCollection}`);
  }
}

// Query Representation
class LocalQuery {
  constructor(collectionName, filters = [], orderByFields = [], limitCount = null) {
    this.collectionName = collectionName;
    this.filters = filters;
    this.orderByFields = orderByFields;
    this.limitCount = limitCount;
  }

  where(field, op, val) {
    return new LocalQuery(
      this.collectionName,
      [...this.filters, { field, op, val }],
      this.orderByFields,
      this.limitCount
    );
  }

  orderBy(field, direction = 'asc') {
    return new LocalQuery(
      this.collectionName,
      this.filters,
      [...this.orderByFields, { field, direction }],
      this.limitCount
    );
  }

  limit(count) {
    return new LocalQuery(
      this.collectionName,
      this.filters,
      this.orderByFields,
      count
    );
  }

  async get() {
    const col = store[this.collectionName] || {};
    let docs = Object.entries(col).map(([id, data]) => ({
      id,
      ...data
    }));

    // Apply where filters
    for (const filter of this.filters) {
      docs = docs.filter((doc) => {
        const val = doc[filter.field];
        if (filter.op === '==') return val === filter.val;
        if (filter.op === '!=') return val !== filter.val;
        if (filter.op === '>') return val > filter.val;
        if (filter.op === '>=') return val >= filter.val;
        if (filter.op === '<') return val < filter.val;
        if (filter.op === '<=') return val <= filter.val;
        if (filter.op === 'in') return Array.isArray(filter.val) && filter.val.includes(val);
        if (filter.op === 'array-contains') return Array.isArray(val) && val.includes(filter.val);
        return true;
      });
    }

    // Apply sort
    for (const { field, direction } of this.orderByFields) {
      docs.sort((a, b) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (valA < valB) return direction === 'desc' ? 1 : -1;
        if (valA > valB) return direction === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      docs = docs.slice(0, this.limitCount);
    }

    const docObjects = docs.map((d) => ({
      id: d.id,
      exists: true,
      data: () => ({ ...d })
    }));

    return {
      empty: docObjects.length === 0,
      size: docObjects.length,
      docs: docObjects,
      forEach: (callback) => docObjects.forEach(callback)
    };
  }
}

// Collection Reference
class LocalCollectionReference extends LocalQuery {
  constructor(collectionName) {
    super(collectionName);
  }

  doc(id) {
    const docId = id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return new LocalDocRef(this.collectionName, docId);
  }

  async add(data) {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const docRef = this.doc(id);
    await docRef.set(data);
    return docRef;
  }
}

// Local Firestore Engine
const localDb = {
  collection: (name) => new LocalCollectionReference(name),
  doc: (pathStr) => {
    const parts = pathStr.split('/');
    if (parts.length === 2) {
      return new LocalDocRef(parts[0], parts[1]);
    }
    return new LocalDocRef(pathStr, 'root');
  },
  runTransaction: async (updateFunction) => {
    const transaction = {
      get: async (docRef) => docRef.get(),
      set: async (docRef, data, options) => docRef.set(data, options),
      update: async (docRef, data) => docRef.update(data),
      delete: async (docRef) => docRef.delete()
    };
    return updateFunction(transaction);
  },
  batch: () => {
    const operations = [];
    return {
      set: (docRef, data, options) => operations.push(() => docRef.set(data, options)),
      update: (docRef, data) => operations.push(() => docRef.update(data)),
      delete: (docRef) => operations.push(() => docRef.delete()),
      commit: async () => {
        for (const op of operations) {
          await op();
        }
      }
    };
  }
};

// Local Auth Engine
const localAuth = {
  verifyIdToken: async (token) => {
    try {
      // 1. Try to decode as JWT if standard token
      const decoded = jwt.decode(token);
      if (decoded && (decoded.user_id || decoded.sub || decoded.uid)) {
        const uid = decoded.user_id || decoded.sub || decoded.uid;
        const user = store.users[uid];
        return {
          uid,
          email: decoded.email || (user ? user.email : 'user@cems.edu'),
          role: decoded.role || (user ? user.role : 'student')
        };
      }
    } catch (e) {
      // Continue to demo token lookup
    }

    // 2. Fallback: match by demo emails/roles or return matched user
    if (token === 'admin-token' || token.includes('admin')) {
      return { uid: 'admin-uid', email: 'admin@cems.edu', role: 'admin' };
    }
    if (token === 'faculty-token' || token.includes('faculty')) {
      return { uid: 'faculty-uid', email: 'faculty.cs@cems.edu', role: 'faculty' };
    }
    // Default to student
    return { uid: 'student-uid', email: 'student.alex@cems.edu', role: 'student' };
  },
  setCustomUserClaims: async (uid, claims) => {
    if (store.users[uid]) {
      store.users[uid] = { ...store.users[uid], ...claims };
      saveStore();
    }
    return true;
  },
  deleteUser: async (uid) => {
    if (store.users[uid]) {
      delete store.users[uid];
      saveStore();
    }
    return true;
  }
};

const localFieldValues = {
  increment: (n) => n,
  serverTimestamp: () => new Date().toISOString(),
  arrayUnion: (...elements) => elements
};

module.exports = {
  localDb,
  localAuth,
  localFieldValues,
  store
};
