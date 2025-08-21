// /api/submit-feedback.js
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client với các biến môi trường
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Xử lý yêu cầu POST để lưu một góp ý mới vào cơ sở dữ liệu.
 */
export default async function handler(request, response) {
  // GHI CHÚ: Chỉ cho phép phương thức POST để đảm bảo an toàn.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // GHI CHÚ: Lấy nội dung tin nhắn từ body của request.
    // Front-end sẽ gửi dữ liệu dưới dạng JSON: { "message": "..." }
    const { message } = request.body;

    // GHI CHÚ: Kiểm tra đầu vào. Đảm bảo tin nhắn không rỗng và hợp lệ.
    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
      return response.status(400).json({ error: 'Nội dung góp ý không hợp lệ.' });
    }

    // GHI CHÚ: Chèn một dòng mới vào bảng 'feedback'.
    // Chỉ cần cung cấp cột 'message', các cột khác sẽ có giá trị mặc định.
    const { error } = await supabase
      .from('feedback')
      .insert([{ message: message.trim() }]);

    // Nếu có lỗi từ Supabase, ném lỗi để khối catch xử lý
    if (error) {
      throw error;
    }

    // Nếu thành công, trả về một thông báo thành công.
    response.status(200).json({ success: true, message: 'Gửi góp ý thành công!' });

  } catch (error) {
    console.error('Lỗi API submit-feedback:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ, không thể gửi góp ý.' });
  }
}