import { createClient } from '@supabase/supabase-js';
//const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { db: { schema: 'api' }});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
export default async function handler(request, response) {
        const { code } = request.query;
        if (!code) return response.status(400).json({ error: 'Thiếu tham số code.' });
        const oldWardCode = parseInt(code, 10);
        try {
                const { data, error } = await supabase
                .from('merger_events')
                .select('*')
                .eq('old_ward_code', oldWardCode);
                if (error) throw error;
                response.status(200).json(data);
        } catch (error) {
            console.error('Lỗi API Tra Cứu Xuôi:', error);
            response.status(500).json({ error: 'Lỗi máy chủ.' });
        }
}