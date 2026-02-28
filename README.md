🛡️ NetRisk: Cross-Channel Mule Account Detection Platform
📌 Problem Statement
Cross-Channel Mule Account Detection Graph
Traditional fraud detection systems often operate in silos, making it difficult to detect money mules who launder funds across diverse channels (UPI, ATM, Net Banking, Branch). When malicious actors distribute transactions across these channels, standard threshold-based alerts fail to capture the holistic network topology of the illicit flow.

💡 Our Solution: NetRisk
NetRisk is an advanced, graph-based monitoring platform designed for fraud analysts. It ingests and correlates transaction data across multiple banking channels to map out complex financial relationships. By utilizing network graph analysis and dynamic risk scoring, NetRisk uncovers hidden mule chains, circular laundering loops, and high-velocity clusters that traditional systems miss.

✨ Key Features
Interactive Network Graph: Visually trace fund flows between nodes. Instantly identify "Mule Chains," "Circular Laundering Loops," and "Velocity Clusters" across diverse channels (UPI, Net Banking, ATM, etc.).

Dynamic Risk Scoring: Accounts are continuously evaluated based on KYC risk, inward/outward flow ratios, and burst activity, generating a live 0-100 risk score.

Automated Threat Mitigation: Customizable Auto-Block Engine that automatically restricts accounts when they cross a pre-set risk threshold (e.g., 85%).

Real-Time Alerts System: Categorized alerts (Critical/Medium) for immediate anomalies like burst activity or sudden threshold breaches.

Advanced Analytics & Reporting: Deep dive into risk score distributions, fraud trends over time, cross-channel correlations, and one-click CSV exports for compliance audits.

📸 Platform Showcase
Dashboard Overview: High-level metrics on cross-channel diversity and critical alerts.

Transaction Network Graph: Deep dive into account relationships and laundering loops.

Account Monitoring & Auto-Block Settings: Configurable thresholds for the detection engine.

🛠️ Tech Stack
Frontend: React.js, Tailwind CSS, D3.js

Backend: Node.js

Database: PostgreSQL, Neo4j

🚀 How to Run Locally
We have built a fully functional prototype of the NetRisk UI. Follow these steps to spin it up on your local machine:

Clone the repository:

Bash
git clone https://github.com/praveen-angapparaj/netrisk-insights.git
cd netrisk-hackathon
Install dependencies:

Bash
npm install

Run the development server:

Bash
npm run dev
Open your browser: Navigate to http://localhost:3000 (or your specific port) to view the NetRisk platform.