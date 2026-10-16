"""Test and verify a local firmware delivery. Never opens a device or publishes a Release."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def require(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", required=True, help="Semantic version, without leading v")
    parser.add_argument("--feature", default="", help="Optional filename label")
    parser.add_argument("--boot-app0", type=Path, required=True,
                        help="boot_app0.bin from the pinned Arduino framework")
    parser.add_argument("--output-dir", type=Path)
    args = parser.parse_args()
    require(re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+", args.version), "Invalid version")
    require(not args.feature or re.fullmatch(r"[A-Za-z0-9-]+", args.feature), "Invalid feature label")
    root = Path(__file__).resolve().parent.parent
    version = json.loads((root / "core/PocketQuestCore/library.json").read_text())["version"]
    require(args.version == version, "Filename version differs from core library version")
    subprocess.run(["sh", "tools/test-host.sh"], cwd=root, check=True)
    subprocess.run([sys.executable, "tools/check-build.py"], cwd=root, check=True)
    build = root / "firmware/.pio/build/m5stack-sticks3"
    merged = (build / "firmware.factory.bin").read_bytes()
    sources = [("bootloader", 0x0000, build / "bootloader.bin"),
               ("partitions", 0x8000, build / "partitions.bin"),
               ("boot_app0", 0xE000, args.boot_app0),
               ("application", 0x10000, build / "firmware.bin")]
    segments = []
    end = 0
    for label, offset, path in sources:
        data = path.read_bytes()
        require(data and offset >= end, f"Invalid or overlapping {label}")
        require(merged[offset:offset + len(data)] == data, f"Merged {label} differs at {offset:#x}")
        require(all(value == 255 for value in merged[end:offset]), f"Unexpected data before {label}")
        end = offset + len(data)
        segments.append({"name": label, "offset": hex(offset), "bytes": len(data),
                         "sha256": hashlib.sha256(data).hexdigest()})
    require(end == len(merged), "Unexpected trailing data in factory image")
    require(len(merged) <= 0x4F0000, "Factory image reaches the save partition")
    output = (args.output_dir or root / "release").resolve()
    output.mkdir(parents=True, exist_ok=True)
    suffix = "-" + args.feature if args.feature else ""
    target = output / f"PocketQuestMini-S3-v{args.version}{suffix}.factory.bin"
    digest = hashlib.sha256(merged).hexdigest()
    # Refuse to silently replace a differently built artifact with the same name.
    require(not target.exists() or target.read_bytes() == merged, "Delivery name already has different contents")
    target.write_bytes(merged)
    require(hashlib.sha256(target.read_bytes()).hexdigest() == digest, "Delivery copy verification failed")
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
    dirty = bool(subprocess.check_output(["git", "status", "--porcelain"], cwd=root, text=True).strip())
    report = {"file": target.name, "version": args.version, "flashAddress": "0x0000",
              "bytes": len(merged), "sha256": digest, "sourceCommit": commit,
              "sourceWorkingTreeDirty": dirty, "segments": segments,
              "tests": "host regression and build/partition checks passed",
              "warning": "No filesystems included. Do not full-erase for a routine update. NVS padding is included."}
    target.with_suffix(".json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    print(f"DOWNLOAD: {target}\nFLASH ADDRESS: 0x0000")


if __name__ == "__main__":
    main()
