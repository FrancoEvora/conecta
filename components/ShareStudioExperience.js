"use client";

import ShareComposer from "@/components/ShareComposer";

export default function ShareStudioExperience({ invitation, code, baseUrl, hostname }) {
  return <ShareComposer
    invitation={invitation}
    code={code}
    baseUrl={baseUrl}
    hostname={hostname}
  />;
}
