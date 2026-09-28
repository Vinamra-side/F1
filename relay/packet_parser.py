"""
F1 2020 UDP Telemetry Binary Packet Parser
Parses UDP packets broadcasted by Codemasters F1 2020 on port 20777.
Supports Header, Motion, Session, Lap Data, Participants, Car Setup, Car Telemetry, and Car Status.
"""

import struct
from typing import Dict, Any, Optional, List, Tuple

HEADER_FORMAT = "<HBBBBQfIBB"
HEADER_SIZE = struct.calcsize(HEADER_FORMAT) # 24 bytes

PACKET_IDS = {
    0: "MOTION",
    1: "SESSION",
    2: "LAP_DATA",
    3: "EVENT",
    4: "PARTICIPANTS",
    5: "CAR_SETUPS",
    6: "CAR_TELEMETRY",
    7: "CAR_STATUS",
    8: "FINAL_CLASSIFICATION",
    9: "LOBBY_INFO",
}

TRACK_NAMES = {
    0: "Melbourne (Australia)",
    1: "Paul Ricard (France)",
    2: "Shanghai (China)",
    3: "Sakhir (Bahrain)",
    4: "Catalunya (Spain)",
    5: "Monaco",
    6: "Montreal (Canada)",
    7: "Silverstone (Great Britain)",
    8: "Hockenheim (Germany)",
    9: "Hungaroring (Hungary)",
    10: "Spa-Francorchamps (Belgium)",
    11: "Monza (Italy)",
    12: "Singapore",
    13: "Suzuka (Japan)",
    14: "Yas Marina (Abu Dhabi)",
    15: "Circuit of the Americas (USA)",
    16: "Interlagos (Brazil)",
    17: "Red Bull Ring (Austria)",
    18: "Sochi Autodrom (Russia)",
    19: "Autodromo Hermanos Rodriguez (Mexico)",
    20: "Baku City Circuit (Azerbaijan)",
    21: "Sakhir Short",
    22: "Silverstone Short",
    23: "Texas Short",
    24: "Suzuka Short",
    25: "Hanoi Street Circuit (Vietnam)",
    26: "Circuit Zandvoort (Netherlands)",
}

WEATHER_NAMES = {
    0: "Clear",
    1: "Light Cloud",
    2: "Overcast",
    3: "Light Rain",
    4: "Heavy Rain",
    5: "Storm",
}

SESSION_TYPES = {
    0: "Unknown",
    1: "Practice 1",
    2: "Practice 2",
    3: "Practice 3",
    4: "Short Practice",
    5: "Qualifying 1",
    6: "Qualifying 2",
    7: "Qualifying 3",
    8: "Short Qualifying",
    9: "One-Shot Qualifying",
    10: "Race",
    11: "Race 2",
    12: "Time Trial",
}

TYRE_COMPOUNDS = {
    16: "Soft",
    17: "Medium",
    18: "Hard",
    7: "Intermediate",
    8: "Wet",
}

def parse_header(data: bytes) -> Dict[str, Any]:
    if len(data) < HEADER_SIZE:
        raise ValueError(f"Packet too short for header: {len(data)} bytes")
    
    (
        packet_format,
        game_major_ver,
        game_minor_ver,
        packet_ver,
        packet_id,
        session_uid,
        session_time,
        frame_id,
        player_car_index,
        secondary_player_car_index,
    ) = struct.unpack_from(HEADER_FORMAT, data, 0)
    
    return {
        "packetFormat": packet_format,
        "gameMajorVersion": game_major_ver,
        "gameMinorVersion": game_minor_ver,
        "packetVersion": packet_ver,
        "packetId": packet_id,
        "packetName": PACKET_IDS.get(packet_id, f"UNKNOWN_{packet_id}"),
        "sessionUID": str(session_uid),
        "sessionTime": round(session_time, 3),
        "frameIdentifier": frame_id,
        "playerCarIndex": player_car_index,
        "secondaryPlayerCarIndex": secondary_player_car_index,
    }

