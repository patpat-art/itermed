import { Pinecone, type Index } from "@pinecone-database/pinecone";

export type PineconeIndex = Index<Record<string, string | number | boolean | string[]>>;

let cachedClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone | null {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new Pinecone({ apiKey });
  }

  return cachedClient;
}

export function getPineconeIndex(): PineconeIndex | null {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX;

  if (!client || !indexName) {
    return null;
  }

  return client.index(indexName);
}

