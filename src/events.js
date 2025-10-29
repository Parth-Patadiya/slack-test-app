import { renderAppHome } from "./appHome.js";

export function registerEvents(app) {
  app.event("app_home_opened", async ({ event, client }) => {
    try {
      const viewData = await renderAppHome(client, event?.view?.team_id);

      await client.views.publish({
        user_id: event.user,
        view: viewData,
      });
    } catch (error) {
      console.error("Error publishing Home tab:", error);
    }
  });
}
