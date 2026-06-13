import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  Activity as ActivityIcon,
  Archive as ArchiveIcon,
  ArrowRight as ArrowRightIcon,
  Award as AwardIcon,
  BookOpen as BookOpenIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CircleAlert as AlertCircleIcon,
  CircleCheck as CheckCircleIcon,
  Clipboard as ClipboardIcon,
  Clock as ClockIcon,
  Loader as LoaderIcon,
  Lock as LockIcon,
  Pencil as Edit2Icon,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
  RotateCcw as RotateCcwIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  SquareCheckBig as CheckSquareIcon,
  Trash2 as Trash2Icon,
  Upload as UploadIcon,
  User as UserIcon,
  X as XIcon,
} from 'lucide-react';

type IconProps = Omit<LucideProps, 'ref'>;

function createIcon(Base: LucideIcon) {
  return function Icon({ className, ...props }: IconProps) {
    return <Base className={`feather-icon${className ? ` ${className}` : ''}`} {...props} />;
  };
}

export const Activity = createIcon(ActivityIcon);
export const AlertCircle = createIcon(AlertCircleIcon);
export const Archive = createIcon(ArchiveIcon);
export const ArrowRight = createIcon(ArrowRightIcon);
export const Award = createIcon(AwardIcon);
export const BookOpen = createIcon(BookOpenIcon);
export const Check = createIcon(CheckIcon);
export const CheckCircle = createIcon(CheckCircleIcon);
export const CheckSquare = createIcon(CheckSquareIcon);
export const ChevronDown = createIcon(ChevronDownIcon);
export const ChevronLeft = createIcon(ChevronLeftIcon);
export const ChevronRight = createIcon(ChevronRightIcon);
export const Clipboard = createIcon(ClipboardIcon);
export const Clock = createIcon(ClockIcon);
export const Edit2 = createIcon(Edit2Icon);
export const Loader = createIcon(LoaderIcon);
export const Lock = createIcon(LockIcon);
export const Plus = createIcon(PlusIcon);
export const RefreshCw = createIcon(RefreshCwIcon);
export const RotateCcw = createIcon(RotateCcwIcon);
export const Send = createIcon(SendIcon);
export const Settings = createIcon(SettingsIcon);
export const Trash2 = createIcon(Trash2Icon);
export const Upload = createIcon(UploadIcon);
export const User = createIcon(UserIcon);
export const X = createIcon(XIcon);
