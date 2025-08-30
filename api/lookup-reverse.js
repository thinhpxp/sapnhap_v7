// /api/lookup-reverse.js - Phiên bản nâng cấp, hỗ trợ tra cứu chia tách ngược
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
    // === BƯỚC 1: Tìm các đơn vị cũ trực tiếp như bình thường ===
    const { data: directOldUnits, error: directError } = await supabase
      .from('full_vietnam')
      .select('*') // Lấy tất cả thông tin ban đầu
      .eq('new_ward_code', newWardCode);

    if (directError) throw directError;
    if (!directOldUnits || directOldUnits.length === 0) {
      return response.status(200).json([]);
    }

    // === GHI CHÚ CỐT LÕI: BƯỚC 2 - "ĐIỀU TRA" BỐI CẢNH CHIA TÁCH ===
    // Tạo một mảng các "lời hứa" (Promise), mỗi lời hứa là một cuộc gọi RPC
    // để tìm bối cảnh chia tách cho từng đơn vị cũ tìm được.
    const contextPromises = directOldUnits.map(unit =>
      supabase.rpc('get_split_context', { p_old_ward_code: unit.old_ward_code })
    );

    // Thực thi tất cả các "lời hứa" song song để tăng hiệu suất
    const contextResults = await Promise.all(contextPromises);

    // === GHI CHÚ: BƯỚC 3 - GHÉP NỐI KẾT QUẢ ===
    // Thêm trường 'split_context' vào mỗi đơn vị cũ
    const finalResults = directOldUnits.map((unit, index) => {
      const contextData = contextResults[index].data;
      return {
        ...unit,
        // Chỉ thêm context nếu nó tồn tại và chứa nhiều hơn 1 mảnh ghép (có sự chia tách thực sự)
        split_context: (contextData && contextData.length > 1) ? contextData : null
      };
    });

    response.status(200).json(finalResults);

  } catch (error) {
    console.error('Lỗi API Tra Cứu Ngược:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}