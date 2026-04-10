import fs from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page } from '@playwright/test';
import { test } from '@/fixtures/behandling/fixture';
import { getDokumenter, getDokumenterUnderArbeid, getJournalfoerteDokumenter } from '@/fixtures/behandling/regions';
import type { DocumentType } from '@/fixtures/behandling/types';
import { UI_DOMAIN } from '@/tests/functions';
import { finishedRequest } from '@/tests/helpers';
import { SAKEN_GJELDER_DATA } from '@/tests/users';

const RENAME_BUTTON_REGEX = /Endre dokumentnavn|Lagre/;
const DOCUMENT_MODAL_REGEX = /Valg for/;
const FINISH_BUTTON_REGEX = /Arkiver|Send ut/;
const DELETE_BUTTON_REGEX = /Slett/;
const ATTACHMENT_GROUP_REGEX = /Vedlegg til/;

const getDocumentByName = (page: Page, documentName: string) => {
  const newDocumentsList = getDokumenterUnderArbeid(page);
  return newDocumentsList.getByRole('article').filter({ hasText: documentName });
};

const getDocumentListItemByName = (page: Page, documentName: string) => {
  const newDocumentsList = getDokumenterUnderArbeid(page);
  return newDocumentsList.getByRole('listitem').filter({ hasText: documentName });
};

const getDocumentById = (page: Page, documentId: string) => {
  const newDocumentsList = getDokumenterUnderArbeid(page);
  return newDocumentsList.locator(`article[data-documentid="${documentId}"]`);
};

export const uploadDocument = async (page: Page, type: DocumentType, filename: string, name: string) => {
  const select = page.getByLabel('Dokumenttype').first();
  await select.scrollIntoViewIfNeeded();

  await select.selectOption({ value: type });

  const filePath = resolve(process.cwd(), `./test-pdf-documents/${filename}`);
  const buffer = fs.readFileSync(filePath);
  const mimeType = 'application/pdf';

  const dokumenter = getDokumenter(page);

  const uploadButton = dokumenter.getByRole('button', { name: 'Filopplasting av dokument' });
  await expect(uploadButton).toBeVisible();

  // The file input is a sibling of the upload button, scoped via the header area
  const fileInput = uploadButton.locator('..').locator('input[type="file"]');
  await fileInput.setInputFiles({ name, buffer, mimeType });

  const container = getDocumentByName(page, name);
  await container.waitFor();

  const uploadedSelect = container.locator('select');
  const selected = await uploadedSelect.inputValue();

  expect(selected).toBe(type);

  return name;
};

