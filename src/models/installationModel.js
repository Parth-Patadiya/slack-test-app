// src/models/installationModel.js
import mongoose from "mongoose";
import { WebClient } from '@slack/web-api';

// Define schema for installation data
const installationSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  installation: { type: Object, required: true },
});

// Create model
const InstallationModel = mongoose.model("Installation", installationSchema);

// Export helper functions
export const Installation = {
  async save(installation) {
    const teamId = installation.team?.id || installation.enterprise?.id;
    if (!teamId) throw new Error("No team or enterprise ID found");

    await InstallationModel.findOneAndUpdate(
      { teamId },
      { installation },
      { upsert: true, new: true }
    );

    // --- Send Welcome DM to installer ---
    try {
      const web = new WebClient(installation.bot?.token);
      await web.chat.postMessage({
        channel: installation.user?.id, // send DM to installer
        text: `👋 Thanks for installing the app! I'm here to help you stay on top of important messages.

You can configure me anytime by typing */settings* or opening the Home tab ⚙️.`,
      });
      console.log(`📨 Sent welcome message to ${installation.user?.id}`);
    } catch (error) {
      console.error("❌ Failed to send welcome DM:", error);
    }

    console.log(`✅ Stored installation for workspace ${teamId}`);
  },

  async find(teamId) {
    const record = await InstallationModel.findOne({ teamId });
    return record ? record.installation : null;
  },

  async delete(teamId) {
    await InstallationModel.deleteOne({ teamId });
    console.log(`🗑️ Deleted installation for workspace ${teamId}`);
  },
};
