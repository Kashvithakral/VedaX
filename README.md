# 🌿 VedaX – From Soil to Soul  
### Blockchain-based Traceability for the Ayurvedic Herbal Supply Chain  

## 📌 Overview
The Ayurvedic herbal supply chain in India is highly fragmented, involving smallholder farmers, wild collectors, intermediaries, processors, and manufacturers.  
This leads to challenges such as:
- Mislabeling and adulteration of herbs  
- Over-harvesting of vulnerable species  
- Lack of provenance and transparency  
- Weak compliance with national and export regulations  

This project proposes a **blockchain-powered traceability platform** augmented with **geo-tagging** and **QR-code transparency** to ensure **authenticity, sustainability, and consumer trust**.

---

## 🚀 Proposed Solution
A **permissioned blockchain network** records every stage of an herb’s journey — from geo-tagged harvest events to processing, lab testing, and final packaging.  

Key Features:
- **Immutable Records:** Each transaction (harvest, lab test, processing step) is stored permanently on blockchain.  
- **Smart Contracts:** Enforce sustainability rules (geo-fencing, seasonal restrictions, quality thresholds).  
- **Geo-Tagging:** GPS-enabled devices or SMS gateways capture precise collection data.  
- **Smart Labelling:** Unique on-chain QR codes provide consumers with a full provenance record.  
- **Consumer Transparency:** Scannable QR codes reveal the herb’s story: farm, lab tests, sustainability compliance.  

---

## 🏗️ System Components
### 1. Permissioned Blockchain Network
- Hyperledger Fabric / Corda-based distributed ledger  
- Nodes: Farmers’ cooperatives, wild collectors, labs, processors, manufacturers  
- Smart contracts validate sustainability & quality compliance  

### 2. Geo-Tagged Data Capture
- Mobile DApp (low-bandwidth optimized) or SMS gateway  
- Capture `CollectionEvent`, `ProcessingStep`, `QualityTest` metadata  
- IoT-enabled devices for real-time data  

### 3. Smart Labeling & Consumer Portal
- On-chain QR code generation for product batches  
- Web/mobile portal to display full provenance via QR scan  
- Includes chain-of-custody, lab results, and interactive maps  

### 4. Integration & Interoperability
- REST APIs for dashboards & ERP integration  
- FHIR-style metadata bundles: `CollectionEvent`, `QualityTest`, `ProcessingStep`, `Provenance`  

### 5. User Interfaces & Reporting
- Farmer/Collector mobile app with offline capture  
- Web dashboards for manufacturers, regulators, and auditors  
- Automated compliance & sustainability reports  

### 6. Demonstration & Pilot
- Pilot on one species (e.g., **Ashwagandha**)  
- End-to-end demo: harvest → lab → processing → QR scan  
- Metrics: latency, throughput, offline sync, consumer engagement  

---

## 🎯 Impact & Benefits
- **For Farmers/Collectors:** Fair pricing, recognition, and access to premium markets  
- **For Manufacturers:** Reliable inputs, streamlined compliance, reduced recalls  
- **For Regulators:** Easy audit trails, sustainability enforcement  
- **For Consumers:** Authentic, safe, and ethically sourced products  

---

## 🛠️ Tech Stack
- **Blockchain:** Hyperledger Fabric / Corda (permissioned)  
- **Backend:** Node.js / Express + REST APIs  
- **Frontend:** HTML/CSS/JS (multi-language, farmer-friendly UI)  
- **Database (off-chain):** MongoDB/PostgreSQL for non-critical metadata  
- **IoT/SMS Integration:** GPS devices & SMS-over-blockchain gateways  
- **QR Codes:** On-chain unique identifiers linked to provenance data  

---

## 📊 Roadmap
1. ✅ Frontend website (farmer/collector/producer/consumer dashboards)  
2. 🔄 Backend API setup for data capture and blockchain integration  
3. 🔒 Blockchain network setup with smart contracts  
4. 🌍 Geo-tagging & IoT/SMS data integration  
5. 📱 Consumer-facing QR-code scanning portal  
6. 🚀 Pilot with one herb species (Ashwagandha)  

---

## 📖 License
This project is for **research and pilot implementation** in the Ayurvedic herbal supply chain sector.  
Open-source licensing (Apache 2.0 / MIT) recommended for community collaboration.  

---


## 🤝 Contributors
- Farmers & Collectors – providing real-time harvest data  
- Processors & Manufacturers – ensuring quality compliance  
- Labs – verifying authenticity and safety  
- Developers – building blockchain, frontend, and backend  
- Regulators – validating sustainability and compliance  
- Consumers – engaging with transparent Ayurvedic products  

---
✨ **VedaX: From Soil to Soul – Restoring Trust in Ayurveda with Blockchain Transparency**  
