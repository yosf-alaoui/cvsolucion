import type { VisitorTrackingEvent } from "./contracts";

export type ClientAnalyticsOptions = {
  sendEvent: (event: VisitorTrackingEvent) => void;
  pushDataLayer?: (payload: Record<string, unknown>) => void;
};

export function createClientAnalyticsModule(options: ClientAnalyticsOptions) {
  return {
    trackVirtualPageView(payload: {
      path: string;
      title: string;
      locale: string;
      userStatus: "anonymous" | "registered";
      search?: string;
    }) {
      options.pushDataLayer?.({
        event: "virtual_pageview",
        page_title: payload.title,
        page_path: payload.path,
        page_search: payload.search || "",
        locale: payload.locale,
        user_status: payload.userStatus,
      });
    },
    trackInteraction(event: VisitorTrackingEvent) {
      options.sendEvent(event);
    },
  };
}

