import { SVGProps } from 'react';

const baseProps: Pick<SVGProps<SVGSVGElement>, 'role' | 'aria-hidden' | 'fill'> = {
  role: 'img',
  'aria-hidden': true,
  fill: 'currentColor'
};

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 0 1 0-2h6V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function IconMinus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M5 11a1 1 0 0 0 0 2h14a1 1 0 1 0 0-2H5Z" />
    </svg>
  );
}

export function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M9.293 4.293a1 1 0 0 0 0 1.414L14.586 11l-5.293 5.293a1 1 0 1 0 1.414 1.414l6-6a1 1 0 0 0 0-1.414l-6-6a1 1 0 0 0-1.414 0Z" />
    </svg>
  );
}

export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M5.293 9.293a1 1 0 0 1 1.414 0L12 14.586l5.293-5.293a1 1 0 1 1 1.414 1.414l-6 6a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414Z" />
    </svg>
  );
}

export function IconEdit(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M17.657 3.929a3 3 0 0 1 0 4.242l-9.192 9.192a1 1 0 0 1-.41.252l-3.536 1.061a1 1 0 0 1-1.265-1.265l1.06-3.536a1 1 0 0 1 .252-.41l9.193-9.192a3 3 0 0 1 4.242 0Zm-3.536 3.536l-7.9 7.9l-.53 1.768l1.768-.53l7.9-7.9l-1.238-1.238Z" />
    </svg>
  );
}

export function IconTrash(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 0 0 0 2H6l.84 11.082A2 2 0 0 0 8.836 20h6.328a2 2 0 0 0 1.996-1.918L18 7h.5a1 1 0 0 0 0-2H16V4a1 1 0 0 0-1-1H9Zm1 2h4v1h-4V5Zm-1.16 2h6.32l-.8 10.536a.5.5 0 0 1-.498.464H8.836a.5.5 0 0 1-.498-.464L7.84 7Z" />
    </svg>
  );
}

export function IconRefresh(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 4a8 8 0 1 1-7.446 5.03a1 1 0 1 1 1.884-.666A6 6 0 1 0 12 6V3a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1h-4a1 1 0 1 1 0-2h2V4Z" />
    </svg>
  );
}

export function IconLink(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M13.06 4.94a5.5 5.5 0 0 1 7.778 7.778l-1.768 1.768a2 2 0 1 1-2.828-2.828l1.768-1.768a1.5 1.5 0 1 0-2.121-2.121l-1.768 1.768a5 5 0 0 1-7.071 0a5 5 0 0 1 0-7.071l1.768-1.768a2 2 0 1 1 2.828 2.828l-1.768 1.768a1.5 1.5 0 1 0 2.121 2.121l1.768-1.768Z" />
    </svg>
  );
}

export function IconCube(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M11.11 2.63a2 2 0 0 1 1.78 0l6.38 3.2A2 2 0 0 1 20 7.64v8.72a2 2 0 0 1-1.08 1.81l-6.38 3.2a2 2 0 0 1-1.78 0l-6.38-3.2A2 2 0 0 1 4 16.36V7.64a2 2 0 0 1 1.08-1.81l6.03-3.03Zm.89 2.25L7 7.09l5 2.53 5-2.53-5-2.21Zm-6 4.4v6.65l5 2.53V11.8l-5-2.53Zm7 9.18 5-2.53V9.28l-5 2.53v6.65Z" />
    </svg>
  );
}

export function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 2a5 5 0 1 1 0 10a5 5 0 0 1 0-10Zm0 12c4.418 0 8 3.132 8 7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1c0-3.868 3.582-7 8-7Z" />
    </svg>
  );
}

export function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9ZM7 5H5a1 1 0 0 0-1 1v2h16V6a1 1 0 0 0-1-1h-2v1a1 1 0 1 1-2 0V5H9v1a1 1 0 1 1-2 0V5Z" />
    </svg>
  );
}

export function IconSpark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M8.37 3.1a1 1 0 0 1 1.26.63L10.5 7l3.26.87a1 1 0 0 1 0 1.94L10.5 10.7 9.63 14a1 1 0 0 1-1.94 0L6.87 10.7 3.6 9.81a1 1 0 0 1 0-1.94L6.87 7l.87-3.27a1 1 0 0 1 .63-.63ZM17 4a1 1 0 0 1 .96.73l.35 1.27 1.27.35a1 1 0 0 1 0 1.92l-1.27.35-.35 1.27a1 1 0 0 1-1.92 0l-.35-1.27-1.27-.35a1 1 0 0 1 0-1.92l1.27-.35.35-1.27A1 1 0 0 1 17 4Zm-1.5 8a1 1 0 0 1 .96.73l.54 1.98 1.97.54a1 1 0 0 1 0 1.92l-1.97.54-.54 1.98a1 1 0 0 1-1.92 0l-.54-1.98-1.97-.54a1 1 0 0 1 0-1.92l1.97-.54.54-1.98a1 1 0 0 1 .96-.73Z" />
    </svg>
  );
}

export function IconBoot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M9 2h4a2 2 0 0 1 2 2v8h2.5A2.5 2.5 0 0 1 20 14.5V19a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3h2V4a2 2 0 0 1 2-2Zm0 2v6h4V4H9Zm-2 8a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2.5a.5.5 0 0 0-.5-.5H12a1 1 0 0 1-1-1v-2.5H7Z" />
    </svg>
  );
}

