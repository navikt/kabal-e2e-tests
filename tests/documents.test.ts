import { test } from '../fixtures/behandling/fixture';
import { DocumentType } from '../fixtures/behandling/types';

test.describe('Dokumenter', () => {
  test('Laste opp og slette', async ({ klagebehandling }) => {
    const filename = 'e2e-test-document.pdf';

    const { behandling } = klagebehandling;

    const brev = await behandling.uploadDocument(DocumentType.BREV, filename);
    await behandling.deleteDocument(brev);
    const vedtaksbrev = await behandling.uploadDocument(DocumentType.VEDTAKSBREV, filename);
    await behandling.deleteDocument(vedtaksbrev);
  });

  test('Opplasting, endre navn/type, ferdigstille', async ({ klagebehandling, page }) => {
    const filename = 'e2e-test-document.pdf';

    const { behandling } = klagebehandling;

    const documents: string[] = [];

    const DOCUMENTS_TO_UPLOAD = 3;

    for (let i = 0; i < DOCUMENTS_TO_UPLOAD; i++) {
      const title = await behandling.uploadDocument(DocumentType.BREV, filename);
      documents.push(title);
    }

    const renamedDocuments: string[] = [];

    for (const title of documents) {
      const newTitle = await behandling.renameDocument(title, `${title}-renamed`);

      renamedDocuments.push(newTitle);
    }

    const [doc1, doc2] = renamedDocuments;

    await behandling.setDocumentType(doc1, DocumentType.VEDTAKSBREV);
    await behandling.setDocumentType(doc2, DocumentType.BESLUTNING);

    await page
      .getByTestId('oppgavebehandling-documents-all-list-item')
      .first()
      .waitFor({ timeout: 10_000 })
      .catch(() => {
        throw new Error('Listen over journalførte dokumenter lastet ikke i tide');
      });

    for (const hoveddokument of renamedDocuments) {
      await behandling.finishAndVerifyDocument(hoveddokument);
    }

    await behandling.deAssign();
  });
});
