// /api/lookup-reverse.js - Phiên bản nâng cấp, hỗ trợ tra cứu lịch sử ngược
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
    // === GHI CHÚ: BƯỚC 1 - Lấy danh sách các đơn vị cũ trực tiếp ===
    const { data: directOldUnits, error: directError } = await supabase
      .from('full_vietnam')
      .select('*') // Lấy tất cả các cột để có đủ thông tin
      .eq('new_ward_code', newWardCode);

    if (directError) throw directError;
    if (!directOldUnits || directOldUnits.length === 0) {
        // Nếu không tìm thấy, trả về mảng rỗng
        return response.status(200).json([]);
    }

    // === GHI CHÚ: BƯỚC 2 - Tìm kiếm lịch sử cho từng đơn vị cũ ===
    // Lấy ra danh sách các mã cũ để truy vấn lịch sử
    const oldWardCodes = directOldUnits.map(unit => unit.old_ward_code);

    const { data: historyRecords, error: historyError } = await supabase
      .from('historical_changes')
      .select('*')
      .in('intermediate_ward_code', oldWardCodes); // Tìm tất cả lịch sử có liên quan

    if (historyError) {
        console.error("Lỗi khi tra cứu lịch sử ngược:", historyError);
        // Không làm sập API, chỉ trả về kết quả không có lịch sử
    }

    // === GHI CHÚ: BƯỚC 3 - Ghép nối dữ liệu lại ===
    const finalResults = directOldUnits.map(unit => {
        // Tìm xem đơn vị cũ này có lịch sử nào không
        const history = historyRecords ? historyRecords.find(h => h.intermediate_ward_code === unit.old_ward_code) : null;

        return {
            ...unit, // Giữ lại tất cả thông tin của đơn vị cũ (tên, mã code...)
            history: history || null // Thêm trường history (hoặc null nếu không có)
        };
    });

    response.status(200).json(finalResults);

  } catch (error) {
    console.error('Lỗi API Tra Cứu Ngược:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}