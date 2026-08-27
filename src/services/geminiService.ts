/**
 * Serviço de Integração com a API do Gemini via backend (server.ts)
 * 
 * Evita vazamento da GEMINI_API_KEY no cliente.
 * Implementa timeout, tratamento de erros e fallback para resiliência.
 */

export interface AIRecommendationResponse {
  recommendedIds: string[];
  reasoning: string;
}

export const getAIRecommendations = async (
  query: string, 
  services: any[]
): Promise<AIRecommendationResponse> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch('/api/gemini/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, services }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na resposta da API.');
    }

    const data: AIRecommendationResponse = await response.json();
    return data;
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Gemini API timeout');
      throw new Error('A análise inteligente demorou muito para responder. Tente novamente.');
    }
    console.error('Erro no geminiService:', error);
    throw new Error('Não foi possível realizar a busca semântica no momento.');
  }
};
