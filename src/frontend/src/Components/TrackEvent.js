// Desc: Track events using Snowplow
export default function trackEvent(action, section, category, label, sub_label='') {
    window.snowplow('trackSelfDescribingEvent', {
        schema: 'iglu:ca.bc.gov.drivebc/action/jsonschema/1-0-0',
        data: {
          action: action,
          section: section,
          category: category,
          label: label,
          sub_label: sub_label,
        },
      });
}
