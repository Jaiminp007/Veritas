from app.models import GroundTruthEntry, HallucinationJudgment


def test_ground_truth_entry_accepts_expected_shape() -> None:
    entry = GroundTruthEntry.model_validate(
        {
            "id": "gt_001",
            "category": "adversarial_rate_trap",
            "query": "What is the rate?",
            "ground_truth_answer": "Answer",
            "source_document": "Doc.pdf",
            "key_facts": ["fact one", "fact two"],
            "adversarial": True,
            "expected_failure_mode": "hallucination trap",
        }
    )

    assert entry.id == "gt_001"
    assert entry.key_facts == ["fact one", "fact two"]


def test_hallucination_judgment_model() -> None:
    judgment = HallucinationJudgment.model_validate(
        {
            "is_hallucination": True,
            "is_refusal": False,
            "penalty": 0.75,
            "violated_facts": ["fact one"],
            "reason": "Contradicted a key fact",
        }
    )

    assert judgment.is_hallucination is True
    assert judgment.penalty == 0.75

