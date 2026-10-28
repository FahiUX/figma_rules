"""
Incremental Sync & Caching Engine for Figma Asset Exports (v2.2 Standard)
Maintains a local .asset_cache.json manifest tracking node content hashes,
timestamps, and output file manifests to enable lightning-fast incremental updates.
"""

import os
import json
import hashlib
import time

CACHE_FILE_NAME = ".asset_cache.json"

def compute_node_hash(node_data):
    """
    Computes a deterministic SHA-256 hash of a Figma node's serialized state
    including its geometry, children, fills, effects, and text content.
    """
    if isinstance(node_data, str):
        serialized = node_data.encode('utf-8')
    else:
        # Sort keys to ensure deterministic JSON representation
        serialized = json.dumps(node_data, sort_keys=True).encode('utf-8')
    return hashlib.sha256(serialized).hexdigest()

class AssetCache:
    def __init__(self, target_directory):
        self.target_dir = os.path.abspath(target_directory)
        self.cache_path = os.path.join(self.target_dir, CACHE_FILE_NAME)
        self.data = self._load_cache()

    def _load_cache(self):
        if os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[WARN] Failed to load cache, initializing fresh: {e}")
        return {
            "version": "2.2",
            "last_synced": None,
            "entries": {}
        }

    def save(self):
        """Saves current cache state to .asset_cache.json."""
        self.data["last_synced"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        os.makedirs(self.target_dir, exist_ok=True)
        with open(self.cache_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2)

    def should_export(self, node_id, current_node_data, expected_files=None, force=False):
        """
        Determines whether a node needs to be re-exported:
        Returns True (Cache Miss / Needs Export) or False (Cache Hit / Skip).
        """
        if force:
            return True, "Force export requested"

        entry = self.data["entries"].get(node_id)
        if not entry:
            return True, "No prior cache entry"

        # Check content hash
        current_hash = compute_node_hash(current_node_data)
        if entry.get("hash") != current_hash:
            return True, "Node content modified in Figma"

        # Verify output files still exist on disk
        cached_files = entry.get("files", [])
        if expected_files:
            cached_files = expected_files

        for fpath in cached_files:
            full_path = fpath if os.path.isabs(fpath) else os.path.join(self.target_dir, fpath)
            if not os.path.exists(full_path):
                return True, f"Output file missing on disk: {os.path.basename(full_path)}"

        return False, "Cache hit (unmodified)"

    def update_entry(self, node_id, node_name, current_node_data, generated_files):
        """Records an exported node into the cache manifest."""
        relative_files = []
        for f in generated_files:
            rel = os.path.relpath(f, self.target_dir) if os.path.isabs(f) else f
            relative_files.append(rel)

        self.data["entries"][node_id] = {
            "name": node_name,
            "hash": compute_node_hash(current_node_data),
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "files": relative_files
        }

    def get_stats(self):
        """Returns cache summary statistics."""
        return {
            "total_cached_nodes": len(self.data.get("entries", {})),
            "last_synced": self.data.get("last_synced")
        }

if __name__ == '__main__':
    import sys
    target = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    cache = AssetCache(target)
    stats = cache.get_stats()
    print(f"Asset Cache Manifest for: {target}")
    print(f"  Total Cached Nodes: {stats['total_cached_nodes']}")
    print(f"  Last Synced:        {stats['last_synced']}")
