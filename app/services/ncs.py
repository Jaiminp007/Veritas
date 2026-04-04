from __future__ import annotations

import re
from dataclasses import dataclass

from ..models import NCSWeights

MIN_FACT_OVERLAP = 0.6
MIN_CITATION_OVERLAP = 0.5

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "have",
    "i",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "with",
    "you",
    "your",
}


def _normalize(text: str) -> set[str]:
    raw_tokens = re.findall(r"[a-z0-9$%,.\-]+", text.lower())
    normalized_tokens: set[str] = set()
    for token in raw_tokens:
        cleaned = token.replace(",", "").strip(".-")
        if cleaned and cleaned not in STOPWORDS:
            normalized_tokens.add(cleaned)
    return normalized_tokens


def _fact_tokens(fact: str) -> set[str]:
    return _normalize(fact)


def _numeric_tokens(tokens: set[str]) -> set[str]:
    return {token for token in tokens if any(char.isdigit() for char in token) or "%" in token or "$" in token}


def token_overlap_ratio(text: str, fact: str) -> float:
    text_tokens = _normalize(text)
    fact_tokens = _fact_tokens(fact)
    if not fact_tokens:
        return 0.0
    return len(text_tokens & fact_tokens) / len(fact_tokens)


def _supports_fact(text_tokens: set[str], fact_tokens: set[str], *, min_overlap: float) -> bool:
    if not fact_tokens:
        return False
    overlap = len(text_tokens & fact_tokens) / len(fact_tokens)
    numeric_tokens = _numeric_tokens(fact_tokens)
    if numeric_tokens and not numeric_tokens.issubset(text_tokens):
        return False
    return overlap >= min_overlap


def fact_coverage(response_text: str, key_facts: list[str]) -> float:
    if not key_facts:
        return 1.0
    response_tokens = _normalize(response_text)
    matches = 0
    for fact in key_facts:
        fact_tokens = _fact_tokens(fact)
        if _supports_fact(response_tokens, fact_tokens, min_overlap=MIN_FACT_OVERLAP):
            matches += 1
    return matches / len(key_facts)


def citation_match(citations: list[str], key_facts: list[str]) -> float:
    if not citations or not key_facts:
        return 0.0
    citation_text = " ".join(citations)
    citation_tokens = _normalize(citation_text)
    matches = 0
    for fact in key_facts:
        if _supports_fact(citation_tokens, _fact_tokens(fact), min_overlap=MIN_CITATION_OVERLAP):
            matches += 1
    return matches / len(key_facts)


def compute_raw_ncs(
    citation_match_value: float,
    hallucination_penalty: float,
    key_fact_coverage_value: float,
    weights: NCSWeights,
) -> float:
    return (
        weights.alpha * citation_match_value
        - weights.beta * hallucination_penalty
        + weights.delta * key_fact_coverage_value
    )


def normalize_raw_ncs(raw_ncs: float, weights: NCSWeights) -> float:
    normalized = (raw_ncs + weights.beta) / (weights.alpha + weights.beta + weights.delta)
    return max(0.0, min(1.0, normalized))


@dataclass(slots=True)
class NCSBreakdown:
    citation_match: float
    key_fact_coverage: float
    raw_ncs: float
    normalized_ncs: float


def compute_ncs(
    response_text: str,
    citations: list[str],
    key_facts: list[str],
    hallucination_penalty: float,
    weights: NCSWeights,
    citation_boost: bool = True,
) -> NCSBreakdown:
    coverage = fact_coverage(response_text, key_facts)
    citation_value = citation_match(citations, key_facts) if citation_boost else 0.0
    raw_ncs = compute_raw_ncs(citation_value, hallucination_penalty, coverage, weights)
    normalized_ncs = normalize_raw_ncs(raw_ncs, weights)
    return NCSBreakdown(
        citation_match=citation_value,
        key_fact_coverage=coverage,
        raw_ncs=raw_ncs,
        normalized_ncs=normalized_ncs,
    )
