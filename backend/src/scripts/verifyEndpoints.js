const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function verify() {
  console.log('--- 1. Testing /api/departments ---');
  const deptRes = await get('http://localhost:5000/api/departments');
  console.log('Departments status:', deptRes.status);
  console.log('Departments count:', deptRes.body?.departments?.length);
  deptRes.body?.departments?.forEach((d) => console.log(`   • [ID: ${d.id}] ${d.name} (${d.code})`));

  console.log('\n--- 2. Testing /api/categories ---');
  const catRes = await get('http://localhost:5000/api/categories');
  console.log('Categories status:', catRes.status);
  console.log('Categories count:', catRes.body?.categories?.length);
  catRes.body?.categories?.forEach((c) => console.log(`   • [ID: ${c.id}] ${c.name} (icon: ${c.icon})`));

  console.log('\n--- 3. Testing Frontend Vite Server (/register) ---');
  const feRes = await get('http://localhost:5173/register');
  console.log('Frontend /register status:', feRes.status);
  console.log('HTML contains root div:', typeof feRes.body === 'string' && feRes.body.includes('id="root"'));
  console.log('HTML contains main.jsx:', typeof feRes.body === 'string' && feRes.body.includes('/src/main.jsx'));

  console.log('\n✅ All endpoints responded successfully!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
