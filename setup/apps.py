import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "core" / "data" / "apps.json"
FORMAT = "formskills-apps"
TOPICS = {
    "Media": ["audio", "encoder", "image", "motion", "photo", "promo", "video"],
    "Design": ["layout", "sculpt", "slides", "texture", "vector", "web"],
    "Documents": ["chat", "document", "notes", "pdf", "reference", "spreadsheet"],
    "Family": ["connect", "launcher", "library", "portal", "skill"],
}


def topic_of(kind):
    for topic, kinds in TOPICS.items():
        if kind in kinds:
            return topic
    sys.exit(f"apps: kind {kind!r} has no topic; add it to TOPICS in setup/apps.py")


def git(repo, *args):
    try:
        return subprocess.check_output(["git", "-C", str(repo), *args], text=True, stderr=subprocess.DEVNULL).strip()
    except (OSError, subprocess.CalledProcessError):
        return ""


def build(compiler):
    apps_dir = compiler / "apps"
    if not apps_dir.is_dir():
        sys.exit(f"apps: {apps_dir} is not formcompiler's registry folder")
    version = (compiler / "VERSION").read_text(encoding="utf-8").strip() if (compiler / "VERSION").is_file() else ""
    apps = []
    for path in sorted(apps_dir.glob("*.json")):
        entry = json.loads(path.read_text(encoding="utf-8"))
        skills = (entry.get("agents") or {}).get("skills") or ""
        if not skills:
            continue
        catalog = entry["catalog"]
        apps.append({
            "id": catalog["id"],
            "app": entry["app"],
            "name": catalog["name"],
            "kind": catalog["kind"],
            "topic": topic_of(catalog["kind"]),
            "licence": catalog.get("licence") or "",
            "summary": catalog["summary"],
            "repository": f"https://github.com/{entry['repository']}",
            "skills": skills,
            "state": catalog["state"],
            "released": bool(entry.get("enabled")),
        })
    apps.sort(key=lambda a: a["name"].lower())
    return {
        "format": FORMAT,
        "format_version": 2,
        "source": {"repository": "nodemode-dev/formcompiler", "version": version, "commit": git(compiler, "rev-parse", "HEAD")},
        "topics": list(TOPICS),
        "apps": apps,
    }


def main():
    parser = argparse.ArgumentParser(description="core/data/apps.json from formcompiler's registry: the Form apps that ship skills")
    parser.add_argument("--compiler", required=True, help="a checkout of nodemode-dev/formcompiler")
    parser.add_argument("--check", action="store_true", help="fail when core/data/apps.json differs")
    args = parser.parse_args()
    text = json.dumps(build(Path(args.compiler).resolve()), indent=2, ensure_ascii=False) + "\n"
    current = OUT.read_text(encoding="utf-8") if OUT.is_file() else ""
    if args.check:
        print("apps: in step" if current == text else "apps: drifted (run python3 setup/apps.py --compiler PATH)")
        sys.exit(0 if current == text else 1)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    count = len(json.loads(text)["apps"])
    print(f"apps: {OUT.relative_to(ROOT)} {'unchanged' if current == text else 'written'}, {count} apps")


if __name__ == "__main__":
    main()
