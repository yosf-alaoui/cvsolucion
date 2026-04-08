import type { SeoServicePageKey } from "./seoServicePages";

export type SeoServicePageImageSet = {
  hero: string;
  mid: string;
  preCta: string;
};

const BASE_PATH = "/images/seo-services";

export const SEO_SERVICE_PAGE_IMAGES: Record<SeoServicePageKey, SeoServicePageImageSet> = {
  support: {
    hero: `${BASE_PATH}/cabinet-vision-support-cabinet-shop-workflow.webp`,
    mid: `${BASE_PATH}/cabinet-vision-support-reporting-and-production-review.webp`,
    preCta: `${BASE_PATH}/cabinet-vision-support-team-collaboration.webp`,
  },
  troubleshooting: {
    hero: `${BASE_PATH}/cabinet-vision-troubleshooting-software-error-analysis.webp`,
    mid: `${BASE_PATH}/cabinet-vision-troubleshooting-report-mismatch.webp`,
    preCta: `${BASE_PATH}/cabinet-vision-troubleshooting-root-cause-workflow.webp`,
  },
  "library-setup": {
    hero: `${BASE_PATH}/cabinet-vision-library-setup-material-organization.webp`,
    mid: `${BASE_PATH}/cabinet-vision-library-cleanup-assemblies-and-standards.webp`,
    preCta: `${BASE_PATH}/cabinet-vision-library-team-standardization.webp`,
  },
  "cnc-integration": {
    hero: `${BASE_PATH}/cabinet-vision-cnc-integration-machine-ready-output.webp`,
    mid: `${BASE_PATH}/cabinet-vision-cnc-output-review.webp`,
    preCta: `${BASE_PATH}/cabinet-vision-cnc-operator-trust.webp`,
  },
  "performance-optimization": {
    hero: `${BASE_PATH}/cabinet-vision-performance-optimization-fast-workstation.webp`,
    mid: `${BASE_PATH}/cabinet-vision-system-stability-review.webp`,
    preCta: `${BASE_PATH}/cabinet-vision-efficient-design-workflow.webp`,
  },
  "install-backup-restore": {
    hero: `${BASE_PATH}/cabinet-vision-install-backup-restore-secure-workflow.webp`,
    mid: `${BASE_PATH}/cabinet-vision-migration-and-upgrade-review.webp`,
    preCta: `${BASE_PATH}/cabinet-vision-recovery-workflow-validation.webp`,
  },
  "custom-programming": {
    hero: `${BASE_PATH}/cabinet-vision-custom-programming-ucs-automation.webp`,
    mid: `${BASE_PATH}/cabinet-vision-custom-reports-and-logic.webp`,
    preCta: `${BASE_PATH}/cabinet-vision-automation-for-cabinet-factory.webp`,
  },
};

export function getSeoServicePageImageSet(key: SeoServicePageKey) {
  return SEO_SERVICE_PAGE_IMAGES[key];
}
