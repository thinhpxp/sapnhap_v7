// /api/get-admin-centers.js
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Xử lý yêu cầu API để lấy danh sách các trung tâm hành chính.
 * @param {object} request - Đối tượng yêu cầu, chứa query parameters.
 * @param {object} response - Đối tượng phản hồi để gửi lại cho client.
 */
export default async function handler(request, response) {
  // Lấy mã xã mới từ tham số URL, ví dụ: /api/get-admin-centers?code=12345
  const { code } = request.query;

  // === BƯỚC 1: Xác thực đầu vào ===
  // Nếu không có mã code, trả về lỗi 400 (Bad Request)
  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số mã xã mới (code).' });
  }

  const newWardCode = parseInt(code, 10);
  // Nếu mã code không phải là một số hợp lệ, cũng trả về lỗi
  if (isNaN(newWardCode)) {
    return response.status(400).json({ error: 'Mã xã mới không hợp lệ.' });
  }

  try {
    // === BƯỚC 2: Truy vấn cơ sở dữ liệu ===
    // Truy vấn vào bảng 'admin_centers'
    const { data, error } = await supabase
      .from('admin_centers')
      .select('agency_type, address') // Chỉ lấy 2 cột cần thiết
      .eq('new_ward_code', newWardCode); // Lọc theo mã xã mới

    // Nếu có lỗi từ Supabase, ném lỗi để khối catch xử lý
    if (error) {
      console.error('Lỗi truy vấn Supabase trong get-admin-centers:', error);
      throw error;
    }

    // === BƯỚC 3: Trả về kết quả thành công ===
    // Trả về một mảng các đối tượng. Mảng này có thể rỗng nếu không tìm thấy địa chỉ nào.
    response.status(200).json(data);

  } catch (error) {
    // === BƯỚC 4: Xử lý lỗi chung ===
    // Ghi lại lỗi chi tiết trên server để debug
    console.error('Lỗi cuối cùng trong API get-admin-centers:', error);
    // Trả về một thông báo lỗi chung chung cho client
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ khi lấy địa chỉ trung tâm hành chính.' });
  }
}