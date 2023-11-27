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

  test('Opplasting, endre navn/type, ferdigstille, sette vedlegg', async ({ klagebehandling }) => {
    const filename = 'e2e-test-document.pdf';

    const { behandling } = klagebehandling;

    const documents: string[] = [];

    const DOCUMENTS_TO_UPLOAD = 4;

    for (let i = 0; i < DOCUMENTS_TO_UPLOAD; i++) {
      const title = await behandling.uploadDocument(DocumentType.NOTAT, filename);
      documents.push(title);
    }

    const renamedDocuments: string[] = [];

    for (const title of documents) {
      const newTitle = await behandling.renameDocument(title, `${title}-renamed`);

      renamedDocuments.push(newTitle);
    }

    const [doc1, doc2, doc3] = renamedDocuments;

    await behandling.setDocumentType(doc1, DocumentType.VEDTAKSBREV);
    await behandling.setDocumentType(doc2, DocumentType.BESLUTNING);
    await behandling.setDocumentType(doc3, DocumentType.BREV);

    for (const hoveddokument of renamedDocuments) {
      await behandling.finishAndVerifyDocument(hoveddokument);
    }

    await behandling.deAssign();
  });
});
