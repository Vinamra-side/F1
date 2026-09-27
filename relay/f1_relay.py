#!/usr/bin/env python3
"""
F1 2020 UDP Telemetry Relay & Cloud Sync Bridge
Receives UDP packets from Codemasters F1 2020 (port 20777), processes telemetry,
tracks lap-to-lap performance, computes setup diagnostic metrics, and relays
data in real-time to:
  1. Local Web / WebSocket clients (for direct LAN viewing on another laptop)
  2. Vercel Cloud API (/api/ingest) for remote viewing over the internet
"""

import socket
import json
import time
import sys
import threading
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import URLError
from typing import Dict, Any, List, Optional

from packet_parser import (
    parse_header,
    parse_motion_packet,
    parse_session_packet,
    parse_lap_packet,
    parse_participants_packet,
    parse_setup_packet,
    parse_car_telemetry_packet,
    parse_car_status_packet,
    parse_car_damage_packet,
)

class TelemetryState:
    def __init__(self, target_driver_name: Optional[str] = None):
        self.lock = threading.Lock()
        self.target_driver_name = target_driver_name
        self.matched_car_index: Optional[int] = None
        self.driver_name = target_driver_name or "Player"
        
        # Latest packet states
        self.session: Dict[str, Any] = {
            "trackName": "Waiting for track...",
            "weather": "Unknown",
            "sessionType": "Practice",
            "airTemperature": 25,
            "trackTemperature": 32,
            "totalLaps": 0,
        }
        self.telemetry: Dict[str, Any] = {
            "speed": 0,
            "throttle": 0.0,
            "brake": 0.0,
            "steer": 0.0,
            "gear": 0,
            "engineRPM": 0,
            "drs": False,
            "tyresSurfaceTemperature": {"fl": 95, "fr": 95, "rl": 95, "rr": 95},
            "tyresInnerTemperature": {"fl": 100, "fr": 100, "rl": 100, "rr": 100},
            "brakesTemperature": {"fl": 450, "fr": 450, "rl": 450, "rr": 450},
            "tyresPressure": {"fl": 23.0, "fr": 23.0, "rl": 21.0, "rr": 21.0},
        }
        self.motion: Dict[str, Any] = {
            "gForceLateral": 0.0,
            "gForceLongitudinal": 0.0,
            "wheelSlip": [0.0, 0.0, 0.0, 0.0],
            "suspensionPosition": [0.0, 0.0, 0.0, 0.0],
        }
        self.lap_data: Dict[str, Any] = {
            "currentLapNum": 1,
            "currentLapTime": 0.0,
            "lastLapTime": 0.0,
            "bestLapTime": 0.0,
            "sector1TimeMs": 0,
            "sector2TimeMs": 0,
            "carPosition": 1,
            "isCurrentLapInvalid": False,
        }
        self.status: Dict[str, Any] = {
            "tyreCompound": "Soft",
            "fuelInTank": 25.0,
            "fuelRemainingLaps": 1.2,
            "ersStoreEnergy": 4000000,
            "drsAllowed": False,
        }
        self.setup: Dict[str, Any] = {
            "frontWing": 7,
            "rearWing": 6,
            "onThrottleDiff": 70,
            "offThrottleDiff": 55,
            "frontCamber": -2.80,
            "rearCamber": -1.50,
            "frontToe": 0.09,
            "rearToe": 0.32,
            "frontSuspension": 7,
            "rearSuspension": 6,
            "frontAntiRollBar": 8,
            "rearAntiRollBar": 6,
            "frontRideHeight": 3,
            "rearRideHeight": 4,
            "brakePressure": 95,
            "brakeBias": 56,
            "frontLeftTyrePressure": 23.0,
            "frontRightTyrePressure": 23.0,
            "rearLeftTyrePressure": 21.0,
            "rearRightTyrePressure": 21.0,
        }
        self.damage: Dict[str, Any] = {
            "tyresWear": {"fl": 0.0, "fr": 0.0, "rl": 0.0, "rr": 0.0},
            "frontLeftWingDamage": 0,
            "frontRightWingDamage": 0,
            "rearWingDamage": 0,
        }
        self.participants: List[Dict[str, Any]] = []
        
        # Lap-to-lap records
        self.completed_laps: List[Dict[str, Any]] = []
        self.last_recorded_lap_num = 0
        self.lap_start_fuel = 0.0
        self.lap_start_wear = {"fl": 0.0, "fr": 0.0, "rl": 0.0, "rr": 0.0}
        self.current_lap_max_speed = 0
        self.lap_temp_samples: List[Dict[str, float]] = []
        
        # AI Engineer Telemetry Diagnostic Accumulators
        self.oversteer_events = 0
        self.understeer_events = 0
        self.front_locking_events = 0
        self.rear_locking_events = 0
        self.kerb_bottoming_events = 0
        self.top_speeds: List[int] = []

    def update_participants(self, participants: List[Dict[str, Any]], default_player_idx: int):
        with self.lock:
            self.participants = participants
            if self.target_driver_name:
                normalized_target = self.target_driver_name.strip().lower()
                for p in participants:
                    if normalized_target in p["name"].lower():
                        self.matched_car_index = p["carIndex"]
                        self.driver_name = p["name"]
                        break
            if self.matched_car_index is None:
                # Default to game's player car index
                self.matched_car_index = default_player_idx
                for p in participants:
                    if p["carIndex"] == default_player_idx:
                        self.driver_name = p["name"]
                        break

    def set_target_driver(self, name: str, car_index: Optional[int] = None):
        with self.lock:
            if not name:
                return
            if self.target_driver_name != name:
                print(f"\n🔄 [Driver Switch] Target driver switched from '{self.driver_name}' to '{name}'")
            self.target_driver_name = name
            self.driver_name = name
            if car_index is not None:
                self.matched_car_index = car_index
            else:
                normalized = name.strip().lower()
                for p in self.participants:
                    if normalized in p["name"].lower():
                        self.matched_car_index = p["carIndex"]
                        self.driver_name = p["name"]
                        break

    def get_effective_car_index(self, header_player_idx: int) -> int:
        with self.lock:
            return self.matched_car_index if self.matched_car_index is not None else header_player_idx

    def on_telemetry(self, t: Dict[str, Any]):
        with self.lock:
            self.telemetry.update(t)
            speed = t.get("speed", 0)
            if speed > self.current_lap_max_speed:
                self.current_lap_max_speed = speed
            
            # Record thermal sample
            if "tyresInnerTemperature" in t:
                self.lap_temp_samples.append({
                    "fl": t["tyresInnerTemperature"].get("fl", 100),
                    "fr": t["tyresInnerTemperature"].get("fr", 100),
                    "rl": t["tyresInnerTemperature"].get("rl", 100),
                    "rr": t["tyresInnerTemperature"].get("rr", 100),
                })
            
            # Check brake lockups (high brake pressure, low wheel speed vs vehicle speed)
            if t.get("brake", 0) > 0.7:
                # front locking tendency
                b_front_avg = (t["brakesTemperature"].get("fl", 0) + t["brakesTemperature"].get("fr", 0)) / 2
                b_rear_avg = (t["brakesTemperature"].get("rl", 0) + t["brakesTemperature"].get("rr", 0)) / 2
                if b_front_avg > b_rear_avg + 120:
                    self.front_locking_events += 1

    def on_motion(self, m: Dict[str, Any]):
        with self.lock:
            self.motion.update(m)
            # Detect oversteer: high lateral G with significant rear wheel slip (> 0.20)
            slips = m.get("wheelSlip", [])
            if len(slips) >= 4:
                # slips: [RL, RR, FL, FR]
                rear_slip = max(slips[0], slips[1])
                front_slip = max(slips[2], slips[3])
                lat_g = abs(m.get("gForceLateral", 0))
                if rear_slip > 0.22 and rear_slip > front_slip * 1.5:
                    self.oversteer_events += 1
                elif front_slip > 0.22 and front_slip > rear_slip * 1.5 and lat_g > 1.8:
                    self.understeer_events += 1
            
            # Detect kerb bottoming
            susp = m.get("suspensionPosition", [])
            if any(abs(s) > 0.08 for s in susp):
                self.kerb_bottoming_events += 1

    def on_lap_data(self, lap: Dict[str, Any]):
        with self.lock:
            prev_lap_num = self.lap_data.get("currentLapNum", 1)
            new_lap_num = lap.get("currentLapNum", 1)
            last_lap_time = lap.get("lastLapTime", 0.0)
            
            # Did we just cross the line into a new lap?
            if new_lap_num > prev_lap_num and last_lap_time > 0:
                self._record_completed_lap(prev_lap_num, last_lap_time, lap)
            
            self.lap_data.update(lap)

    def _record_completed_lap(self, lap_num: int, lap_time: float, current_lap_packet: Dict[str, Any]):
        # Calculate fuel used
        curr_fuel = self.status.get("fuelInTank", 0.0)
        fuel_used = round(max(0.0, self.lap_start_fuel - curr_fuel), 2) if self.lap_start_fuel > 0 else 1.85
        self.lap_start_fuel = curr_fuel
        
        # Calculate tyre wear delta
        curr_wear = self.damage.get("tyresWear", {"fl": 0, "fr": 0, "rl": 0, "rr": 0})
        wear_delta = {
            k: round(max(0.0, curr_wear.get(k, 0) - self.lap_start_wear.get(k, 0)), 1)
            for k in ["fl", "fr", "rl", "rr"]
        }
        self.lap_start_wear = dict(curr_wear)
        
        # Calculate average inner tyre temps
        avg_temps = {"fl": 100, "fr": 100, "rl": 100, "rr": 100}
        if self.lap_temp_samples:
            for k in avg_temps.keys():
                avg_temps[k] = round(sum(s[k] for s in self.lap_temp_samples) / len(self.lap_temp_samples), 1)
        self.lap_temp_samples = []
        
        # Sector times
        s1 = current_lap_packet.get("sector1TimeMs", 0) / 1000.0
        s2 = current_lap_packet.get("sector2TimeMs", 0) / 1000.0
        s3 = round(lap_time - s1 - s2, 3) if (s1 > 0 and s2 > 0 and lap_time > (s1 + s2)) else 0.0
        
        lap_entry = {
            "lapNumber": lap_num,
            "lapTime": lap_time,
            "lapTimeFormatted": format_lap_time(lap_time),
            "sector1": round(s1, 3) if s1 > 0 else None,
            "sector2": round(s2, 3) if s2 > 0 else None,
            "sector3": round(s3, 3) if s3 > 0 else None,
            "maxSpeedKmh": self.current_lap_max_speed,
            "fuelUsedKg": fuel_used,
            "tyreWear": dict(curr_wear),
            "tyreWearDelta": wear_delta,
            "averageTyreTemps": avg_temps,
            "tyreCompound": self.status.get("tyreCompound", "Soft"),
            "isValid": not current_lap_packet.get("isCurrentLapInvalid", False),
            "oversteerEvents": self.oversteer_events,
            "understeerEvents": self.understeer_events,
        }
        self.completed_laps.append(lap_entry)
        self.current_lap_max_speed = 0
        self.oversteer_events = 0
        self.understeer_events = 0

    def snapshot(self) -> Dict[str, Any]:
        with self.lock:
            return {
                "driverName": self.driver_name,
                "session": dict(self.session),
                "telemetry": dict(self.telemetry),
                "motion": dict(self.motion),
                "lapData": dict(self.lap_data),
                "status": dict(self.status),
                "setup": dict(self.setup),
                "damage": dict(self.damage),
                "completedLaps": list(self.completed_laps),
                "participants": list(self.participants),
                "diagnostics": {
                    "oversteerEvents": self.oversteer_events,
                    "understeerEvents": self.understeer_events,
                    "frontLockingEvents": self.front_locking_events,
                    "rearLockingEvents": self.rear_locking_events,
                    "kerbBottomingEvents": self.kerb_bottoming_events,
                },
                "timestamp": time.time(),
            }

