// Automatically determine the API URL based on the current hostname
// This allows the app to work on both localhost and local network IP (e.g., 192.168.1.X)
const IP_ADDRESS = window.location.hostname;
export const API_BASE = `http://${IP_ADDRESS}:8000/api`;
