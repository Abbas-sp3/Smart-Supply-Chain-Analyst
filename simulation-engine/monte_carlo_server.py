"""
Monte Carlo Risk Server
=======================
FastAPI service that runs a self-contained MCTS simulation to produce
dynamic risk percentages for supply-chain disruption scenarios.

Start with:
    pip install fastapi uvicorn
    cd simulation-engine
    python monte_carlo_server.py
"""

from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass, field
from typing import Any

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Monte Carlo Risk Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# MCTS state
# ---------------------------------------------------------------------------

@dataclass
class DisruptionState:
    phase: str
    inventory_cover_days: float
    transport_reliability: float
    supplier_concentration: float
    substitution_flexibility: float
    customer_penalty_pressure: float
    disruption_mode: str


def _bounded(val: float) -> float:
    return max(0.0, min(1.0, val))


# ---------------------------------------------------------------------------
# Domain: propose_actions (ported from supply_chain_disruption.py)
# ---------------------------------------------------------------------------

def _propose_actions(state: DisruptionState) -> list[dict]:
    phase = state.phase
    c = state.customer_penalty_pressure
    inv = state.inventory_cover_days
    conc = state.supplier_concentration
    trans = state.transport_reliability
    sub = state.substitution_flexibility
    mode = state.disruption_mode
    transport_bias = 0.24 if mode == "transport" else 0.0
    source_bias = 0.24 if mode == "source" else 0.0

    if phase == "trigger":
        return [
            {"id": "allocate-inventory",    "prior": _bounded(0.10 + max(0, 14 - inv) * 0.02 + c * 0.16 + (0.08 if mode == "transport" else 0.0))},
            {"id": "expedite-alternatives", "prior": _bounded(0.08 + max(0.0, 0.65 - sub) * 0.14 + conc * 0.18 + source_bias - transport_bias)},
            {"id": "customer-prioritization","prior": _bounded(0.08 + c * 0.22 + max(0, 12 - inv) * 0.015 + max(0.0, 0.55 - trans) * 0.08 + transport_bias * 0.8)},
            {"id": "reserve-logistics",     "prior": _bounded(0.08 + max(0.0, 0.6 - trans) * 0.2 + conc * 0.06 + transport_bias * 1.05)},
        ]
    if phase == "triage":
        return [
            {"id": "reroute-logistics", "prior": _bounded(0.14 + max(0.0, 0.55 - trans) * 0.2)},
            {"id": "demand-shaping",    "prior": _bounded(0.12 + c * 0.18)},
        ]
    if phase == "rerouting":
        return [
            {"id": "buffer-build",    "prior": _bounded(0.12 + max(0, 12 - inv) * 0.025)},
            {"id": "supplier-onboard","prior": _bounded(0.12 + conc * 0.2 + max(0.0, 0.65 - sub) * 0.12)},
        ]
    if phase == "capacity-rebuild":
        return [
            {"id": "stabilize-network","prior": _bounded(0.16 + max(0.0, 0.55 - trans) * 0.14 + c * 0.08)},
            {"id": "localize-node",    "prior": _bounded(0.10 + conc * 0.18)},
        ]
    return []


# ---------------------------------------------------------------------------
# Domain: sample_transition
# ---------------------------------------------------------------------------

