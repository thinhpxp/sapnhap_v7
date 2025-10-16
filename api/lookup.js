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

    console.log('=== SUPABASE RAW RESPONSE ===');
    console.log('Error:', error);
    console.log('Data type:', typeof data);
    console.log('Data:', JSON.stringify(data, null, 2));

    if (error) throw error;

    let finalData = data;

    // Xử lý các trường hợp cấu trúc dữ liệu khác nhau
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];

      // Case 1: Wrapped trong function name key
      if (firstItem[rpcFunctionName]) {
        finalData = firstItem[rpcFunctionName];
        console.log('📦 Unwrapped from function key');
      }
      // Case 2: Data trực tiếp là array events
      else {
        finalData = data;
      }
    }

    // Chuẩn hóa cấu trúc dữ liệu trả về
    // Forward lookup: { events: [...], village_changes: [...] }
    // Reverse lookup: array of events with village_changes embedded

    if (type === 'forward') {
      // Đảm bảo có cấu trúc đúng cho forward lookup
      if (!finalData.events && Array.isArray(finalData)) {
        finalData = { events: finalData, village_changes: [] };
      }
      // Kiểm tra village_changes
      if (!finalData.village_changes) {
        finalData.village_changes = [];
      }
    } else {
      // Reverse lookup: đảm bảo mỗi event có village_changes
      if (Array.isArray(finalData)) {
        finalData = finalData.map(event => ({
          ...event,
          village_changes: event.village_changes || []
        }));
      }
    }

    console.log('=== FINAL NORMALIZED DATA ===');
    console.log(JSON.stringify(finalData, null, 2));

    return response.status(200).json(finalData);

  } catch (error) {
    console.error(`Lỗi API lookup (type: ${type}):`, error);
    return response.status(500).json({
      error: 'Lỗi máy chủ.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}