// /api/lookup.js
// TÍCH HỢP TRA CỨU XUÔI VÀ NGƯỢC TRONG MỘT API
// YÊU CẦU THAM SỐ: code (mã phường xã), type (forward hoặc reverse)
// ==================================================================
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client một lần duy nhất
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  // Cho phép CORS và cache
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  // GHI CHÚ QUAN TRỌNG: Lấy cả 'code' và 'type' từ query
  const { code, type } = request.query;

  // --- VALIDATION ---
  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số code.' });
  }
  if (type !== 'forward' && type !== 'reverse') {
    return response.status(400).json({ error: "Tham số 'type' phải là 'forward' hoặc 'reverse'." });
  }

  try {
    const wardCode = parseInt(code, 10);

    // GHI CHÚ CỐT LÕI: Dựa vào 'type' để xác định cột cần truy vấn
    const queryColumn = type === 'forward' ? 'old_ward_code' : 'new_ward_code';

    const { data, error } = await supabase
      .from('merger_events')
      .select('*')
      .eq(queryColumn, wardCode);

    if (error) throw error;

    return response.status(200).json(data);

  } catch (error) {
    console.error(`Lỗi API lookup (type: ${type}):`, error);
    return response.status(500).json({ error: 'Lỗi máy chủ.' });
  }
}