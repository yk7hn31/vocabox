import type { FeatherIconName, FeatherIconProps } from '@/components/FeatherIcon';
import { FeatherIcon } from '@/components/FeatherIcon';

type IconProps = Omit<FeatherIconProps, 'name'>;

function createIcon(name: FeatherIconName) {
  return function Icon({ className, ...props }: IconProps) {
    return <FeatherIcon className={`feather-icon${className ? ` ${className}` : ''}`} name={name} {...props} />;
  };
}

export const Activity = createIcon('activity');
export const AlertCircle = createIcon('alert-circle');
export const ArrowRight = createIcon('arrow-right');
export const Award = createIcon('award');
export const BookOpen = createIcon('book-open');
export const Check = createIcon('check');
export const CheckCircle = createIcon('check-circle');
export const CheckSquare = createIcon('check-square');
export const ChevronDown = createIcon('chevron-down');
export const Clipboard = createIcon('clipboard');
export const Edit2 = createIcon('edit-2');
export const Plus = createIcon('plus');
export const RefreshCw = createIcon('refresh-cw');
export const Send = createIcon('send');
export const Settings = createIcon('settings');
export const User = createIcon('user');
export const X = createIcon('x');
