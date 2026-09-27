#!/usr/bin/env python3
"""
F1 2020 Telemetry Simulator / Mock Generator
Simulates realistic F1 2020 telemetry packets broadcasted over UDP port 20777.
Generates full laps around Bahrain International Circuit with braking zones,
cornering lateral Gs, tyre thermal buildup, fuel burn, and sector timing.
"""

import socket
import struct
import time
import math
import argparse
from typing import Tuple

HEADER_FORMAT = "<HBBBBQfIBB" # 24 bytes

def make_header(packet_id: int, session_time: float, frame_id: int, player_idx: int = 0) -> bytes:
    return struct.pack(
        HEADER_FORMAT,
        2020,         # m_packetFormat
        1,            # m_gameMajorVersion
        18,           # m_gameMinorVersion
        1,            # m_packetVersion
        packet_id,    # m_packetId
        1234567890123,# m_sessionUID
        float(session_time),
        frame_id,
        player_idx,
        255           # m_secondaryPlayerCarIndex
    )

def simulate_track_lap(target_host: str = "127.0.0.1", target_port: int = 20777, driver_name: str = "Vinamra", total_laps: int = 5):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    print("=" * 65)
    print(f"🏎️  STARTING F1 2020 TELEMETRY SIMULATOR (Bahrain GP)")
    print(f"🎯 Target UDP Destination: {target_host}:{target_port}")
    print(f"👤 Driver Name: {driver_name}")
    print("=" * 65)
    
    start_time = time.time()
    frame_id = 0
    lap_num = 1
    lap_time = 0.0
    lap_length_m = 5412.0 # Bahrain Sakhir Grand Prix Circuit
    lap_dist = 0.0
    fuel_tank = 30.0
    tyre_wear = {"fl": 2.0, "fr": 2.0, "rl": 2.0, "rr": 2.0}
    
    # 22 cars dummy filler
    motion_car_dummy = b'\x00' * 60
    lap_car_dummy = b'\x00' * 53
    setup_car_dummy = b'\x00' * 49
    telemetry_car_dummy = b'\x00' * 58
    status_car_dummy = b'\x00' * 60
    damage_car_dummy = b'\x00' * 26

    # Setup values (Baseline Bahrain Setup)
    # frontWing=7, rearWing=6, onThrottle=70, offThrottle=55, frontCamber=-2.8, rearCamber=-1.5,
    # frontToe=0.09, rearToe=0.32, frontSusp=7, rearSusp=6, frontARB=8, rearARB=6,
    # frontHeight=3, rearHeight=4, brakePress=95, brakeBias=56,
    # rearLeftTyre=21.0, rearRightTyre=21.0, frontLeftTyre=23.0, frontRightTyre=23.0, ballast=7, fuel=30.0
    setup_payload = struct.pack(
        "<BBBBffffBBBBBBBBffffBf",
        7, 6, 70, 55, -2.8, -1.5, 0.09, 0.32,
        7, 6, 8, 6, 3, 4, 95, 56,
        21.0, 21.0, 23.0, 23.0, 7, 30.0
    )

    last_participants_time = 0.0
    last_session_time = 0.0
    last_setup_time = 0.0

    try:
        while lap_num <= total_laps:
            loop_start = time.time()
            session_time = loop_start - start_time
            frame_id += 1
            
            # Progress through lap (90 second lap pace = 1:30.000)
            target_lap_duration = 91.5
            lap_progress = (lap_time % target_lap_duration) / target_lap_duration # 0.0 -> 1.0
            lap_dist = lap_progress * lap_length_m
            
            # Physics & driving simulation along Bahrain track
            # Straight (0-0.2), Heavy Braking T1 (0.2-0.25), Technical infield (0.25-0.6), Back straight (0.6-0.75), Final sector (0.75-1.0)
            phase = lap_progress * 10.0
            phase_frac = phase - int(phase)
            
            # Determine if in braking zone, corner apex, or straight
            is_braking = (0.18 < lap_progress < 0.23) or (0.38 < lap_progress < 0.43) or (0.68 < lap_progress < 0.72) or (0.92 < lap_progress < 0.95)
            is_cornering = (0.23 <= lap_progress <= 0.35) or (0.43 <= lap_progress <= 0.65) or (0.72 <= lap_progress <= 0.85)
            
            if is_braking:
                speed = int(320 - (phase_frac * 220))
                throttle = 0.0
                brake = 0.95
                steer = 0.05 * math.sin(phase * 10)
                gear = 2
                rpm = 10500
                drs = False
                lat_g = 0.4
                long_g = -4.5
                fl_brake_temp = 780
            elif is_cornering:
                speed = int(120 + 60 * math.sin(phase * 5))
                throttle = 0.45 + (0.4 * phase_frac)
                brake = 0.0
                steer = 0.45 * math.sin(phase * 3)
                gear = 3 if speed < 150 else 4
                rpm = 11200
                drs = False
                lat_g = 3.6 * math.sin(phase * 3)
                long_g = 0.8
                fl_brake_temp = 520
            else:
                # Full throttle straight
                speed = int(210 + (phase_frac * 115))
                throttle = 1.0
                brake = 0.0
                steer = 0.0
                gear = 7 if speed > 270 else 6
                rpm = 12400
                drs = (lap_progress < 0.18 or (0.62 < lap_progress < 0.68))
                lat_g = 0.05
                long_g = 1.6
                fl_brake_temp = 410

            # Tyre temperature dynamics
            surface_temp = int(100 + (abs(lat_g) * 3.5) + (brake * 12))
            inner_temp = int(98 + (lap_num * 0.8) + (phase_frac * 3))
            
            # --- 1. Participants Packet (every 2 seconds) ---
            if session_time - last_participants_time > 2.0:
                last_participants_time = session_time
                header = make_header(4, session_time, frame_id, 0)
                # uint8 numCars = 1
                name_bytes = driver_name.encode('utf-8')[:47].ljust(48, b'\x00')
                p_data = struct.pack("<BBBBBBB48sB", 0, 1, 0, 0, 0, 44, 1, name_bytes, 1)
                # pad rest of 21 cars
                p_data += (b'\x00' * 56) * 21
                sock.sendto(header + struct.pack("<B", 1) + p_data, (target_host, target_port))

            # --- 2. Session Packet (every 1 second) ---
            if session_time - last_session_time > 1.0:
                last_session_time = session_time
                header = make_header(1, session_time, frame_id, 0)
                # weather=0 (clear), trackTemp=38, airTemp=28, totalLaps=total_laps, trackLength=5412, sessionType=10 (Race), trackId=3 (Bahrain)
                session_data = struct.pack("<BbBbhBb", 0, 38, 28, total_laps, 5412, 10, 3)
                sock.sendto(header + session_data, (target_host, target_port))

            # --- 3. Car Setup Packet (every 3 seconds) ---
            if session_time - last_setup_time > 3.0:
                last_setup_time = session_time
                header = make_header(5, session_time, frame_id, 0)
                sock.sendto(header + setup_payload + (setup_car_dummy * 21), (target_host, target_port))

            # --- 4. Car Telemetry Packet (20Hz) ---
            header = make_header(6, session_time, frame_id, 0)
            rev_lights = int((rpm / 13500.0) * 100)
            t_payload = struct.pack(
                "<HfffBbHBB4H4B4BH4f4B",
                speed, throttle, steer, brake, 0, gear, rpm, int(drs), rev_lights,
                # brake temps: RL, RR, FL, FR
                fl_brake_temp - 50, fl_brake_temp - 50, fl_brake_temp, fl_brake_temp,
                # tyre surface: RL, RR, FL, FR
                surface_temp, surface_temp, surface_temp + 3, surface_temp + 2,
                # tyre inner: RL, RR, FL, FR
                inner_temp, inner_temp, inner_temp + 2, inner_temp + 2,
                102, # engine temp
                21.2, 21.2, 23.3, 23.3, # tyre PSI
                0, 0, 0, 0 # surface type
            )
            sock.sendto(header + t_payload + (telemetry_car_dummy * 21), (target_host, target_port))

            # --- 5. Motion Packet (20Hz) ---
            header = make_header(0, session_time, frame_id, 0)
            m_payload = struct.pack(
                "<ffffffhhhhhhffffff",
                0.0, 0.0, lap_dist, 0.0, 0.0, float(speed),
                0, 0, 32767, 32767, 0, 0,
                lat_g, long_g, 0.0, 0.0, 0.0, 0.0
            )
            # extra player data: 4 suspPos, 4 suspVel, 4 suspAcc, 4 wheelSpeed, 4 wheelSlip
            extra_payload = struct.pack(
                "<4f4f4f4f4f",
                0.01, 0.01, 0.02, 0.02,
                0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0,
                float(speed), float(speed), float(speed), float(speed),
                # wheelSlip: RL, RR, FL, FR
                0.02, 0.02, 0.01, 0.01
            )
            sock.sendto(header + m_payload + (motion_car_dummy * 21) + extra_payload, (target_host, target_port))

            # --- 6. Car Status Packet (10Hz) ---
            if frame_id % 2 == 0:
                header = make_header(7, session_time, frame_id, 0)
                # tc=0, abs=0, fuelMix=1, brakeBias=56, pitLimiter=0, fuelTank, fuelCap=110, fuelRem=2.1, maxRPM=13500, idleRPM=4000, maxGears=8, drsAllowed=1
                # visualCompound=16 (soft), tyreAge=lap_num, ersStore=3200000, deployMode=2 (hotlap)
                status_payload = struct.pack(
                    "<BBBBBfffHHBBHBBBb f B fff",
                    0, 0, 1, 56, 0,
                    fuel_tank, 110.0, 1.4,
                    13500, 4000, 8, 1, 0,
                    16, 16, lap_num, 0,
                    3200000.0, 2, 500.0, 1200.0, 800.0
                )
                sock.sendto(header + status_payload + (status_car_dummy * 21), (target_host, target_port))

            # --- 7. Car Damage Packet (5Hz) ---
            if frame_id % 4 == 0:
                header = make_header(10, session_time, frame_id, 0)
                # tyresWear [RL, RR, FL, FR], wear deltas
                wear_rl = int(tyre_wear["rl"] + (lap_num * 3.2))
                wear_rr = int(tyre_wear["rr"] + (lap_num * 3.2))
                wear_fl = int(tyre_wear["fl"] + (lap_num * 4.5)) # Front left takes more wear at Bahrain T9/T10
                wear_fr = int(tyre_wear["fr"] + (lap_num * 3.8))
                damage_payload = struct.pack(
                    "<4B4B4BBBBBBBBBBBBBB",
                    wear_rl, wear_rr, wear_fl, wear_fr,
                    0, 0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                )
                sock.sendto(header + damage_payload + (damage_car_dummy * 21), (target_host, target_port))

            # --- 8. Lap Data Packet (10Hz) ---
            if frame_id % 2 == 0:
                header = make_header(2, session_time, frame_id, 0)
                # S1 is ~28.5s, S2 is ~39.2s, S3 is ~23.8s
                s1_ms = int(min(lap_time, 28.520) * 1000) if lap_time >= 28.5 else 0
                s2_ms = int(min(lap_time - 28.520, 39.180) * 1000) if lap_time >= (28.5 + 39.18) else 0
                
                # Check if lap finished
                last_lap_val = 91.500 if lap_num > 1 else 0.0
                lap_payload = struct.pack(
                    "<ffHHfBHHHHBHBHBfffBBBBBBBBBBBBB",
                    last_lap_val, lap_time, s1_ms, s2_ms,
                    91.420, 1, 28520, 39180, 23720,
                    28520, 1, 39180, 1, 23720, 1,
                    lap_dist, (lap_num - 1) * lap_length_m + lap_dist, 0.0,
                    1, lap_num, 0, 0, 1 if lap_time < 28.5 else (2 if lap_time < 67.7 else 3),
                    0, 0, 0, 0, 0, 1, 1, 2
                )
                sock.sendto(header + lap_payload + (lap_car_dummy * 21), (target_host, target_port))

            # Time step (50ms = 20Hz update rate)
            elapsed = time.time() - loop_start
            sleep_time = max(0.005, 0.050 - elapsed)
            time.sleep(sleep_time)
            
            lap_time += 0.050
            if lap_time >= target_lap_duration:
                # Complete lap!
                fuel_tank -= 1.82
                print(f"🏁 Lap {lap_num} Completed! Time: 1:{target_lap_duration-60:05.3f} | Fuel: {fuel_tank:.1f}kg")
                lap_num += 1
                lap_time = 0.0
                time.sleep(0.5)

    except KeyboardInterrupt:
        print("\n🛑 Telemetry simulator stopped.")
    finally:
        sock.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate F1 2020 Telemetry over UDP")
    parser.add_argument("--host", default="127.0.0.1", help="Target UDP IP (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=20777, help="Target UDP port (default: 20777)")
    parser.add_argument("--driver-name", default="Vinamra", help="Driver name to broadcast")
    parser.add_argument("--laps", type=int, default=10, help="Number of laps to simulate (default: 10)")
    args = parser.parse_args()
    simulate_track_lap(target_host=args.host, target_port=args.port, driver_name=args.driver_name, total_laps=args.laps)
