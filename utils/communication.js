import fs from "fs";
import axios from "axios";

export async function updateSectors(token) {
  const response = await axios.get(
    "https://staging.makruzz.com/booking_api/get_sectors",
    {
      headers: { Mak_Authorization: token },
    }
  );

  fs.writeFileSync("sectors.json", JSON.stringify(response.data.data));
}

export async function fetchSchedule(token, data) {
  try {
    const payload = {
      data: {
        trip_type: "single_trip",
        from_location: data.from,
        to_location: data.to,
        travel_date: data.date,
        no_of_passenger: parseInt(data.passengers), // ✅ Correct key name + integer
      },
    };

    const response = await axios.post(
      "https://staging.makruzz.com/booking_api/schedule_search",
      payload,
      {
        headers: {
          Mak_Authorization: token.trim(), // Always trim tokens
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.data.code !== "200") {
      const msg = response.data.msg;

      if (typeof msg === "object" && msg !== null && !Array.isArray(msg)) {
        const messages = [];
        for (const key in msg) {
          const item = msg[key];
          if (Array.isArray(item)) {
            item.forEach((m) => messages.push(m));
          } else {
            messages.push(String(item));
          }
        }
        throw new Error(`API error: ${messages.join("; ")}`);
      }

      throw new Error(`API error: ${msg || "Unknown API error"}`);
    }

    return response.data;
  } catch (err) {
    if (err.response) {
      throw new Error(
        `API response error: ${err.response.status} - ${err.response.statusText}`
      );
    } else if (err.request) {
      throw new Error("Network error: No response received from API");
    } else {
      throw new Error(`Unexpected error: ${err.message}`);
    }
  }
}

export async function savePassengers(token, data) {
  try {
    const response = await axios.post(
      "https://staging.makruzz.com/booking_api/savePassengers",
      data,
      {
        headers: {
          Mak_Authorization: token,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds
      }
    );

    if (response.data.code !== "200") {
      const msg = response.data.msg;

      if (typeof msg === "object" && msg !== null && !Array.isArray(msg)) {
        const messages = [];
        for (const key in msg) {
          const item = msg[key];
          if (Array.isArray(item)) {
            item.forEach((m) => messages.push(m));
          } else {
            messages.push(String(item));
          }
        }
        throw new Error(`API error: ${messages.join("; ")}`);
      }

      throw new Error(`API error: ${msg || "Unknown API error"}`);
    }

    return response.data;
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      throw new Error("API error: Request timed out");
    } else if (err.response) {
      throw new Error(
        `API response error: ${err.response.status} - ${err.response.statusText}`
      );
    } else if (err.request) {
      throw new Error("API error: No response received from server");
    } else {
      throw new Error(`Unexpected error: ${err.message}`);
    }
  }
}
export async function confirmBooking(token, data) {
  try {
    const response = await axios.post(
      "https://staging.makruzz.com/booking_api/confirm_booking",
      data,
      {
        headers: {
          Mak_Authorization: token,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds
      }
    );

    if (response.data.code !== "200") {
      const msg = response.data.msg;

      if (typeof msg === "object" && msg !== null && !Array.isArray(msg)) {
        const messages = [];
        for (const key in msg) {
          const item = msg[key];
          if (Array.isArray(item)) {
            item.forEach((m) => messages.push(m));
          } else {
            messages.push(String(item));
          }
        }
        throw new Error(`API error: ${messages.join("; ")}`);
      }

      throw new Error(`API error: ${msg || "Unknown API error"}`);
    }

    return response.data;
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      throw new Error("API error: Request timed out");
    } else if (err.response) {
      throw new Error(
        `API response error: ${err.response.status} - ${err.response.statusText}`
      );
    } else if (err.request) {
      throw new Error("API error: No response received from server");
    } else {
      throw new Error(`Unexpected error: ${err.message}`);
    }
  }
}
export async function downloadTicket(token, data) {
  try {
    const response = await axios.post(
      "https://staging.makruzz.com/booking_api/download_ticket_pdf",
      data,
      {
        headers: {
          Mak_Authorization: token,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 seconds
      }
    );

 
    

    return response.data;
  } catch (err) {
    if (err.code === "ECONNABORTED") {
      throw new Error("API error: Request timed out");
    } else if (err.response) {
      throw new Error(
        `API response error: ${err.response.status} - ${err.response.statusText}`
      );
    } else if (err.request) {
      throw new Error("API error: No response received from server");
    } else {
      throw new Error(`Unexpected error: ${err.message}`);
    }
  }
}