def _apply_action(state: DisruptionState, action_id: str) -> DisruptionState:
    s = state
    ph = s.phase

    def _next(**kwargs) -> DisruptionState:
        base = {"phase": s.phase, "inventory_cover_days": s.inventory_cover_days,
                "transport_reliability": s.transport_reliability, "supplier_concentration": s.supplier_concentration,
                "substitution_flexibility": s.substitution_flexibility, "customer_penalty_pressure": s.customer_penalty_pressure,
                "disruption_mode": s.disruption_mode}
        base.update(kwargs)
        return DisruptionState(**base)

    if ph == "trigger" and action_id == "allocate-inventory":
        return _next(phase="triage", inventory_cover_days=max(1, s.inventory_cover_days - 4), customer_penalty_pressure=min(1.0, s.customer_penalty_pressure + 0.03))
    if ph == "trigger" and action_id == "expedite-alternatives":
        if s.disruption_mode == "transport":
            return _next(phase="triage", inventory_cover_days=max(1, s.inventory_cover_days - 4), substitution_flexibility=s.substitution_flexibility + 0.05, supplier_concentration=max(0.0, s.supplier_concentration - 0.04))
        return _next(phase="rerouting", inventory_cover_days=max(1, s.inventory_cover_days - 2), substitution_flexibility=s.substitution_flexibility + 0.15, supplier_concentration=max(0.0, s.supplier_concentration - 0.1))
    if ph == "trigger" and action_id == "customer-prioritization":
        return _next(phase="triage", customer_penalty_pressure=max(0.0, s.customer_penalty_pressure - 0.04), inventory_cover_days=max(1, s.inventory_cover_days - 3), transport_reliability=s.transport_reliability + 0.03)
    if ph == "trigger" and action_id == "reserve-logistics":
        if s.disruption_mode == "transport":
            return _next(phase="rerouting", customer_penalty_pressure=max(0.0, s.customer_penalty_pressure - 0.03), inventory_cover_days=max(1, s.inventory_cover_days - 1), transport_reliability=s.transport_reliability + 0.2)
        return _next(phase="rerouting", inventory_cover_days=max(1, s.inventory_cover_days - 2), transport_reliability=s.transport_reliability + 0.12)
    if ph == "triage" and action_id == "reroute-logistics":
        return _next(phase="rerouting", inventory_cover_days=max(1, s.inventory_cover_days - 1), transport_reliability=s.transport_reliability + 0.15)
    if ph == "triage" and action_id == "demand-shaping":
        return _next(phase="capacity-rebuild", customer_penalty_pressure=max(0.0, s.customer_penalty_pressure - 0.06), inventory_cover_days=s.inventory_cover_days + 2, substitution_flexibility=s.substitution_flexibility + 0.05)
    if ph == "rerouting" and action_id == "buffer-build":
        return _next(phase="capacity-rebuild", inventory_cover_days=s.inventory_cover_days + 3, transport_reliability=s.transport_reliability + 0.05)
    if ph == "rerouting" and action_id == "supplier-onboard":
        return _next(phase="resolution", inventory_cover_days=s.inventory_cover_days + 4, substitution_flexibility=s.substitution_flexibility + 0.12, supplier_concentration=max(0.0, s.supplier_concentration - 0.16))
    if ph == "capacity-rebuild" and action_id == "stabilize-network":
        return _next(phase="resolution", customer_penalty_pressure=max(0.0, s.customer_penalty_pressure - 0.06), inventory_cover_days=s.inventory_cover_days + 5, transport_reliability=s.transport_reliability + 0.08)
    if ph == "capacity-rebuild" and action_id == "localize-node":
        return _next(phase="resolution", substitution_flexibility=s.substitution_flexibility + 0.08, supplier_concentration=max(0.0, s.supplier_concentration - 0.12), transport_reliability=s.transport_reliability + 0.04)
    return state


def _is_terminal(state: DisruptionState, depth: int, max_depth: int) -> bool:
    return state.phase == "resolution" or depth >= max_depth


def _score_state(state: DisruptionState) -> dict[str, float]:
    phase_disruption = {"trigger": 0.55, "triage": 0.50, "rerouting": 0.40, "capacity-rebuild": 0.30, "resolution": 0.15}
    disruption = phase_disruption.get(state.phase, 0.40)
    inv = state.inventory_cover_days
    trans = state.transport_reliability
    sub = state.substitution_flexibility
    conc = state.supplier_concentration
    cust = state.customer_penalty_pressure
    return {
        "escalation":      _bounded(disruption + max(0, 14 - inv) / 30 + max(0.0, 0.55 - trans) * 0.16 + cust * 0.14),
        "negotiation":     _bounded(0.18 + sub * 0.24 + trans * 0.18 + max(0.0, 0.6 - conc) * 0.16),
        "economic_stress": _bounded(0.26 + max(0, 20 - inv) / 28 + max(0.0, 0.5 - sub) * 0.16 + conc * 0.14 + cust * 0.12),
    }


# ---------------------------------------------------------------------------
# MCTS core
# ---------------------------------------------------------------------------

@dataclass
class _Node:
    state: DisruptionState
    depth: int
    prior: float
    visits: int = 0
    value_sum: float = 0.0
    children: list = field(default_factory=list)
    action_id: str = ""

    @property
    def mean_value(self) -> float:
        return self.value_sum / self.visits if self.visits > 0 else 0.0

    def ucb(self, parent_visits: int, c_puct: float) -> float:
        return self.mean_value + c_puct * self.prior * math.sqrt(max(parent_visits, 1)) / (1 + self.visits)


def _expand(node: _Node) -> None:
    if node.children:
        return
    for action in _propose_actions(node.state):
        node.children.append(_Node(
            state=_apply_action(node.state, action["id"]),
            depth=node.depth + 1,
            prior=action["prior"],
            action_id=action["id"],
        ))


def _rollout(state: DisruptionState, depth: int, max_depth: int, rollout_depth: int) -> float:
    for _ in range(rollout_depth):
        if _is_terminal(state, depth, max_depth):
            break
        actions = _propose_actions(state)
        if not actions:
            break
        total = sum(a["prior"] for a in actions)
        if total <= 0:
            break
        r = random.random() * total
        cum = 0.0
        chosen = actions[-1]
        for a in actions:
            cum += a["prior"]
            if r <= cum:
                chosen = a
                break
        state = _apply_action(state, chosen["id"])
        depth += 1
    s = _score_state(state)
    return _bounded((1.0 - s["escalation"]) * 0.35 + s["negotiation"] * 0.30 + (1.0 - s["economic_stress"]) * 0.35)


