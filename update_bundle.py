#!/usr/bin/env python3
"""
Bundle Update Script - Creates text bundles from directories
Preserves exact file content without modifications
"""

import os
import sys
from pathlib import Path

# Files and directories to skip
SKIP_PATTERNS = {
    '.git', '.gitignore', 'node_modules', '__pycache__', '.pyc', 
    '.pyo', '.DS_Store', 'dist', 'build', 'target', '.idea',
    '.vscode', '*.log', 'bundle.txt', 'recreate_from_bundle.py',
    'update_bundle.py', '.env', '.env.local'
}

def should_skip(path):
    """Check if a file or directory should be skipped."""
    name = os.path.basename(path)
    
    # Check exact matches
    if name in SKIP_PATTERNS:
        return True
    
    # Check patterns
    for pattern in SKIP_PATTERNS:
        if pattern.startswith('*') and name.endswith(pattern[1:]):
            return True
        if pattern.endswith('*') and name.startswith(pattern[:-1]):
            return True
    
    return False

def is_binary_file(file_path):
    """Check if a file is binary."""
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
            # Check for null bytes
            if b'\0' in chunk:
                return True
            # Check if mostly printable
            text_chars = bytes(range(32, 127)) + b'\n\r\t\f\b'
            non_text = chunk.translate(None, text_chars)
            if len(non_text) / len(chunk) > 0.3:
                return True
        return False
    except:
        return True

def create_bundle(source_dir, bundle_file):
    """Create a bundle file from a directory."""
    
    if not os.path.exists(source_dir):
        print(f"ERROR: Source directory '{source_dir}' not found!")
        return 0
    
    print(f"Creating bundle from {source_dir} -> {bundle_file}")
    
    file_count = 0
    
    with open(bundle_file, 'w', encoding='utf-8', newline='') as bundle:
        # Walk through all files in the directory
        for root, dirs, files in os.walk(source_dir):
            # Filter out directories to skip
            dirs[:] = [d for d in dirs if not should_skip(d)]
            
            for file in files:
                if should_skip(file):
                    continue
                
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, source_dir)
                
                # Skip binary files
                if is_binary_file(file_path):
                    print(f"  Skipping binary file: {relative_path}")
                    continue
                
                # Write file marker
                bundle.write(f"===BEGIN FILE:{relative_path}===\n")
                
                # Write file content preserving exact formatting
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        # Write content as-is
                        bundle.write(content)
                        # Ensure there's a newline before the end marker
                        if not content.endswith('\n'):
                            bundle.write('\n')
                except Exception as e:
                    print(f"  Warning: Could not read {relative_path}: {e}")
                    bundle.write(f"// Error reading file: {e}\n")
                
                # Write end marker
                bundle.write("===END FILE===\n")
                
                file_count += 1
                if file_count % 10 == 0:
                    print(f"  Bundled {file_count} files...")
    
    print(f"SUCCESS: Bundled {file_count} files into {bundle_file}\n")
    return file_count

def main():
    if len(sys.argv) < 2:
        print("Usage: python update_bundle.py <source_dir> [bundle_file]")
        print("  If bundle_file is not specified, creates 'bundle.txt' in current directory")
        sys.exit(1)
    
    source_dir = sys.argv[1]
    bundle_file = sys.argv[2] if len(sys.argv) > 2 else 'bundle.txt'
    
    print("="*60)
    print("   BUNDLE CREATION")
    print("="*60)
    print()
    
    create_bundle(source_dir, bundle_file)

if __name__ == "__main__":
    main()