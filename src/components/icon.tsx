import { iconPaths, type IconName } from './icon-paths';

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  title?: string;
};

export function Icon({ name, size = 20, className, strokeWidth = 1.75, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: iconPaths[name] }}
    />
  );
}
