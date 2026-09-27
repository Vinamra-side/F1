# 🏎️ F1 2020 AI Race Engineer & Live Telemetry Pit Wall

An end-to-end, multi-device **F1 2020 Game Engineer & Telemetry System**. Designed to run on your gaming PC, deploy to **Vercel**, and provide real-time lap-to-lap telemetry analysis and physics-based car setups on your secondary laptop while you race.

---

## 🌟 Highlights & Capabilities

### 1. 🤖 AI Race Engineer & Setup Optimizer
- **Chassis Balance Diagnostics**: Calculates real-time handling balance score (-10 Oversteer to +10 Understeer).
- **Automated Setup Adjustments**: Generates tailored F1 2020 setups (Aerodynamics, Differential, Suspension Geometry, Springs, Anti-Roll Bars, Ride Heights, Brake Bias, and Tyre Pressures) based on your live driving data.
- **Audio Pit Wall Radio**: Uses browser speech synthesis to speak radio transmissions through your laptop's speakers (e.g. *"Box this lap, Vinamra. Front tyres running hot at 106°C..."*).
- **Interactive Driver Feel Feedback**: Click symptom chips (e.g. *"Oversteer on Corner Exit"*, *"Front Locking"*, *"Kerb Instability"*) to instantly tune setup clicks with engineering rationale.
- **Garage Setup Sheet**: View and copy complete in-game setup values to enter directly in the garage.

### 2. ⏱️ Lap-to-Lap Performance Analysis
- **Sector Splits**: Tracks Sector 1, Sector 2, and Sector 3 in milliseconds with session-best purple indicators.
- **Delta Comparison**: Real-time delta to session best lap time.
- **Degradation & Fuel Burn**: Fuel consumed per lap (kg) and per-wheel tyre wear delta (%) to calculate pit stop windows.
- **Speed Trap**: Terminal straight-line velocity records per lap.
- **Handling Incident Counter**: Records oversteer and understeer events across every lap.

### 3. 📊 4-Wheel Tyre & Brake Thermal Matrix
- **Inner Core & Surface Temperatures**: Color-coded thermal indicators (Blue: Cold, Green: Optimal 95-104°C, Amber: Warm, Red: Overheating >109°C).
- **Tyre Pressure (PSI)**: Real-time dynamic tyre inflation.
- **Brake Rotor Glow**: Rotor temperatures (°C) to identify front brake glaze or rear lockup tendencies.
- **Tread Wear Percentage**: Real-time visual wear bar with caution and critical warning indicators.

### 4. 🚀 Live Pit Wall HUD
- **Digital Speedometer & Gear Indicator**: Large, readable display with neutral and reverse indicators.
- **15-LED Shift Light Bar**: Green, Red, and Purple RPM shift lights calibrated to F1 2020 redlines.
- **Live Pedal Traces**: Smooth throttle and brake pressure bars plus steering angle indicator.
- **DRS & ERS Status**: Active DRS badge and ERS 4MJ battery level.

---

## 🛠️ Architecture: How Multi-Device Realtime Works

```
 ┌────────────────────────────────────────────────────────┐
 │                      GAMING PC                         │
 │                                                        │
 │   [ Codemasters F1 2020 ]                              │
 │            │ (UDP packets on port 20777)               │
 │            ▼                                           │
 │   [ relay/f1_relay.py ]                                │
 │     • Parses binary packets (Motion, Lap, Setup, etc.) │
 │     • Matches target Driver Name (e.g. "Vinamra")      │
 └────────────┬─────────────────────────────┬─────────────┘
              │ (HTTP POST /api/ingest)     │ (LAN WebSocket/HTTP)
              ▼                             ▼
 ┌───────────────────────────┐    ┌───────────────────────────┐
 │       VERCEL CLOUD        │    │    LOCAL HOME WI-FI       │
 │   Next.js API & App       │    │    http://192.168.x.x:8080│
 └─────────────┬─────────────┘    └─────────────┬─────────────┘
               │                                │
               └───────────────┬────────────────┘
                               ▼
 ┌────────────────────────────────────────────────────────┐
 │                    SECONDARY LAPTOP                    │
 │   Browser: https://your-app.vercel.app                 │
 │   • Live Pit Wall HUD                                  │
 │   • AI Race Engineer & Setups                          │
 │   • Lap-to-Lap Performance Data                        │
 └────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Step 1: Configure UDP Telemetry in F1 2020
1. Launch **F1 2020** on your gaming PC.
2. Go to **Game Options** &rarr; **Settings** &rarr; **Telemetry Settings**.
3. Set the following options:
   - **UDP Telemetry**: `ON`
   - **UDP Broadcast**: `ON` (or set UDP IP to `127.0.0.1`)
   - **UDP Port**: `20777`
   - **UDP Send Rate**: `20Hz` or `60Hz`
   - **UDP Format**: `2020`

---

### Step 2: Deploy to Vercel (For Remote Viewing)
1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of F1 2020 Telemetry Engineer"
   git remote add origin https://github.com/YOUR_USERNAME/f1-2020-telemetry-engineer.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your repository and click **Deploy** (zero configuration needed; framework is automatically detected as Next.js).
4. Vercel will give you a public URL, for example:
   `https://f1-2020-engineer.vercel.app`

