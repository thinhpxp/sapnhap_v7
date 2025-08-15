// /api/lookup-forward.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  const { code } = request.query;
  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số mã xã cũ (code).' });
  }

  const oldWardCode = parseInt(code, 10);

  try {
    // === THAY ĐỔI LỚN: Không dùng .maybeSingle() nữa ===
    // Lấy về một mảng kết quả và chỉ giới hạn ở kết quả đầu tiên tìm thấy.
    const { data, error } = await supabase
      .from('full_vietnam')
      .select(`
        old_ward_code,
        old_district_code,
        old_province_code,
        new_ward_name,
        new_ward_code,
        new_province_name,
        new_province_code
      `)
      .eq('old_ward_code', oldWardCode)
      .limit(1); // Giới hạn chỉ lấy 1 bản ghi để đảm bảo hiệu năng

    if (error) throw error;

    // Kiểm tra xem mảng data có phần tử nào không
    const record = data && data.length > 0 ? data[0] : null;

    if (!record) {
      // Không tìm thấy, tức là địa chỉ không đổi
      return response.status(200).json({ changed: false });
    }

    // Trả về dữ liệu của bản ghi đầu tiên tìm thấy
    response.status(200).json({
      changed: true,
      old_ward_code: record.old_ward_code,
      old_district_code: record.old_district_code,
      old_province_code: record.old_province_code,
      new_ward_name: record.new_ward_name,
      new_ward_code: record.new_ward_code,
      new_province_name: record.new_province_name,
      new_province_code: record.new_province_code,
    });

  } catch (error) {
    console.error('Lỗi API Tra Cứu Xuôi:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}