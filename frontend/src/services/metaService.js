import api from './api';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Technical', slug: 'technical', icon: 'Code', description: 'Coding, hackathons, robotics, bootcamps' },
  { id: '2', name: 'Cultural', slug: 'cultural', icon: 'Music', description: 'Music, dance, drama, and campus celebrations' },
  { id: '3', name: 'Sports', slug: 'sports', icon: 'Trophy', description: 'Football, cricket, basketball, track & field' },
  { id: '4', name: 'Arts & Media', slug: 'arts', icon: 'Palette', description: 'Photography, sketching, graphic design' },
  { id: '5', name: 'Academic', slug: 'academic', icon: 'GraduationCap', description: 'Symposiums, paper presentations, guest lectures' },
  { id: '6', name: 'Competitions', slug: 'competitions', icon: 'Flame', description: 'Debates, quizzes, business pitches' },
  { id: '7', name: 'Workshop', slug: 'workshop', icon: 'Cpu', description: 'Hands-on skill building bootcamps' },
  { id: '8', name: 'Seminar', slug: 'seminar', icon: 'BookOpen', description: 'Distinguished lectures and research talks' }
];

export const DEFAULT_DEPARTMENTS = [
  { id: '1', name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Engineering' },
  { id: '2', name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
  { id: '3', name: 'Electronics & Telecommunication', code: 'EXTC', description: 'Department of Electronics and Telecommunication Engineering' },
  { id: '4', name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' },
  { id: '5', name: 'Biotechnology', code: 'BIOTECH', description: 'Department of Biotechnology' },
  { id: '6', name: 'Management & Business Studies', code: 'BMS', description: 'Department of Management Studies' },
  { id: '7', name: 'Civil Engineering', code: 'CIVIL', description: 'Department of Civil Engineering' },
  { id: '8', name: 'Electronics & Communication', code: 'ECE', description: 'Department of Electronics and Communication' }
];

// Helper to prevent any network call from hanging the UI
const withTimeout = (promise, ms = 2500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), ms))
  ]);
};

// Retrieve cached items from localStorage with strict validation
export const getCachedCategories = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('cems_cached_categories') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        const valid = parsed.filter(
          item => item && item.id && item.name && !item.name.toLowerCase().includes('select')
        );
        if (valid.length >= 3) return valid;
      }
      // If corrupted or partial cache exists, clean it up
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('cems_cached_categories');
      }
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_CATEGORIES;
};

export const getCachedDepartments = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('cems_cached_departments') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        const valid = parsed.filter(
          item =>
            item &&
            item.id &&
            item.name &&
            !item.name.toLowerCase().includes('select') &&
            !item.name.toLowerCase().includes('campus-wide')
        );
        if (valid.length >= 3) return valid;
      }
      // If corrupted or partial cache exists, clean it up
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('cems_cached_departments');
      }
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_DEPARTMENTS;
};

/**
 * Fetch event categories with multi-layer resilience:
 * 1. Express Backend REST API (with strict JSON validation and 2.5s timeout)
 * 2. Client-side Cloud Firestore direct query (with 2.5s timeout)
 * 3. LocalStorage cached categories
 * 4. Static default catalog (always guaranteed to return values)
 */
export const fetchCategories = async () => {
  // 1. Try Backend API
  try {
    const res = await withTimeout(api.get('/categories'), 2000);
    // Ensure response is not an HTML string from SPA rewrite
    if (res && typeof res === 'object') {
      const items = res?.categories || res?.data?.categories;
      if (Array.isArray(items) && items.length > 0) {
        const sorted = items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        localStorage.setItem('cems_cached_categories', JSON.stringify(sorted));
        return sorted;
      }
    }
  } catch (apiErr) {
    try {
      const resMeta = await withTimeout(api.get('/meta/categories'), 1500);
      if (resMeta && typeof resMeta === 'object') {
        const items = resMeta?.categories || resMeta?.data?.categories;
        if (Array.isArray(items) && items.length > 0) {
          const sorted = items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          localStorage.setItem('cems_cached_categories', JSON.stringify(sorted));
          return sorted;
        }
      }
    } catch (metaErr) {
      // Proceed to Firestore
    }
  }

  // 2. Try Direct Firestore
  try {
    const snapshot = await withTimeout(getDocs(collection(db, 'categories')), 2000);
    if (!snapshot.empty) {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      if (items.length > 0) {
        const sorted = items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        localStorage.setItem('cems_cached_categories', JSON.stringify(sorted));
        return sorted;
      }
    }
  } catch (firestoreErr) {
    // Fall back to cache or default
  }

  // 3. Fallback to LocalStorage or Predefined defaults
  const cached = getCachedCategories();
  return Array.isArray(cached) && cached.length > 0 ? cached : DEFAULT_CATEGORIES;
};