def parse_motion_packet(data: bytes, header: Dict[str, Any]) -> Dict[str, Any]:
    # 22 cars * 60 bytes each
    car_motion_format = "<ffffffhhhhhhffffff"
    car_motion_size = struct.calcsize(car_motion_format) # 60 bytes
    player_idx = header["playerCarIndex"]
    
    offset = HEADER_SIZE + (player_idx * car_motion_size)
    if len(data) < offset + car_motion_size:
        return {}
    
    motion_values = struct.unpack_from(car_motion_format, data, offset)
    
    # Extra player data at end of packet:
    # 4 floats suspPos, 4 floats suspVel, 4 floats suspAcc, 4 floats wheelSpeed, 4 floats wheelSlip
    extra_offset = HEADER_SIZE + (22 * car_motion_size)
    extra_format = "<4f4f4f4f4f"
    susp_pos, susp_vel, susp_acc, wheel_spd, wheel_slip = ([], [], [], [], [])
    
    if len(data) >= extra_offset + struct.calcsize(extra_format):
        extra_vals = struct.unpack_from(extra_format, data, extra_offset)
        susp_pos = [round(x, 4) for x in extra_vals[0:4]]
        susp_vel = [round(x, 4) for x in extra_vals[4:8]]
        susp_acc = [round(x, 4) for x in extra_vals[8:12]]
        wheel_spd = [round(x, 2) for x in extra_vals[12:16]]
        wheel_slip = [round(x, 4) for x in extra_vals[16:20]] # [RL, RR, FL, FR]
    
    return {
        "worldPosition": [round(motion_values[0], 2), round(motion_values[1], 2), round(motion_values[2], 2)],
        "worldVelocity": [round(motion_values[3], 2), round(motion_values[4], 2), round(motion_values[5], 2)],
        "gForceLateral": round(motion_values[12], 2),
        "gForceLongitudinal": round(motion_values[13], 2),
        "gForceVertical": round(motion_values[14], 2),
        "yaw": round(motion_values[15], 4),
        "pitch": round(motion_values[16], 4),
        "roll": round(motion_values[17], 4),
        "suspensionPosition": susp_pos,
        "suspensionVelocity": susp_vel,
        "wheelSpeed": wheel_spd,
        "wheelSlip": wheel_slip,
    }

def parse_session_packet(data: bytes, header: Dict[str, Any]) -> Dict[str, Any]:
    # uint8 weather, int8 trackTemp, int8 airTemp, uint8 totalLaps, uint16 trackLength, uint8 sessionType, int8 trackId
    session_format = "<BbbBHBb"
    offset = HEADER_SIZE
    if len(data) < offset + struct.calcsize(session_format):
        return {}
    
    vals = struct.unpack_from(session_format, data, offset)
    weather_id = vals[0]
    track_temp = vals[1]
    air_temp = vals[2]
    total_laps = vals[3]
    track_length = vals[4]
    session_type_id = vals[5]
    track_id = vals[6]
    
    return {
        "weather": WEATHER_NAMES.get(weather_id, "Unknown"),
        "weatherId": weather_id,
        "trackTemperature": track_temp,
        "airTemperature": air_temp,
        "totalLaps": total_laps,
        "trackLength": track_length,
        "sessionType": SESSION_TYPES.get(session_type_id, f"Type {session_type_id}"),
        "sessionTypeId": session_type_id,
        "trackId": track_id,
        "trackName": TRACK_NAMES.get(track_id, f"Track {track_id}"),
    }

def parse_lap_packet(data: bytes, header: Dict[str, Any]) -> Dict[str, Any]:
    # 22 cars * 53 bytes
    lap_format = "<ffHHfBHH HHHHH fff BBBBB BBBBB BB"
    # Exact LapData struct:
    # float lastLapTime, float currentLapTime, uint16 sector1TimeInMS, uint16 sector2TimeInMS,
    # float bestLapTime, uint8 bestLapNum, uint16 bestLapSector1TimeInMS, uint16 bestLapSector2TimeInMS, uint16 bestLapSector3TimeInMS,
    # uint16 bestOverallSector1TimeInMS, uint8 bestOverallSector1LapNum, uint16 bestOverallSector2TimeInMS, uint8 bestOverallSector2LapNum,
    # uint16 bestOverallSector3TimeInMS, uint8 bestOverallSector3LapNum, float lapDistance, float totalDistance, float safetyCarDelta,
    # uint8 carPosition, uint8 currentLapNum, uint8 pitStatus, uint8 numPitStops, uint8 sector, uint8 currentLapInvalid,
    # uint8 penalties, uint8 warnings, uint8 numUnservedDriveThroughPens, uint8 numUnservedStopGoPens, uint8 gridPosition,
    # uint8 driverStatus, uint8 resultStatus
    lap_size = 53
    player_idx = header["playerCarIndex"]
    offset = HEADER_SIZE + (player_idx * lap_size)
    if len(data) < offset + lap_size:
        return {}
    
    (
        last_lap_time,
        curr_lap_time,
        s1_ms,
        s2_ms,
        best_lap_time,
        best_lap_num,
        best_s1_ms,
        best_s2_ms,
        best_s3_ms,
        best_ovr_s1_ms,
        best_ovr_s1_lap,
        best_ovr_s2_ms,
        best_ovr_s2_lap,
        best_ovr_s3_ms,
        best_ovr_s3_lap,
        lap_dist,
        total_dist,
        safety_car_delta,
        car_pos,
        curr_lap_num,
        pit_status,
        num_pit_stops,
        sector,
        current_lap_invalid,
        penalties,
        warnings,
        dt_pens,
        sg_pens,
        grid_pos,
        driver_status,
        result_status,
    ) = struct.unpack_from("<ffHHfBHHHHBHBHBfffBBBBBBBBBBBBB", data, offset)
    
    return {
        "lastLapTime": round(last_lap_time, 3),
        "currentLapTime": round(curr_lap_time, 3),
        "sector1TimeMs": s1_ms,
        "sector2TimeMs": s2_ms,
        "bestLapTime": round(best_lap_time, 3),
        "bestLapNum": best_lap_num,
        "lapDistance": round(lap_dist, 1),
        "totalDistance": round(total_dist, 1),
        "carPosition": car_pos,
        "currentLapNum": curr_lap_num,
        "pitStatus": pit_status,
        "numPitStops": num_pit_stops,
        "sector": sector,
        "isCurrentLapInvalid": bool(current_lap_invalid),
        "penalties": penalties,
    }

