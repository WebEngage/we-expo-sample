import { INLINE } from '@/analytics/inlinePlacements';
import { InlineLab } from '@/components/InlineLab';

export default function Screen4() {
  return (
    <InlineLab
      placement={INLINE.screen4}
      blurb="A campaign that throws while rendering. The placeholder exception is handled: nothing is shown and the app carries on."
    />
  );
}
