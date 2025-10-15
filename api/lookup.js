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

    // Chọn hàm RPC dựa trên 'type'
    if (type === 'forward') {
      rpcFunctionName = 'get_forward_lookup_details';
    } else {
      rpcFunctionName = 'get_reverse_lookup_details';
    }

    console.log('=== DEBUG API LOOKUP ===');
    console.log('Type:', type);
    console.log('Ward Code:', wardCode);
    console.log('RPC Function:', rpcFunctionName);

    const { data, error } = await supabase.rpc(rpcFunctionName, {
      [type === 'forward' ? 'p_old_ward_code' : 'p_new_ward_code']: wardCode
    });

    console.log('=== SUPABASE RESPONSE ===');
    console.log('Error:', error);
    console.log('Data type:', typeof data);
    console.log('Data:', JSON.stringify(data, null, 2));

    if (error) throw error;

    // ⚠️ QUAN TRỌNG: Kiểm tra cấu trúc dữ liệu trả về
    // Supabase RPC có thể trả về dữ liệu theo nhiều cách:
    // 1. Trực tiếp: { events: [...], village_changes: [...] }
    // 2. Wrapped trong array: [{ get_forward_lookup_details: {...} }]

    let finalData = data;

    // Nếu data là array và có phần tử đầu tiên
    if (Array.isArray(data) && data.length > 0) {
      // Kiểm tra xem có wrap trong key function name không
      const firstItem = data[0];
      if (firstItem[rpcFunctionName]) {
        finalData = firstItem[rpcFunctionName];
        console.log('⚠️ Data was wrapped, unwrapped to:', JSON.stringify(finalData, null, 2));
      } else {
        // Có thể data trực tiếp là array kết quả
        finalData = data;
      }
    }

    console.log('=== FINAL DATA TO SEND ===');
    console.log(JSON.stringify(finalData, null, 2));

    // Dữ liệu trả về từ RPC đã có cấu trúc chuẩn
    return response.status(200).json(finalData);

  } catch (error) {
    console.error(`Lỗi API lookup (type: ${type}):`, error);
    return response.status(500).json({ error: 'Lỗi máy chủ.' });
  }
}