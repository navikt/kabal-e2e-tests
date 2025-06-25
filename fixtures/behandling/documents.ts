import fs from 'node:fs';
import { resolve } from 'node:path';
import { type Page, expect } from '@playwright/test';
import { UI_DOMAIN } from '../../tests/functions';
import { finishedRequest } from '../../tests/helpers';
import { SAKEN_GJELDER_DATA } from '../../tests/users';
import { test } from './fixture';
import type { DocumentType } from './types';
const getDocumentByName = (page: Page, documentName: string) => {
  const newDocumentsList = page.getByTestId('new-documents-list');
  return newDocumentsList.locator(`article[data-documentname="${documentName}"]`);
};

const getDocumentListItemByName = (page: Page, documentName: string) => {
  const newDocumentsList = page.getByTestId('new-documents-list');
  return newDocumentsList.locator(`li[data-documentname="${documentName}"]`);
};

const getDocumentById = (page: Page, documentId: string) => {
  const newDocumentsList = page.getByTestId('new-documents-list');
  return newDocumentsList.locator(`article[data-documentid="${documentId}"]`);
};

export const uploadDocument = async (page: Page, type: DocumentType, filename: string, name: string) => {
  const select = page.getByTestId('upload-document-type-select');
  await select.scrollIntoViewIfNeeded();

  await select.selectOption({ value: type });

  const filePath = resolve(process.cwd(), `./test-pdf-documents/${filename}`);
  const buffer = fs.readFileSync(filePath);
  const mimeType = 'application/pdf';

  const fileInput = page.getByTestId('upload-document-input');
  await fileInput.setInputFiles({ name, buffer, mimeType });

  const container = getDocumentByName(page, name);
  await container.waitFor();

  const uploadedSelect = container.getByTestId('document-type-select');
  const selected = await uploadedSelect.inputValue();

  expect(selected).toBe(type);

  return name;
};

export const renameDocument = async (page: Page, documentName: string, newDocumentName: string) => {
  const container = getDocumentByName(page, documentName);
  await container.hover();
  const renameButton = container.getByTestId('document-title-edit-save-button');
  const documentId = await container.getAttribute('data-documentid');

  if (documentId === null) {
    throw new Error(`Dokument med navn "${documentName}" mangler ID.`);
  }

  const renameButtonCount = await renameButton.count();

  if (renameButtonCount !== 1) {
    throw new Error(`Forventet 1 "Endre navn"-knapp, fant ${renameButtonCount}`);
  }

  await renameButton.click();

  const input = container.getByTestId('document-filename-input');
  await input.focus();
  await input.clear();
  await input.fill(newDocumentName);
  await input.press('Enter');

  await test.step(`Endre navn \`${documentId.substring(0, 8)}...\``, async () => {
    const document = getDocumentById(page, documentId);
    await document.waitFor();
    await document.locator(`text="${newDocumentName}"`).waitFor({ timeout: 1_000 });
  });

  return newDocumentName;
};

const NYTT_DOKUMENT_REGEX = /\/nytt-dokument\/(.*)\/(.*)/;

