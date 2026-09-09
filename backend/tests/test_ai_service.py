import pytest
from app.services import ai_service

def test_parse_llm_json_strips_markdown_fences():
    raw = '```json\n{"score": 80}\n```'
    assert ai_service._parse_llm_json(raw, fallback={}) == {"score": 80}

def test_parse_llm_json_array_with_conversational_text():
    raw = '''Here are your recommended projects:
[
  {"id": "p1", "title": "Project One"},
  {"id": "p2", "title": "Project Two"}
]
I hope this helps!'''
    res = ai_service._parse_llm_json(raw, fallback=[])
    assert isinstance(res, list)
    assert len(res) == 2
    assert res[0]["id"] == "p1"
    assert res[1]["title"] == "Project Two"

def test_parse_llm_json_object_with_conversational_text():
    raw = 'Certainly! Here is the JSON:\n{"phases": [{"phase_number": 1, "title": "Setup"}]}'
    res = ai_service._parse_llm_json(raw, fallback={})
    assert isinstance(res, dict)
    assert "phases" in res
    assert res["phases"][0]["title"] == "Setup"

def test_parse_llm_json_falls_back_on_garbage():
    assert ai_service._parse_llm_json("not json at all", fallback={"score": 0}) == {"score": 0}
