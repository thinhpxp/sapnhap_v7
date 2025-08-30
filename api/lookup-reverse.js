// /api/lookup-reverse.js - Phiên bản cuối cùng, dựa trên schema chính xác
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  const { code } = request.query;
  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số mã xã mới (code).' });
  }

  const newWardCode = parseInt(code, 10);

  try {
    // === THAY ĐỔI CỐT LÕI: Sử dụng tên bảng và các cột chính xác ===
    const { data, error } = await supabase
      .from('full_vietnam') // Tên bảng chính xác
      .select(`
        old_ward_name,
        old_ward_code,
        old_district_name,
        old_district_code,
        old_province_name,
        old_province_code,
        new_ward_code,
        new_province_code
      `) // Lấy chính xác các cột cần thiết
      .eq('new_ward_code', newWardCode);

    if (error) {
      console.error('Lỗi truy vấn Supabase trong lookup-reverse:', error);
      throw error;
    }

    // Trả về dữ liệu cho client
    response.status(200).json(data);

  } catch (error) {
    console.error('Lỗi cuối cùng trong API Tra Cứu Ngược:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}