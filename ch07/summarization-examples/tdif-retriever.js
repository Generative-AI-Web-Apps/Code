import { Corpus } from "tiny-tfidf";
import { BaseRetriever } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";

class TFIDFRetriever extends BaseRetriever {
  lc_namespace = ["langchain", "retrievers", "tfidf"];
  corpus;

  constructor(documents) {
    super();
    this.corpus = new Corpus(
      documents.map((_, i) => `document-${i}`),
      documents
    );
  }

  async _getRelevantDocuments(query) {
    const topDocsQueryResult = this.corpus.getResultsForQuery(query);

    return topDocsQueryResult.map(([identifier, score]) => {
      const document = this.corpus.getDocument(identifier);
      const topTerms = this.corpus.getTopTermsForDocument(identifier);
      return new Document({
        id: identifier,
        pageContent: document.getText(),
        metadata: { score, topTerms },
      });
    });
  }
}

// Example usage
const documents = [
  "This is a lengthy document about the history of computers.",
  "A shorter document about the latest advancements in technology.",
  "A medium-length document discussing the impact of AI on society.",
];

const retriever = new TFIDFRetriever(documents, 2.0, 0.5);
const results = await retriever.invoke("document");

console.log(results);