def parse_participants_packet(data: bytes, header: Dict[str, Any]) -> List[Dict[str, Any]]:
    # uint8 numActiveCars, then 22 ParticipantData
    # ParticipantData: uint8 ai, uint8 driverId, uint8 netId, uint8 teamId, uint8 myTeam, uint8 raceNum, uint8 nationality, char name[48], uint8 yourTelemetry
    # size per participant: 1+1+1+1+1+1+1 + 48 + 1 = 56 bytes
    if len(data) < HEADER_SIZE + 1:
        return []
    
    num_cars = struct.unpack_from("<B", data, HEADER_SIZE)[0]
    participants = []
    offset = HEADER_SIZE + 1
    p_size = 56
    
    for i in range(min(num_cars, 22)):
        if len(data) < offset + p_size:
            break
        vals = struct.unpack_from("<BBBBBBB48sB", data, offset)
        raw_name = vals[7].split(b'\x00')[0].decode('utf-8', errors='ignore').strip()
        participants.append({
            "carIndex": i,
            "isAi": bool(vals[0]),
            "driverId": vals[1],
            "teamId": vals[3],
            "isMyTeam": bool(vals[4]),
            "raceNumber": vals[5],
            "nationality": vals[6],
            "name": raw_name if raw_name else f"Driver {i+1}",
        })
        offset += p_size
        
    return participants

def parse_setup_packet(data: bytes, header: Dict[str, Any]) -> Dict[str, Any]:
    # 22 cars * 49 bytes
    # uint8 frontWing, uint8 rearWing, uint8 onThrottle, uint8 offThrottle,
    # float frontCamber, float rearCamber, float frontToe, float rearToe,
    # uint8 frontSusp, uint8 rearSusp, uint8 frontARB, uint8 rearARB,
    # uint8 frontRideHeight, uint8 rearRideHeight, uint8 brakePressure, uint8 brakeBias,
    # float rearLeftTyrePressure, float rearRightTyrePressure, float frontLeftTyrePressure, float frontRightTyrePressure,
    # uint8 ballast, float fuelLoad
    setup_format = "<BBBBffffBBBBBBBBffffBf"
    setup_size = struct.calcsize(setup_format) # 49 bytes
    player_idx = header["playerCarIndex"]
    offset = HEADER_SIZE + (player_idx * setup_size)
    if len(data) < offset + setup_size:
        return {}
    
    vals = struct.unpack_from(setup_format, data, offset)
    return {
        "frontWing": vals[0],
        "rearWing": vals[1],
        "onThrottleDiff": vals[2],
        "offThrottleDiff": vals[3],
        "frontCamber": round(vals[4], 2),
        "rearCamber": round(vals[5], 2),
        "frontToe": round(vals[6], 2),
        "rearToe": round(vals[7], 2),
        "frontSuspension": vals[8],
        "rearSuspension": vals[9],
        "frontAntiRollBar": vals[10],
        "rearAntiRollBar": vals[11],
        "frontRideHeight": vals[12],
        "rearRideHeight": vals[13],
        "brakePressure": vals[14],
        "brakeBias": vals[15],
        "rearLeftTyrePressure": round(vals[16], 1),
        "rearRightTyrePressure": round(vals[17], 1),
        "frontLeftTyrePressure": round(vals[18], 1),
        "frontRightTyrePressure": round(vals[19], 1),
        "ballast": vals[20],
        "fuelLoad": round(vals[21], 1),
    }

