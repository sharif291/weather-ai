import fs from 'fs';
import path from 'path';
import { prisma } from '../../core/db.js';
import { s3Service } from '../../core/s3.js';

export const createFarm = async (req, res) => {
  const { 
    name, 
    latitude, 
    longitude, 
    cropType, 
    imageUrl, 
    windThreshold,
    rainThreshold,
    enabled,
    notifyEmail,
    emailAddress,
    notifySms,
    phoneNumber,
    notifyDiscord,
    discordWebhook,
    notifyInApp,
    region,
    country,
    timezone,
    city
  } = req.body;

  if (!name || latitude === undefined || longitude === undefined || !cropType) {
    return res.status(400).json({ error: 'Missing required fields: name, latitude, longitude, and cropType are required' });
  }

  try {
    const farm = await prisma.farm.create({
      data: {
        userId: req.user.id,
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        cropType,
        imageUrl: imageUrl || null,
        city: city || null,
        region: region || null,
        country: country || null,
        timezone: timezone || null,
        alertConfig: {
          create: {
            windThreshold: windThreshold !== undefined ? parseFloat(windThreshold) : 20.0,
            rainThreshold: rainThreshold !== undefined ? parseFloat(rainThreshold) : 10.0,
            enabled: enabled !== undefined ? Boolean(enabled) : true,
            notifyEmail: enabled ? Boolean(notifyEmail) : false,
            emailAddress: enabled && notifyEmail ? emailAddress || null : null,
            notifySms: enabled ? Boolean(notifySms) : false,
            phoneNumber: enabled && notifySms ? phoneNumber || null : null,
            notifyDiscord: enabled ? Boolean(notifyDiscord) : false,
            discordWebhook: enabled && notifyDiscord ? discordWebhook || null : null,
            notifyInApp: enabled ? Boolean(notifyInApp) : true
          }
        }
      },
      include: {
        alertConfig: true
      }
    });

    console.log(`[Farms] Created new PostgreSQL record with AlertConfig for User: ${req.user.id}, Farm: ${name}`);
    return res.status(201).json(farm);
  } catch (err) {
    console.error('[Farms] Create farm SQL failure:', err.message);
    return res.status(500).json({ error: 'Database error: Failed to register farm details', details: err.message });
  }
};

export const getFarms = async (req, res) => {
  try {
    const farms = await prisma.farm.findMany({
      where: { userId: req.user.id },
      include: { alertConfig: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(farms);
  } catch (err) {
    console.error('[Farms] Fetch farms SQL failure:', err.message);
    return res.status(500).json({ error: 'Database error: Failed to retrieve user farms list', details: err.message });
  }
};

export const deleteFarm = async (req, res) => {
  const { id } = req.params;

  try {
    // Confirm farm belongs to user before deletion
    const farm = await prisma.farm.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!farm) {
      return res.status(404).json({ error: 'Delete failed: Farm not found or permission denied' });
    }

    // Delete custom farm images from disk if it was a local mock upload
    if (farm.imageUrl && farm.imageUrl.includes('/uploads/')) {
      const relativePath = farm.imageUrl.split('/uploads/')[1];
      const absolutePath = path.join(process.cwd(), 'uploads', relativePath);
      fs.unlink(absolutePath, (err) => {
        if (err) console.warn('[Farms] Failed to cleanup local image on disk:', err.message);
        else console.log('[Farms] Cleaned up local image from disk:', relativePath);
      });
    }

    await prisma.farm.delete({
      where: { id }
    });

    console.log(`[Farms] Deleted PostgreSQL record for User: ${req.user.id}, Farm ID: ${id}`);
    return res.json({ success: true, message: 'Farm deleted successfully' });
  } catch (err) {
    console.error('[Farms] Delete farm SQL failure:', err.message);
    return res.status(500).json({ error: 'Database error: Failed to delete farm', details: err.message });
  }
};

export const getUploadToken = async (req, res) => {
  const { fileName, contentType } = req.query;

  if (!fileName || !contentType) {
    return res.status(400).json({ error: 'Missing query parameters: fileName and contentType are required' });
  }

  try {
    const uploadData = await s3Service.getPresignedUploadUrl(fileName, contentType);
    return res.json(uploadData);
  } catch (err) {
    console.error('[Farms] S3 upload token failure:', err.message);
    return res.status(500).json({ error: 'Failed to generate secure upload credentials', details: err.message });
  }
};

// Local S3 disk upload emulator endpoint (PUT route)
// Receives raw binary data from client PUT requests and saves it under /uploads
export const handleMockUpload = async (req, res) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ error: 'Mock Upload: Missing file key' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'uploads', path.dirname(key));
    
    // Ensure nested directories (e.g. uploads/farms) exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const destPath = path.join(process.cwd(), 'uploads', key);
    const writeStream = fs.createWriteStream(destPath);
    
    req.pipe(writeStream);

    req.on('end', () => {
      console.log(`[S3 Mock Upload] Successfully wrote binary file to disk: uploads/${key}`);
      return res.status(200).json({ success: true, url: `/uploads/${key}` });
    });

    req.on('error', (err) => {
      console.error('[S3 Mock Upload] Request stream error:', err.message);
      return res.status(500).json({ error: 'File stream write failed' });
    });
  } catch (err) {
    console.error('[S3 Mock Upload] System crash:', err.message);
    return res.status(500).json({ error: 'Disk write failed', details: err.message });
  }
};

