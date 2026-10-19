import { INLINE } from '@/analytics/inlinePlacements';
import { InlineLab } from '@/components/InlineLab';

export default function Screen3() {
  return (
    <InlineLab
      placement={INLINE.screen3}
      blurb="One Custom-View In-Line campaign. The app draws it from the data the SDK delivers, and reports the impression and any tap."
    />
  );
}
