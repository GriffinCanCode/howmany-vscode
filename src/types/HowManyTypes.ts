/**
 * Core types matching howmany-core Rust structs
 */

import * as vscode from 'vscode';

/**
 * File-level statistics from analysis
 */
export interface FileStats {
    /** Total number of lines in the file */
    total_lines: number;
    /** Lines containing actual code */
    code_lines: number;
    /** Lines containing comments */
    comment_lines: number;
    /** Empty/whitespace-only lines */
    blank_lines: number;
    /** File size in bytes */
    file_size: number;
    /** Lines containing documentation */
    doc_lines: number;
}

/**
 * Statistics for a specific file extension (matching core ExtensionStats)
 */
export interface ExtensionStats {
    /** Number of files with this extension */
    file_count: number;
    /** Total lines in all files of this extension */
    total_lines: number;
    /** Total code lines */
    code_lines: number;
    /** Total comment lines */
    comment_lines: number;
    /** Total documentation lines */
    doc_lines: number;
    /** Total blank lines */
    blank_lines: number;
    /** Total size in bytes */
    total_size: number;
    /** Average lines per file */
    average_lines_per_file: number;
    /** Average size per file */
    average_size_per_file: number;
}

/**
 * Basic statistics (matching core BasicStats)
 */
export interface BasicStats {
    /** Total number of files analyzed */
    total_files: number;
    /** Total lines across all files */
    total_lines: number;
    /** Total code lines across all files */
    code_lines: number;
    /** Total comment lines across all files */
    comment_lines: number;
    /** Total blank lines across all files */
    blank_lines: number;
    /** Total size in bytes of all files */
    total_size: number;
    /** Total documentation lines across all files */
    doc_lines: number;
    /** Average file size */
    average_file_size: number;
    /** Average lines per file */
    average_lines_per_file: number;
    /** Largest file size */
    largest_file_size: number;
    /** Smallest file size */
    smallest_file_size: number;
    /** Statistics grouped by file extension */
    stats_by_extension: Record<string, ExtensionStats>;
}

/**
 * Quality metrics from ratios.quality_metrics
 */
export interface QualityMetrics {
    /** Overall quality score (0-100) */
    overall_quality_score: number;
    /** Maintainability index score (0-100) */
    maintainability_score: number;
    /** Documentation coverage score (0-100) */
    documentation_score: number;
    /** Readability score (0-100) */
    readability_score: number;
    /** Consistency score (0-100) */
    consistency_score: number;
}

/**
 * Complexity statistics from core
 */
export interface ComplexityStats {
    /** Number of functions */
    function_count: number;
    /** Number of classes */
    class_count: number;
    /** Total code structures */
    total_structures: number;
    /** Cyclomatic complexity average */
    cyclomatic_complexity: number;
    /** Cognitive complexity average */
    cognitive_complexity: number;
    /** Maintainability index */
    maintainability_index: number;
    /** Maximum nesting depth */
    max_nesting_depth: number;
    /** Average nesting depth */
    average_nesting_depth: number;
}

/**
 * Ratio statistics from core
 */
export interface RatioStats {
    /** Code lines ratio */
    code_ratio: number;
    /** Comment lines ratio */
    comment_ratio: number;
    /** Documentation lines ratio */
    doc_ratio: number;
    /** Blank lines ratio */
    blank_ratio: number;
    /** Comment to code ratio */
    comment_to_code_ratio: number;
    /** Documentation to code ratio */
    doc_to_code_ratio: number;
    /** Quality metrics */
    quality_metrics: QualityMetrics;
}

/**
 * Metadata about the analysis
 */
export interface StatsMetadata {
    /** Calculation time in milliseconds */
    calculation_time_ms: number;
    /** HowMany version */
    version: string;
    /** Analysis timestamp */
    timestamp: string;
    /** Number of files analyzed */
    file_count_analyzed: number;
    /** Total bytes analyzed */
    total_bytes_analyzed: number;
    /** Languages detected */
    languages_detected: string[];
    /** Analysis depth performed */
    analysis_depth: string;
}

/**
 * Main result interface from core
 */
export interface HowManyResult {
    /** Basic statistics */
    basic: BasicStats;
    /** Complexity analysis results */
    complexity: ComplexityStats;
    /** Ratio analysis results */
    ratios: RatioStats;
    /** Analysis metadata */
    metadata: StatsMetadata;
}

/**
 * Legacy interface for backward compatibility
 * Maps to the new HowManyResult structure
 */
export interface LegacyHowManyResult {
    /** Basic code statistics */
    basic: BasicStats;
    /** Quality metrics (mapped from ratios.quality_metrics) */
    quality?: QualityMetrics;
    /** Time estimates (converted from minutes to hours) */
    time?: {
        total_development_time_hours: number;
        code_writing_time_hours: number;
        documentation_time_hours: number;
    };
    /** ISO timestamp of when analysis was performed */
    analysis_timestamp: string;
    /** Path that was analyzed */
    analysis_path: string;
}

/**
 * Status bar display modes
 */
export type StatusBarDisplay = 'lines' | 'files' | 'quality' | 'auto' | 'smart';

/**
 * Number formatting styles
 */
