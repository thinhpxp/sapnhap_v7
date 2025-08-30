// /api/lookup-reverse.js - Phiên bản nâng cấp, xử lý tra cứu ngược cho cả sáp nhập và chia tách
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
    // === GHI CHÚ CỐT LÕI: Thực hiện 2 truy vấn song song ===
    // Promise.all sẽ chạy cả hai "cuộc điều tra" cùng một lúc.
    const [directMergeResponse, splitSourceResponse] = await Promise.all([
      // 1. Điều tra các trường hợp sáp nhập trực tiếp (N -> 1)
      supabase
        .from('full_vietnam')
        .select('*')
        .eq('new_ward_code', newWardCode),

      // 2. Điều tra xem đơn vị mới này có phải là kết quả của một sự kiện chia tách không (1 -> N)
      supabase
        .from('split_details')
        .select('*')
        .eq('new_ward_code', newWardCode)
    ]);

    // Kiểm tra lỗi của từng truy vấn
    if (directMergeResponse.error) throw directMergeResponse.error;
    if (splitSourceResponse.error) throw splitSourceResponse.error;

    // Lấy dữ liệu từ kết quả
    const directOldUnits = directMergeResponse.data || [];
    const splitSourceParts = splitSourceResponse.data || [];

    let finalResults = [...directOldUnits];

    // Nếu tìm thấy nguồn gốc từ việc chia tách
    if (splitSourceParts.length > 0) {
      // Lấy tất cả các mã gốc bị chia tách (có thể có nhiều)
      const originalWardCodes = [...new Set(splitSourceParts.map(part => part.old_ward_code))];

      // Tìm tất cả các "mảnh ghép anh em" của các phần này
      const { data: allSplitParts, error: allPartsError } = await supabase
        .from('split_details')
        .select('*')
        .in('old_ward_code', originalWardCodes);

      if (allPartsError) throw allPartsError;

      // Thêm các bản ghi "ảo" vào kết quả cuối cùng
      splitSourceParts.forEach(part => {
        finalResults.push({
          // Tạo một cấu trúc dữ liệu giống như một bản ghi từ full_vietnam
          old_ward_name: part.split_part_description,
          old_ward_code: part.old_ward_code,
          old_district_name: 'N/A (Chia tách)', // Ghi chú rằng đây là trường hợp đặc biệt
          old_district_code: null,
          old_province_name: 'N/A',
          old_province_code: null,
          // ... các trường 'new_' ...
          new_ward_code: part.new_ward_code,
          // Đính kèm bối cảnh chia tách
          split_context: allSplitParts
        });
      });
    }

    // === Xử lý bối cảnh lịch sử cho TẤT CẢ các kết quả (cả sáp nhập và chia tách) ===
    if (finalResults.length > 0) {
        const oldWardCodesFound = finalResults.map(unit => unit.old_ward_code);
        const { data: historyRecords, error: historyError } = await supabase
            .from('historical_changes')
            .select('*')
            .in('intermediate_ward_code', oldWardCodesFound);

        if (historyError) console.error("Lỗi khi tra cứu lịch sử ngược:", historyError);

        // Ghép nối thông tin lịch sử vào kết quả cuối cùng
        const resultsWithHistory = finalResults.map(unit => {
            const history = historyRecords ? historyRecords.find(h => h.intermediate_ward_code === unit.old_ward_code) : null;
            return { ...unit, history: history || null };
        });

        return response.status(200).json(resultsWithHistory);
    }

    response.status(200).json([]); // Trả về mảng rỗng nếu không tìm thấy gì

  } catch (error) {
    console.error('Lỗi API Tra Cứu Ngược:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}