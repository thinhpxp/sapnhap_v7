// /api/get-event-count.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Hàm khởi tạo client, sử dụng thông tin từ biến môi trường
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
});
const propertyId = process.env.GA4_PROPERTY_ID;

// Vercel sẽ cache kết quả của hàm này
export default async function handler(request, response) {
  // Cho phép trình duyệt từ mọi nguồn gọi API này (CORS)
  response.setHeader('Access-Control-Allow-Origin', '*');
  // Cache kết quả trong 1 giờ ở phía trình duyệt và CDN của Vercel
  response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

  try {
    const [gaResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '2025-07-01', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
    });

    let totalClicks = 0;
    let eventCounts = {};

    gaResponse.rows.forEach(row => {
        const eventName = row.dimensionValues[0].value;
        const eventCount = parseInt(row.metricValues[0].value, 10);
        eventCounts[eventName] = eventCount;

        // Ví dụ: Cộng dồn các sự kiện click bạn quan tâm
        if (eventName === 'Event_lookup' || eventName === 'Event_switch_old_new') {
            totalClicks += eventCount;
        }
    });

    response.status(200).json({
      totalClicks: totalClicks, // Trả về một con số tổng
      allEvents: eventCounts    // Hoặc trả về chi tiết tất cả sự kiện
    });

  } catch (error) {
    console.error('Lỗi khi gọi Google Analytics Data API:', error);
    response.status(500).json({ error: 'Không thể lấy dữ liệu từ Google Analytics.' });
  }
}