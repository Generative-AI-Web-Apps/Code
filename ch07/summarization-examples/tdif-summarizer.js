import { Corpus } from "tiny-tfidf";
import { BaseRetriever } from "@langchain/core/retrievers";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TokenTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import natural from "natural";

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

const pdfPath = "docs/tiny-data.pdf";
const loader = new PDFLoader(pdfPath, { parsedItemSeparator: "" });

const docs = await loader.load();

const splitter = new TokenTextSplitter({
  chunkSize: 10000,
  chunkOverlap: 250,
});

const allDocs = await splitter.splitDocuments(docs);

export class DocumentSummarizer {
  tokenizer
  stopwords

  constructor() {
    this.tokenizer = new natural.SentenceTokenizer();
    // Basic English stopwords - you can expand this list
    this.stopwords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
      'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
      'that', 'the', 'to', 'was', 'were', 'will', 'with'
    ]);
  }

  cleanDocument(text) {
    // Remove special characters and extra whitespace
    return text
      .replace(/[^a-zA-Z\s.-]+/g, ' ')
      .replace(/-/g, '')
      .replace(/\.\.\./g, '')
      .replace(/Mr\./g, 'Mr')
      .replace(/Mrs\./g, 'Mrs')
      .replace(/\s+/g, ' ')
      .trim();
  }

  removeStopwords(text) {
    return text
      .split(' ')
      .filter(word => !this.stopwords.has(word.toLowerCase()))
      .join(' ');
  }

  calculateSimilarityScore(title, sentence) {
    const titleWords = new Set(
      this.removeStopwords(title.toLowerCase()).split(' ')
    );
    const sentenceWords = this.removeStopwords(sentence.toLowerCase()).split(' ');
    
    const similarWords = sentenceWords.filter(word => titleWords.has(word));
    return (similarWords.length * 0.1) / titleWords.size;
  }

  rankSentences(
    sentences,
    corpus,
    title,
    topN = 3
  ) {
    const scores = sentences.map((sentence, index) => {
      // Calculate TF-IDF score
      const terms = corpus.getTopTermsForDocument(`document-${index}`);
      const tfidfScore = terms.reduce((sum, [_, score]) => sum + score, 0);
      
      // Calculate similarity with title
      const similarityScore = this.calculateSimilarityScore(title, sentence);
      
      // Position weight (sentences at the beginning get higher weight)
      const positionWeight = 1 - (index / sentences.length);
      
      // Combine scores
      const finalScore = (tfidfScore * 0.4) + 
                        (similarityScore * 0.3) + 
                        (positionWeight * 0.3);

      return {
        index,
        score: finalScore
      };
    });

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  summarize(
    documents,
    title = "",
    topN = 3
  ) {
    // Clean and prepare documents
    const cleanedDocs = documents.map(doc => 
      this.cleanDocument(doc.pageContent)
    );

    // Create corpus for TF-IDF calculation
    const corpus = new Corpus(
      cleanedDocs.map((_, i) => `document-${i}`),
      cleanedDocs
    );

    // Tokenize sentences
    const allSentences = cleanedDocs.flatMap(doc => 
      this.tokenizer.tokenize(doc)
    );

    // Rank sentences
    const topSentences = this.rankSentences(
      allSentences,
      corpus,
      title,
      topN
    );

    // Build summary
    const summary = topSentences
      .sort((a, b) => a.index - b.index)  // Restore original order
      .map(score => allSentences[score.index])
      .join(' ');

    return summary;
  }
}

const summarizer = new DocumentSummarizer();
const title = "Optional document title";
const summary = summarizer.summarize(allDocs, title, 3);
console.log(summary);