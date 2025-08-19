#!/usr/bin/env python3
"""
Bundle Recreation Script - Preserves exact file formatting
Extracts projects from text bundles without adding whitespace
"""

import os
import sys
import shutil
from pathlib import Path

def recreate_from_bundle(bundle_file, output_dir, apply_replacements=False):
    """Recreate project structure from bundle file preserving exact formatting."""
    
    if not os.path.exists(bundle_file):
        print(f"ERROR: Bundle file '{bundle_file}' not found!")
        return 0
    
    print(f"Processing {bundle_file} -> {output_dir}")
    
    # Remove and recreate output directory
    output_dir = os.path.normpath(output_dir)
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir, exist_ok=True)
    
    current_file = None
    in_file = False
    file_content = []
    file_count = 0
    
    with open(bundle_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line_num, line in enumerate(f, 1):
            # Remove only the newline at the end, preserve other whitespace
            line = line.rstrip('\n\r')
            
            # Check for file begin marker
            if '===BEGIN FILE:' in line:
                # Extract file path
                start = line.find('===BEGIN FILE:') + len('===BEGIN FILE:')
                end = line.find('===', start) if '===' in line[start:] else len(line)
                file_path = line[start:end].strip()
                
                # Create full path
                file_path = file_path.replace('\\', '/')
                current_file = os.path.join(output_dir, file_path)
                current_file = os.path.normpath(current_file)
                
                # Create directory structure
                dir_path = os.path.dirname(current_file)
                if dir_path:
                    os.makedirs(dir_path, exist_ok=True)
                
                in_file = True
                file_content = []
                file_count += 1
                
                if file_count % 10 == 0:
                    print(f"  Processing file {file_count}: {file_path}")
                
            # Check for file end marker
            elif '===END FILE===' in line:
                if in_file and current_file:
                    # Write the collected content preserving exact formatting
                    with open(current_file, 'w', encoding='utf-8', newline='') as f:
                        if file_content:
                            f.write('\n'.join(file_content))
                            # Only add final newline if original had content
                            if file_content[-1] != '':
                                f.write('\n')
                in_file = False
                file_content = []
                current_file = None
                
            # Collect file content
            elif in_file:
                file_content.append(line)
            
            # Progress indicator for large files
            if line_num % 10000 == 0:
                print(f"  Processed {line_num} lines...")
    
    print(f"SUCCESS: Created {file_count} files in {output_dir}\n")
    return file_count

def main():
    if len(sys.argv) < 3:
        print("Usage: python recreate_from_bundle.py <bundle.txt> <output_dir>")
        sys.exit(1)
    
    bundle = sys.argv[1]
    output = sys.argv[2]
    
    print("="*60)
    print("   BUNDLE EXTRACTION")
    print("="*60)
    print()
    
    recreate_from_bundle(bundle, output)

if __name__ == "__main__":
    main()