def _select(node: _Node, c_puct: float) -> list:
    path = [node]
    while node.children and not _is_terminal(node.state, node.depth, 99):
        node = max(node.children, key=lambda ch: ch.ucb(node.visits, c_puct))
        path.append(node)
    return path


def run_mcts(initial_state: DisruptionState, iterations: int = 600, max_depth: int = 4, rollout_depth: int = 3, c_puct: float = 1.1) -> dict:
    root = _Node(state=initial_state, depth=0, prior=1.0)
    for _ in range(iterations):
        path = _select(root, c_puct)
        leaf = path[-1]
        if not _is_terminal(leaf.state, leaf.depth, max_depth):
            _expand(leaf)
            if leaf.children:
                unvisited = [ch for ch in leaf.children if ch.visits == 0]
                if unvisited:
                    leaf = max(unvisited, key=lambda ch: ch.prior)
                    path.append(leaf)
        value = _rollout(leaf.state, leaf.depth, max_depth, rollout_depth)
        for node in path:
            node.visits += 1
            node.value_sum += value

    _expand(root)
    best_child = max(root.children, key=lambda ch: ch.visits) if root.children else None
    best_action = best_child.action_id if best_child else "none"
    stress = 1.0 - root.mean_value

    # Walk best-path to terminal
    terminal_state = initial_state
    depth = 0
    for _ in range(max_depth + rollout_depth):
        if _is_terminal(terminal_state, depth, max_depth + rollout_depth):
            break
        actions = _propose_actions(terminal_state)
        if not actions:
            break
        best = max(actions, key=lambda a: a["prior"])
        terminal_state = _apply_action(terminal_state, best["id"])
        depth += 1

    ts = _score_state(terminal_state)

    # Phase visit distribution
    phase_visits: dict[str, int] = {}
    def _walk(n: _Node):
        ph = n.state.phase
        phase_visits[ph] = phase_visits.get(ph, 0) + n.visits
        for ch in n.children:
            _walk(ch)
    _walk(root)
    total_v = sum(phase_visits.values()) or 1
    phase_dist = {ph: round(v / total_v * 100, 1) for ph, v in phase_visits.items()}

    severity_pct = round(_bounded(stress * 0.6 + ts["economic_stress"] * 0.4) * 100, 1)
    return {
        "severity_pct": severity_pct,
        "escalation_pct": round(ts["escalation"] * 100, 1),
        "economic_stress_pct": round(ts["economic_stress"] * 100, 1),
        "negotiation_score": round(ts["negotiation"] * 100, 1),
        "best_action": best_action,
        "phase_distribution": phase_dist,
        "iterations_run": iterations,
        "root_visits": root.visits,
        "initial_phase": initial_state.phase,
        "terminal_phase": terminal_state.phase,
    }


# ---------------------------------------------------------------------------
# Preset profiles
# ---------------------------------------------------------------------------

PRESET_PROFILES: dict[str, dict] = {
    "hormuz_closure":            {"mode": "transport", "inv": 12, "trans": 0.20, "conc": 0.65, "sub": 0.25, "cust": 0.60},
    "suez_closure":              {"mode": "transport", "inv": 18, "trans": 0.30, "conc": 0.40, "sub": 0.40, "cust": 0.45},
    "red_sea_houthi":            {"mode": "transport", "inv": 16, "trans": 0.35, "conc": 0.45, "sub": 0.35, "cust": 0.50},
    "malacca_disruption":        {"mode": "transport", "inv": 14, "trans": 0.30, "conc": 0.50, "sub": 0.35, "cust": 0.55},
    "south_china_sea_conflict":  {"mode": "transport", "inv": 10, "trans": 0.25, "conc": 0.55, "sub": 0.30, "cust": 0.60},
    "black_sea_grain_corridor":  {"mode": "source",    "inv": 20, "trans": 0.40, "conc": 0.55, "sub": 0.30, "cust": 0.40},
    "cape_of_good_hope_surge":   {"mode": "transport", "inv": 22, "trans": 0.45, "conc": 0.30, "sub": 0.50, "cust": 0.30},
    "russia_ukraine_energy":     {"mode": "source",    "inv": 15, "trans": 0.35, "conc": 0.70, "sub": 0.20, "cust": 0.55},
    "india_port_congestion":     {"mode": "transport", "inv": 18, "trans": 0.50, "conc": 0.30, "sub": 0.55, "cust": 0.35},
    "singapore_port_disruption": {"mode": "transport", "inv": 14, "trans": 0.30, "conc": 0.50, "sub": 0.30, "cust": 0.55},
    "energy":                    {"mode": "transport", "inv": 14, "trans": 0.30, "conc": 0.55, "sub": 0.30, "cust": 0.55},
    "food_agriculture":          {"mode": "source",    "inv": 20, "trans": 0.45, "conc": 0.50, "sub": 0.35, "cust": 0.40},
    "manufacturing":             {"mode": "mixed",     "inv": 18, "trans": 0.40, "conc": 0.45, "sub": 0.40, "cust": 0.40},
    "multi_sector":              {"mode": "mixed",     "inv": 16, "trans": 0.35, "conc": 0.45, "sub": 0.35, "cust": 0.45},
    "default":                   {"mode": "mixed",     "inv": 18, "trans": 0.40, "conc": 0.40, "sub": 0.40, "cust": 0.40},
}