def format_lap_time(seconds: float) -> str:
    if seconds <= 0:
        return "--:--.---"
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{mins}:{secs:02d}.{millis:03d}"

class LocalHttpServer:
    """Provides a local REST API & SSE endpoint for other laptops on LAN"""
    def __init__(self, state: TelemetryState, host: str = "0.0.0.0", port: int = 8080):
        self.state = state
        self.host = host
        self.port = port
        self.httpd = None

    def start(self):
        state_ref = self.state
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path in ["/api/live", "/live", "/api/telemetry"]:
                    data = json.dumps(state_ref.snapshot()).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.send_header("Access-Control-Allow-Headers", "*")
                    self.end_headers()
                    self.wfile.write(data)
                elif self.path in ["/api/laps", "/laps"]:
                    laps = json.dumps(state_ref.snapshot().get("completedLaps", [])).encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(laps)
                elif self.path == "/health":
                    self.send_response(200)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(b'{"status":"ok","engine":"F1 2020 Relay"}')
                else:
                    self.send_response(404)
                    self.end_headers()

            def do_POST(self):
                content_len = int(self.headers.get("Content-Length", 0))
                post_body = self.rfile.read(content_len) if content_len > 0 else b"{}"
                try:
                    data = json.loads(post_body.decode("utf-8"))
                    driver_name = data.get("driverName") or data.get("name")
                    car_index = data.get("carIndex")
                    if driver_name:
                        state_ref.set_target_driver(driver_name, car_index)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(b'{"success":true}')
                except Exception as e:
                    self.send_response(400)
                    self.end_headers()

            def do_OPTIONS(self):
                self.send_response(200)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "*")
                self.end_headers()

            def log_message(self, format, *args):
                pass # Suppress HTTP access logging to keep console clean

        try:
            self.httpd = HTTPServer((self.host, self.port), Handler)
            threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
            print(f"📡 [LAN Bridge] Local REST API active at http://{self.host}:{self.port}/api/live")
        except Exception as e:
            print(f"⚠️ [LAN Bridge] Could not start local server on {self.port}: {e}")