export const renameDocument = async (page: Page, documentName: string, newDocumentName: string) => {
  const container = getDocumentByName(page, documentName);
  await container.hover();
  const renameButton = container.getByRole('button', { name: RENAME_BUTTON_REGEX });
  const documentId = await container.getAttribute('data-documentid');

  if (documentId === null) {
    throw new Error(`Dokument med navn "${documentName}" mangler ID.`);
  }

  const renameButtonCount = await renameButton.count();

  if (renameButtonCount !== 1) {
    throw new Error(`Forventet 1 "Endre navn"-knapp, fant ${renameButtonCount}`);
  }

  await renameButton.click();

  // After clicking edit, the document title moves from text to an input field,
  // so the article filter by hasText may not match. Find the input in the region instead.
  const region = getDokumenterUnderArbeid(page);
  const input = region.getByLabel('Endre filnavn');
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

export const downloadPdf = async (page: Page, behandlingId: string, documentName: string) => {
  const container = getDocumentByName(page, documentName);
  const documentId = await container.getAttribute('data-documentid');

  if (documentId === null) {
    throw new Error(`Could not find document ID for document: ${documentName}`);
  }

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
  const inProgressList = getDokumenterUnderArbeid(page);
  await inProgressList.waitFor();

  const numberOfNewDocsBeforeFinish = await inProgressList.getByRole('listitem').count();

  await getJournalfoerteDokumenter(page)
    .getByRole('treeitem')
    .first()
    .waitFor({ timeout: 120 * 1_000 });

  const container = getDocumentByName(page, documentName);
  const actionButton = container.getByRole('button', { name: 'Åpne flere valg for dokument' });

  const actionButtonCount = await actionButton.count();

  if (actionButtonCount !== 1) {
    throw new Error(`Forventet 1 kontekstknapp, fant ${actionButtonCount}`);
  }

  await actionButton.click();

  const modal = page.getByRole('dialog', { name: DOCUMENT_MODAL_REGEX });

  await selectSuggestedMottaker(page, SAKEN_GJELDER_DATA.name);

  await modal.getByRole('button', { name: FINISH_BUTTON_REGEX }).click();

  // Wait for confirm state (same button text + cancel button appears)
  await modal.getByRole('button', { name: 'Avbryt' }).waitFor();
  await modal.getByRole('button', { name: FINISH_BUTTON_REGEX }).click();

  const finishedList = getJournalfoerteDokumenter(page);

  await finishedList.waitFor({ timeout: 120_000 });

  const finishedDocument = finishedList.getByRole('treeitem').filter({ hasText: documentName });
  await finishedDocument.waitFor({ timeout: 60_000 });

  await finishedDocument.locator('[data-included="true"]').waitFor({ timeout: 60_000 });

  if (numberOfNewDocsBeforeFinish > 1) {
    const inNewList = await inProgressList.getByRole('article').filter({ hasText: documentName }).count();
    expect(inNewList).toBe(0);
  } else {
    const inProgressChildren = await inProgressList.getByRole('listitem').count();
    expect(inProgressChildren).toBe(0);
  }
};

export const deleteDocument = async (page: Page, documentName: string) => {
  const container = getDocumentByName(page, documentName);
  const actionButton = container.getByRole('button', { name: 'Åpne flere valg for dokument' });

  const actionButtonCount = await actionButton.count();

  if (actionButtonCount !== 1) {
    throw new Error(`Expected 1 action button, found ${actionButtonCount}`);
  }

  await actionButton.click();

  const modal = page.getByRole('dialog', { name: DOCUMENT_MODAL_REGEX });

  // First click shows confirm state (replaces button with confirm + cancel)
  await modal.getByRole('button', { name: DELETE_BUTTON_REGEX }).click();

  // Wait for the "Avbryt" button to appear (confirms we're in confirm state)
  await modal.getByRole('button', { name: 'Avbryt' }).waitFor();

  // Now click the confirm "Slett" button and wait for the DELETE response
  const response = page.waitForResponse(
    (res) => res.ok() && res.request().method() === 'DELETE' && res.url().includes('/dokumenter/'),
  );
  await modal.getByRole('button', { name: DELETE_BUTTON_REGEX }).click();
  await response;

  const documentsCount = await container.count();

  if (documentsCount !== 0) {
    throw new Error(`Forventet at dokumentet (${documentName}) var slettet`);
  }

  return documentName;
};

export const setDocumentType = async (page: Page, documentName: string, type: DocumentType) => {
  const container = getDocumentByName(page, documentName);

  const select = container.locator('select');
  await select.scrollIntoViewIfNeeded();

  const requestPromise = page.waitForRequest('**/behandlinger/**/dokumenter/**/dokumenttype');
  await select.selectOption({ value: type });
  await finishedRequest(requestPromise);

  const actual = await select.inputValue();

  expect(actual).toBe(type);
};

export const setDocumentAsAttachmentTo = async (page: Page, documentName: string, parentName: string) => {
  const container = getDocumentListItemByName(page, documentName);

  const actionButton = container.getByRole('button', { name: 'Åpne flere valg for dokument' });

  const actionButtonCount = await actionButton.count();

  expect(actionButtonCount, `Forventet kun én kontekstknapp for dokument ${documentName}`).toBe(1);

  await actionButton.click();

  const modal = page.getByRole('dialog', { name: DOCUMENT_MODAL_REGEX });

  const toggleGroup = modal.getByRole('radiogroup', { name: ATTACHMENT_GROUP_REGEX });
  await toggleGroup.waitFor();

  const response = page.waitForResponse(
    (res) => res.ok() && res.request().method() === 'PUT' && res.url().endsWith('/parent'),
  );
  await toggleGroup.getByText(parentName).click();
  await response;

  await page.keyboard.press('Escape');

  const parent = getDocumentListItemByName(page, parentName);
  const attachmentList = parent.getByRole('list').first();
  await attachmentList.waitFor();
  const attachments = attachmentList.getByRole('listitem').filter({ hasText: documentName });
  const count = await attachments.count();
  expect(count, `Forventet å finne dokument ${documentName} som vedlegg til ${parentName}.`).toBe(1);
};

export const initSmartEditor = async (page: Page, templateName: string) => {
  await page.getByRole('tab', { name: 'Opprett nytt dokument' }).click();
  const section = page.locator('section').filter({ hasText: 'Opprett nytt dokument' }).first();
  await section.waitFor();
  await section.getByText(templateName).click();

  const smartEditor = page.locator('[data-area="content"]');
  await page.locator('[data-slate-editor="true"]').waitFor({ state: 'visible' });

  return smartEditor;
};

const selectSuggestedMottaker = async (page: Page, name: string) => {
  const suggestedMottakere = page.locator('fieldset').filter({ hasText: 'Foreslåtte mottakere fra saken' });

  const promise = page.waitForRequest('**/behandlinger/**/dokumenter/**/mottakere');
  await suggestedMottakere.getByText(name).waitFor();
  await suggestedMottakere.getByText(name).click();
  await finishedRequest(promise);
};
