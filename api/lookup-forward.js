//lookup-forward.js
import { createClient } from '@supabase/supabase-js';
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
                // === GHI CHÚ THAY ĐỔI: Thêm logic lấy ghi chú tỉnh ===
                let provinceNote = null;
                if (result && result.old_province_code !== result.new_province_code) {
                    // Nếu tỉnh cũ và mới khác nhau, tạo ghi chú
                    provinceNote = {
                        type: 'BECAME', // Báo cho client biết đây là loại ghi chú "trở thành"
                        old_name: result.old_province_name,
                        new_name: result.new_province_name
                    };
                }

                return response.status(200).json({
                  changed: true,
                  is_split_case: false,
                  ...result,
                  history: historyRecords,
                  province_merger_note: provinceNote // Đính kèm ghi chú vào kết quả
                });
        } catch (error) {
            console.error('Lỗi API Tra Cứu Xuôi:', error);
            response.status(500).json({ error: 'Lỗi máy chủ.' });
        }
}