// /api/get-new-wards.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  const { province_code } = request.query;
  if (!province_code) {
    return response.status(400).json({ error: 'Thiếu tham số province_code.' });
  }

  try {
    // Gọi hàm SQL đã được cập nhật
    const { data, error } = await supabase.rpc('get_new_wards_by_province', {
      p_code: parseInt(province_code, 10)
    });

    if (error) {
      throw error;
    }

    // Trả về dữ liệu (sẽ chứa 3 cột: ward_code, name, en_name)
    response.status(200).json(data);

  } catch (error) {
    console.error('Lỗi API get-new-wards:', error);
    response.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách xã.' });
  }
}