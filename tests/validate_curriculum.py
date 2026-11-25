"""Validate staged cards and path against the upstream schema or its snapshot."""
import json
from pathlib import Path
from graphlib import TopologicalSorter
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "content/curricula/local-llm"


def read_json(path: Path) -> Any:
    """Load UTF-8 JSON from disk."""
    return json.loads(path.read_text(encoding="utf-8"))


def validate() -> None:
    """Check schema validity, unique positions, references and graph closure."""
    schema = ROOT / "content/schema/card.schema.json"
    if not schema.exists():
        schema = COURSE / "schema/upstream-card.schema.json"
    card_validator = Draft202012Validator(read_json(schema), format_checker=FormatChecker())
    path = read_json(COURSE / "path.json")
    path_validator = Draft202012Validator(
        read_json(COURSE / "schema/path.schema.json"), format_checker=FormatChecker()
    )
    path_validator.validate(path)
    cards = {file.stem: read_json(file) for file in (COURSE / "cards").glob("*.json")}
    assert set(cards) == set(path["card_ids"]) == set(path["nodes"])
    assert path["target"] in cards
    positions: set[tuple[str, int]] = set()
    for card_id, card in cards.items():
        card_validator.validate(card)
        assert card_id == card["id"]
        position = (card["category"], card["index"])
        assert position not in positions, position
        positions.add(position)
        assert set(card.get("related_ids", [])) <= cards.keys()
        overlay = card.get("role_overlays", {}).get("builder", {})
        scenario = overlay.get("scenario")
        if scenario:
            refs = [scenario["answer_id"], *scenario.get("distractors", [])]
            assert set(refs) <= cards.keys() and len(refs) == len(set(refs))
    graph = {id_: node["prerequisite_ids"] for id_, node in path["nodes"].items()}
    for id_, deps in graph.items():
        assert id_ not in deps and set(deps) <= cards.keys()
    order = list(TopologicalSorter(graph).static_order())
    reachable: set[str] = set()
    pending = [path["target"]]
    while pending:
        id_ = pending.pop()
        if id_ in reachable:
            continue
        reachable.add(id_)
        pending.extend(graph[id_])
    assert reachable == cards.keys(), f"Unreachable from capstone: {cards.keys() - reachable}"
    print(f"Validated {len(order)} cards, {sum(map(len, graph.values()))} DAG edges")
    print(f"Card schema: {schema.relative_to(ROOT)}")


if __name__ == "__main__":
    validate()
