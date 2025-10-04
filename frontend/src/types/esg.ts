export interface ESGRequest {
  companyName: string;
  sector: string;
  description: string;
}

export interface ESGScores {
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}

export interface ESGAnalysis {
  environmental: string;
  social: string;
  governance: string;
  summary: string;
  risks: string[];
  opportunities: string[];
}

export interface ESGResponse {
  success: boolean;
  timestamp: string;
  company: {
    name: string;
    sector: string;
  };
  esgScores: ESGScores;
  analysis: ESGAnalysis;
  metadata: {
    model: string;
    analysisDate: string;
    version: string;
  };
}

export interface ESGError {
  error: string;
  message: string;
  details?: any;
  requestId?: string;
}