import axios from "axios";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

export class AuthClient {
    static async getUser(userId: number) {
        try {
            const response = await axios.get(`${AUTH_SERVICE_URL}/internal/users/${userId}`);
            return response.data; 
        } catch (error) {
            return { id: userId, username: "Unknown Author", avatar_url: null };
        }
    }
}