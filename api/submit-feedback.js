// /api/submit-feedback.js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  db: { schema: 'api' }
});

/**
 * Xử lý yêu cầu POST để lưu một góp ý mới vào cơ sở dữ liệu.
 */
export default async function handler(request, response) {
  // GHI CHÚ: Chỉ cho phép phương thức POST để đảm bảo an toàn.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // GHI CHÚ THAY ĐỔI: Lấy thêm 'context' từ body của request.
    const { message, context } = request.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
      return response.status(400).json({ error: 'Nội dung góp ý không hợp lệ.' });
    }

    // GHI CHÚ THAY ĐỔI: Chèn cả 'message' và 'context' vào CSDL.
    // Nếu 'context' không được gửi từ client, nó sẽ là undefined và Supabase sẽ chèn NULL.
    const { error } = await supabase
      .from('feedback')
      .insert([{ message: message.trim(), context: context }]);

    if (error) throw error;
    response.status(200).json({ success: true, message: 'Gửi góp ý thành công!' });

  } catch (error) {
    console.error('Lỗi API submit-feedback:', error);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ, không thể gửi góp ý.' });
  }
}