// /api/get-new-provinces.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  try {
    // Gọi hàm SQL đã được cập nhật, không cần tham số
    const { data, error } = await supabase.rpc('get_unique_new_provinces');

    if (error) {
      throw error;
    }

    // Trả về dữ liệu (sẽ chứa 3 cột: province_code, name, en_name)
    response.status(200).json(data);

  } catch (error) {
    console.error('Lỗi API get-new-provinces:', error);
    response.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách tỉnh.' });
  }
}