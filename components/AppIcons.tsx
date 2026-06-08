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
export const Archive = createIcon('archive');
export const ArrowRight = createIcon('arrow-right');
export const Award = createIcon('award');
export const BookOpen = createIcon('book-open');
export const Check = createIcon('check');
export const CheckCircle = createIcon('check-circle');
export const CheckSquare = createIcon('check-square');
export const ChevronDown = createIcon('chevron-down');
export const ChevronLeft = createIcon('chevron-left');
export const ChevronRight = createIcon('chevron-right');
export const Clipboard = createIcon('clipboard');
export const Clock = createIcon('clock');
export const Edit2 = createIcon('edit-2');
export const Lock = createIcon('lock');
export const Plus = createIcon('plus');
export const RefreshCw = createIcon('refresh-cw');
export const RotateCcw = createIcon('rotate-ccw');
export const Send = createIcon('send');
export const Settings = createIcon('settings');
export const Trash2 = createIcon('trash-2');
export const Upload = createIcon('upload');
export const User = createIcon('user');
export const X = createIcon('x');
