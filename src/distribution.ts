import {
  evaluateDistributionGate,
  type TrackPackage,
} from "./catalog";

export type DistributionRequest = {
  kind: "music.distribute_requested";
  project: "music-catalog";
  source: "mengine";
  authorized: true;
  payload: {
    track_id: string;
    title: string;
    distribution_gate_passed: true;
    sources?: TrackPackage["sources"];
    metadata: TrackPackage["metadata"];
    assets: TrackPackage["assets"];
    technical: TrackPackage["technical"];
    ratings: TrackPackage["ratings"];
  };
};

export type DistributionHandoffResult = {
  ok: boolean;
  reason: string;
  jobId?: string;
  queuePath?: string;
};

export const buildDistributionRequest = (
  track: TrackPackage,
): DistributionRequest => {
  const gate = evaluateDistributionGate(track);
  if (!gate.ready) {
    throw new Error(
      `distribution gate failed: ${gate.missingRequired
        .map((item) => item.label)
        .join(", ")}`,
    );
  }

  return {
    kind: "music.distribute_requested",
    project: "music-catalog",
    source: "mengine",
    authorized: true,
    payload: {
      track_id: track.id,
      title: track.metadata.title,
      distribution_gate_passed: true,
      sources: track.sources,
      metadata: track.metadata,
      assets: track.assets,
      technical: track.technical,
      ratings: track.ratings,
    },
  };
};

export const handoffDistribution = async (
  track: TrackPackage,
  endpoint = "http://127.0.0.1:8765",
): Promise<DistributionHandoffResult> => {
  let request: DistributionRequest;
  try {
    request = buildDistributionRequest(track);
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "distribution_gate_failed",
    };
  }

  try {
    const response = await fetch(`${endpoint}/api/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BlackMamba-User-Action": "explicit",
      },
      body: JSON.stringify(request),
    });
    const body = (await response.json()) as {
      ok?: boolean;
      reason?: string;
      job?: { job_id?: string };
      queue_path?: string;
      error?: string;
    };

    return {
      ok: response.ok && body.ok === true,
      reason: body.reason ?? body.error ?? `http_${response.status}`,
      jobId: body.job?.job_id,
      queuePath: body.queue_path,
    };
  } catch {
    return {
      ok: false,
      reason: "automator_unreachable",
    };
  }
};
