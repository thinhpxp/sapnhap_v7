// /api/quick-search.js
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client một lần duy nhất, nhắm đến schema 'api'
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { db: { schema: 'api' } }
);

export default async function handler(request, response) {
  // Lấy cả 'term' và 'mode' từ query string
  const { term, mode } = request.query;

  // --- VALIDATION (Kiểm tra đầu vào) ---
  // 1. Kiểm tra search term
  if (!term || term.trim().length < 2) {
    // Trả về mảng rỗng nếu không có đủ ký tự, giống hành vi cũ
    return response.status(200).json([]);
  }

  // 2. Kiểm tra chế độ 'mode'
  if (mode !== 'old' && mode !== 'new') {
    return response.status(400).json({ error: "Tham số 'mode' không hợp lệ. Phải là 'old' hoặc 'new'." });
  }

  // GHI CHÚ QUAN TRỌNG: Chọn hàm RPC để gọi dựa trên 'mode'
  const rpcFunction = mode === 'old' ? 'search_old_wards' : 'search_new_wards';

  try {
    // Gọi hàm RPC đã được chọn
    const { data, error } = await supabase.rpc(rpcFunction, {
      p_search_term: term.trim()
    });

    if (error) throw error;

    response.status(200).json(data);

  } catch (error) {
    // Thêm 'mode' vào log để gỡ lỗi dễ hơn
    console.error(`Lỗi API Quick Search (mode: ${mode}):`, error);
    response.status(500).json({ error: 'Lỗi máy chủ.' });
  }
}