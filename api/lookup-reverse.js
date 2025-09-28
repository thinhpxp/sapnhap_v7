//lookup-reverse.js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
export default async function handler(request, response) {
          const { code } = request.query;
          if (!code) return response.status(400).json({ error: 'Thiếu tham số code.' });
             const newWardCode = parseInt(code, 10);
          try {
                const { data, error } = await supabase
                  .from('merger_events')
                  .select('*')
                  .eq('new_ward_code', newWardCode);
                if (error) throw error;
                response.status(200).json(data);

                // Truy vấn bảng province_mergers để tìm tất cả các tỉnh cũ
                const { data: sourceProvinces, error: noteError } = await supabase
                    .from('province_mergers')
                    .select('old_province_name')
                    .eq('new_province_code', newProvinceCode);

                if (noteError) throw noteError;

                if (sourceProvinces && sourceProvinces.length > 0) {
                    provinceNote = {
                        type: 'FORMED_FROM', // Báo cho client biết đây là loại ghi chú "hợp thành từ"
                        new_name: newProvinceName,
                        source_names: sourceProvinces.map(p => p.old_province_name)
                    };
                }
            }

        // Đính kèm ghi chú vào một đối tượng trả về mới
        response.status(200).json({
            results: finalResults,
            province_merger_note: provinceNote
    });
          } catch (error) {
                console.error('Lỗi API Tra Cứu Ngược:', error);
                response.status(500).json({ error: 'Lỗi máy chủ.' });
          }
}