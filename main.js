import { config } from "dotenv"; // For environment variable management
config();
import express from "express";
import { updateSectors } from "./utils/communication.js";
import ejs from "ejs";
import { savePassengers } from "./utils/communication.js";

import { fetchSchedule } from "./utils/communication.js";
import fs from "fs";
import axios from "axios";
import { confirmBooking } from "./utils/communication.js";
import { downloadTicket } from "./utils/communication.js";
import moment from "moment";

import cookieParser from "cookie-parser";

const PORT = process.env.PORT || 8000; // Default to 8000 if PORT is not defined in .env
const TOKEN_FILE = "token.json";
const API_URL = "https://staging.makruzz.com/booking_api/login";
const USERNAME = process.env.API_USERNAME;
const PASSWORD = process.env.API_PASSWORD;

// Load Environment Variables

// Initialize Express App
const app = express();

const pickToken = () => {
  let tokenData = null;
  if (fs.existsSync(TOKEN_FILE)) {
    const fileData = fs.readFileSync(TOKEN_FILE, "utf-8");
    tokenData = JSON.parse(fileData);
    return tokenData.token;
  }
};
// Initialize Passport

app.use(cookieParser());

// Middleware and Settings
// Set EJS as the view engine (Corrected 'view engine' typo)
app.set("view engine", "ejs");

// Middlewares for Parsing and Static Files (Optional, Add if Needed)
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(express.static("public")); // Serve static files from the "public" directory

async function getToken() {
  let tokenData = null;

  // Step 1: Check if token file exists
  if (fs.existsSync(TOKEN_FILE)) {
    const fileData = fs.readFileSync(TOKEN_FILE, "utf-8");
    tokenData = JSON.parse(fileData);

    // Step 2: Check expiry
    const tokenTime = moment(tokenData.createdAt);
    const now = moment();

    if (now.diff(tokenTime, "hours") < 24) {
      console.log("✅ Using saved token");
      return tokenData.token;
    }

    console.log("⏰ Token expired, fetching new token...");
  } else {
    console.log("⚠️ No token file found, fetching new token...");
  }

  // Step 3: Fetch new token from API
  try {
    const response = await axios.post(
      API_URL,
      {
        data: {
          username: USERNAME,
          password: PASSWORD,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    const responseData = response.data; // no need for .json()

    if (responseData.code == 200) {
      const newToken = responseData.data.token;

      // Step 4: Save token to file with timestamp
      const tokenObj = {
        token: newToken,
        createdAt: moment().toISOString(),
      };

      fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenObj, null, 2));
      console.log("✅ New token saved");

      return newToken;
    } else {
      throw new Error(`Failed to fetch token: ${responseData.msg}`);
    }
  } catch (err) {
    console.log(err);
    console.error("❌ Error fetching token:", err.message);
  }
}

app.get("/", (req, res) => {
  const sectorsData = JSON.parse(fs.readFileSync("sectors.json"));
  return res.render("home.ejs", { sectors: sectorsData });
});

app.post("/fetchSchedule", async (req, res) => {
  try {
    const { trip_type, from, to, date, passengers } = req.body;

    // Validation: check if all required fields are present
    if (!trip_type || !from || !to || !date || !passengers) {
      return res.status(400).json({
        status: "error",
        error: "MissingFields",
        message: "All fields (from, to, date, passengers) are required.",
        data: null,
      });
    }

    // Validation: from and to should not be the same
    if (from === to) {
      return res.status(400).json({
        status: "error",
        error: "SamePortSelected",
        message: "Departure and destination ports cannot be the same.",
        data: null,
      });
    }

    // Validation: check if date is in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    if (selectedDate < today) {
      return res.status(400).json({
        status: "error",
        error: "InvalidDate",
        message: "Selected date cannot be in the past.",
        data: null,
      });
    }

    // Validation: passengers must be a positive integer
    const passengersCount = parseInt(passengers);
    if (isNaN(passengersCount) || passengersCount < 1) {
      return res.status(400).json({
        status: "error",
        error: "InvalidPassengerCount",
        message: "Passenger count must be a positive number.",
        data: null,
      });
    }

    // if every thing is in perfect working order let's make the request got it
    const token = pickToken();
    const data = await fetchSchedule(token, req.body);

    return res.status(200).json({
      status: "success",

      message: data.msg,
      data,
    });
  } catch (err) {
    console.error("Server Error:", err);

    return res.status(500).json({
      status: "error",
      error: "ServerError",
      message: err.message,
      data: null,
    });
  }
});

app.get(
  "/savePassengers/:no_of_passenger/:schedule_id/:travel_date/:class_id/:fare",
  (req, res) => {
    const { no_of_passenger, schedule_id, travel_date, class_id, fare } =
      req.params;

    res.render("passenger.ejs", { passengers: no_of_passenger });
  }
);
app.post(
  "/savePassengers/:no_of_passenger/:schedule_id/:travel_date/:class_id/:fare",
  async (req, res) => {
    try {
      const { no_of_passenger, schedule_id, travel_date, class_id, fare } =
        req.params;

      const data = req.body;
      data.data["c_remark"] = "test";
      data.data["no_of_passenger"] = parseInt(no_of_passenger);
      data.data["schedule_id"] = parseInt(schedule_id);
      data.data["travel_date"] = String(travel_date); // Make sure it's in YYYY-MM-DD format
      data.data["class_id"] = parseInt(class_id);
      data.data["fare"] = parseFloat(fare);
      data.data["tc_check"] = true;

      const responseData = await savePassengers(pickToken(), data);

      return res.status(200).json({
        status: "success",

        message: responseData.msg,
        data: responseData,
      });
    } catch (error) {
      console.log(error.message);

      // Determine error type
      const errorType =
        error.name === "AxiosError" || error.message?.includes("API")
          ? "APIError"
          : "ServerError";

      return res.status(500).json({
        status: "error",
        error: errorType,
        message: error.message || "Something went wrong on the server",
        data: null,
      });
    }
  }
);

app.post("/confirmBooking/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;

    if (!booking_id) {
      return res.status(400).json({
        status: "error",
        error: "bookingId",
        message: "booking id does not exists",
        data: null,
      });
    }

    const responseData = await confirmBooking(pickToken(), {
      data: { booking_id: booking_id },
    });
    return res.status(200).json({
      status: "success",

      message: responseData.msg,
      data: responseData,
    });
  } catch (error) {
    console.log(error);
    console.log(error.message);

    // Determine error type
    const errorType =
      error.name === "AxiosError" || error.message?.includes("API")
        ? "APIError"
        : "ServerError";

    return res.status(500).json({
      status: "error",
      error: errorType,
      message: error.message || "Something went wrong on the server",
    });
  }
});
app.post("/downlaod/:booking_id", async (req, res) => {
  try {
    const { booking_id } = req.params;

    if (!booking_id) {
      return res.status(400).json({
        status: "error",
        error: "bookingId",
        message: "booking id does not exists",
        data: null,
      });
    }

    const responseData = await downloadTicket(pickToken(), {
      data: { booking_id: booking_id },
    });
    return res.status(200).json({
      status: "success",

      data: responseData,
    });
  } catch (error) {
    console.log(error.message);

    // Determine error type
    const errorType =
      error.name === "AxiosError" || error.message?.includes("API")
        ? "APIError"
        : "ServerError";

    return res.status(500).json({
      status: "error",
      error: errorType,
      message: error.message || "Something went wrong on the server",
    });
  }
});

app.get("/schedule_search", async (req, res) => {
  return res.render("ferry.ejs");
});

app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
  getToken();
});
