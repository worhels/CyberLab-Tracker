#!/usr/bin/env python3
import json
import os
import socket
from pathlib import Path


def write_is_blocked(path: Path) -> bool:
    try:
        path.write_text("probe", encoding="utf-8")
    except OSError:
        return True
    path.unlink(missing_ok=True)
    return False


def outbound_network_is_blocked() -> bool:
    connection = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    connection.settimeout(0.25)
    try:
        return connection.connect_ex(("1.1.1.1", 53)) != 0
    finally:
        connection.close()


def proc_status() -> dict[str, str]:
    values: dict[str, str] = {}
    for line in Path("/proc/self/status").read_text(encoding="utf-8").splitlines():
        if ":" in line:
            key, value = line.split(":", maxsplit=1)
            values[key] = value.strip()
    return values


status = proc_status()
checks = {
    "uid_non_root": os.getuid() == 65532 and os.getgid() == 65532,
    "capabilities_empty": status.get("CapEff") == "0000000000000000",
    "no_new_privileges": status.get("NoNewPrivs") == "1",
    "root_read_only": write_is_blocked(Path("/verifier-write-probe")),
    "input_read_only": write_is_blocked(Path("/input/verifier-write-probe")),
    "outbound_network_blocked": outbound_network_is_blocked(),
}

print(json.dumps({"checks": checks}, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if all(checks.values()) else 1)