export type NumberFormat = 'abbreviated' | 'full' | 'compact';

/**
 * Status bar click actions
 */
export type StatusBarClickAction = 'quickActions' | 'showReport' | 'analyzeWorkspace';

/**
 * Webview theme options
 */
export type WebviewTheme = 'auto' | 'minimal' | 'detailed';

/**
 * Sort criteria for analysis results
 */
export type SortCriteria = 'files' | 'lines' | 'code' | 'comments' | 'size';

/**
 * Quality thresholds configuration
 */
export interface QualityThresholds {
    /** Overall quality score threshold (0-100) */
    overall: number;
    /** Maintainability index threshold (0-100) */
    maintainability: number;
    /** Documentation coverage threshold (0-100) */
    documentation: number;
    /** Maximum average complexity per function */
    complexity: number;
}

/**
 * Status bar configuration options
 */
export interface StatusBarConfig {
    /** What metric to display */
    display: StatusBarDisplay;
    /** How to format numbers */
    format: NumberFormat;
    /** Whether to show quality-based colors */
    showQualityColor: boolean;
    /** Whether to show the graph icon */
    showIcon: boolean;
    /** Action to perform on click */
    clickAction: StatusBarClickAction;
}

/**
 * Webview configuration options
 */
export interface WebviewConfig {
    /** Theme and detail level */
    theme: WebviewTheme;
    /** Enable animations and transitions */
    animations: boolean;
    /** Auto-refresh on analysis completion */
    autoRefresh: boolean;
}

/**
 * Analysis behavior configuration
 */
export interface AnalysisConfig {
    /** Show intelligent suggestions */
    smartSuggestions: boolean;
    /** Quality thresholds */
    qualityThresholds: QualityThresholds;
}

/**
 * Notification preferences
 */
export interface NotificationConfig {
    /** Show completion notifications */
    showCompletion: boolean;
    /** Show error notifications */
    showErrors: boolean;
    /** Show quality warning notifications */
    showQualityWarnings: boolean;
}

/**
 * Complete extension configuration
 */
export interface ExtensionConfig {
    /** Path to HowMany binary */
    binaryPath: string;
    /** Auto-analyze on startup and file changes */
    autoAnalyze: boolean;
    /** Maximum directory traversal depth */
    maxDepth: number;
    /** Include hidden files and directories */
    includeHidden: boolean;
    /** Specific file extensions to analyze */
    extensions: string[];
    /** Patterns to ignore during analysis */
    ignorePatterns: string[];
    /** Default sorting criteria */
    sortBy: SortCriteria;
    
    // New filtering options
    /** Use CLI mode for faster analysis */
    useCliMode: boolean;
    /** Minimum lines per file to include */
    minLines?: number;
    /** Maximum lines per file to include */
    maxLines?: number;
    /** Minimum file size to include (in bytes) */
    minSize?: number;
    /** Maximum file size to include (in bytes) */
    maxSize?: number;
    /** Include only these languages */
    onlyLanguages: string[];
    /** Exclude these languages */
    excludeLanguages: string[];
    /** Show enhanced CLI output options */
    showComplexity: boolean;
    showQuality: boolean;
    showTime: boolean;
    showRatios: boolean;
    showSize: boolean;
    
    /** Legacy notification setting (deprecated) */
    showNotifications: boolean;
    /** Status bar configuration */
    statusBar: StatusBarConfig;
    /** Webview configuration */
    webview: WebviewConfig;
    /** Analysis behavior configuration */
    analysis: AnalysisConfig;
    /** Notification preferences */
    notifications: NotificationConfig;
    /** Legacy quality thresholds (deprecated) */
    qualityThresholds: QualityThresholds;
}

/**
 * Quick action categories
 */
export type QuickActionCategory = 'analysis' | 'results' | 'suggestions' | 'config' | 'other';

/**
 * Quick action definition
 */
export interface QuickAction {
    /** Unique identifier for the action */
    id: string;
    /** Display label */
    label: string;
    /** VS Code icon name */
    icon: string;
    /** Whether the action is currently available */
    enabled: boolean;
    /** Optional description/help text */
    description?: string;
    /** Category for grouping actions */
    category?: QuickActionCategory;
}

/**
 * Utility type for creating partial configurations
 */
export type PartialExtensionConfig = Partial<ExtensionConfig>;

/**
 * Type guard to check if quality metrics are available
 */
export function hasQualityMetrics(result: HowManyResult): boolean {
    return result.ratios?.quality_metrics !== undefined;
}

/**
 * Get quality metrics from the result (always available in new structure)
 */
export function getQualityMetrics(result: HowManyResult): QualityMetrics | undefined {
    return result.ratios?.quality_metrics;
}

/**
 * Convert HowManyResult to legacy format for backward compatibility
 */
export function toLegacyResult(result: HowManyResult, analysisPath: string): LegacyHowManyResult {
    return {
        basic: result.basic,
        quality: result.ratios?.quality_metrics,
        analysis_timestamp: result.metadata.timestamp,
        analysis_path: analysisPath,
    };
}

/**
 * Utility type for status bar item with action
 */
export interface QuickPickItemWithAction extends vscode.QuickPickItem {
    action?: string;
} 