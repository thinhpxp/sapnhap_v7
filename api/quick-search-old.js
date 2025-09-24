import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(request, response) {
  const { term } = request.query;
  if (!term || term.trim().length < 2) return response.status(200).json([]);
  try {
    const { data, error } = await supabase.rpc('search_old_wards', { search_term: term.trim() });
    if (error) throw error;
    response.status(200).json(data);
  } catch (error) {
    console.error('Lỗi API Quick Search Old:', error);
    response.status(500).json({ error: 'Lỗi máy chủ.' });
  }
}