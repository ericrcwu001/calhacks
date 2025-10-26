import { useAuth } from "@/hooks/use-auth";
import { useReportToParentWindow } from "@/lib/report-parent-window";
import { useCallback } from "react";
import { useAppConfig } from "./use-app-config";

const API_BASE_PATH = import.meta.env.VITE_MCP_API_BASE_PATH;

export interface MCPRequest {
	jsonrpc: "2.0";
	id: string;
	method: string;
	params?: unknown;
}

export interface MCPResponse {
	jsonrpc: "2.0";
	id: string;
	result?: unknown;
	error?: {
		code: number;
		message: string;
		data?: unknown;
	};
}

/**
 * Standard MCP tool response format that wraps actual tool data
 * CRITICAL: MCP tools return data wrapped in content[0].text as JSON string
 */
export interface MCPToolResponse {
	content: Array<{
		type: "text";
		text: string; // JSON string containing actual tool data
	}>;
}

/**
 * Custom hook for making MCP calls with automatic reporting to parent window
 * Reports all MCP requests and responses to the parent window via postMessage
 *
 * IMPORTANT: MCP tools return wrapped responses in MCPToolResponse format
 * Use callTool<MCPToolResponse, InputParams>() and parse content[0].text JSON
 */
export function useMCPClient() {
	const { token, isAuthenticated } = useAuth();

	// Use the utility hook for reporting to parent window
	const { reportParent } = useReportToParentWindow();

	// Get app config at the top level (hooks can't be called in callbacks)
	const appConfig = useAppConfig();

	const callMCP = useCallback(
		async (
			serverUrl: string,
			mcpId: string,
			request: MCPRequest,
			transportType = "streamable_http",
			retryCount = 0,
			maxRetries = 3,
		): Promise<unknown> => {
			// Allow unauthenticated calls for development/testing
			// In production, authentication should be enforced by the backend
			const isDevelopment = import.meta.env.DEV || !token;

			if (!isAuthenticated && !isDevelopment) {
				throw new Error("User not authenticated");
			}

			// Base object with common fields for reporting
			const baseReportData = {
				serverUrl,
				method: request.method,
				params: request.params,
				url: `${API_BASE_PATH}/execute-mcp/v2`,
				transportType,
				retryAttempt: retryCount,
			};

			try {
				// Build headers object with comprehensive MCP-compatible headers
				const headers: Record<string, string> = {
					"Content-Type": "application/json",
					Accept: "application/json, text/event-stream",
					"X-CREAO-MCP-ID": mcpId,
				};

				// Only add Authorization header if we have a token
				if (token) {
					headers.Authorization = `Bearer ${token}`;
				}

				// Use app config from closure (hooks called at top level)
				if (appConfig.taskId) headers["X-CREAO-API-TASK-ID"] = appConfig.taskId;
				if (appConfig.projectId)
					headers["X-CREAO-API-PROJECT-ID"] = appConfig.projectId;

				// Log request details for debugging
				console.log("[MCP] Request:", {
					url: `${API_BASE_PATH}/execute-mcp/v2`,
					method: request.method,
					mcpId,
					serverUrl,
					transportType,
					retryAttempt: retryCount,
					timestamp: new Date().toISOString(),
				});

				const response = await fetch(`${API_BASE_PATH}/execute-mcp/v2`, {
					method: "POST",
					headers,
					body: JSON.stringify({
						transportType,
						serverUrl,
						request,
					}),
					// Add timeout signal (30 seconds)
					signal: AbortSignal.timeout(30000),
				});

				console.log(
					"[MCP] Response status:",
					response.status,
					response.statusText,
				);

				if (!response.ok) {
					const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
					const responseBody = await response
						.text()
						.catch(() => "Unable to read response");

					console.error("[MCP] HTTP Error:", {
						status: response.status,
						statusText: response.statusText,
						body: responseBody,
						headers: Object.fromEntries(response.headers.entries()),
					});

					// Report error response to parent window
					reportParent({
						type: "mcp",
						subType: "http-error",
						success: false,
						payload: {
							...baseReportData,
							error: {
								message: errorMessage,
								type: "http",
								status: response.status,
								responseBody,
							},
						},
					});

					// Retry on 5xx errors or 429 (rate limit)
					if (
						(response.status >= 500 || response.status === 429) &&
						retryCount < maxRetries
					) {
						const delay = Math.min(1000 * 2 ** retryCount, 10000);
						console.warn(
							`[MCP] Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`,
						);
						await new Promise((resolve) => setTimeout(resolve, delay));
						return callMCP(
							serverUrl,
							mcpId,
							request,
							transportType,
							retryCount + 1,
							maxRetries,
						);
					}

					throw new Error(errorMessage);
				}

				const data: MCPResponse = await response.json();

				console.log("[MCP] Response data:", {
					hasError: !!data.error,
					hasResult: !!data.result,
					id: data.id,
				});

				if (data.error) {
					const errorMessage = data.error.message || "MCP request failed";

					console.error("[MCP] MCP Error:", {
						code: data.error.code,
						message: data.error.message,
						data: data.error.data,
					});

					// Report MCP error to parent window
					reportParent({
						type: "mcp",
						subType: "data-error",
						success: false,
						payload: {
							...baseReportData,
							error: {
								message: errorMessage,
								type: "mcp-data",
								code: data.error.code,
								data: data.error.data,
							},
						},
					});
					throw new Error(errorMessage);
				}

				console.log("[MCP] Success!");

				// Report successful response to parent window
				reportParent({
					type: "mcp",
					subType: "response-success",
					success: true,
					payload: {
						...baseReportData,
						response: data,
					},
				});

				return data.result;
			} catch (error) {
				// Enhanced error reporting with network-specific details
				if (error instanceof Error) {
					const errorDetails = {
						name: error.name,
						message: error.message,
						stack: error.stack,
					};

					// Detect network error types
					let errorType = "runtime";
					let userFriendlyMessage = error.message;

					if (error.name === "TypeError" && error.message.includes("fetch")) {
						errorType = "network";
						userFriendlyMessage =
							"Network error: Unable to connect to server. Please check your internet connection.";
					} else if (
						error.name === "AbortError" ||
						error.message.includes("timeout")
					) {
						errorType = "timeout";
						userFriendlyMessage =
							"Request timeout: Server took too long to respond. Please try again.";
					} else if (error.message.includes("CORS")) {
						errorType = "cors";
						userFriendlyMessage =
							"CORS error: Server denied access. This may be a server configuration issue.";
					}

					console.error(`[MCP] ${errorType} error:`, errorDetails);

					reportParent({
						type: "mcp",
						subType: `${errorType}-error`,
						success: false,
						payload: {
							...baseReportData,
							error: {
								message: userFriendlyMessage,
								type: errorType,
								originalError: errorDetails,
							},
						},
					});

					// Retry on network errors (but not on validation errors)
					if (
						(errorType === "network" || errorType === "timeout") &&
						retryCount < maxRetries
					) {
						const delay = Math.min(1000 * 2 ** retryCount, 10000);
						console.warn(
							`[MCP] Retrying after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`,
						);
						await new Promise((resolve) => setTimeout(resolve, delay));
						return callMCP(
							serverUrl,
							mcpId,
							request,
							transportType,
							retryCount + 1,
							maxRetries,
						);
					}
				}
				throw error;
			}
		},
		[token, isAuthenticated, reportParent, appConfig],
	);

	const listTools = useCallback(
		async (serverUrl: string, mcpId: string) => {
			return callMCP(serverUrl, mcpId, {
				jsonrpc: "2.0",
				id: `list-tools-${Date.now()}`,
				method: "tools/list",
			});
		},
		[callMCP],
	);

	const callTool = useCallback(
		async <TOutput = unknown, TInput = Record<string, unknown>>(
			serverUrl: string,
			mcpId: string,
			toolName: string,
			args: TInput,
		): Promise<TOutput> => {
			return callMCP(serverUrl, mcpId, {
				jsonrpc: "2.0",
				id: `call-tool-${Date.now()}`,
				method: "tools/call",
				params: {
					name: toolName,
					arguments: args,
				},
			}) as Promise<TOutput>;
		},
		[callMCP],
	);

	// No need for message queue processing - handled by useReportToParentWindow

	return {
		listTools,
		callTool,
	};
}
