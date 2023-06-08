import { icon24x24 } from './icon';

export const calendarIconPath =
    '<path d="M5 3a2.015 2.015 0 0 0-2 2v14a2.015 2.015 0 0 0 2 2h14a2.015 2.015 0 0 0 2-2V5a2.015 2.015 0 0 0-2-2Zm0 2h14v2H5Zm0 4h2v2H5Zm4 0h2v2H9Zm4 0h2v2h-2Zm4 0h2v2h-2ZM5 13h2v2H5Zm4 0h2v2H9Zm4 0h2v2h-2Zm4 0h2v2h-2ZM5 17h2v2H5Zm4 0h2v2H9Zm4 0h2v2h-2Zm4 0h2v2h-2Z"/>';

export const calendarIcon = {
    data: icon24x24(calendarIconPath),
    name: 'calendar' as const,
};
