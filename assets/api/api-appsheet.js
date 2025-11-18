// API Configuration - sử dụng từ config.js
const API_CONFIG = window.APPSHEET_CONFIG || {
  appId: '433f4472-a3ff-4956-9f34-ba5314207a7d',
  accessKey: 'V2-34GVr-dFi12-b3qhj-KwKIs-JjkCp-8t20X-pBh5S-Hd4hp',
  baseUrl: 'https://www.appsheet.com/api/v2/apps/'
};

// Hàm gọi API AppSheet để đọc dữ liệu
async function fetchDataFromAPI(tableName, selector = null) {
  try {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.appId}/tables/${encodeURIComponent(tableName)}/Action`;

    const requestBody = {
      Action: 'Find',
      Properties: {},
      Rows: []
    };

    // Nếu có selector, thêm vào request
    if (selector) {
      requestBody.Properties.Selector = selector;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        applicationAccessKey: API_CONFIG.accessKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Lỗi API: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // AppSheet trả về array trực tiếp hoặc trong property nào đó
    let result = Array.isArray(data) ? data : data.Rows || data.rows || [];

    return result;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy dữ liệu từ bảng ${tableName}:`, error);
    throw error;
  }
}

// Hàm gọi API AppSheet để cập nhật dữ liệu
async function updateDataToAPI(tableName, data) {
  try {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.appId}/tables/${encodeURIComponent(tableName)}/Action`;
    const requestBody = {
      Action: 'Edit',
      Properties: {},
      Rows: [data]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        applicationAccessKey: API_CONFIG.accessKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update API Error Response:', errorText);
      throw new Error(`Lỗi API: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    return { success: true, data: responseData.Rows || responseData || [] };
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật dữ liệu vào bảng ${tableName}:`, error);
    return { success: false, message: error.message };
  }
}

// Hàm gọi API AppSheet để thêm dữ liệu mới
async function addDataToAPI(tableName, data) {
  try {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.appId}/tables/${encodeURIComponent(tableName)}/Action`;
    const requestBody = {
      Action: 'Add',
      Properties: {},
      Rows: data
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        applicationAccessKey: API_CONFIG.accessKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Add API Error Response:', errorText);
      throw new Error(`Lỗi API: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    return { success: true, data: responseData.Rows || responseData || [] };
  } catch (error) {
    console.error(`❌ Lỗi khi thêm dữ liệu vào bảng ${tableName}:`, error);
    return { success: false, message: error.message };
  }
}

// Hàm gọi API AppSheet để xóa dữ liệu
async function deleteDataFromAPI(tableName, data) {
  try {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.appId}/tables/${encodeURIComponent(tableName)}/Action`;
    const requestBody = {
      Action: 'Delete',
      Properties: {},
      Rows: [data]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        applicationAccessKey: API_CONFIG.accessKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Delete API Error Response:', errorText);
      throw new Error(`Lỗi API: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    return { success: true, data: responseData.Rows || responseData || [] };
  } catch (error) {
    console.error(`❌ Lỗi khi xóa dữ liệu từ bảng ${tableName}:`, error);
    return { success: false, message: error.message };
  }
}
