import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
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
  } catch (error) {
    console.error('Lỗi API Tra Cứu Ngược:', error);
    response.status(500).json({ error: 'Lỗi máy chủ.' });
  }
}