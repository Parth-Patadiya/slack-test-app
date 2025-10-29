import { getWorkspaceSettings } from "./models/settingsModel.js";

async function getChannelNames(client, channelIds) {
  const names = [];
  for (const id of channelIds) {
    try {
      const res = await client.conversations.info({ channel: id });
      names.push(res.channel.name);
    } catch (err) {
      console.error('Error fetching channel name:', err);
      names.push(id); // fallback to ID
    }
  }
  return names;
}

async function getUserNames(client, userIds) {
  const names = [];
  for (const id of userIds) {
    try {
      const res = await client.users.info({ user: id });
      names.push(res.user.real_name || res.user.name);
    } catch (err) {
      console.error('Error fetching user name:', err);
      names.push(id); // fallback to ID
    }
  }
  return names;
}

export async function renderAppHome(client, teamId) {
  const settings = await getWorkspaceSettings(teamId);
  const channels = settings?.channels?.length
    ? (await getChannelNames(client, settings.channels)).join(', ')
    : 'No channels selected';

    
  const vips = settings?.vips?.length
    ? (await getUserNames(client, settings.vips)).join(', ')
    : 'No VIP users added';

  const keywords = settings?.keywords?.length
    ? settings.keywords.join(', ')
    : 'No keywords added';
    
  const schedule = settings?.schedule || 'daily';

  return {
    type: 'home',
    callback_id: 'home_view',
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⚙️ Workspace Settings' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Channels:* ${channels}\n*VIP Users:* ${vips}\n*Keywords:* ${keywords}\n*Schedule:* ${schedule}`,
        },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: 'Edit Settings' },
          action_id: 'settings',
        },
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Last updated: ${settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Never'}`,
          },
        ],
      },
    ],
  };
}
