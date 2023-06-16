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
    const inProgressListCount = await inProgressList.count();
    expect(
      inProgressListCount === 0,
      'Forventet at "Under arbeid"-listen ikke eksisterer, da det er 0 dokumenter under arbeid.'
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
  await modal.getByTestId('document-delete-confirm').click();
  await page.waitForResponse((res) => res.ok() && res.request().method() === 'DELETE');

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

  const modal = page.getByTestId('document-actions-modal');

  const toggleGroup = modal.getByTestId('document-set-parent-document');
  await toggleGroup.waitFor();

  await toggleGroup.getByText(parentName).click();

  await page.waitForResponse((res) => res.ok() && res.request().method() === 'PUT' && res.url().endsWith('/parent'));

  const parent = getDocumentListItemByName(page, parentName);
  const attachmentList = parent.getByTestId('new-attachments-list');
  await attachmentList.waitFor();
  const attachments = attachmentList.locator(
    `[data-testid="new-document-list-item-content"][data-documentname="${documentName}"][data-documenttype="attachment"]`
  );
  const count = await attachments.count();
  expect(count, `Forventet å finne dokument ${documentName} som vedlegg til ${parentName}.`).toBe(1);
};
