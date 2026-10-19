import { INLINE } from '@/analytics/inlinePlacements';
import { InlineLab } from '@/components/InlineLab';

export default function Screen1() {
  return <InlineLab placement={INLINE.screen1} blurb="One Text-view In-Line campaign, drawn by the SDK's widget." />;
}