class CloudSyncWorker:
    """Syncs telemetry snapshots to Vercel cloud deployment"""
    def __init__(self, state: TelemetryState, cloud_url: str, sync_hz: float = 4.0):
        self.state = state
        self.cloud_url = cloud_url.rstrip("/")
        self.interval = 1.0 / sync_hz
        self.running = True
        self.last_status_code = None

    def start(self):
        if not self.cloud_url:
            return
        thread = threading.Thread(target=self._run, daemon=True)
        thread.start()
        print(f"☁️ [Cloud Sync] Forwarding live telemetry to {self.cloud_url}/api/ingest @ {1.0/self.interval:.0f}Hz")

    def _run(self):
        ingest_endpoint = f"{self.cloud_url}/api/ingest"
        while self.running:
            time.sleep(self.interval)
            try:
                payload = json.dumps(self.state.snapshot()).encode("utf-8")
                req = Request(
                    ingest_endpoint,
                    data=payload,
                    headers={"Content-Type": "application/json", "User-Agent": "F1-2020-Relay/1.0"},
                )
                with urlopen(req, timeout=1.5) as resp:
                    self.last_status_code = resp.status
                    resp_data = resp.read()
                    if resp_data:
                        body = json.loads(resp_data.decode("utf-8"))
                        remote_driver = body.get("targetDriverName")
                        remote_car_idx = body.get("targetCarIndex")
                        if remote_driver and remote_driver != self.state.driver_name:
                            self.state.set_target_driver(remote_driver, remote_car_idx)
            except URLError as e:
                # Fail gracefully if internet or vercel cold start
                self.last_status_code = getattr(e, "code", "ERR")
            except Exception:
                pass

