// src/utils/storage.js
import mongoose from "mongoose";

const installationSchema = new mongoose.Schema({}, { strict: false });
const Installation = mongoose.model("Installation", installationSchema);

// Save new installation or update existing one
export const saveInstallation = async (installation) => {
  try {
    const query = {
      teamId: installation.team?.id,
      enterpriseId: installation.enterprise?.id,
    };
    await Installation.findOneAndUpdate(query, installation, { upsert: true });
    console.log("✅ Installation saved:", installation.team?.id);
  } catch (error) {
    console.error("❌ Error saving installation:", error);
    throw error;
  }
};

// Fetch installation for event authorization
export const fetchInstallation = async (installQuery) => {
  try {
    const query = {
      teamId: installQuery.teamId,
      enterpriseId: installQuery.enterpriseId,
    };
    const record = await Installation.findOne(query);
    if (!record) {
      console.warn("⚠️ Installation not found:", query);
      throw new Error("Installation not found");
    }
    return record;
  } catch (error) {
    console.error("❌ Error fetching installation:", error);
    throw error;
  }
};
