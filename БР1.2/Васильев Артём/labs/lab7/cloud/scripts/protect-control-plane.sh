#!/usr/bin/env bash
# Protect administrative sockets without touching SSH, NodePort or other rules.
set -Eeuo pipefail
interface="$(ip -j route get 1.1.1.1 | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["dev"])')"
for command in iptables ip6tables; do
  command -v "$command" >/dev/null || continue
  "$command" -w -N LAB_K3S_GUARD 2>/dev/null || true
  for port in 6443 10250 2379 2380; do
    "$command" -w -C LAB_K3S_GUARD -p tcp --dport "$port" -j DROP 2>/dev/null || "$command" -w -A LAB_K3S_GUARD -p tcp --dport "$port" -j DROP
  done
  "$command" -w -C LAB_K3S_GUARD -p udp --dport 8472 -j DROP 2>/dev/null || "$command" -w -A LAB_K3S_GUARD -p udp --dport 8472 -j DROP
  "$command" -w -C INPUT -i "$interface" -j LAB_K3S_GUARD 2>/dev/null || "$command" -w -I INPUT -i "$interface" -j LAB_K3S_GUARD
  "$command" -w -S LAB_K3S_GUARD
done