/**
 * Fetch academic departments with multi-layer resilience:
 * 1. Express Backend REST API (with strict JSON validation and 2.5s timeout)
 * 2. Client-side Cloud Firestore direct query (with 2.5s timeout)
 * 3. LocalStorage cached departments
 * 4. Static default catalog (always guaranteed to return values)
 */
export const fetchDepartments = async () => {
  // 1. Try Backend API
  try {
    const res = await withTimeout(api.get('/departments'), 2000);
    if (res && typeof res === 'object') {
      const items = res?.departments || res?.data?.departments;
      if (Array.isArray(items) && items.length >= 3) {
        const valid = items.filter(
          (d) =>
            d &&
            d.id &&
            d.name &&
            !d.name.toLowerCase().includes('select') &&
            !d.name.toLowerCase().includes('campus-wide')
        );
        if (valid.length >= 3) {
          const sorted = valid.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          localStorage.setItem('cems_cached_departments', JSON.stringify(sorted));
          return sorted;
        }
      }
    }
  } catch (apiErr) {
    try {
      const resMeta = await withTimeout(api.get('/meta/departments'), 1500);
      if (resMeta && typeof resMeta === 'object') {
        const items = resMeta?.departments || resMeta?.data?.departments;
        if (Array.isArray(items) && items.length >= 3) {
          const valid = items.filter(
            (d) =>
              d &&
              d.id &&
              d.name &&
              !d.name.toLowerCase().includes('select') &&
              !d.name.toLowerCase().includes('campus-wide')
          );
          if (valid.length >= 3) {
            const sorted = valid.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            localStorage.setItem('cems_cached_departments', JSON.stringify(sorted));
            return sorted;
          }
        }
      }
    } catch (metaErr) {
      // Proceed to Firestore
    }
  }

  // 2. Try Direct Firestore
  try {
    const snapshot = await withTimeout(getDocs(collection(db, 'departments')), 2000);
    if (!snapshot.empty) {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      if (items.length >= 3) {
        const valid = items.filter(
          (d) =>
            d &&
            d.id &&
            d.name &&
            !d.name.toLowerCase().includes('select') &&
            !d.name.toLowerCase().includes('campus-wide')
        );
        if (valid.length >= 3) {
          const sorted = valid.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          localStorage.setItem('cems_cached_departments', JSON.stringify(sorted));
          return sorted;
        }
      }
    }
  } catch (firestoreErr) {
    // Fall back to cache or default
  }

  // 3. Fallback to LocalStorage or Predefined defaults
  const cached = getCachedDepartments();
  return Array.isArray(cached) && cached.length >= 3 ? cached : DEFAULT_DEPARTMENTS;
};

/**
 * Fetch both categories and departments concurrently with guaranteed non-empty fallback
 */
export const fetchCategoriesAndDepartments = async () => {
  try {
    const [categories, departments] = await Promise.all([
      fetchCategories(),
      fetchDepartments()
    ]);
    return {
      categories: categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES,
      departments: departments && departments.length > 0 ? departments : DEFAULT_DEPARTMENTS
    };
  } catch (e) {
    return {
      categories: DEFAULT_CATEGORIES,
      departments: DEFAULT_DEPARTMENTS
    };
  }
};
