const ORS_BASE_URL = 'https://api.openrouteservice.org';

const getConfiguration = () => {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  const latitude = process.env.ORS_SHOP_LATITUDE;
  const longitude = process.env.ORS_SHOP_LONGITUDE;

  if (!apiKey || !latitude || !longitude) {
    const error = new Error(
      'Thiếu cấu hình OpenRouteService hoặc tọa độ cửa hàng',
    );
    error.statusCode = 503;
    throw error;
  }

  const origin = [Number(longitude), Number(latitude)];

  if (
    !Number.isFinite(origin[0]) ||
    !Number.isFinite(origin[1]) ||
    origin[0] < -180 ||
    origin[0] > 180 ||
    origin[1] < -90 ||
    origin[1] > 90
  ) {
    const error = new Error('Tọa độ cửa hàng không hợp lệ');
    error.statusCode = 503;
    throw error;
  }

  return { apiKey, origin };
};

const requestOpenRouteService = async (url, options, apiKey) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: apiKey,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = new Error('OpenRouteService không thể tính tuyến đường');
    error.statusCode = 502;
    throw error;
  }

  return response.json();
};

const getDeliveryRoute = async (shippingAddress) => {
  const { apiKey, origin } = getConfiguration();
  const geocodeUrl = new URL(`${ORS_BASE_URL}/geocode/search`);
  geocodeUrl.searchParams.set('text', shippingAddress);
  geocodeUrl.searchParams.set('boundary.country', 'VNM');
  geocodeUrl.searchParams.set('size', '1');

  const geocode = await requestOpenRouteService(geocodeUrl, {}, apiKey);
  const destination = geocode.features?.[0]?.geometry?.coordinates;

  if (
    !Array.isArray(destination) ||
    !Number.isFinite(destination[0]) ||
    !Number.isFinite(destination[1]) ||
    destination[0] < -180 ||
    destination[0] > 180 ||
    destination[1] < -90 ||
    destination[1] > 90
  ) {
    const error = new Error('Không tìm thấy tọa độ cho địa chỉ giao hàng');
    error.statusCode = 422;
    throw error;
  }

  const route = await requestOpenRouteService(
    `${ORS_BASE_URL}/v2/directions/driving-car/geojson`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [origin, destination],
      }),
    },
    apiKey,
  );

  const feature = route.features?.[0];
  const summary = feature?.properties?.summary;
  const routeCoordinates = feature?.geometry?.coordinates;

  if (
    !Array.isArray(routeCoordinates) ||
    routeCoordinates.length < 2 ||
    !routeCoordinates.every(
      (coordinate) =>
        Array.isArray(coordinate) &&
        Number.isFinite(coordinate[0]) &&
        Number.isFinite(coordinate[1]) &&
        coordinate[0] >= -180 &&
        coordinate[0] <= 180 &&
        coordinate[1] >= -90 &&
        coordinate[1] <= 90,
    ) ||
    !Number.isFinite(summary?.distance) ||
    !Number.isFinite(summary?.duration)
  ) {
    const error = new Error('OpenRouteService trả về tuyến đường không hợp lệ');
    error.statusCode = 502;
    throw error;
  }

  return {
    geometry: feature.geometry,
    distance: summary.distance,
    duration: summary.duration,
    origin,
    destination,
  };
};

module.exports = {
  getDeliveryRoute,
};