export const updateFarm = async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    latitude, 
    longitude, 
    cropType, 
    imageUrl, 
    windThreshold,
    rainThreshold,
    enabled,
    notifyEmail,
    emailAddress,
    notifySms,
    phoneNumber,
    notifyDiscord,
    discordWebhook,
    notifyInApp,
    region,
    country,
    timezone,
    city
  } = req.body;

  if (!name || latitude === undefined || longitude === undefined || !cropType) {
    return res.status(400).json({ error: 'Missing required fields: name, latitude, longitude, and cropType are required' });
  }

  try {
    const farm = await prisma.farm.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!farm) {
      return res.status(404).json({ error: 'Update failed: Farm not found or permission denied' });
    }

    const updated = await prisma.farm.update({
      where: { id },
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        cropType,
        imageUrl: imageUrl || null,
        city: city || null,
        region: region || null,
        country: country || null,
        timezone: timezone || null,
        alertConfig: {
          upsert: {
            create: {
              windThreshold: windThreshold !== undefined ? parseFloat(windThreshold) : 20.0,
              rainThreshold: rainThreshold !== undefined ? parseFloat(rainThreshold) : 10.0,
              enabled: enabled !== undefined ? Boolean(enabled) : true,
              notifyEmail: enabled ? Boolean(notifyEmail) : false,
              emailAddress: enabled && notifyEmail ? emailAddress || null : null,
              notifySms: enabled ? Boolean(notifySms) : false,
              phoneNumber: enabled && notifySms ? phoneNumber || null : null,
              notifyDiscord: enabled ? Boolean(notifyDiscord) : false,
              discordWebhook: enabled && notifyDiscord ? discordWebhook || null : null,
              notifyInApp: enabled ? Boolean(notifyInApp) : true
            },
            update: {
              windThreshold: windThreshold !== undefined ? parseFloat(windThreshold) : 20.0,
              rainThreshold: rainThreshold !== undefined ? parseFloat(rainThreshold) : 10.0,
              enabled: enabled !== undefined ? Boolean(enabled) : true,
              notifyEmail: enabled ? Boolean(notifyEmail) : false,
              emailAddress: enabled && notifyEmail ? emailAddress || null : null,
              notifySms: enabled ? Boolean(notifySms) : false,
              phoneNumber: enabled && notifySms ? phoneNumber || null : null,
              notifyDiscord: enabled ? Boolean(notifyDiscord) : false,
              discordWebhook: enabled && notifyDiscord ? discordWebhook || null : null,
              notifyInApp: enabled ? Boolean(notifyInApp) : true
            }
          }
        }
      },
      include: {
        alertConfig: true
      }
    });

    console.log(`[Farms] Updated PostgreSQL record with AlertConfig for User: ${req.user.id}, Farm ID: ${id}`);
    return res.json(updated);
  } catch (err) {
    console.error('[Farms] Update farm SQL failure:', err.message);
    return res.status(500).json({ error: 'Database error: Failed to update farm details', details: err.message });
  }
};
