import { icons, type FeatherIconNames } from 'feather-icons';
import type { SVGProps } from 'react';

export type FeatherIconName = FeatherIconNames;

export interface FeatherIconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'dangerouslySetInnerHTML'> {
  name: FeatherIconName;
}

export function FeatherIcon({ name, className, ...props }: FeatherIconProps) {
  const icon = icons[name];
  const attrs = icon.attrs;

  return (
    <svg
      aria-hidden="true"
      className={`${attrs.class}${className ? ` ${className}` : ''}`}
      fill={attrs.fill}
      height={attrs.height}
      stroke={attrs.stroke}
      strokeLinecap={attrs['stroke-linecap']}
      strokeLinejoin={attrs['stroke-linejoin'] as SVGProps<SVGSVGElement>['strokeLinejoin']}
      strokeWidth={attrs['stroke-width']}
      viewBox={attrs.viewBox}
      width={attrs.width}
      xmlns={attrs.xmlns}
      {...props}
      dangerouslySetInnerHTML={{ __html: icon.contents }}
    />
  );
}
