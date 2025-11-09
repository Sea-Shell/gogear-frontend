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

export function IconInfo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...baseProps} {...props}>
      <path d="M12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16Zm0 4.75a1.25 1.25 0 1 1 0 2.5a1.25 1.25 0 0 1 0-2.5Zm1 4.25a1 1 0 0 1 0 2h-.25a.25.25 0 0 0-.25.25V16a1 1 0 0 1-2 0v-2.75c0-.69.56-1.25 1.25-1.25H13Z" />
    </svg>
  );
}
