import axios from 'axios';
import { config } from '../core/config.js';

class SmsService {
  constructor() {
    const { accountSid, authToken, fromNumber } = config.twilio || {};
    this.isActive = Boolean(accountSid && authToken && fromNumber);
  }

  async send(to, text) {
    if (!this.isActive) {
      console.log(`[SMS Service] [SIMULATOR] Outbound SMS to <${to}>: "${text}"`);
      return { simulated: true };
    }

    const { accountSid, authToken, fromNumber } = config.twilio;

    try {
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: text
        }).toString(),
        {
          auth: {
            username: accountSid,
            password: authToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log(`[SMS Service] Twilio SMS dispatched successfully to <${to}>. SID: ${response.data.sid}`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error(`[SMS Service] Twilio API request failed for <${to}>:`, errorMsg);
      throw new Error(`SMS delivery failure: ${errorMsg}`);
    }
  }
}

export const smsService = new SmsService();
