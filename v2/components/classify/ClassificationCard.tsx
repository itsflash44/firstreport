'use client';

import type { Classification, LangCode } from '../../types/index';
import { t } from '../../types/i18n';

interface ClassificationCardProps {
  classification: Classification;
  language: LangCode;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
};

export function ClassificationCard({ classification, language }: ClassificationCardProps) {
  return (
    <div className="bg-white rounded-xl border border-cool-gray shadow-sm p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">
            BNSS Section
          </p>
          <p className="text-lg font-semibold text-navy mt-0.5">
            {classification.bnss_section}
          </p>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${CONFIDENCE_STYLES[classification.confidence]}`}>
          {classification.confidence}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-text-secondary font-medium">
            {language === 'en-IN' ? 'Offense' : 'अपराध'}
          </p>
          <p className="text-sm text-navy font-medium">
            {classification.offense_name_hindi}
          </p>
          <p className="text-xs text-text-secondary">
            {classification.offense_name_english}
          </p>
        </div>

        <div>
          <p className="text-xs text-text-secondary font-medium">
            {language === 'en-IN' ? 'Rationale' : 'कारण'}
          </p>
          <p className="text-sm text-navy">
            {classification.rationale_hindi}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-cool-gray">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${classification.is_cognizable ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-xs text-text-secondary">
            {classification.is_cognizable ? 'Cognizable' : 'Non-cognizable'}
          </span>
        </div>
        <div className="text-xs text-text-secondary">
          {classification.punishment}
        </div>
      </div>
    </div>
  );
}
