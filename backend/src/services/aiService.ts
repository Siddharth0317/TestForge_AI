import { env } from '../config/env';
import { logger } from '../utils/logger';
import { INLPAnalysis, IMLClassification } from '../models/Requirement';

export interface AIRequirementAnalysisResponse {
  requirement_id?: string;
  version: number;
  normalized_text: string;
  actors: string[];
  actions: string[];
  entities: string[];
  conditions: string[];
  constraints: string[];
  outcomes: string[];
  explicit_negations?: string[];
  ambiguity_findings: Array<{
    phrase: string;
    reason: string;
    severity: 'warning' | 'info';
    start_char?: number;
    end_char?: number;
  }>;
  evidence_spans: Array<{
    category: string;
    text: string;
    start_char: number;
    end_char: number;
    confidence: number;
  }>;
  processing_version: string;
}

export interface AIClassificationResponse {
  category: string;
  confidence: number;
  model_version: string;
  is_uncertain: boolean;
  probabilities?: Record<string, number>;
  requirement_id?: string;
}

export interface AIGenerationResponse {
  job_id: string;
  requirement_id: string;
  requirement_version: number;
  status: 'completed' | 'failed';
  provider: string;
  model: string;
  prompt_template_version: string;
  schema_version: string;
  candidates: any[];
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  duration_ms: number;
  error_code?: string;
  error_summary?: string;
}

export class AIServiceClient {
  private static baseUrl = env.AI_SERVICE_URL;
  private static serviceKey = env.INTERNAL_SERVICE_KEY;

  public static async analyzeRequirement(
    text: string,
    requirementId?: string,
    version: number = 1
  ): Promise<AIRequirementAnalysisResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${this.baseUrl}/internal/v1/requirements/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': this.serviceKey
        },
        body: JSON.stringify({
          text,
          requirement_id: requirementId,
          version
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(
          { status: response.status, body: errorText },
          'AI service rejected requirement analysis request'
        );
        return null;
      }

      const data = (await response.json()) as AIRequirementAnalysisResponse;
      return data;
    } catch (error: any) {
      logger.warn(
        { err: error.message },
        'Failed to connect to AI service for requirement analysis; falling back to draft status'
      );
      return null;
    }
  }

  public static async classifyRequirement(
    text: string,
    requirementId?: string
  ): Promise<AIClassificationResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${this.baseUrl}/internal/v1/classifier/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': this.serviceKey
        },
        body: JSON.stringify({
          text,
          requirement_id: requirementId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(
          { status: response.status, body: errorText },
          'AI service rejected requirement classification request'
        );
        return null;
      }

      const data = (await response.json()) as AIClassificationResponse;
      return data;
    } catch (error: any) {
      logger.warn(
        { err: error.message },
        'Failed to connect to AI service for requirement classification; skipping ML tag'
      );
      return null;
    }
  }

  public static async generateTestCases(params: {
    requirement_id: string;
    requirement_version: number;
    requirement_text: string;
    nlp_analysis?: any;
    ml_category?: string;
    scenario_types?: string[];
    provider_override?: string;
    max_cases?: number;
  }): Promise<AIGenerationResponse | null> {
    try {
      const controller = new AbortController();
      // Allow up to 35s for generation
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch(`${this.baseUrl}/internal/v1/test-cases/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': this.serviceKey
        },
        body: JSON.stringify(params),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(
          { status: response.status, body: errorText },
          'AI service rejected candidate test-case generation request'
        );
        return null;
      }

      const data = (await response.json()) as AIGenerationResponse;
      return data;
    } catch (error: any) {
      logger.error(
        { err: error.message },
        'Failed to connect to AI service for test case generation'
      );
      return null;
    }
  }
}
