// /api/lookup-forward.js - Phiên bản nâng cấp, hỗ trợ tra cứu chia tách
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  // GHI CHÚ THAY ĐỔI: Nhận thêm một tham số 'is_split' từ client
  // để biết đây có phải là trường hợp đặc biệt hay không.
  const { code, is_split } = request.query;

  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số mã xã cũ (code).' });
  }

  const oldWardCode = parseInt(code, 10);

  try {
    // === GHI CHÚ CỐT LÕI: Rẽ nhánh logic dựa trên cờ 'is_split' ===

    if (is_split === 'true') {
      // --- LUỒNG XỬ LÝ CHO TRƯỜNG HỢP CHIA TÁCH ---
      console.log(`API: Xử lý trường hợp chia tách cho mã ${oldWardCode}`);

      // 1. Lấy tất cả các phần đã được chia tách từ bảng split_details
      const { data: splitParts, error: splitError } = await supabase
        .from('split_details')
        .select('split_part_description, new_ward_code')
        .eq('old_ward_code', oldWardCode);

      if (splitError) throw splitError;
      if (!splitParts || splitParts.length === 0) {
        return response.status(404).json({ error: 'Không tìm thấy chi tiết chia tách cho mã này.' });
      }

      // 2. Lấy danh sách các mã xã mới không trùng lặp
      const newWardCodes = [...new Set(splitParts.map(part => part.new_ward_code))];

      // 3. Lấy thông tin chi tiết của các xã mới đó từ bảng full_vietnam
      const { data: newUnits, error: newUnitsError } = await supabase
        .from('full_vietnam')
        .select('new_ward_code, new_ward_name, new_ward_en_name, new_province_name, new_province_en_name, new_province_code')
        .in('new_ward_code', newWardCodes);

      if (newUnitsError) throw newUnitsError;

      // 4. Ghép nối thông tin lại để trả về cho client
      const splitResults = splitParts.map(part => {
        const correspondingNewUnit = newUnits.find(unit => unit.new_ward_code === part.new_ward_code);
        return {
          description: part.split_part_description,
          new_address: correspondingNewUnit || null
        };
      });

      // 5. Trả về đối tượng JSON có cấu trúc đặc biệt
      return response.status(200).json({
        changed: true,
        is_split_case: true,
        split_results: splitResults,
        history: [] // Trường hợp chia tách không cần lịch sử riêng
      });

    } else {
      // --- LUỒNG XỬ LÝ BÌNH THƯỜNG (kết hợp lịch sử) ---
      console.log(`API: Xử lý trường hợp thông thường cho mã ${oldWardCode}`);

      let finalOldWardCode = oldWardCode;
      let historyRecords = [];

      // 1. Kiểm tra lịch sử
      const { data: historyData, error: historyError } = await supabase
        .from('historical_changes')
        .select('*')
        .eq('original_ward_code', oldWardCode);

      if (historyError) console.error('Lỗi khi tra cứu lịch sử:', historyError);

      if (historyData && historyData.length > 0) {
        finalOldWardCode = historyData[0].intermediate_ward_code;
        historyRecords = historyData;
      }

      // 2. Tra cứu sáp nhập cuối cùng
      const { data: finalRecord, error: finalError } = await supabase
        .from('full_vietnam')
        .select('old_ward_code, old_district_code, old_province_code, new_ward_name, new_ward_en_name, new_ward_code, new_province_name, new_province_en_name, new_province_code')
        .eq('old_ward_code', finalOldWardCode)
        .limit(1);

      if (finalError) throw finalError;

      const result = finalRecord && finalRecord.length > 0 ? finalRecord[0] : null;

      if (!result) {
        return response.status(200).json({
          changed: historyRecords.length > 0,
          is_split_case: false,
          history: historyRecords
        });
      }

      // 3. Trả về kết quả tổng hợp
      return response.status(200).json({
        changed: true,
        is_split_case: false,
        ...result,
        history: historyRecords
      });
    }

  } catch (error) {
    console.error('Lỗi API Tra Cứu Xuôi:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}