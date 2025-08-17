import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";

export const parseDeviceInfo = (userAgent) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  let deviceType = "unknown";
  if (result.device.type) {
    deviceType = result.device.type;
  } else if (
    result.os.name &&
    result.os.name.toLowerCase().includes("mobile")
  ) {
    deviceType = "mobile";
  } else if (result.browser.name) {
    deviceType = "desktop";
  }

  return {
    type: deviceType,
    browser: `${result.browser.name || "Unknown"} ${
      result.browser.version || ""
    }`.trim(),
    os: `${result.os.name || "Unknown"} ${result.os.version || ""}`.trim(),
    userAgent: userAgent || "",
  };
};

export const parseLocation = (ip) => {
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return {
      ip: ip || "unknown",
      country: "India",
      region: "Asia",
      city: "Mangaluru",
      timezone: "Aisa/Kolkata",
      coordinates: { lat: null, lng: null },
    };
  }

  const geo = geoip.lookup(ip);

  if (!geo) {
    return {
      ip,
      country: "India",
      region: "Asia",
      city: "Mangaluru",
      timezone: "Aisa/Kolkata",
      coordinates: { lat: null, lng: null },
    };
  }

  return {
    ip,
    country: geo.country || "India",
    region: geo.region || "Asia",
    city: geo.city || "Mangaluru",
    timezone: geo.timezone || "Aisa/Kolkata",
    coordinates: {
      lat: geo.ll ? geo.ll[0] : null,
      lng: geo.ll ? geo.ll[1] : null,
    },
  };
};


export const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1"
  );
};