---

### Step 3: Run the Telemetry Relay on your Gaming PC
On the PC where F1 2020 is running:

#### Option A: One-Click Windows Batch Launcher
Double-click:
```
relay/run_relay.bat
```
Enter your Driver Name (e.g. `Vinamra`) and your Vercel URL.

#### Option B: Terminal Command
```bash
python relay/f1_relay.py --driver-name "Vinamra" --cloud-url https://your-app.vercel.app
```

*Arguments:*
- `--driver-name "YOUR_NAME"`: Automatically finds and matches your car index from session participants.
- `--cloud-url "https://your-app.vercel.app"`: Streams live data to your Vercel deployment.
- `--http-port 8080`: Local LAN server port.

---

### Step 4: Open on Your Second Laptop
1. Open your browser on your secondary laptop and navigate to your Vercel URL (or local LAN IP).
2. The dashboard will automatically display your live telemetry, laps, and race engineer suggestions as you drive!
3. Click the **Audio Radio** button to hear spoken pit wall instructions as you race.

---

## 🧪 Testing Without the Game (Built-in Simulator)

You can test the entire pipeline without opening F1 2020:

### 1. In-Browser Demo Mode
1. In the web dashboard, click the Connection button at the top right.
2. Select **"Interactive Bahrain GP Demo"**.
3. Telemetry will begin playing immediately in your browser.

### 2. Python UDP Packet Generator
To test UDP transmission through the relay:
```bash
# Terminal 1: Run Relay
python relay/f1_relay.py --driver-name "Vinamra"

# Terminal 2: Run Bahrain GP Simulator
python relay/simulator.py --driver-name "Vinamra" --laps 5
```

---

## 📁 Project Structure

```
f1-2020-telemetry-engineer/
├── relay/
│   ├── f1_relay.py          # UDP packet receiver, accumulator & cloud forwarder
│   ├── packet_parser.py     # Binary struct unpacker for F1 2020 UDP 20777
│   ├── simulator.py         # Mock telemetry generator (Bahrain GP)
│   └── run_relay.bat        # Windows one-click launcher
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ingest/route.ts  # Receives telemetry from relay
│   │   │   ├── live/route.ts    # Serves live state to web UI
│   │   │   ├── setup/route.ts   # AI setup evaluator
│   │   │   └── reset/route.ts   # Clears session data
│   │   ├── layout.tsx
│   │   └── page.tsx             # Master Dashboard (Pit Wall, Setups, Laps)
│   ├── components/
│   │   ├── LivePitWall.tsx      # Speed, Gear, LED Shift Lights, DRS, ERS
│   │   ├── TyreMatrix.tsx       # 4-wheel thermal & wear matrix
│   │   ├── LapHistory.tsx       # Lap-to-lap comparison table & sector splits
│   │   ├── RaceEngineer.tsx     # AI Setup Recommender & Voice Radio
│   │   ├── ConnectionModal.tsx  # Cloud / LAN / Demo connection switcher
│   │   └── DriverSelector.tsx   # Driver name filter & participant picker
│   └── lib/
│       ├── types.ts             # TypeScript definitions
│       ├── f1_constants.ts      # 22 F1 tracks & baseline setups
│       ├── engineer_engine.ts   # Setup recommendation algorithm
│       └── telemetry_store.ts   # In-memory session store
├── package.json
└── README.md
```
