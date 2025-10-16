// /api/ga-stats.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// --- PHẦN KHỞI TẠO CHUNG ---
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
});
const propertyId = process.env.GA4_PROPERTY_ID;

const CLICK_EVENTS_TO_SUM = [
    'Event_lookup',
    'Event_Quick_Search_Old',
    'Event_Quick_Search_New',
    'Event_lookup_button_click'
];

// --- BỘ ĐIỀU KHIỂN CHÍNH (HANDLER) ---
export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  const { report } = request.query;

  switch (report) {
    case 'events':
      // GHI CHÚ THAY ĐỔI: Không còn 'return' ở đây
      await handleEventCount(request, response);
      break; // Thêm break để thoát khỏi switch
    case 'realtime':
      // GHI CHÚ THAY ĐỔI: Không còn 'return' ở đây
      await handleRealtimeLocations(request, response);
      break; // Thêm break để thoát khỏi switch
    default:
      // GHI CHÚ THAY ĐỔI: Chỉ cần gọi response, không return
      response.status(400).json({ error: "Tham số 'report' không hợp lệ. Phải là 'events' hoặc 'realtime'." });
  }
}

// ==================================================================
// HÀM XỬ LÝ ĐẾM SỰ KIỆN
// ==================================================================
async function handleEventCount(request, response) {
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
    if (gaResponse.rows) {
        gaResponse.rows.forEach(row => {
            const eventName = row.dimensionValues[0].value;
            const eventCount = parseInt(row.metricValues[0].value, 10);
            eventCounts[eventName] = eventCount;
            if (CLICK_EVENTS_TO_SUM.includes(eventName)) {
                totalClicks += eventCount;
            }
        });
    }

    // GHI CHÚ THAY ĐỔI: Không 'return'
    response.status(200).json({
      totalClicks: totalClicks,
      allEvents: eventCounts
    });

  } catch (error) {
    console.error('Lỗi khi gọi GA Data API (Event Count):', error);
    // GHI CHÚ THAY ĐỔI: Không 'return'
    response.status(500).json({ error: 'Không thể lấy dữ liệu sự kiện từ Google Analytics.' });
  }
}

// ==================================================================
// HÀM XỬ LÝ VỊ TRÍ THỜI GIAN THỰC
// ==================================================================
async function handleRealtimeLocations(request, response) {
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  try {
    const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'city' }, { name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
    });

    const locations = [];
    if (realtimeResponse.rows) {
      realtimeResponse.rows.forEach(row => {
        const city = row.dimensionValues[0].value;
        const country = row.dimensionValues[1].value;
        const userCount = parseInt(row.metricValues[0].value, 10);
        if (city && city !== '(not set)' && userCount > 0) {
          locations.push({ city, country, count: userCount });
        }
      });
    }

    locations.sort((a, b) => b.count - a.count);
    const totalActiveUsers = locations.reduce((total, location) => total + location.count, 0);

    // GHI CHÚ THAY ĐỔI: Không 'return'
    response.status(200).json({
      totalActiveUsers: totalActiveUsers,
      activeLocations: locations
    });

  } catch (error) {
    console.error('Lỗi khi gọi GA Realtime API:', error);
    // GHI CHÚ THAY ĐỔI: Không 'return'
    response.status(500).json({ error: 'Không thể lấy dữ liệu thời gian thực.' });
  }
}