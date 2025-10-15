// /api/new-geo-data.js
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client một lần duy nhất
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  // Cho phép CORS và thiết lập cache
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache trong 1 ngày

  // GHI CHÚ QUAN TRỌNG: Lấy province_code từ query
  const { province_code } = request.query;

  try {
    // GHI CHÚ CỐT LÕI: Phân luồng logic dựa trên sự tồn tại của province_code
    if (province_code) {
      // --- LOGIC CŨ TỪ get-new-wards.js ---
      // Nếu có province_code, gọi RPC để lấy danh sách xã/phường
      const { data, error } = await supabase.rpc('get_new_wards_by_province', {
        p_code: parseInt(province_code, 10)
      });

      if (error) throw error;
      return response.status(200).json(data);

    } else {
      // --- LOGIC CŨ TỪ get-new-provinces.js ---
      // Nếu không có province_code, gọi RPC để lấy danh sách tỉnh/thành
      const { data, error } = await supabase.rpc('get_unique_new_provinces');

      if (error) throw error;
      return response.status(200).json(data);
    }
  } catch (error) {
    console.error('Lỗi API new-geo-data:', error);
    return response.status(500).json({ error: 'Lỗi máy chủ.' });
  }
}