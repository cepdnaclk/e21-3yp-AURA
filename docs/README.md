---
layout: home
permalink: index.html

# Please update this with your repository name and project title
repository-name: e21-3yp-AURA
title: Project AURA
---

[comment]: # "This is the standard layout for the project, but you can clean this and use your own template"

# Project AURA - Automated Urban Restaurant Assistant

---

## Team Members
- **E/21/024**, AMARANGA S.G.I. - [Email](mailto:e21024@eng.pdn.ac.lk)
- **E/21/113**, DISSANAYAKE H.G.K.V.D.C. - [Email](mailto:e21113@eng.pdn.ac.lk)
- **E/21/245**, MADHUSHAN S.K.A.K. - [Email](mailto:e21245@eng.pdn.ac.lk)
- **E/21/407**, THENNAKOON T.M.I.I.C. - [Email](mailto:e21407@eng.pdn.ac.lk)

![Sample Image](./images/logo.png)

---

## Introduction

In the modern hospitality industry, customers often face delays in ordering, difficulties in communicating with staff due to language barriers, and a lack of engaging entertainment while waiting. **AURA (Automated Urban Restaurant Assistant)** addresses these issues by introducing a smart, interactive table-top robot companion.



Unlike standard digital kiosks, AURA utilizes **Social Robotics** principles—employing active face tracking, voice interaction, and ambient lighting control to create a "living" digital concierge. It streamlines the ordering process, entertains customers, and assists staff by automating repetitive tasks.

### Key Features
* **Interactive Robotics:** Pan & Tilt head movement with active face tracking and voice interaction.
* **Autonomous Ordering:** Intuitive touch-based ordering system with multi-language support.
* **Smart Environment:** User-controlled ambient RGB lighting (Moods: *Dining, Reading, Party*).
* **Wireless & Portable:** Battery-powered design requiring no table wiring (**Zero Infrastructure Cost**).

---

## Solution Architecture

### High-Level Overview
The system consists of three main components:
1.  **The AURA Robot Nodes:** Placed at each table, handling user interaction and sensing.
2.  **The MQTT Broker:** Managing real-time communication between robots and the server.
3.  **The Central Server:** Handling order processing, kitchen display updates, and database management.

![System Architecture](../docs/images/system_architecture.jpeg)

---

## Hardware & Software Designs

### Hardware Specifications
The robot is built around high-performance embedded computing to support AI tasks.

| Component | Specification | Purpose |
| :--- | :--- | :--- |
| **Main Controller** | Raspberry Pi 4 Model B (2GB) | Core processing, AI, & UI rendering |
| **Display** | 7-inch Capacitive Touch Screen | User Interface for ordering & games |
| **Camera** | Raspberry Pi Camera Module V2 | Face tracking & QR scanning |
| **Actuators** | 2x MG996R Servo Motors | Pan & Tilt mechanism for head movement |
| **Sensors** | PIR Motion Sensor | Presence detection & auto-wake |
| **Power** | Li-ion Battery Pack (10,000mAh) | Portable power source |
| **Audio** | USB Mic & Speaker | Voice interaction & alerts |

### Software Stack
* **Robot Frontend:** Python (PyQt/Kivy) for the touch interface.
* **Robot Logic:** OpenCV for face tracking, GPIO Zero for servo control.
* **Communication:** MQTT Protocol (Paho-MQTT) for lightweight messaging.
* **Central Server:** Flask (Python) web server.
* **Database:** SQLite for managing menu items and transaction history.

### Data Flow
1.  **Input:** User interacts via touch or voice. Camera tracks user face.
2.  **Processing:** Raspberry Pi processes inputs and generates MQTT payloads.
3.  **Transmission:** Data sent over Wi-Fi to the Central Server.
4.  **Action:** Kitchen Display shows the order; Robot updates UI/Lighting.

---

## Testing

To ensure reliability in a chaotic restaurant environment, we employ a three-tier testing strategy:

1.  **Unit Testing:** Individual testing of Servo mechanisms, Camera feed, and UI components.
2.  **Integration Testing:** Verifying MQTT message delivery latency and reliability between Robot and Server.
3.  **User Acceptance Testing (UAT):** Real-world trials in a café environment to assess battery life and user interaction flow.

---

## Detailed Budget

Below is the estimated budget for a single AURA unit based on current component prices.

| Item | Quantity | Unit Cost (LKR) | Total (LKR) |
| :--- | :---: | :---: | :---: |
| Raspberry Pi 4 Model B (2GB) | 1 | 18,500 | 18,500 |
| 7-inch Capacitive Touch Screen | 1 | 16,000 | 16,000 |
| Raspberry Pi Camera Module V2 | 1 | 4,500 | 4,500 |
| MG996R Servo Motors | 2 | 1,200 | 2,400 |
| 10,000mAh Li-ion Battery Pack | 1 | 6,500 | 6,500 |
| USB Microphone & Speaker | 1 | 2,500 | 2,500 |
| PIR Motion Sensor | 1 | 450 | 450 |
| 3D Printing Filament (PLA) | 1 | 3,000 | 3,000 |
| Miscellaneous (Wires, Screws) | - | 1,500 | 1,500 |
| **Grand Total** | | | **55,350 LKR** |

---

## Links

- **Project Repository:** [GitHub Repo](https://github.com/cepdnaclk/e21-3yp-AURA)
- **Project Page:** [AURA Website](https://cepdnaclk.github.io/e21-3yp-AURA)
- **Department of Computer Engineering:** [UoP CPED](http://www.ce.pdn.ac.lk/)
- **University of Peradeniya:** [UoP Website](https://eng.pdn.ac.lk/)

[//]: # (Please refer this to learn more about Markdown syntax)
[//]: # (https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
