import { POST as registerPOST } from '../app/api/auth/register/route';
import { GET as approveGET } from '../app/api/admin/users/approve/route';

async function main() {
  const testPhone = `+62899${Date.now().toString().slice(-6)}`;
  console.log('1. Mendaftarkan pengguna baru via /api/auth/register...');
  const regReq = new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Bambang Sudirman Pendaftar Baru',
      phoneNumber: testPhone,
    }),
  });

  const regRes = await registerPOST(regReq);
  const regData = await regRes.json();
  console.log('Hasil Pendaftaran:', regData.message);
  console.log('User ID:', regData.user.id, 'Approval Status:', regData.user.approval_status);

  console.log('\n2. Mengambil data dari /api/admin/users/approve...');
  const apprRes = await approveGET();
  const apprData = await apprRes.json();
  console.log('Total Pengguna:', apprData.stats.total);
  console.log('Total Menunggu Approval:', apprData.stats.pending);

  const foundInPending = apprData.pendingUsers.find((u: any) => u.phone_number === testPhone);
  const foundInAll = apprData.users.find((u: any) => u.phone_number === testPhone);

  if (foundInPending) {
    console.log('✓ BERHASIL: Pengguna baru ditemukan di antrean Menunggu Approval:');
    console.log('  Nama:', foundInPending.full_name);
    console.log('  Phone:', foundInPending.phone_number);
    console.log('  Status:', foundInPending.approval_status);
  } else {
    console.error('✗ GAGAL: Pengguna TIDAK ditemukan di pendingUsers');
  }

  if (foundInAll) {
    console.log('✓ BERHASIL: Pengguna baru ditemukan di daftar users:');
    console.log('  Nama:', foundInAll.full_name);
  }
}

main().catch(console.error);
