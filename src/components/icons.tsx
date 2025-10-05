import type { SVGProps } from 'react';

export const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

export const WhatsAppIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M18.403 5.633A8.919 8.919 0 0 0 12.05 3c-4.94 0-8.95 4.01-8.95 8.95 0 1.56.38 3.05 1.09 4.38L3 21l5.26-1.38c1.29.68 2.75 1.09 4.29 1.09h.005c4.94 0 8.95-4.01 8.95-8.95a8.926 8.926 0 0 0-2.697-6.392zm-6.353 13.81h-.005c-1.32 0-2.6-.36-3.73-1.01L7.9 18.82l-3.32.87.89-3.23-.4-.64a7.12 7.12 0 0 1-1.12-3.87c0-3.95 3.2-7.15 7.15-7.15.97 0 1.9.2 2.75.58l.1.05.05.1a7.12 7.12 0 0 1 4.15 6.42c0 3.95-3.2 7.15-7.15 7.15zm4.27-5.41c-.24-.12-1.42-.7-1.65-.78-.23-.08-.39-.12-.56.12-.17.24-.62.78-.76.93-.14.15-.28.17-.52.05-.24-.12-1.02-.38-1.95-1.2-.72-.63-1.2-1.42-1.35-1.67-.14-.24-.02-.37.1-.49.11-.11.25-.28.37-.42.12-.14.16-.24.25-.4.08-.16.04-.3-.02-.42-.06-.12-.56-1.25-.76-1.7-.2-.45-.4-.39-.56-.39h-.4c-.16 0-.42.06-.63.3-.2.24-.8.76-.8 1.84s.82 2.14.94 2.28c.12.15 1.6 2.45 3.9 3.44.56.24 1.01.38 1.35.49.56.17 1.08.15 1.49.09.46-.06 1.42-.58 1.62-1.14.2-.55.2-1.03.14-1.14-.06-.11-.22-.17-.46-.29z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