export function IconLayers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Zm0 7.118L4.47 8.235 3 9.058 12 14l9-4.942-1.47-.823L12 10.118Zm0 4L4.47 12.235 3 13.058 12 18l9-4.942-1.47-.823L12 14.118Z" />
    </svg>
  );
}

export function IconPack(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M9 2h6a3 3 0 0 1 3 3v2h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1V5a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v2h8V5a1 1 0 0 0-1-1H9Zm10 6H5v9h14v-9Zm-5 3a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function IconCompass(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm4.24 4.24-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Zm-4.83 4.83 1.06-3.18-3.18 1.06-1.06 3.18 3.18-1.06Z" />
    </svg>
  );
}

export function IconTent(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M11.34 3.3a1 1 0 0 1 1.32 0l8.5 14a1 1 0 0 1-.82 1.7H3.66a1 1 0 0 1-.82-1.7l8.5-14Zm.66 3.3L5.27 17h13.46L12 6.6Zm1 4.4v5a1 1 0 1 1-2 0v-5a1 1 0 1 1 2 0Z" />
    </svg>
  );
}

export function IconSleep(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 2a6 6 0 0 1 6 6v8a6 6 0 1 1-12 0V8a6 6 0 0 1 6-6Zm0 2a4 4 0 0 0-4 4v8a4 4 0 1 0 8 0V8a4 4 0 0 0-4-4Zm0 3a1 1 0 0 1 1 1v2.5a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function IconCook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M9 3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h2a1 1 0 1 1 0 2h-1v2a4 4 0 0 1 3 3.87V17a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-6.13A4 4 0 0 1 6 8V6H5a1 1 0 1 1 0-2h2V3Zm2 0v1h2V3h-2ZM7 10v7a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-7H7Z" />
    </svg>
  );
}

export function IconAccessory(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M13.5 2a6.5 6.5 0 0 1 0 13H11a1 1 0 1 1 0-2h2.5a4.5 4.5 0 1 0 0-9H9a4 4 0 0 0-4 4v7a3 3 0 0 0 3 3h1a1 1 0 1 1 0 2H8a5 5 0 0 1-5-5V8a6 6 0 0 1 6-6h4.5Z" />
    </svg>
  );
}

export function IconBeacon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 3a1 1 0 0 1 .92.6l4 9a3 3 0 1 1-1.84.86L12.8 11h-1.6l-2.28 3.46a3 3 0 1 1-1.84-.86l4-9A1 1 0 0 1 12 3Zm-5.66 2.05a1 1 0 0 1 1.32.48 5 5 0 0 0 .46.83 1 1 0 1 1-1.65 1.09 7 7 0 0 1-.64-1.18 1 1 0 0 1 .5-1.32Zm11.32 0a1 1 0 0 1 .5 1.32 7 7 0 0 1-.64 1.18 1 1 0 0 1-1.65-1.09 5 5 0 0 0 .46-.83 1 1 0 0 1 1.32-.48Zm2.83 5.66a1 1 0 0 1-.38 1.36 9 9 0 0 1-1.74.79 1 1 0 1 1-.6-1.9 7 7 0 0 0 1.36-.62 1 1 0 0 1 1.36.37Zm-16.98 0a1 1 0 0 1 1.36-.37 7 7 0 0 0 1.36.62 1 1 0 1 1-.6 1.9 9 9 0 0 1-1.74-.79 1 1 0 0 1-.38-1.36Z" />
    </svg>
  );
}

export function IconApparelAccessory(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 3a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v3a1 1 0 1 1-2 0v-3a1 1 0 0 0-1-1h-1v5h1.5a1.5 1.5 0 0 1 0 3H6.5a1.5 1.5 0 0 1 0-3H8v-5H7a1 1 0 0 0-1 1v3a1 1 0 1 1-2 0v-3a3 3 0 0 1 3-3h1V7a2 2 0 1 0-4 0 1 1 0 0 1-2 0 4 4 0 1 1 8 0v1h4V7a2 2 0 1 0-4 0 1 1 0 0 1-2 0 4 4 0 0 1 4-4Zm-2 8v5h4v-5h-4Zm-3.5 7a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1h-11Z" />
    </svg>
  );
}

export function IconInfo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16Zm0 4.75a1.25 1.25 0 1 1 0 2.5a1.25 1.25 0 0 1 0-2.5Zm1 4.25a1 1 0 0 1 0 2h-.25a.25.25 0 0 0-.25.25V16a1 1 0 0 1-2 0v-2.75c0-.69.56-1.25 1.25-1.25H13Z" />
    </svg>
  );
}

export function IconPin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M15.7 3.3a1 1 0 0 1 .24 1.4L14.9 6.1l2.99 2.99 1.4-1.04a1 1 0 0 1 1.4 1.28l-1.33 3.54a1 1 0 0 1-.24.38l-3.18 3.18-2.23-.59-4.12 4.12a1 1 0 1 1-1.41-1.41l4.12-4.12-.59-2.23 3.18-3.18a1 1 0 0 1 .38-.24l3.54-1.33a1 1 0 0 1 1.28 1.4l-1.04 1.4-2.99-2.99 1.4-1.04a1 1 0 0 1 .21-1.41ZM15.6 10.6l-1.95.73-1.96 1.96.31 1.16 3.48-3.48.12-.37Z" />
    </svg>
  );
}
