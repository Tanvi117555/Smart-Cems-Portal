const { db } = require('../config/firebase');

const seedLiveFirestore = async () => {
  console.log('🚀 Seeding live Cloud Firestore for Smart CEMS...');

  // 1. Departments
  const departments = [
    { id: '1', name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Engineering' },
    { id: '2', name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
    { id: '3', name: 'Electronics & Telecommunication', code: 'EXTC', description: 'Department of Electronics and Telecommunication Engineering' },
    { id: '4', name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical Engineering' },
    { id: '5', name: 'Biotechnology', code: 'BIOTECH', description: 'Department of Biotechnology' },
    { id: '6', name: 'Management & Business Studies', code: 'BMS', description: 'Department of Management Studies' }
  ];

  for (const dept of departments) {
    await db.collection('departments').doc(dept.id).set(dept, { merge: true });
  }
  console.log(`✅ Seeded ${departments.length} departments.`);

  // 2. Categories
  const categories = [
    { id: '1', name: 'Technical', slug: 'technical', icon: 'Code', description: 'Coding, hackathons, robotics, bootcamps' },
    { id: '2', name: 'Cultural', slug: 'cultural', icon: 'Music', description: 'Music, dance, drama, and campus celebrations' },
    { id: '3', name: 'Sports', slug: 'sports', icon: 'Trophy', description: 'Football, cricket, basketball, track & field' },
    { id: '4', name: 'Arts & Media', slug: 'arts', icon: 'Palette', description: 'Photography, sketching, graphic design' },
    { id: '5', name: 'Academic', slug: 'academic', icon: 'GraduationCap', description: 'Symposiums, paper presentations, guest lectures' },
    { id: '6', name: 'Competitions', slug: 'competitions', icon: 'Flame', description: 'Debates, quizzes, business pitches' }
  ];

  for (const cat of categories) {
    await db.collection('categories').doc(cat.id).set(cat, { merge: true });
  }
  console.log(`✅ Seeded ${categories.length} categories.`);

  // 3. Demo Users
  const users = [
    {
      uid: 'admin-cems-uid', id: 'admin-cems-uid', email: 'admin@cems.edu', name: 'Dr. Rajesh Deshmukh (Admin)',
      role: 'admin', status: 'active', phone: '+91 9876543210', department_id: 1, department_name: 'Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'faculty-cs-uid', id: 'faculty-cs-uid', email: 'faculty.cs@cems.edu', name: 'Dr. Priya Sharma',
      role: 'faculty', status: 'active', phone: '+91 9876543211', department_id: 1, department_name: 'Computer Science & Engineering',
      faculty_id: 'FAC-CS-101', designation: 'Associate Professor & HOD',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'student-alex-uid', id: 'student-alex-uid', email: 'student.alex@cems.edu', name: 'Alex Johnson',
      role: 'student', status: 'active', phone: '+91 9876543220', department_id: 1, department_name: 'Computer Science & Engineering',
      student_id: 'STU2023CSE045', year: '3rd Year',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      createdAt: new Date().toISOString()
    }
  ];

  for (const user of users) {
    await db.collection('users').doc(user.uid).set(user, { merge: true });
  }
  console.log(`✅ Seeded ${users.length} initial users.`);

  // 4. Events
  const events = [
    {
      id: '1', title: 'CodeFest 2026: 24-Hour National Hackathon',
      description: 'A high-intensity 24-hour hackathon bringing together the sharpest minds to build AI, Web3, and Cloud solutions for real-world civic challenges. Cash prizes up to ₹1,50,000 + mentorship opportunities.',
      category_id: 1, category_name: 'Technical', category_slug: 'technical',
      department_id: 1, department_name: 'Computer Science & Engineering', department_code: 'CSE',
      organizer_id: 'faculty-cs-uid', organizer_name: 'Dr. Priya Sharma',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200',
      date: '2026-10-15', start_time: '09:00 AM', end_time: '09:00 AM',
      venue: 'Main Campus Auditorium & Innovation Labs', room_number: 'Lab 301-304', building: 'APJ Abdul Kalam Block',
      max_participants: 200, seatsFilled: 124, seatsAvailable: 76, registered_count: 124,
      fee: 250, registration_fee: 250, is_paid: true,
      payment_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cems.fest@upi&pn=CodeFest2026&am=250',
      qr_code_image: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=cems.fest@upi&pn=CodeFest2026&am=250',
      status: 'published', createdAt: '2026-09-01T09:00:00.000Z'
    },
    {
      id: '2', title: 'RoboWars: Combat Robotics Championship',
      description: 'Prepare for mechanical carnage! Custom-built 15kg & 30kg combat bots battle in an armored bulletproof arena. Dual weapon systems, flippers, and spinners compete for the coveted Titan Cup.',
      category_id: 1, category_name: 'Technical', category_slug: 'technical',
      department_id: 4, department_name: 'Mechanical Engineering', department_code: 'MECH',
      organizer_id: 'faculty-cs-uid', organizer_name: 'Dr. Priya Sharma',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200',
      date: '2026-10-22', start_time: '10:00 AM', end_time: '05:30 PM',
      venue: 'University Open Ground Arena', room_number: 'Ground Arena', building: 'Mechanical Block Quadrangle',
      max_participants: 120, seatsFilled: 98, seatsAvailable: 22, registered_count: 98,
      fee: 500, registration_fee: 500, is_paid: true,
      status: 'published', createdAt: '2026-09-05T09:00:00.000Z'
    },
    {
      id: '3', title: 'Tarang 2026: Annual Inter-College Cultural Fest',
      description: 'A 3-day extravaganza of music bands, western and folk dance battles, fashion parade, dramatic arts, and live celebrity star-night. The largest youth cultural festival in the state.',
      category_id: 2, category_name: 'Cultural', category_slug: 'cultural',
      department_id: 2, department_name: 'Information Technology', department_code: 'IT',
      organizer_id: 'faculty-cs-uid', organizer_name: 'Dr. Priya Sharma',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200',
      date: '2026-11-05', start_time: '04:00 PM', end_time: '10:00 PM',
      venue: 'Central Amphitheater & Open Air Theater', room_number: 'Main Stage', building: 'Student Activity Center',
      max_participants: 500, seatsFilled: 412, seatsAvailable: 88, registered_count: 412,
      fee: 0, registration_fee: 0, is_paid: false,
      status: 'published', createdAt: '2026-09-10T09:00:00.000Z'
    },
    {
      id: '4', title: 'Spardha 2026: Inter-University Sports Meet',
      description: 'Annual athletic championship featuring 100m/400m sprint, Football 7v7, Cricket T20, Volleyball, and Badminton singles and doubles. Medals, trophies, and university certificates.',
      category_id: 3, category_name: 'Sports', category_slug: 'sports',
      department_id: 4, department_name: 'Mechanical Engineering', department_code: 'MECH',
      organizer_id: 'faculty-cs-uid', organizer_name: 'Dr. Priya Sharma',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200',
      date: '2026-10-28', start_time: '08:00 AM', end_time: '06:00 PM',
      venue: 'University Sports Complex', room_number: 'Stadium & Courts', building: 'Sports Directorate',
      max_participants: 350, seatsFilled: 220, seatsAvailable: 130, registered_count: 220,
      fee: 100, registration_fee: 100, is_paid: true,
      status: 'published', createdAt: '2026-09-01T09:00:00.000Z'
    }
  ];

  for (const ev of events) {
    await db.collection('events').doc(ev.id).set(ev, { merge: true });
  }
  console.log(`✅ Seeded ${events.length} initial campus events in Cloud Firestore.`);

  console.log('🎉 Firestore seeding finished successfully!');
  process.exit(0);
};

seedLiveFirestore().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
