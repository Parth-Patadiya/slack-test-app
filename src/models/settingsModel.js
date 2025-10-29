import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  channels: { type: [String], default: [] },    // array of channel IDs  
  vips: { type: [String], default: [] },        // array of user IDs
  keywords: { type: [String], default: [] },    // array of keywords
  schedule: { type: String, enum: ['daily', 'weekly', 'both'], default: 'daily' },
  updatedAt: { type: Date, default: Date.now },
});

const SettingsModel = mongoose.model('Settings', settingsSchema);

/**
 * Save or update workspace settings
 * @param {string} teamId
 * @param {{channels: string[], vips: string[], keywords: string[], schedule: string}} settings
 */
export async function saveWorkspaceSettings(teamId, settings) {
  const doc = await SettingsModel.findOneAndUpdate(
    { teamId },
    {
      teamId,
      channels: settings.channels || [],
      vips: settings.vips || [],
      keywords: settings.keywords || [],
      schedule: settings.schedule || 'daily',
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );
  return doc;
}

/** Helper to retrieve settings */
export async function getWorkspaceSettings(teamId) {
  return await SettingsModel.findOne({ teamId }).lean();
}
