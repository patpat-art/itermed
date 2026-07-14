import { Pinecone, type Index } from "@pinecone-database/pinecone";
import { config } from "@/lib/config";

export type PineconeIndex = Index<Record<string, string | number | boolean | string[]>>;

let cachedClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone | null {
  if (!config.isPineconeConfigured || !config.PINECONE_API_KEY) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new Pinecone({ apiKey: config.PINECONE_API_KEY });
  }

  return cachedClient;
}

export function getPineconeIndex(): PineconeIndex | null {
  const client = getPineconeClient();

  if (!client || !config.PINECONE_INDEX) {
    return null;
  }

  return client.index(config.PINECONE_INDEX);
}
