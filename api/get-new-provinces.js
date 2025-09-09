import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  db: { schema: 'api' }
});
export default async function handler(request, response) {
      try {
        const { data, error } = await supabase.rpc('get_unique_new_provinces');
        if (error) throw error;
        response.status(200).json(data);
      } catch (error) {
        console.error('Lỗi API get-new-provinces:', error);
        response.status(500).json({ error: 'Lỗi máy chủ.' });
      }
}