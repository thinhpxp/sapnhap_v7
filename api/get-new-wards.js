import { createClient } from '@supabase/supabase-js';
//const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { db: { schema: 'api' }});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
export default async function handler(request, response) {
          const { province_code } = request.query;
          if (!province_code) return response.status(400).json({ error: 'Thiếu province_code.' });
          try {
            const { data, error } = await supabase.rpc('get_new_wards_by_province', { p_code: parseInt(province_code, 10) });
            if (error) throw error;
            response.status(200).json(data);
          } catch (error) {
            console.error('Lỗi API get-new-wards:', error);
            response.status(500).json({ error: 'Lỗi máy chủ.' });
          }
}