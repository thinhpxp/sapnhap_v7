// /api/lookup-reverse.js - Phiên bản nâng cấp, hỗ trợ tra cứu lịch sử chia tách ngược
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
    // === BƯỚC 1: Lấy danh sách các đơn vị cũ trực tiếp từ bảng sáp nhập chính ===
    const { data: directOldUnits, error: directError } = await supabase
      .from('full_vietnam')
      .select('*') // Lấy tất cả các cột để có đủ thông tin
      .eq('new_ward_code', newWardCode);

    if (directError) throw directError;
    if (!directOldUnits || directOldUnits.length === 0) {
        return response.status(200).json([]);
    }

    // === BƯỚC 2: Kiểm tra xem có đơn vị cũ nào là một phần của một sự kiện chia tách không ===
    // Lấy mã của các đơn vị cũ tìm được
    const oldWardCodesFound = directOldUnits.map(unit => unit.old_ward_code);

    // Truy vấn vào bảng split_details để tìm xem có bản ghi nào chứa các mã này không
    const { data: splitContextRecords, error: splitContextError } = await supabase
      .from('split_details')
      .select('*')
      .in('old_ward_code', oldWardCodesFound);

    if (splitContextError) throw splitContextError;

    // === BƯỚC 3: Ghép nối dữ liệu và trả về kết quả đã được làm giàu ===
    const finalResults = directOldUnits.map(unit => {
        // Tìm bối cảnh chia tách tương ứng cho đơn vị cũ này
        const splitContext = splitContextRecords.find(s => s.old_ward_code === unit.old_ward_code);

        return {
            ...unit, // Giữ lại tất cả thông tin của đơn vị cũ
            split_context: splitContext || null // Thêm trường split_context (hoặc null nếu không có)
        };
    });

    response.status(200).json(finalResults);

  } catch (error) {
    console.error('Lỗi API Tra Cứu Ngược:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}