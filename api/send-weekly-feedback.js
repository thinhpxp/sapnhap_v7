// /api/send-weekly-feedback.js
import { createClient } from '@supabase/supabase-js';

// GHI CHÚ: Khởi tạo Supabase client với SERVICE_ROLE_KEY.
// Điều này cần thiết vì policy RLS của chúng ta chỉ cho phép service_role đọc dữ liệu.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // <-- SỬ DỤNG SERVICE ROLE KEY
);

// Hàm nhỏ để gửi tin nhắn đến Telegram
async function sendTelegramMessage(text) {
    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    if (!response.ok) {
        console.error('Lỗi khi gửi tin nhắn Telegram:', await response.json());
    }
}

export default async function handler(request, response) {
  // GHI CHÚ: Một lớp bảo mật để đảm bảo chỉ có Vercel Cron Job mới có thể gọi API này.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Lấy tất cả các tin nhắn chưa được gửi
    const { data: messages, error: selectError } = await supabase
      .from('feedback')
      .select('id, message, created_at')
      .eq('is_sent_to_telegram', false);
    if (selectError) throw selectError;

    if (messages.length === 0) {
      console.log("Cron Job: Không có tin nhắn mới để gửi.");
      return response.status(200).json({ message: 'Không có tin nhắn mới để gửi.' });
    }

    // 2. Định dạng tin nhắn để gửi đi
    let telegramMessage = `*Tổng hợp Góp ý Tuần Này (${messages.length} tin nhắn mới):*\n\n`;
    messages.forEach(msg => {
      // Định dạng ngày tháng cho dễ đọc
      const date = new Date(msg.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      // Sử dụng ký tự Markdown của Telegram
      telegramMessage += `*[${date}]:*\n\`\`\`\n${msg.message}\n\`\`\`\n\n`;
    });

    // 3. Gửi đến Telegram
    await sendTelegramMessage(telegramMessage);

    // 4. Đánh dấu các tin nhắn là đã được gửi thành công
    const messageIds = messages.map(msg => msg.id);
    const { error: updateError } = await supabase
      .from('feedback')
      .update({ is_sent_to_telegram: true })
      .in('id', messageIds);
    if (updateError) throw updateError;

    console.log(`Cron Job: Đã gửi thành công ${messages.length} tin nhắn.`);
    response.status(200).json({ success: true, sent: messages.length });

  } catch (error) {
    console.error('Lỗi nghiêm trọng trong API send-weekly-feedback:', error);
    // Gửi một tin nhắn báo lỗi đến Telegram để bạn biết
    await sendTelegramMessage(`*CRON JOB FAILED:*\n\`\`\`\n${error.message}\n\`\`\``);
    response.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  }
}