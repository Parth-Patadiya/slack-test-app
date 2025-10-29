import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import pkg from '@slack/bolt';
const { App, ExpressReceiver } = pkg;

import { WebClient } from '@slack/web-api';
import { registerEvents } from './src/events.js';
import { registerActions } from './src/actions.js';
import { Installation } from './src/models/installationModel.js';

// --- Connect to MongoDB ---
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  }
})();

// --- ExpressReceiver with OAuth setup ---
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET || 'some_random_secret',
  scopes: [
    'commands',
    'chat:write',
    'channels:read',
    'users:read'
  ],
  installationStore: {
    storeInstallation: async (installation) => {
      const workspaceId = installation.team?.id || installation.enterprise?.id;
      if (!workspaceId) throw new Error('No workspace ID found');

      await Installation.save(installation);
      console.log(`✅ Stored installation for workspace ${workspaceId}`);

      // --- Send a Welcome DM to the installer user ---
      const botToken = installation.bot?.token;
      const installerUserId = installation.user?.id;

      if (botToken && installerUserId) {
        const web = new WebClient(botToken);
        try {
          await web.chat.postMessage({
            channel: installerUserId,
            text: '👋 Welcome to *My Slack App*!',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `👋 *Welcome to My Slack App!* 🎉\n\nHere's what you can do:\n• Type \`/settings\` to configure your preferences.\n• Click ⚙️ *Configure* in the App Home tab.\n• Get daily or weekly digests automatically!`,
                },
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: '⚙️ Open Settings' },
                    action_id: 'settings',
                  },
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: '📘 Learn More' },
                    url: '#',
                  },
                ],
              },
            ],
          });
          console.log(`💬 Sent welcome DM to ${installerUserId}`);
        } catch (err) {
          console.error('⚠️ Failed to send welcome DM:', err);
        }
      }
    },
    fetchInstallation: async (installQuery) => {
      const workspaceId = installQuery.teamId || installQuery.enterpriseId;
      const installation = await Installation.find(workspaceId);
      if (!installation) throw new Error('No installation found');
      return installation;
    },
    deleteInstallation: async (installQuery) => {
      const workspaceId = installQuery.teamId || installQuery.enterpriseId;
      await Installation.delete(workspaceId);
      console.log(`🗑️ Deleted installation for workspace ${workspaceId}`);
    },
  },
  installerOptions: {
    redirectUriPath: '/slack/oauth_redirect',
    redirectUri: process.env.SLACK_REDIRECT_URI,
    userScopes: ['chat:write', 'channels:history'],
  },
  endpoints: {
    events: '/slack/events',
    actions: '/slack/interactivity',
  },
});

// --- App Instance ---
const app = new App({ receiver });

// --- Register event/action handlers ---
registerEvents(app);
registerActions(app);

// --- Start the server ---
(async () => {
  const port = process.env.PORT || 3000;
  await receiver.app.listen(port);
  console.log(`⚡️ Slack multi-tenant app running on port ${port}`);
})();
