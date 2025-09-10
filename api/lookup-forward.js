import { createClient } from '@supabase/supabase-js';
//const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { db: { schema: 'api' }});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
export default async function handler(request, response) {
        const { code } = request.query;
        if (!code) return response.status(400).json({ error: 'Thiếu tham số code.' });
        const oldWardCode = parseInt(code, 10);
        try {
                const { data, error } = await supabase
                .from('merger_events')
                .select('*')
                .eq('old_ward_code', oldWardCode);
                if (error) throw error;
                response.status(200).json(data);
        } catch (error) {
            console.error('Lỗi API Tra Cứu Xuôi:', error);
            response.status(500).json({ error: 'Lỗi máy chủ.' });
        }
}

/*
// /api/lookup-forward.js - Phiên bản đơn giản hóa, không truy vết lịch sử
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
    // GHI CHÚ: Logic được đơn giản hóa. Chỉ còn một truy vấn duy nhất.
    // Dựa vào cờ is_split để quyết định tìm trong bảng nào.
    if (is_split === 'true') {
      // --- Xử lý cho trường hợp CHIA TÁCH ---
      const { data: splitParts, error: splitError } = await supabase
        .from('split_details')
        .select('*') // Lấy tất cả thông tin
        .eq('old_ward_code', oldWardCode);

      if (splitError) throw splitError;

      // Trả về kết quả dưới dạng cấu trúc cho trường hợp chia tách
      return response.status(200).json({
        changed: true,
        is_split_case: true,
        split_results: splitParts || []
      });

    } else {
      // --- Xử lý cho trường hợp SÁP NHẬP THÔNG THƯỜNG ---
      const { data: mergeEvents, error: mergeError } = await supabase
        .from('merger_events')
        .select('*')
        .eq('old_ward_code', oldWardCode);

      if (mergeError) throw mergeError;

      // Trả về một mảng các sự kiện (thường chỉ có 1)
      return response.status(200).json(mergeEvents || []);
    }
  } catch (error) {
    console.error('Lỗi API Tra Cứu Xuôi:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}
*/