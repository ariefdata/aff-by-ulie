#!/bin/bash
echo "🚀 Pre-Deployment Check..."
npm run build
if [ $? -eq 0 ]; then
  echo "✅ Build Success. Ready to go live!"
  echo "Langkah selanjutnya: Link ke Vercel dan push kode Anda."
else
  echo "❌ Build Failed. Cek konfigurasi kembali."
  exit 1
fi
