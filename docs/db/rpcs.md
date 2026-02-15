## RPCs

### match_my_knowledge_chunks(p_query_embedding, p_match_count)

Vector search over knowledge_chunks scoped to auth.uid().
Returns chunk content + similarity + source metadata.
Used by RAG retrieval in /api/chat.