def get_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def run_f1_relay(args):
    state = TelemetryState(target_driver_name=args.driver_name)
    lan_ip = get_lan_ip()
    
    print("=" * 70)
    print(" 🏎️  F1 2020 RACE ENGINEER & TELEMETRY RELAY BRIDGE")
    print("=" * 70)
    print(f"🎮 Target Driver Filter : {args.driver_name or '[Auto-Detect Active Player]'}")
    print(f"📥 UDP Listener Port   : {args.udp_port} (Codemasters F1 2020 format)")
    print(f"💻 Your Gaming PC IP   : {lan_ip}")
    print(f"🔗 LAN Access for Laptop: http://{lan_ip}:{args.http_port}/api/live")
    if args.cloud_url:
        print(f"🌐 Cloud Vercel Target  : {args.cloud_url}")
    else:
        print("🌐 Cloud Vercel Target  : [Not configured - pass --cloud-url to sync]")
    print("-" * 70)
    print("💡 To connect from your other laptop:")
    print(f"   Option A (LAN): Enter 'http://{lan_ip}:{args.http_port}' in the web app settings.")
    print("   Option B (Vercel): Deploy the web app and launch with --cloud-url https://your-app.vercel.app")
    print("=" * 70)
    
    # Start LAN HTTP server
    local_server = LocalHttpServer(state, host="0.0.0.0", port=args.http_port)
    local_server.start()
    
    # Start Cloud sync worker if URL provided
    if args.cloud_url:
        cloud_worker = CloudSyncWorker(state, cloud_url=args.cloud_url, sync_hz=args.cloud_hz)
        cloud_worker.start()
    
    # Open UDP Socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.bind((args.bind_ip, args.udp_port))
        print(f"✅ Listening for F1 2020 UDP packets on {args.bind_ip}:{args.udp_port}...\n")
    except Exception as e:
        print(f"❌ Failed to bind UDP socket on {args.bind_ip}:{args.udp_port}: {e}")
        print("   Make sure no other telemetry application is using port 20777.")
        return
    
    packet_count = 0
    last_print_time = time.time()
    
    try:
        while True:
            data, addr = sock.recvfrom(2048)
            if len(data) < 24:
                continue
            
            packet_count += 1
            try:
                header = parse_header(data)
                packet_id = header["packetId"]
                
                # Check participants packet to match driver name
                if packet_id == 4:
                    participants = parse_participants_packet(data, header)
                    state.update_participants(participants, header["playerCarIndex"])
                
                # Use effective player car index
                effective_idx = state.get_effective_car_index(header["playerCarIndex"])
                header["playerCarIndex"] = effective_idx
                
                if packet_id == 0:
                    motion = parse_motion_packet(data, header)
                    state.on_motion(motion)
                elif packet_id == 1:
                    session = parse_session_packet(data, header)
                    with state.lock:
                        state.session.update(session)
                elif packet_id == 2:
                    lap = parse_lap_packet(data, header)
                    state.on_lap_data(lap)
                elif packet_id == 5:
                    setup = parse_setup_packet(data, header)
                    with state.lock:
                        state.setup.update(setup)
                elif packet_id == 6:
                    telemetry = parse_car_telemetry_packet(data, header)
                    state.on_telemetry(telemetry)
                elif packet_id == 7:
                    status = parse_car_status_packet(data, header)
                    with state.lock:
                        state.status.update(status)
                elif packet_id == 10:
                    damage = parse_car_damage_packet(data, header)
                    with state.lock:
                        state.damage.update(damage)
            except Exception as parse_err:
                pass
            
            # Print live CLI dashboard line every 1 second
            now = time.time()
            if now - last_print_time >= 1.0:
                last_print_time = now
                s = state.snapshot()
                t = s["telemetry"]
                l = s["lapData"]
                sess = s["session"]
                laps_done = len(s["completedLaps"])
                print(
                    f"\r🏎️  [{s['driverName']}] Track: {sess.get('trackName', 'Unknown')[:14]} | "
                    f"Lap: {l.get('currentLapNum', 1)} | Time: {format_lap_time(l.get('currentLapTime', 0))} | "
                    f"Spd: {t.get('speed', 0):3d} km/h (G{t.get('gear', 0)}) | "
                    f"Tyres: {t.get('tyresInnerTemperature', {}).get('fl', 0)}°C | "
                    f"Laps Logged: {laps_done} | Packets: {packet_count}",
                    end="",
                    flush=True,
                )
    except KeyboardInterrupt:
        print("\n🛑 Telemetry relay stopped by user.")
    finally:
        sock.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="F1 2020 UDP Telemetry Relay to LAN and Vercel Cloud")
    parser.add_argument("--udp-port", type=int, default=20777, help="F1 2020 UDP port (default: 20777)")
    parser.add_argument("--bind-ip", type=str, default="0.0.0.0", help="UDP bind IP (default: 0.0.0.0)")
    parser.add_argument("--http-port", type=int, default=8080, help="Local LAN HTTP server port (default: 8080)")
    parser.add_argument("--driver-name", type=str, default=None, help="Player / Driver name to track and match")
    parser.add_argument("--cloud-url", type=str, default=None, help="Vercel cloud deployment URL (e.g. https://my-f1-app.vercel.app)")
    parser.add_argument("--cloud-hz", type=float, default=5.0, help="Cloud sync rate in Hz (default: 5.0)")
    args = parser.parse_args()
    run_f1_relay(args)
