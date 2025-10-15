// /api/get-details.js
// LẤY ĐƯỢC TOÀN BỘ THÔNG TIN CỦA MỘT PHƯỜNG XÃ
// DỰA TRÊN MÃ PHƯỜNG XÃ VÀ LOẠI MÃ (mã cũ hoặc mã mới)
// YÊU CẦU THAM SỐ: code (mã phường xã), type (old hoặc new)
// QUICK-SCRIPT.JS ĐANG SỬ DỤNG API NÀY ĐỂ LẤY CHI TIẾT SỰ KIỆN SÁP NHẬP
// ==================================================================
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(request, response) {
  const { code, type } = request.query;
  if (!code || !type) {
    return response.status(400).json({ error: 'Thiếu tham số code hoặc type.' });
  }

  const wardCode = parseInt(code, 10);
  const lookupColumn = type === 'old' ? 'old_ward_code' : 'new_ward_code';

  try {
    const { data, error } = await supabase
      .from('merger_events')
      .select('*')
      .eq(lookupColumn, wardCode);
    if (error) throw error;
    response.status(200).json(data);
  } catch (error) {
    console.error('Lỗi API Get Details:', error);
    response.status(500).json({ error: 'Lỗi máy chủ khi lấy chi tiết.' });
  }
}