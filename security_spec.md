# Security Specification — SIP-PKKM 2026 Firestore Rules (Phase 0 TDD)

## 1. Data Invariants
1. Seluruh operasi baca/tulis pada koleksi `indicators`, `notifications`, dan `members` wajib berasal dari pengguna Google terautentikasi dengan `request.auth.token.email_verified == true`.
2. Administrator utama (`zaeymar@gmail.com`, terverifikasi) adalah Bootstrap Admin. Anggota tim lain hanya dapat mengakses jika terdaftar aktif di `/members/{email}` atau tercantum dalam `allowedEmails`.
3. `indicatorId` harus cocok dengan pola `^[a-zA-Z0-9_-]+$` (maksimal 32 karakter) dan `componentId` berada dalam rentang `1..4`.
4. `status` indikator hanya boleh bernilai `'belum'`, `'proses'`, atau `'disetorkan'`.
5. Setiap array (`checkedSubItems`, `targetUserIds`, `readBy`, `allowedEmails`) memiliki batas ukuran ketat (`<= 30` / `<= 25` / `<= 20`) untuk mencegah *Denial of Wallet*.
6. `updatedByUid` / `actorUid` / `addedByUid` pada setiap mutasi wajib sama dengan `request.auth.uid` (Identity Integrity), serta `serverUpdatedAt` / `serverCreatedAt` wajib sama dengan `request.time`.
7. Penghapusan koleksi `indicators` atau `notifications` diblokir di klien (hanya Admin jika diperlukan atau dikelola melalui update status).

## 2. The "Dirty Dozen" Attack Payloads (Wajib Ditolak `PERMISSION_DENIED`)
1. Unauthenticated read/write ke `/indicators/k1-1`.
2. Unverified email (`email_verified: false`) dengan email admin `zaeymar@gmail.com` menulis ke `/indicators/k1-1`.
3. Shadow field injection (`isSuperAdmin: true`) pada `create`/`update` di `/indicators/k1-1`.
4. Identity spoofing (`updatedByUid: "other-uid-123"`) pada update `/indicators/k1-1`.
5. Client timestamp spoofing (`serverUpdatedAt: "2020-01-01T00:00:00Z"`) yang bukan `request.time`.
6. Invalid ID path poisoning (`k1-1$$invalid/../../etc` atau ID > 128 karakter).
7. Oversized `catatan` (> 1000 chars) atau `lokasiBerkas` (> 500 chars) pada `/indicators/k1-1`.
8. Unbounded array (`checkedSubItems` dengan > 30 elemen) atau elemen non-int pada index 0.
9. Invalid `status` enum (`status: "hacked"`) pada `/indicators/k1-1`.
10. Non-admin mengubah `archived` atau menghapus dokumen `/indicators/k1-1`.
11. Non-admin membaca daftar PII `/members` (`list` pada `/members`).
12. Non-admin menyisipkan email dirinya ke `members/{email}` untuk eskalasi hak akses.
