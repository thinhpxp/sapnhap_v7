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

  const initialOldWardCode = parseInt(code, 10);
  let finalOldWardCode = initialOldWardCode; // Mã sẽ dùng để tra cứu trong bảng full_vietnam
  let historyRecords = []; // Mảng để lưu trữ lịch sử

  try {
   // === GHI CHÚ THAY ĐỔI: BƯỚC 1 - KIỂM TRA LỊCH SỬ ===
    // Truy vấn vào bảng historical_changes để xem mã ban đầu có lịch sử không.
    const { data: historyData, error: historyError } = await supabase
      .from('historical_changes')
      .select('*')
      .eq('original_ward_code', initialOldWardCode);

    if (historyError) {
      // Nếu có lỗi ở đây, vẫn tiếp tục nhưng ghi lại lỗi
      console.error('Lỗi khi tra cứu lịch sử:', historyError);
    }

    // Nếu tìm thấy lịch sử
    if (historyData && historyData.length > 0) {
        console.log(`Tìm thấy ${historyData.length} bản ghi lịch sử cho mã ${initialOldWardCode}.`);
        // Gán lại mã tra cứu cuối cùng bằng mã trung gian
        // Giả sử chỉ lấy bản ghi lịch sử đầu tiên nếu có nhiều
        finalOldWardCode = historyData[0].intermediate_ward_code;
        historyRecords = historyData; // Lưu lại toàn bộ lịch sử để trả về
    }

    // === GHI CHÚ: BƯỚC 2 - TRA CỨU SÁP NHẬP CUỐI CÙNG ===
    // Sử dụng finalOldWardCode (có thể là mã gốc hoặc mã trung gian)
    const { data: finalRecord, error: finalError } = await supabase
      .from('full_vietnam')
      .select(`
        old_ward_code, old_district_code, old_province_code,
        new_ward_name, new_ward_en_name, new_ward_code,
        new_province_name, new_province_en_name, new_province_code
      `)
      .eq('old_ward_code', finalOldWardCode)
      .limit(1);

    if (finalError) throw finalError;

    const result = finalRecord && finalRecord.length > 0 ? finalRecord[0] : null;

    if (!result) {
      // Không tìm thấy sáp nhập cuối cùng -> địa chỉ không đổi
      // Nhưng vẫn có thể có lịch sử thay đổi trước đó
      return response.status(200).json({
        changed: historyRecords.length > 0, // 'changed' là true nếu có lịch sử
        history: historyRecords
      });
    }

    // === GHI CHÚ: BƯỚC 3 - TRẢ VỀ KẾT QUẢ TỔNG HỢP ===
    // Trả về kết quả cuối cùng KÈM THEO lịch sử (nếu có)
    response.status(200).json({
      changed: true,
      ...result,
      history: historyRecords
    });

  } catch (error) {
    console.error('Lỗi API Tra Cứu Xuôi:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}