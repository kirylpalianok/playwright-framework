import { epic, feature, parentSuite, severity, story, subSuite, suite } from 'allure-js-commons';
import { Severity } from 'allure-js-commons';

const EPIC_NAME = 'Practice Automation Coverage';

export interface SuiteMetadata {
  /** Top-level Allure suite grouping, matching the architectural layer under test. */
  readonly layer: 'UI' | 'API';
  readonly suiteName: string;
  readonly subSuiteName: string;
  readonly featureName: string;
  readonly storyName: string;
  readonly severity?: Severity;
}

/**
 * Applies the framework's initial Allure suite hierarchy (epic, parent/sub suite,
 * feature, story, severity) to the currently running test. Kept as one shared module so
 * every specification reports under a consistent taxonomy (CLAUDE.md section 11).
 */
export async function applySuiteMetadata(metadata: SuiteMetadata): Promise<void> {
  await epic(EPIC_NAME);
  await parentSuite(metadata.layer);
  await suite(metadata.suiteName);
  await subSuite(metadata.subSuiteName);
  await feature(metadata.featureName);
  await story(metadata.storyName);
  await severity(metadata.severity ?? Severity.NORMAL);
}

export { Severity };
