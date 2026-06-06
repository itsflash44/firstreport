import json
import os
import re
from pathlib import Path
from graphify.extract import collect_files, extract
from graphify.cache import check_semantic_cache, save_semantic_cache
from graphify.llm import extract_corpus_parallel

def main():
    # 1. Load detection results
    detect_path = Path('graphify-out/.graphify_detect.json')
    if not detect_path.exists():
        print("Error: .graphify_detect.json not found")
        return
    detect = json.loads(detect_path.read_text(encoding='utf-8'))
    
    # 2. Extract AST structural code data
    code_files = []
    for f in detect.get('files', {}).get('code', []):
        code_files.extend(collect_files(Path(f)) if Path(f).is_dir() else [Path(f)])
    
    if code_files:
        print(f"Extracting AST structural data from {len(code_files)} code files...")
        ast_result = extract(code_files, cache_root=Path('.'))
        Path('graphify-out/.graphify_ast.json').write_text(json.dumps(ast_result, indent=2, ensure_ascii=False), encoding='utf-8')
        print(f"AST: {len(ast_result['nodes'])} nodes, {len(ast_result['edges'])} edges")
    else:
        Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}), encoding='utf-8')
        print("No code files - skipping AST extraction")
        ast_result = {'nodes':[], 'edges':[]}

    # 3. Read API Key from .env.local
    api_key = None
    env_local = Path('.env.local')
    if env_local.exists():
        content = env_local.read_text(encoding='utf-8')
        match = re.search(r'GEMINI_API_KEY\s*=\s*([^\s#]+)', content)
        if match:
            api_key = match.group(1).strip()
            # remove quotes if any
            if (api_key.startswith('"') and api_key.endswith('"')) or (api_key.startswith("'") and api_key.endswith("'")):
                api_key = api_key[1:-1]
            os.environ['GEMINI_API_KEY'] = api_key
            print("Successfully loaded GEMINI_API_KEY from .env.local")

    # 4. Check cache for all non-code files
    non_code_files = []
    for key in ['document', 'paper', 'image']:
        non_code_files.extend(detect.get('files', {}).get(key, []))

    print(f"Checking semantic cache for {len(non_code_files)} files...")
    cached_nodes, cached_edges, cached_hyperedges, uncached_paths = check_semantic_cache(non_code_files)
    
    cached_data = {
        'nodes': cached_nodes,
        'edges': cached_edges,
        'hyperedges': cached_hyperedges or []
    }
    
    print(f"Cache: {len(non_code_files) - len(uncached_paths)} files hit, {len(uncached_paths)} files need extraction")
    
    new_sem = {'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}
    
    if uncached_paths:
        if not api_key:
            print("Error: GEMINI_API_KEY not found in environment or .env.local. Semantic extraction cannot proceed.")
            return
            
        print(f"Running semantic extraction on {len(uncached_paths)} uncached files via Gemini...")
        # convert paths to Path objects as required by extract_corpus_parallel
        uncached_file_objs = [Path(p) for p in uncached_paths]
        
        # Run semantic extraction in parallel using Gemini
        new_sem = extract_corpus_parallel(
            files=uncached_file_objs,
            backend="gemini",
            api_key=api_key,
            model="gemini-2.5-flash",
            max_concurrency=1,
            chunk_size=10
        )
        print(f"Semantic extraction completed: {len(new_sem.get('nodes', []))} nodes, {len(new_sem.get('edges', []))} edges")
        
        # Save new semantic extraction to cache
        saved = save_semantic_cache(
            new_sem.get('nodes', []),
            new_sem.get('edges', []),
            new_sem.get('hyperedges', [])
        )
        print(f"Saved {saved} files to semantic cache")

    # 5. Merge Cached + New semantic results
    all_nodes = cached_data['nodes'] + new_sem.get('nodes', [])
    all_edges = cached_data['edges'] + new_sem.get('edges', [])
    all_hyperedges = cached_data['hyperedges'] + new_sem.get('hyperedges', [])
    
    seen = set()
    deduped = []
    for n in all_nodes:
        if n['id'] not in seen:
            seen.add(n['id'])
            deduped.append(n)
            
    merged_semantic = {
        'nodes': deduped,
        'edges': all_edges,
        'hyperedges': all_hyperedges,
        'input_tokens': new_sem.get('input_tokens', 0),
        'output_tokens': new_sem.get('output_tokens', 0)
    }
    Path('graphify-out/.graphify_semantic.json').write_text(json.dumps(merged_semantic, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"Semantic merge: {len(deduped)} total nodes, {len(all_edges)} total edges")

    # 6. Merge AST + Semantic into final extraction
    ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text(encoding='utf-8'))
    sem = merged_semantic
    
    seen_ids = {n['id'] for n in ast['nodes']}
    merged_nodes = list(ast['nodes'])
    for n in sem['nodes']:
        if n['id'] not in seen_ids:
            merged_nodes.append(n)
            seen_ids.add(n['id'])
            
    merged_edges = ast['edges'] + sem['edges']
    merged_hyperedges = sem.get('hyperedges', [])
    
    final_extract = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': merged_hyperedges,
        'input_tokens': sem.get('input_tokens', 0),
        'output_tokens': sem.get('output_tokens', 0)
    }
    Path('graphify-out/.graphify_extract.json').write_text(json.dumps(final_extract, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"Final extraction merge complete: {len(merged_nodes)} nodes, {len(merged_edges)} edges")

if __name__ == '__main__':
    main()
