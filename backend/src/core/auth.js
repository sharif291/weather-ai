import { firebaseAdmin } from './firebase.js';
import { prisma } from './db.js';

export const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify Firebase token (will run mock verifications if Firebase keys are absent)
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    
    const userPayload = {
      id: decodedToken.uid,
      email: decodedToken.email || `${decodedToken.uid}@terraclimate.demo`,
      name: decodedToken.name || 'Guest Farmer'
    };

    // Auto-sync User record in PostgreSQL
    // If user record doesn't exist, create it on-the-fly
    let dbUser = await prisma.user.findUnique({
      where: { id: userPayload.id }
    });

    if (!dbUser) {
      console.log(`[Auth Sync] Syncing new authenticated user to PostgreSQL: ${userPayload.email}`);
      dbUser = await prisma.user.create({
        data: {
          id: userPayload.id,
          email: userPayload.email,
          name: userPayload.name
        }
      });
    }

    // Attach verified user payload to the request
    req.user = dbUser;
    next();
  } catch (err) {
    console.error('[Auth Error] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication credentials' });
  }
};

export default verifyAuth;
