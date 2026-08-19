import { Secret } from '../models/Secret.js';
import { encryptSecret, decryptSecret } from '../utils/encryption.js';
import { isDBConnected } from '../config/db.js';

const memorySecrets = new Map(); // Key: `${userId}:${keyName}` -> { key, encryptedData, iv, tag, updatedAt }

export async function setSecret(req, res) {
  try {
    const { key, value } = req.body;
    if (!key || !value) {
      return res.status(400).json({ success: false, message: 'Secret key and value are required.' });
    }

    const userId = req.user._id || req.user.id;
    const cleanKey = key.toUpperCase().trim();
    const { encryptedData, iv, tag } = encryptSecret(value);

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const secret = await Secret.findOneAndUpdate(
        { userId, key: cleanKey },
        { encryptedData, iv, tag },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: `Secret ${cleanKey} saved successfully.`,
        secret: { id: secret._id, key: secret.key, updatedAt: secret.updatedAt }
      });
    } else {
      const memKey = `${userId}:${cleanKey}`;
      const secretObj = {
        key: cleanKey,
        encryptedData,
        iv,
        tag,
        updatedAt: new Date()
      };
      memorySecrets.set(memKey, secretObj);
      return res.status(200).json({
        success: true,
        message: `Secret ${cleanKey} saved successfully (In-Memory)`,
        secret: { id: memKey, key: cleanKey, updatedAt: secretObj.updatedAt }
      });
    }
  } catch (error) {
    console.error('Set secret error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getSecretsList(req, res) {
  try {
    const userId = req.user._id || req.user.id;

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const secrets = await Secret.find({ userId }).select('key createdAt updatedAt');
      return res.status(200).json({ success: true, secrets });
    } else {
      const prefix = `${userId}:`;
      const secrets = Array.from(memorySecrets.entries())
        .filter(([k]) => k.startsWith(prefix))
        .map(([_, val]) => ({ key: val.key, createdAt: val.updatedAt, updatedAt: val.updatedAt }));
      return res.status(200).json({ success: true, secrets });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteSecret(req, res) {
  try {
    const { key } = req.params;
    const userId = req.user._id || req.user.id;
    const cleanKey = key.toUpperCase().trim();

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      await Secret.findOneAndDelete({ userId, key: cleanKey });
    } else {
      memorySecrets.delete(`${userId}:${cleanKey}`);
    }

    return res.status(200).json({
      success: true,
      message: `Secret ${cleanKey} deleted.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Internal helper to retrieve and decrypt all user secrets for runtime execution injection
 */
export async function getDecryptedUserSecrets(userId) {
  try {
    if (isDBConnected()) {
      const secrets = await Secret.find({ userId });
      const decryptedMap = {};
      for (const sec of secrets) {
        decryptedMap[sec.key] = decryptSecret(sec.encryptedData, sec.iv, sec.tag);
      }
      return decryptedMap;
    } else {
      const prefix = `${userId}:`;
      const decryptedMap = {};
      for (const [k, val] of memorySecrets.entries()) {
        if (k.startsWith(prefix)) {
          decryptedMap[val.key] = decryptSecret(val.encryptedData, val.iv, val.tag);
        }
      }
      return decryptedMap;
    }
  } catch (error) {
    console.error('Failed to load user secrets:', error.message);
    return {};
  }
}
