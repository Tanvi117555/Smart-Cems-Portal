const { auth, db } = require('../config/firebase');

const demoUsers = [
  {
    email: 'admin@cems.edu',
    password: 'Admin@123',
    displayName: 'Dr. Rajesh Deshmukh (Admin)',
    role: 'admin',
    department_id: 1,
    department_name: 'Computer Science & Engineering',
    phone: '+91 9876543210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
  },
  {
    email: 'faculty.cs@cems.edu',
    password: 'Faculty@123',
    displayName: 'Dr. Priya Sharma',
    role: 'faculty',
    department_id: 1,
    department_name: 'Computer Science & Engineering',
    faculty_id: 'FAC-CS-101',
    designation: 'Associate Professor & HOD',
    phone: '+91 9876543211',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'
  },
  {
    email: 'student.alex@cems.edu',
    password: 'Student@123',
    displayName: 'Alex Johnson',
    role: 'student',
    department_id: 1,
    department_name: 'Computer Science & Engineering',
    student_id: 'STU2023CSE045',
    year: '3rd Year',
    phone: '+91 9876543220',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300'
  }
];

async function createDemoUsers() {
  console.log('🔐 Provisioning demo users into Firebase Authentication...');

  for (const u of demoUsers) {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(u.email);
      console.log(`ℹ️ User ${u.email} already exists (UID: ${userRecord.uid}). Updating password and claims...`);
      await auth.updateUser(userRecord.uid, {
        password: u.password,
        displayName: u.displayName
      });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.displayName,
          emailVerified: true
        });
        console.log(`✅ Created user ${u.email} in Firebase Auth (UID: ${userRecord.uid})`);
      } else {
        throw err;
      }
    }

    // Set Custom Claims (Role)
    await auth.setCustomUserClaims(userRecord.uid, { role: u.role });
    console.log(`🎖️ Set custom claim role='${u.role}' for ${u.email}`);

    // Create/Update Firestore document under users/{uid}
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      id: userRecord.uid,
      email: u.email,
      name: u.displayName,
      role: u.role,
      status: 'active',
      phone: u.phone,
      avatar: u.avatar,
      department_id: u.department_id,
      department_name: u.department_name,
      ...(u.student_id && { student_id: u.student_id, year: u.year }),
      ...(u.faculty_id && { faculty_id: u.faculty_id, designation: u.designation }),
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log(`📄 Synced profile doc in Firestore users/${userRecord.uid}`);
  }

  console.log('\n🎉 ALL DEMO ACCOUNTS CREATED IN LIVE FIREBASE AUTHENTICATION!');
  process.exit(0);
}

createDemoUsers().catch((err) => {
  console.error('❌ Error creating demo users:', err);
  process.exit(1);
});
