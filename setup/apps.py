import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "core" / "data" / "apps.json"
OUT_NAME = "core/data/apps.json"
FORMAT = "formskills-apps"
SPEC_FORMAT = "formai-family"
SPEC_VERSION = 1
TOPICS = {
    "Media": ["audio", "encoder", "image", "motion", "photo", "promo", "video"],
    "Design": ["layout", "sculpt", "slides", "texture", "vector", "web"],
    "Documents": ["chat", "document", "notes", "pdf", "reference", "spreadsheet"],
    "Family": ["connect", "extensions", "launcher", "library", "portal", "skill", "utility"],
}
FALLBACK_TOPIC = "Family"
REQUIRED = ("id", "app", "name", "kind", "summary", "licence", "repository", "state", "agents", "release")


def fail(message):
    print(f"apps: {message}", file=sys.stderr)
    sys.exit(2)


def topic_of(kind, fallen):
    for topic, kinds in TOPICS.items():
        if kind in kinds:
            return topic
    fallen.add(kind)
    return FALLBACK_TOPIC


def load_family(path):
    try:
        family = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        fail(f"cannot read the family spec {path}: {error}")
    if not isinstance(family, dict) or family.get("format") != SPEC_FORMAT or family.get("format_version") != SPEC_VERSION:
        fail(f"{path} is not a {SPEC_FORMAT} version {SPEC_VERSION} file")
    source = family.get("source")
    if not isinstance(source, dict) or not isinstance(source.get("registry_version"), str) or not isinstance(family.get("apps"), list):
        fail(f"{path} has no source.registry_version or no apps list")
    return family


def build(family):
    apps = []
    fallen = set()
    seen = set()
    for entry in family["apps"]:
        if not isinstance(entry, dict) or entry.get("public") is not True:
            continue
        missing = [key for key in REQUIRED if key not in entry]
        if missing:
            fail(f"public entry {entry.get('id')!r} lacks {', '.join(missing)}")
        skills = (entry["agents"] or {}).get("skills") or ""
        if not skills:
            continue
        if entry["id"] in seen:
            fail(f"the family spec lists {entry['id']!r} twice")
        seen.add(entry["id"])
        apps.append({
            "id": entry["id"],
            "app": entry["app"],
            "name": entry["name"],
            "kind": entry["kind"],
            "topic": topic_of(entry["kind"], fallen),
            "licence": entry["licence"] or "",
            "summary": entry["summary"],
            "repository": f"https://github.com/{entry['repository']}",
            "skills": skills,
            "state": entry["state"],
            "released": entry["release"] is not None,
        })
    for kind in sorted(fallen):
        print(f"apps: kind {kind!r} is not in TOPICS, listed under {FALLBACK_TOPIC}", file=sys.stderr)
    apps.sort(key=lambda a: (a["name"].lower(), a["id"]))
    return {
        "format": FORMAT,
        "format_version": 2,
        "source": {"repository": family["source"].get("repository") or "nodemode-dev/formcompiler", "version": family["source"]["registry_version"]},
        "topics": list(TOPICS),
        "apps": apps,
    }


def main():
    parser = argparse.ArgumentParser(description="core/data/apps.json from the family spec: the public Form apps that ship skills")
    parser.add_argument("--family", required=True, help="family.json from formadaptor's spec branch")
    parser.add_argument("--check", action="store_true", help="write nothing; exit 1 naming core/data/apps.json when it differs")
    args = parser.parse_args()
    text = json.dumps(build(load_family(args.family)), indent=2, ensure_ascii=False) + "\n"
    current = OUT.read_text(encoding="utf-8") if OUT.is_file() else ""
    if args.check:
        print("apps: in step" if current == text else f"apps: drifted: {OUT_NAME}")
        sys.exit(0 if current == text else 1)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    count = len(json.loads(text)["apps"])
    print(f"apps: {OUT.relative_to(ROOT)} {'unchanged' if current == text else 'written'}, {count} apps")


if __name__ == "__main__":
    main()