def parse_car_telemetry_packet(data: bytes, header: Dict[str, Any]) -> Dict[str, Any]:
    # 22 cars * 58 bytes
    # uint16 speed, float throttle, float steer, float brake, uint8 clutch, int8 gear, uint16 engineRPM, uint8 drs, uint8 revLights,
    # uint16 brakesTemp[4], uint8 tyresSurfaceTemp[4], uint8 tyresInnerTemp[4], uint16 engineTemp, float tyresPressure[4], uint8 surfaceType[4]
    # Wheels order: [RL, RR, FL, FR]
    telemetry_format = "<HfffBbHBB4H4B4BH4f4B"
    t_size = struct.calcsize(telemetry_format) # 58 bytes
    player_idx = header["playerCarIndex"]
    offset = HEADER_SIZE + (player_idx * t_size)
    if len(data) < offset + t_size:
        return {}
    
    vals = struct.unpack_from(telemetry_format, data, offset)
    speed = vals[0]
    throttle = round(vals[1], 3)
    steer = round(vals[2], 3)
    brake = round(vals[3], 3)
    clutch = vals[4]
    gear = vals[5]
    rpm = vals[6]
    drs = bool(vals[7])
    rev_lights = vals[8]
    
    # Brake temps: [RL, RR, FL, FR] -> map to dict
    brakes_temp = {"rl": vals[9], "rr": vals[10], "fl": vals[11], "fr": vals[12]}
    # Tyres surface temp: [RL, RR, FL, FR]
    tyres_surface = {"rl": vals[13], "rr": vals[14], "fl": vals[15], "fr": vals[16]}
    # Tyres inner core temp: [RL, RR, FL, FR]
    tyres_inner = {"rl": vals[17], "rr": vals[18], "fl": vals[19], "fr": vals[20]}
    engine_temp = vals[21]
    tyres_pressure = {
        "rl": round(vals[22], 1),
        "rr": round(vals[23], 1),
        "fl": round(vals[24], 1),
        "fr": round(vals[25], 1),
    }
    
    return {
        "speed": speed,
        "throttle": throttle,
        "steer": steer,
        "brake": brake,
        "clutch": clutch,
        "gear": gear,
        "engineRPM": rpm,
        "drs": drs,
        "revLightsPercent": rev_lights,
        "brakesTemperature": brakes_temp,
        "tyresSurfaceTemperature": tyres_surface,
        "tyresInnerTemperature": tyres_inner,
        "engineTemperature": engine_temp,
        "tyresPressure": tyres_pressure,
    }

def parse_car_status_packet(data: bytes, header: Dict[str, Any]) -> Dict[str, Any]:
    # 22 cars * 60 bytes
    # uint8 tc, uint8 abs, uint8 fuelMix, uint8 frontBrakeBias, uint8 pitLimiter,
    # float fuelInTank, float fuelCapacity, float fuelRemainingLaps,
    # uint16 maxRPM, uint16 idleRPM, uint8 maxGears, uint8 drsAllowed, uint16 drsDistance,
    # uint8 tyresWear[4], uint8 actualCompound, uint8 visualCompound, uint8 tyresAgeLaps,
    # uint8 tyresDamage[4], wing/DRS/engine/gearbox damage, int8 fiaFlags,
    # float ersStoreEnergy, uint8 ersDeployMode, float ersHarvestedMGUK, float ersHarvestedMGUH, float ersDeployed
    status_format = "<5B3f2H2BH4B3B4B6BbfB3f"
    s_size = struct.calcsize(status_format) # 60 bytes
    player_idx = header["playerCarIndex"]
    offset = HEADER_SIZE + (player_idx * s_size)
    if len(data) < offset + s_size:
        return {}
    
    vals = struct.unpack_from(status_format, data, offset)
    compound_id = vals[18]
    
    return {
        "tractionControl": vals[0],
        "antiLockBrakes": vals[1],
        "fuelMix": vals[2],
        "frontBrakeBias": vals[3],
        "pitLimiter": bool(vals[4]),
        "fuelInTank": round(vals[5], 2),
        "fuelCapacity": round(vals[6], 2),
        "fuelRemainingLaps": round(vals[7], 2),
        "maxRPM": vals[8],
        "idleRPM": vals[9],
        "drsAllowed": bool(vals[11]),
        "tyreCompound": TYRE_COMPOUNDS.get(compound_id, "Dry"),
        "tyresAgeLaps": vals[19],
        "ersStoreEnergy": round(vals[31], 0), # Max 4,000,000 Joules
        "ersDeployMode": vals[32],
        "damage": {
            "tyresWear": {"rl": vals[13], "rr": vals[14], "fl": vals[15], "fr": vals[16]},
            "frontLeftWingDamage": vals[24],
            "frontRightWingDamage": vals[25],
            "rearWingDamage": vals[26],
            "engineDamage": vals[28],
            "gearboxDamage": vals[29],
        },
    }
