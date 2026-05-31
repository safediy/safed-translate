const axios = require("axios");
require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;

async function apiRequest(method, endpoint, data = {}, headers = {}) {

    try {

        const options = {
            method,
            url: `${SUPABASE_URL}/rest/v1/${endpoint}`,
            headers: {
                "apikey": SUPABASE_API_KEY,
                "Authorization": `Bearer ${SUPABASE_API_KEY}`,
                "Content-Type": "application/json",
                ...headers,
            },
        };

        if (method === "get" && Object.keys(data).length > 0) {
            options.params = data;
        } else {
            options.data = data;
        }

        // console.log("API Request:", options);
        const response = await axios(options);
        return response.data;
    } catch (error) {

        console.error(error);


        console.error("❌ API xatosi:", error.message);
        throw new Error(JSON.stringify({ message: error.response?.data?.message || error.message }));
    }
}

module.exports = {
    get: async (endpoint, params, chatId, headers) =>
        apiRequest("get", endpoint, params, chatId, headers),
    post: async (endpoint, data, chatId, headers) =>
        apiRequest("post", endpoint, data, chatId, headers),
    patch: async (endpoint, data, chatId, headers) =>
        apiRequest("patch", endpoint, data, chatId, headers),
    delete: async (endpoint, data, chatId, headers) =>
        apiRequest("delete", endpoint, data, chatId, headers),
};