export const downloadPdf = async (page: Page, documentName: string) => {
  const container = getDocumentByName(page, documentName);
  const href = await container.locator('a').getAttribute('href');
  const match = href?.match(NYTT_DOKUMENT_REGEX);

  if (match === null || match === undefined) {
    throw new Error(`Could not find path to PDF to be downloaded: ${documentName}, href: ${href}`);
  }

  const [behandlingId, documentId] = match.slice(1);

  const url = `${UI_DOMAIN}/api/kabal-api/behandlinger/${behandlingId}/dokumenter/${documentId}/pdf`;

  const cookies = await page.context().cookies();

  const res = await fetch(url, {
    headers: { cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ') },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch PDF from ${url}, response: ${res.status} - ${res.statusText}`);
  }
};

export const finishAndVerifyDocument = async (page: Page, documentName: string) => {
  const inProgressList = page.getByTestId('new-documents-list');
  await inProgressList.waitFor();

  const numberOfNewDocsBeforeFinish = await inProgressList.locator('li').count();

  await page.getByTestId('oppgavebehandling-documents-all-list').waitFor({ timeout: 120 * 1_000 });

  const container = getDocumentByName(page, documentName);
  const actionButton = container.getByTestId('document-actions-button');

  const actionButtonCount = await actionButton.count();

  if (actionButtonCount !== 1) {
    throw new Error(`Forventet 1 kontekstknapp, fant ${actionButtonCount}`);
  }

  await actionButton.click();

  const modal = page.getByTestId('document-actions-modal');

  await selectSuggestedMottaker(page, SAKEN_GJELDER_DATA.name);

  await modal.getByTestId('document-finish-button').click();
  await modal.getByTestId('document-finish-confirm').click();

  await container.getByTestId('document-archiving').waitFor();

  const finishedList = page.getByTestId('oppgavebehandling-documents-all-list');

  await finishedList.waitFor({ timeout: 120_000 });

  const finishedDocument = finishedList.locator(`article[data-documentname="${documentName}"]`);
  await finishedDocument.waitFor({ timeout: 60_000 });

  await finishedDocument.locator('[data-included="true"]').waitFor({ timeout: 60_000 });

  if (numberOfNewDocsBeforeFinish > 1) {
    const inNewList = await inProgressList.locator(`article[data-documentname="${documentName}"]`).count();
    expect(inNewList === 0, 'Forventet at journalført dokument forsvinner fra "Under arbeid"-listen.').toBe(true);
  } else {
    const inProgressChildren = await inProgressList.locator('li').count();

    expect(
      inProgressChildren === 0,
      'Forventet at "Under arbeid"-listen ikke eksisterer, da det er 0 dokumenter under arbeid.',
    ).toBe(true);
  }
};

export const deleteDocument = async (page: Page, documentName: string) => {
  const container = getDocumentByName(page, documentName);
  const actionButton = container.getByTestId('document-actions-button');

  const actionButtonCount = await actionButton.count();

  if (actionButtonCount !== 1) {
    throw new Error(`Expected 1 action button, found ${actionButtonCount}`);
  }

  await actionButton.click();

  const modal = page.getByTestId('document-actions-modal');
  await modal.getByTestId('document-delete-button').click();

  const response = page.waitForResponse((res) => res.ok() && res.request().method() === 'DELETE');
  await modal.getByTestId('document-delete-confirm').click();
  await response;

  const documentsCount = await container.count();

  if (documentsCount !== 0) {
    throw new Error(`Forventet at dokumentet (${documentName}) var slettet`);
  }

  return documentName;
};

export const setDocumentType = async (page: Page, documentName: string, type: DocumentType) => {
  const container = getDocumentByName(page, documentName);

  const select = container.getByTestId('document-type-select');
  await select.scrollIntoViewIfNeeded();

  const requestPromise = page.waitForRequest('**/behandlinger/**/dokumenter/**/dokumenttype');
  await select.selectOption({ value: type });
  await finishedRequest(requestPromise);

  const actual = await select.inputValue();

  expect(actual).toBe(type);
};

export const setDocumentAsAttachmentTo = async (page: Page, documentName: string, parentName: string) => {
  const container = getDocumentListItemByName(page, documentName);

  const actionButton = container.getByTestId('document-actions-button');

  const actionButtonCount = await actionButton.count();

  expect(actionButtonCount, `Forventet kun én kontekstknapp for dokument ${documentName}`).toBe(1);

  await actionButton.click();

  const modal = page.getByTestId('document-actions-modal');

  const toggleGroup = modal.getByTestId('document-set-parent-document');
  await toggleGroup.waitFor();

  const response = page.waitForResponse(
    (res) => res.ok() && res.request().method() === 'PUT' && res.url().endsWith('/parent'),
  );
  await toggleGroup.getByText(parentName).click();
  await response;

  page.keyboard.press('Escape');

  const parent = getDocumentListItemByName(page, parentName);
  const attachmentList = parent.getByTestId('new-attachments-list');
  await attachmentList.waitFor();
  const attachments = attachmentList.locator(
    `[data-testid="new-document-list-item-content"][data-documentname="${documentName}"][data-documenttype="attachment"]`,
  );
  const count = await attachments.count();
  expect(count, `Forventet å finne dokument ${documentName} som vedlegg til ${parentName}.`).toBe(1);
};

export const initSmartEditor = async (page: Page, templateName: string) => {
  await page.getByLabel('Opprett nytt dokument').click();
  const section = page.locator('section').filter({ hasText: 'Opprett nytt dokument' }).first();
  await section.waitFor();
  await section.getByText(templateName).click();

  const smartEditor = page.locator('[data-area="content"]');
  // Wait for actual content to load
  await smartEditor.locator('[class="slate-current-date"]').waitFor();

  return smartEditor;
};

const selectSuggestedMottaker = async (page: Page, name: string) => {
  const suggestedMottakere = page.locator('fieldset').filter({ hasText: 'Foreslåtte mottakere fra saken' });

  const promise = page.waitForRequest('**/behandlinger/**/dokumenter/**/mottakere');
  await suggestedMottakere.getByText(name).click();
  await finishedRequest(promise);
};
