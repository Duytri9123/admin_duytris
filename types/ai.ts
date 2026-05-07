export type AiProviderType = 'openai' | 'openrouter' | 'google' | 'anthropic' | 'ollama' | 'custom'

export interface AiProvider {
  id: number
  name: string
  provider: AiProviderType
  model: string
  base_url?: string
  is_active: boolean
  is_default: boolean
  max_tokens: number
  temperature: number
  capabilities: string[]
  system_prompt?: string
  created_at: string
  // quota check fields (optional, returned by health check)
  quota_status?: 'ok' | 'limited' | 'exhausted' | 'error' | 'unknown'
  last_tested_at?: string
  last_error?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
}

export interface AiConversation {
  id: number
  ai_provider_id: number
  title: string
  context: string
  messages: ChatMessage[]
  total_tokens: number
  updated_at: string
  provider?: { id: number; name: string; provider: string }
}

export const PROVIDER_META: Record<AiProviderType, { label: string; color: string; models: string[] }> = {
  openai: {
    label: 'OpenAI',
    color: '#10a37f',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  openrouter: {
    label: 'OpenRouter',
    color: '#7c3aed',
    models: ['openrouter/free', 'google/gemma-4-31b-it:free', 'openai/gpt-oss-20b:free', 'meta-llama/llama-3.3-70b-instruct:free'],
  },
  google: {
    label: 'Google Gemini',
    color: '#4285f4',
    models: ['gemini-2.0-flash', 'gemma-3-27b-it', 'gemma-3-12b-it', 'gemma-3-4b-it'],
  },
  anthropic: {
    label: 'Anthropic Claude',
    color: '#d97706',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  },
  ollama: {
    label: 'Ollama (Local)',
    color: '#6366f1',
    models: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3'],
  },
  custom: {
    label: 'Custom API',
    color: '#64748b',
    models: [],
  },
}

export const CAPABILITIES = ['chat', 'code', 'analysis', 'image', 'search', 'translation', 'product', 'seo', 'review', 'classify', 'summarize']
