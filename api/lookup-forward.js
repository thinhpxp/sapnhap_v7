// /api/lookup-forward.js - Phiên bản cuối cùng, xử lý tự tham chiếu trong trường hợp chia tách
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  const { code, is_split } = request.query;

  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số mã xã cũ (code).' });
  }

  const oldWardCode = parseInt(code, 10);

  try {
    if (is_split === 'true') {
      // --- LUỒNG XỬ LÝ CHO TRƯỜNG HỢP CHIA TÁCH ---
      console.log(`API: Xử lý trường hợp chia tách cho mã ${oldWardCode}`);

      // GHI CHÚ THAY ĐỔI 1: Lấy thêm các cột tên từ split_details để làm dự phòng
      const { data: splitParts, error: splitError } = await supabase
        .from('split_details')
        .select('split_part_description, new_ward_code, new_ward_name, new_ward_en_name, new_province_name, new_province_en_name, new_province_code')
        .eq('old_ward_code', oldWardCode);

      if (splitError) throw splitError;
      if (!splitParts || splitParts.length === 0) {
        return response.status(404).json({ error: 'Không tìm thấy chi tiết chia tách cho mã này.' });
      }

      const newWardCodes = [...new Set(splitParts.map(part => part.new_ward_code))];

      const { data: newUnits, error: newUnitsError } = await supabase
        .from('full_vietnam')
        .select('new_ward_code, new_ward_name, new_ward_en_name, new_province_name, new_province_en_name, new_province_code')
        .in('new_ward_code', newWardCodes);

      if (newUnitsError) throw newUnitsError;

      // GHI CHÚ THAY ĐỔI 2: Logic ghép nối thông minh hơn
      const splitResults = splitParts.map(part => {
        // Ưu tiên tìm thông tin chi tiết trong bảng full_vietnam
        let correspondingNewUnit = newUnits.find(unit => unit.new_ward_code === part.new_ward_code);

        // LOGIC DỰ PHÒNG: Nếu không tìm thấy (trường hợp tự sáp nhập)
        // thì tự tạo đối tượng new_address từ chính thông tin có sẵn trong split_details.
        if (!correspondingNewUnit) {
            console.log(`Không tìm thấy mã ${part.new_ward_code} trong full_vietnam, sẽ tự tham chiếu từ split_details.`);
            correspondingNewUnit = {
                new_ward_code: part.new_ward_code,
                new_ward_name: part.new_ward_name,
                new_ward_en_name: part.new_ward_en_name,
                new_province_name: part.new_province_name,
                new_province_en_name: part.new_province_en_name,
                new_province_code: part.new_province_code
            };
        }

        return {
          description: part.split_part_description,
          new_address: correspondingNewUnit
        };
      });

      return response.status(200).json({
        changed: true,
        is_split_case: true,
        split_results: splitResults,
        history: []
      });

    } else {
      // --- LUỒNG XỬ LÝ BÌNH THƯỜNG (kết hợp lịch sử) ---
      // Logic này được giữ nguyên hoàn toàn so với phiên bản gốc của bạn
      console.log(`API: Xử lý trường hợp thông thường cho mã ${oldWardCode}`);
      let finalOldWardCode = oldWardCode;
      let historyRecords = [];
      const { data: historyData, error: historyError } = await supabase
        .from('historical_changes')
        .select('*')
        .eq('original_ward_code', oldWardCode);
      if (historyError) console.error('Lỗi khi tra cứu lịch sử:', historyError);
      if (historyData && historyData.length > 0) {
        finalOldWardCode = historyData[0].intermediate_ward_code;
        historyRecords = historyData;
      }
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