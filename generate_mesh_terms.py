#!/usr/bin/env python3
"""
Generate a 31,000+ entry terms.json from the official 2026 NLM MeSH XML release.

Source:
https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.zip

Usage:
    python generate_mesh_terms.py

Optional:
    python generate_mesh_terms.py --output terms.json
    python generate_mesh_terms.py --merge curated_terms.json
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

MESH_URL = (
    "https://nlmpubs.nlm.nih.gov/projects/mesh/"
    "MESH_FILES/xmlmesh/desc2026.zip"
)

LIST_FIELDS = {
    "searchTerms",
    "parts",
    "relatedTerms",
    "relatedConfusables",
    "synonyms",
    "antonyms",
    "examples",
    "clinicalPearls",
    "wordFamily",
    "tags",
}

TERM_KEYS = [
    "id",
    "word",
    "searchTerms",
    "parts",
    "definition",
    "plainDefinition",
    "pronunciation",
    "ipa",
    "category",
    "bodySystem",
    "difficulty",
    "partOfSpeech",
    "relatedTerms",
    "relatedConfusables",
    "synonyms",
    "antonyms",
    "examples",
    "clinicalPearls",
    "commonAbbreviation",
    "wordFamily",
    "tags",
    "mnemonicSeed",
]


def slugify(value: str) -> str:
    value = value.casefold()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def text_at(node: ET.Element, path: str, default: str = "") -> str:
    found = node.find(path)
    if found is None or found.text is None:
        return default
    return found.text.strip()


def texts_at(node: ET.Element, path: str) -> list[str]:
    values: list[str] = []
    for found in node.findall(path):
        if found.text:
            value = found.text.strip()
            if value and value not in values:
                values.append(value)
    return values


def infer_category(tree_numbers: list[str]) -> tuple[str, str]:
    """Map the first MeSH tree letter to an app-friendly category/body system."""
    if not tree_numbers:
        return "general", "General"

    letter = tree_numbers[0][0].upper()
    mapping = {
        "A": ("anatomy", "General Anatomy"),
        "B": ("organisms", "General"),
        "C": ("disease", "General"),
        "D": ("pharmacology", "General"),
        "E": ("diagnostics_and_therapeutics", "General"),
        "F": ("behavioral_health", "Behavioral Health"),
        "G": ("biological_sciences", "General"),
        "H": ("specialties", "General"),
        "I": ("social_sciences", "General"),
        "J": ("technology", "General"),
        "K": ("humanities", "General"),
        "L": ("information_science", "General"),
        "M": ("population", "General"),
        "N": ("healthcare", "General"),
        "V": ("publication_type", "General"),
        "Z": ("geography", "General"),
    }
    return mapping.get(letter, ("general", "General"))


def parse_mesh(xml_path: Path) -> list[dict]:
    terms: list[dict] = []
    used_ids: set[str] = set()

    # iterparse avoids loading the entire XML file into memory.
    for _, elem in ET.iterparse(xml_path, events=("end",)):
        if elem.tag != "DescriptorRecord":
            continue

        mesh_id = text_at(elem, "DescriptorUI")
        word = text_at(elem, "DescriptorName/String")
        if not word:
            elem.clear()
            continue

        scope_note = text_at(
            elem,
            "ConceptList/Concept/ScopeNote",
            default=f"MeSH descriptor for {word}.",
        )
        synonyms = texts_at(
            elem,
            "ConceptList/Concept/TermList/Term/String",
        )
        synonyms = [s for s in synonyms if s.casefold() != word.casefold()]

        tree_numbers = texts_at(elem, "TreeNumberList/TreeNumber")
        category, body_system = infer_category(tree_numbers)

        base_id = slugify(word) or mesh_id.casefold()
        term_id = base_id
        if term_id in used_ids:
            term_id = f"{base_id}-{mesh_id.casefold()}"
        used_ids.add(term_id)

        term = {
            "id": term_id,
            "word": word,
            "searchTerms": synonyms[:30],
            # MeSH does not provide verified prefix/root/suffix decomposition.
            # Leave empty rather than inventing incorrect word parts.
            "parts": [],
            "definition": scope_note,
            "plainDefinition": scope_note,
            "pronunciation": "",
            "ipa": "",
            "category": category,
            "bodySystem": body_system,
            "difficulty": "intermediate",
            "partOfSpeech": "noun",
            "relatedTerms": [],
            "relatedConfusables": [],
            "synonyms": synonyms[:30],
            "antonyms": [],
            "examples": [],
            "clinicalPearls": [],
            "commonAbbreviation": "",
            "wordFamily": [],
            "tags": ["mesh", category, f"mesh:{mesh_id}"],
            "mnemonicSeed": "",
        }
        terms.append(term)
        elem.clear()

    return terms


def normalize_term(term: dict) -> dict:
    return {
        key: term.get(key, [] if key in LIST_FIELDS else "")
        for key in TERM_KEYS
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="terms.json")
    parser.add_argument(
        "--merge",
        help="Optional curated terms.json. Curated entries override MeSH entries with the same id.",
    )
    parser.add_argument("--cache-dir", default=".mesh-cache")
    args = parser.parse_args()

    cache = Path(args.cache_dir)
    cache.mkdir(parents=True, exist_ok=True)
    zip_path = cache / "desc2026.zip"
    xml_path = cache / "desc2026.xml"

    if not zip_path.exists():
        print(f"Downloading official MeSH data:\n{MESH_URL}")
        urllib.request.urlretrieve(MESH_URL, zip_path)

    if not xml_path.exists():
        with zipfile.ZipFile(zip_path) as archive:
            xml_members = [
                name for name in archive.namelist()
                if name.lower().endswith(".xml")
            ]
            if not xml_members:
                raise RuntimeError("No XML file found in MeSH archive.")
            with archive.open(xml_members[0]) as source:
                xml_path.write_bytes(source.read())

    terms = parse_mesh(xml_path)
    term_map = {term["id"]: term for term in terms}

    if args.merge:
        curated_path = Path(args.merge)
        curated = json.loads(curated_path.read_text(encoding="utf-8"))
        for term in curated:
            term_map[term["id"]] = normalize_term(term)

    output = sorted(term_map.values(), key=lambda item: item["word"].casefold())
    Path(args.output).write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    manifest = {
        "source": "NLM Medical Subject Headings (MeSH), 2026",
        "sourceUrl": MESH_URL,
        "recordCount": len(output),
        "notes": [
            "NLM must be acknowledged as the source.",
            "MeSH-derived records have empty parts arrays unless overridden by curated data.",
            "The generated file is educational and is not a substitute for clinical guidance.",
        ],
    }
    Path("terms.index.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Created {args.output} with {len(output):,} terms.")
    print("Created terms.index.json.")


if __name__ == "__main__":
    main()
