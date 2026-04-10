import type { Page } from '@playwright/test';

export const getRegion = (page: Page, heading: string | RegExp) =>
  typeof heading === 'string'
    ? page.getByRole('region', { name: heading, exact: true })
    : page.getByRole('region', { name: heading });

export const getMainMenu = (page: Page) => page.getByRole('navigation', { name: 'Meny' });
