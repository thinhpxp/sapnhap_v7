// /api/get-realtime-locations.js
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
});
const propertyId = process.env.GA4_PROPERTY_ID;

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const [realtimeResponse] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [
          { name: 'city' },
          { name: 'country' }
      ],
      metrics: [{ name: 'activeUsers' }],
    });

    const locations = [];
    if (realtimeResponse.rows) {
      realtimeResponse.rows.forEach(row => {
        const city = row.dimensionValues[0].value;
        const country = row.dimensionValues[1].value;
        const userCount = parseInt(row.metricValues[0].value, 10);

        // Chỉ lấy các thành phố có tên và có ít nhất 1 người dùng
        if (city && city !== '(not set)' && userCount > 0) {
          locations.push({
            city: city,
            country: country,
            count: userCount
          });
        }
      });
    }

    // Sắp xếp danh sách theo số lượng người dùng giảm dần
    locations.sort((a, b) => b.count - a.count);
    // === THÊM MỚI: Tính tổng số người dùng ===
    // Sử dụng hàm reduce để tính tổng tất cả các giá trị 'count' trong mảng locations
    const totalActiveUsers = locations.reduce((total, location) => total + location.count, 0);

    // Trả về cả danh sách chi tiết VÀ tổng số người dùng
    response.status(200).json({
      totalActiveUsers: totalActiveUsers, // <-- Thêm mới
      activeLocations: locations
    });

  } catch (error) {
    console.error('Lỗi khi gọi Google Analytics Realtime API:', error);
    response.status(500).json({ error: 'Không thể lấy dữ liệu thời gian thực.' });
  }
}