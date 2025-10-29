import { renderAppHome } from "./appHome.js";
import {
  saveWorkspaceSettings,
} from "./models/settingsModel.js";

export function registerActions(app) {
  // Open settings modal from Home tab button
  app.action("settings", async ({ ack, body, client }) => {
    await ack();
    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: "settings_modal",
          title: { type: "plain_text", text: "App Settings" },
          submit: { type: "plain_text", text: "Save" },
          close: { type: "plain_text", text: "Cancel" },
          blocks: [
            {
              type: "input",
              block_id: "channels_block",
              element: {
                type: "multi_channels_select",
                placeholder: { type: "plain_text", text: "Select channels" },
                action_id: "channels",
              },
              label: { type: "plain_text", text: "Channels to follow" },
            },
            {
              type: "input",
              block_id: "vip_block",
              element: {
                type: "multi_users_select",
                placeholder: { type: "plain_text", text: "Add VIP people" },
                action_id: "vips",
              },
              label: { type: "plain_text", text: "VIP Users" },
            },
            {
              type: "input",
              block_id: "keywords_block",
              element: {
                type: "plain_text_input",
                multiline: false,
                action_id: "keywords",
                placeholder: {
                  type: "plain_text",
                  text: "e.g. urgent, client, release",
                },
              },
              label: { type: "plain_text", text: "Keywords (comma-separated)" },
            },
            {
              type: "input",
              block_id: "schedule_block",
              element: {
                type: "static_select",
                action_id: "schedule",
                options: [
                  {
                    text: { type: "plain_text", text: "Daily at 9 AM" },
                    value: "daily",
                  },
                  {
                    text: { type: "plain_text", text: "Weekly" },
                    value: "weekly",
                  },
                  { text: { type: "plain_text", text: "Both" }, value: "both" },
                ],
              },
              label: { type: "plain_text", text: "Digest schedule" },
            },
          ],
        },
      });
    } catch (err) {
      console.error("Error opening modal:", err);
    }
  });

  // Handle settings modal submission
  app.view("settings_modal", async ({ ack, body, view, client }) => {
    await ack();

    try {
      const user = body.user.id;
      const teamId = body.team.id;
      const values = view.state.values;

      // Extract values safely with optional chaining + defaults
      const channels =
        values?.channels_block?.channels?.selected_channels || [];
      const vips = values?.vip_block?.vips?.selected_users || [];
      const keywordsRaw = values?.keywords_block?.keywords?.value || "";
      const keywords = keywordsRaw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const schedule =
        values?.schedule_block?.schedule?.selected_option?.value || "daily";

      const settings = { channels, vips, keywords, schedule };

      await saveWorkspaceSettings(teamId, settings);
      const viewData = await renderAppHome(client, teamId);
      await client.views.publish({
        user_id: body.user.id,
        view: viewData,
      });

      // Confirmation message to the user who submitted modal
      await client.chat.postMessage({
        channel: user,
        text: `✅ Your settings have been saved!
📺 Channels: ${channels.length}
⭐ VIPs: ${vips.length}
🏷️ Keywords: ${keywords.join(", ") || "—"}
⏰ Schedule: ${schedule}`,
      });
    } catch (err) {
      console.error("Error handling settings_modal submit:", err);
    }
  });
}
