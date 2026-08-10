// Adapted from kyaulabs/deepseek-websearch-mcp (MIT).

export const SearchErrorCode = Object.freeze({
  MISSING_API_KEY: "MISSING_API_KEY",
  NETWORK_ERROR: "NETWORK_ERROR",
  API_ERROR: "API_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  CANCELLED: "CANCELLED",
});

export class SearchError extends Error {
  constructor(code, message, statusCode) {
    super(message);
    this.name = "SearchError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
