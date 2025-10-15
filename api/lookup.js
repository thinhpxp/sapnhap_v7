// /api/lookup.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  const { code, type } = request.query;

  if (!code) {
    return response.status(400).json({ error: 'Thiếu tham số code.' });
  }
  if (type !== 'forward' && type !== 'reverse') {
    return response.status(400).json({ error: "Tham số 'type' phải là 'forward' hoặc 'reverse'." });
  }

  try {
    const wardCode = parseInt(code, 10);
    let rpcFunctionName;

    // GHI CHÚ CỐT LÕI: Chọn hàm RPC dựa trên 'type'
    if (type === 'forward') {
      rpcFunctionName = 'get_forward_lookup_details';
    } else {
      rpcFunctionName = 'get_reverse_lookup_details';
    }

    const { data, error } = await supabase.rpc(rpcFunctionName, {
      // Tên tham số phải khớp với tên trong hàm SQL
      [type === 'forward' ? 'p_old_ward_code' : 'p_new_ward_code']: wardCode
    });

    if (error) throw error;

    // Dữ liệu trả về từ RPC đã có cấu trúc chuẩn, chỉ cần gửi lại cho client
    return response.status(200).json(data);

  } catch (error) {
    console.error(`Lỗi API lookup (type: ${type}):`, error);
    return response.status(500).json({ error: 'Lỗi máy chủ.' });
  }
}