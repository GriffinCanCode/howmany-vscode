#!/usr/bin/env python3
"""
Sample Python file for testing HowMany VS Code extension.

This file demonstrates various code patterns that HowMany can analyze:
- Functions and classes
- Comments and documentation
- Different complexity patterns
"""

import os
import sys
from typing import List, Dict, Optional


class CodeAnalyzer:
    """A sample class to demonstrate code analysis capabilities."""
    
    def __init__(self, name: str, version: str = "1.0.0"):
        """Initialize the analyzer.
        
        Args:
            name: The name of the analyzer
            version: Version string (default: "1.0.0")
        """
        self.name = name
        self.version = version
        self.metrics = {}
    
    def analyze_file(self, filepath: str) -> Dict[str, int]:
        """Analyze a single file and return metrics.
        
        This method demonstrates moderate complexity with error handling
        and multiple return paths.
        
        Args:
            filepath: Path to the file to analyze
            
        Returns:
            Dictionary containing analysis metrics
            
        Raises:
            FileNotFoundError: If the file doesn't exist
            PermissionError: If the file can't be read
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
                
            # Simple metrics calculation
            lines = content.split('\n')
            metrics = {
                'total_lines': len(lines),
                'code_lines': sum(1 for line in lines if line.strip() and not line.strip().startswith('#')),
                'comment_lines': sum(1 for line in lines if line.strip().startswith('#')),
                'blank_lines': sum(1 for line in lines if not line.strip()),
            }
            
            return metrics
            
        except PermissionError as e:
            print(f"Permission denied: {e}")
            raise
        except Exception as e:
            print(f"Unexpected error: {e}")
            return {}
    
    def analyze_directory(self, directory: str, extensions: Optional[List[str]] = None) -> Dict[str, Dict[str, int]]:
        """Analyze all files in a directory.
        
        This method demonstrates higher complexity with nested loops
        and conditional logic.
        
        Args:
            directory: Directory to analyze
            extensions: List of file extensions to include (default: ['.py'])
            
        Returns:
            Dictionary mapping filenames to their metrics
        """
        if extensions is None:
            extensions = ['.py']
        
        results = {}
        
        for root, dirs, files in os.walk(directory):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    filepath = os.path.join(root, file)
                    try:
                        metrics = self.analyze_file(filepath)
                        relative_path = os.path.relpath(filepath, directory)
                        results[relative_path] = metrics
                    except (FileNotFoundError, PermissionError):
                        continue
        
        return results
    
    def generate_report(self, results: Dict[str, Dict[str, int]]) -> str:
        """Generate a formatted report from analysis results."""
        if not results:
            return "No files analyzed."
        
        total_files = len(results)
        total_lines = sum(metrics['total_lines'] for metrics in results.values())
        total_code = sum(metrics['code_lines'] for metrics in results.values())
        total_comments = sum(metrics['comment_lines'] for metrics in results.values())
        
        report = f"""
Analysis Report - {self.name} v{self.version}
{'=' * 50}

Files analyzed: {total_files}
Total lines: {total_lines:,}
Code lines: {total_code:,}
Comment lines: {total_comments:,}
Documentation ratio: {(total_comments / total_lines * 100) if total_lines > 0 else 0:.1f}%

Top 5 largest files:
"""
        
        # Sort by total lines and show top 5
        sorted_files = sorted(results.items(), key=lambda x: x[1]['total_lines'], reverse=True)[:5]
        
        for i, (filename, metrics) in enumerate(sorted_files, 1):
            report += f"  {i}. {filename}: {metrics['total_lines']} lines\n"
        
        return report


def main():
    """Main function to demonstrate the analyzer."""
    if len(sys.argv) < 2:
        print("Usage: python sample.py <directory>")
        sys.exit(1)
    
    directory = sys.argv[1]
    analyzer = CodeAnalyzer("Sample Analyzer")
    
    print(f"Analyzing directory: {directory}")
    results = analyzer.analyze_directory(directory)
    
    report = analyzer.generate_report(results)
    print(report)


if __name__ == "__main__":
    main() 