import fs from 'fs';
import { resolve } from 'path';
import { Page, expect } from '@playwright/test';
import { test } from './fixture';
import { DocumentType } from './types';

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

  await test.step(`Endre navn på dokument \`${documentId}\`.`, async () => {
    const document = getDocumentById(page, documentId);
    await document.waitFor();
    await document.locator(`text="${newDocumentName}"`).waitFor({ timeout: 1_000 });
  });

  return newDocumentName;
};

export const finishDocument = async (page: Page, documentName: string) => {
  await page.getByTestId('oppgavebehandling-documents-all-list').waitFor({ timeout: 120 * 1_000 });

  const container = getDocumentByName(page, documentName);
  const actionButton = container.getByTestId('document-actions-button');

  const actionButtonCount = await actionButton.count();

  if (actionButtonCount !== 1) {
    throw new Error(`Forventet 1 kontekstknapp, fant ${actionButtonCount}`);
  }

  await actionButton.click();

  await container.getByTestId('document-finish-button').click();
  await container.getByTestId('document-finish-confirm').click();

  await container.getByTestId('document-archiving').waitFor();

  return documentName;
};

export const verifyFinishedDocument = async (page: Page, documentName: string) => {
  const inProgressList = page.getByTestId('new-documents-list');
  const finishedList = page.getByTestId('oppgavebehandling-documents-all-list');

  await inProgressList.waitFor();
  await finishedList.waitFor({ timeout: 120_000 });

  const finishedDocument = finishedList.locator(`article[data-documentname="${documentName}"]`);
  await finishedDocument.waitFor({ timeout: 60_000 });

  await finishedDocument.locator('[data-testid="journalfoert-document-checkbox"]:checked').waitFor({ timeout: 60_000 });

  await page.waitForTimeout(200);

  const inNewList = await inProgressList.locator(`article[data-documentname="${documentName}"]`).count();
  expect(inNewList === 0, 'Forventet at journalført dokument forsvinner fra "Under arbeid"-listen.').toBe(true);
};

export const deleteDocument = async (page: Page, documentName: string) => {
  const container = getDocumentByName(page, documentName);
  const actionButton = container.getByTestId('document-actions-button');

  const actionButtonCount = await actionButton.count();

  if (actionButtonCount !== 1) {
    throw new Error(`Expected 1 action button, found ${actionButtonCount}`);
  }

  await actionButton.click();

  const response = page.waitForResponse((res) => res.ok() && res.request().method() === 'DELETE');
  await container.getByTestId('document-delete-button').click();
  await container.getByTestId('document-delete-confirm').click();
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

  await select.selectOption({ value: type });

  const actual = await select.inputValue();

  expect(actual).toBe(type);
};

export const setDocumentAsAttachmentTo = async (page: Page, documentName: string, parentName: string) => {
  const container = getDocumentListItemByName(page, documentName);

  const actionButton = container.getByTestId('document-actions-button');

  const actionButtonCount = await actionButton.count();

  expect(actionButtonCount, `Forventet kun én kontekstknapp for dokument ${documentName}`).toBe(1);

  await actionButton.click();

  const select = container.getByTestId('document-set-parent-document');
  await select.waitFor();

  const response = page.waitForResponse(
    (res) => res.ok() && res.request().method() === 'PUT' && res.url().endsWith('/parent')
  );

  await select.selectOption({ label: parentName });

  await response;

  const parent = getDocumentListItemByName(page, parentName);
  const attachmentList = parent.getByTestId('new-attachments-list');
  await attachmentList.waitFor();
  const attachments = attachmentList.locator(
    `[data-testid="new-document-list-item-content"][data-documentname="${documentName}"][data-documenttype="attachment"]`
  );
  const count = await attachments.count();
  expect(count, `Forventet å finne dokument ${documentName} som vedlegg til ${parentName}.`).toBe(1);
};
