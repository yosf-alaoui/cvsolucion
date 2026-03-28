import { createJsonHttpClient, type JsonHttpClientOptions } from "../shared/http";
import type { TrackInteractionPayload, TrackVisitPayload, VisitorRecord } from "./contracts";

type CreateVisitorTrackingModuleClientOptions = JsonHttpClientOptions & {
  visitPath?: string;
  interactionPath?: string;
};

export function createVisitorTrackingModuleClient(
  options: CreateVisitorTrackingModuleClientOptions = {}
) {
  const request = createJsonHttpClient(options);
  const visitPath = options.visitPath || "/api/analytics/visit";
  const interactionPath = options.interactionPath || "/api/analytics/interaction";

  return {
    trackVisit(payload: TrackVisitPayload) {
      return request<{ ok: true; visitor: VisitorRecord }>(visitPath, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    trackInteraction(payload: TrackInteractionPayload) {
      return request<{ ok: true; visitor: VisitorRecord | null }>(interactionPath, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}
