'use client';

import CourseCertificatePage from '@/app/certificate/[courseId]/page';

export default function CertificateByHashPage({
  params,
}: {
  params: { hash: string };
}) {
  return <CourseCertificatePage params={{ courseId: params.hash }} />;
}
