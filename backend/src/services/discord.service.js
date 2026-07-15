import axios from 'axios';

class DiscordService {
  async send(webhookUrl, text, farmName = 'TerraClimate Farm') {
    if (!webhookUrl) {
      console.log(`[Discord Service] [SIMULATOR] Webhook missing. Broadcast text: "${text}"`);
      return { simulated: true };
    }

    try {
      const payload = {
        username: 'TerraClimate Advisory Bot',
        avatar_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=200&auto=format&fit=crop',
        embeds: [
          {
            title: `🌱 Advisory Alert for ${farmName}`,
            description: text,
            color: 16753920, // Orange
            timestamp: new Date().toISOString(),
            footer: {
              text: 'TerraClimate Precision Alerts'
            }
          }
        ]
      };

      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`[Discord Service] Webhook alert successfully pushed to Discord.`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error(`[Discord Service] Discord Webhook API request failed:`, errorMsg);
      return { error: errorMsg };
    }
  }
}

export const discordService = new DiscordService();