def _resolve_profile(preset_id: str, category: str) -> dict:
    pid = preset_id.lower().replace("-", "_").replace(" ", "_")
    if pid in PRESET_PROFILES:
        return PRESET_PROFILES[pid]
    cat = (category or "").lower().replace("-", "_")
    if cat in PRESET_PROFILES:
        return PRESET_PROFILES[cat]
    return PRESET_PROFILES["default"]


# ---------------------------------------------------------------------------
# API models
# ---------------------------------------------------------------------------

class MonteCarloRequest(BaseModel):
    preset_id: str
    category: str = "multi_sector"
    severity_pct: float = 50.0
    duration_days: float = 30.0
    iterations: int = 600
    inventory_cover_days: float | None = None
    transport_reliability: float | None = None
    supplier_concentration: float | None = None
    substitution_flexibility: float | None = None
    customer_penalty_pressure: float | None = None
    disruption_mode: str | None = None


class MonteCarloResponse(BaseModel):
    preset_id: str
    severity_pct: float
    severity_range: dict
    escalation_pct: float
    economic_stress_pct: float
    negotiation_score: float
    best_action: str
    phase_distribution: dict
    iterations_run: int
    root_visits: int
    computation_ms: float
    method: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "monte-carlo-risk-server", "version": "1.0.0"}


@app.post("/monte-carlo", response_model=MonteCarloResponse)
def compute_monte_carlo(req: MonteCarloRequest) -> MonteCarloResponse:
    t0 = time.perf_counter()
    profile = _resolve_profile(req.preset_id, req.category)
    sev = req.severity_pct / 100.0

    initial = DisruptionState(
        phase="trigger",
        inventory_cover_days=req.inventory_cover_days if req.inventory_cover_days is not None else profile["inv"] * (1.0 - sev * 0.3),
        transport_reliability=req.transport_reliability if req.transport_reliability is not None else _bounded(profile["trans"] + (1.0 - sev) * 0.2),
        supplier_concentration=req.supplier_concentration if req.supplier_concentration is not None else _bounded(profile["conc"] * sev + profile["conc"] * 0.3),
        substitution_flexibility=req.substitution_flexibility if req.substitution_flexibility is not None else _bounded(profile["sub"] * (1.0 - sev * 0.3)),
        customer_penalty_pressure=req.customer_penalty_pressure if req.customer_penalty_pressure is not None else _bounded(profile["cust"] * sev + 0.1),
        disruption_mode=req.disruption_mode or profile["mode"],
    )

    result = run_mcts(initial_state=initial, iterations=min(req.iterations, 2000))
    dt_ms = (time.perf_counter() - t0) * 1000

    mc_sev = result["severity_pct"]
    return MonteCarloResponse(
        preset_id=req.preset_id,
        severity_pct=mc_sev,
        severity_range={"min": round(max(0.0, mc_sev * 0.70), 1), "max": round(min(100.0, mc_sev * 1.35), 1)},
        escalation_pct=result["escalation_pct"],
        economic_stress_pct=result["economic_stress_pct"],
        negotiation_score=result["negotiation_score"],
        best_action=result["best_action"],
        phase_distribution=result["phase_distribution"],
        iterations_run=result["iterations_run"],
        root_visits=result["root_visits"],
        computation_ms=round(dt_ms, 1),
        method="MCTS-supply-chain-disruption",
    )


@app.get("/presets")
def list_presets():
    return {"presets": list(PRESET_PROFILES.keys())}


if __name__ == "__main__":
    print("=" * 55)
    print("  Monte Carlo Risk Server  (Global MCTS Engine)")
    print("  http://localhost:8787/health")
    print("  POST http://localhost:8787/monte-carlo")
    print("=" * 55)
    uvicorn.run(app, host="0.0.0.0", port=8787, log_level="info")
