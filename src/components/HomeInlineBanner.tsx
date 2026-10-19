import React from 'react';

import { INLINE } from '@/analytics/inlinePlacements';
import { InlineWidgetSlot } from '@/components/InlineSlots';

/** WebEngage In-Line Banner on Home (`home_banner` on Android, `1001` on iOS, screen `home`). Hidden until a
 *  campaign has actually rendered, so there is no empty box when none is running. */
export function HomeInlineBanner() {
  return <InlineWidgetSlot placement={INLINE.home} collapseWhenEmpty />;
}
