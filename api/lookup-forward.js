// /api/lookup-forward.js - ver_event_model
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

  const oldWardCode = parseInt(code, 10);

  try {
    // GHI CHÚ: Logic được đơn giản hóa triệt để.
    // Chỉ cần một câu lệnh SELECT duy nhất vào bảng merger_events.
    // Nó sẽ tự động trả về 1 dòng (sáp nhập thường) hoặc nhiều dòng (chia tách).
    const { data, error } = await supabase
      .from('merger_events')
      .select('*') // Lấy tất cả thông tin sự kiện
      .eq('old_ward_code', oldWardCode);

    if (error) throw error;

    // Trả về một mảng kết quả. Client sẽ tự quyết định cách hiển thị.
    response.status(200).json(data);

  } catch (error) {
    console.error('Lỗi API Tra Cứu Xuôi:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}