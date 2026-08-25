"use client";

import { use } from "react";
import { RecruiterApplicationDetail } from "@/components/applications/recruiter-application-detail";

export default function Page({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  return <RecruiterApplicationDetail applicationId={applicationId} />;
}
