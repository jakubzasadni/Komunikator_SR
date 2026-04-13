"""
In-memory store mapping user_id -> set of socket_ids.
Supports multiple sessions per user (e.g. multiple browser tabs).
"""

from collections import defaultdict

# { user_id (int): {socket_id (str), ...} }
_sessions: dict[int, set] = defaultdict(set)


def add_session(user_id: int, socket_id: str) -> None:
    _sessions[user_id].add(socket_id)


def remove_session(user_id: int, socket_id: str) -> None:
    _sessions[user_id].discard(socket_id)
    if not _sessions[user_id]:
        del _sessions[user_id]


def get_socket_ids(user_id: int) -> set:
    return set(_sessions.get(user_id, set()))


def get_online_user_ids() -> set:
    return set(_sessions.keys())


def get_user_id_by_socket(socket_id: str) -> int | None:
    for uid, sids in _sessions.items():
        if socket_id in sids:
            return uid
    return None
