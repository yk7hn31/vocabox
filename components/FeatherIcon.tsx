import { icons, type FeatherIconNames } from 'feather-icons';
import type { SVGProps } from 'react';

export type FeatherIconName = FeatherIconNames;

export interface FeatherIconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'dangerouslySetInnerHTML'> {
  name: FeatherIconName;
}

export function FeatherIcon({
  name,
  className,
  fill,
  height,
  stroke,
  strokeWidth,
  width,
  ...props
}: FeatherIconProps) {
  const icon = icons[name];
  const attrs = icon.attrs;

  return (
    <svg
      aria-hidden="true"
      className={`${attrs.class}${className ? ` ${className}` : ''}`}
      fill={fill ?? attrs.fill}
      height={height ?? attrs.height}
      stroke={stroke ?? attrs.stroke}
      strokeLinecap={attrs['stroke-linecap']}
      strokeLinejoin={attrs['stroke-linejoin'] as SVGProps<SVGSVGElement>['strokeLinejoin']}
      strokeWidth={strokeWidth ?? attrs['stroke-width']}
      viewBox={attrs.viewBox}
      width={width ?? attrs.width}
      xmlns={attrs.xmlns}
      {...props}
      dangerouslySetInnerHTML={{ __html: icon.contents }}
    />
  );
}
