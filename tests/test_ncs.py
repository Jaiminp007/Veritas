from app.models import NCSWeights
from app.services.ncs import compute_ncs, token_overlap_ratio


def test_compute_ncs_best_case_is_one() -> None:
    weights = NCSWeights(alpha=0.5, beta=0.8, delta=0.3)
    breakdown = compute_ncs(
        "grounded answer with verified facts",
        ["verified facts"],
        ["verified facts"],
        0.0,
        weights,
    )

    assert breakdown.normalized_ncs == 1.0
    assert breakdown.raw_ncs == 0.8


def test_compute_ncs_worst_case_is_zero() -> None:
    weights = NCSWeights(alpha=0.5, beta=0.8, delta=0.3)
    breakdown = compute_ncs(
        "wrong answer",
        [],
        ["required fact"],
        1.0,
        weights,
        citation_boost=False,
    )

    assert breakdown.normalized_ncs == 0.0
    assert breakdown.raw_ncs == -0.8


def test_token_overlap_handles_currency_and_partial_fact_matches() -> None:
    overlap = token_overlap_ratio(
        "Guarantee fee is 0% on loans up to $150,000 in fiscal year 2025.",
        "0% fee for loans up to $150,000",
    )

    assert overlap >= 0.8


def test_negation_conflict_rejects_contradicted_fact() -> None:
    from app.services.ncs import fact_coverage

    coverage = fact_coverage(
        "The Fed rate is at zero and has been for some time.",
        ["Fed rate not at zero, 3.64% March 2026"],
    )
    assert coverage == 0.0


def test_no_negation_conflict_when_polarity_matches() -> None:
    from app.services.ncs import fact_coverage

    coverage = fact_coverage(
        "The Fed rate is not at zero, it is 3.64% as of March 2026.",
        ["Fed rate not at zero, 3.64% March 2026"],
    )
    assert coverage == 1.0


def test_compute_ncs_citation_match_accepts_partial_supported_snippets() -> None:
    weights = NCSWeights(alpha=0.5, beta=0.8, delta=0.3)
    breakdown = compute_ncs(
        "The guarantee fee is 0% up to $150,000, 3% for $150,001 to $700,000, and 3.5% above that.",
        [
            "Guarantee Fees: For fiscal year 2025, the SBA guarantee fee is 0% on the guaranteed portion of loans up to $150,000. "
            "Loans $150,001 to $700,000 have a 3% fee, and loans over $700,000 have a 3.5% fee."
        ],
        [
            "0% fee for loans up to $150,000",
            "3% for $150,001 to $700,000",
            "3.5% for over $700,000",
        ],
        0.0,
        weights,
    )

    assert breakdown.citation_match == 1.0
    assert breakdown.key_fact_coverage == 1.0
