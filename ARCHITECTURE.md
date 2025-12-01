\# System Architecture

\## High-Level Architecture

```mermaid

graph TB

&nbsp;   subgraph "Client Layer"

&nbsp;       A\[React Frontend<br/>Port 80/443]

&nbsp;   end

&nbsp;

&nbsp;   subgraph "API Layer"

&nbsp;       B\[Express.js Backend<br/>Port 3000]

&nbsp;       B1\[Auth Controller]

&nbsp;       B2\[Discovery Controller]

&nbsp;       B3\[History Controller]

&nbsp;       B --> B1

&nbsp;       B --> B2

&nbsp;       B --> B3

&nbsp;   end

&nbsp;

&nbsp;   subgraph "ML Layer"

&nbsp;       C\[Flask ML Service<br/>Port 5000]

&nbsp;       C1\[Multi-Agent System]

&nbsp;       C --> C1

&nbsp;   end

&nbsp;

&nbsp;   subgraph "Data Layer"

&nbsp;       D\[(MongoDB<br/>Database)]

&nbsp;   end

&nbsp;

&nbsp;   subgraph "External Services"

&nbsp;       E\[Gemini AI<br/>Google]

&nbsp;       F\[PubChem<br/>Database API]

&nbsp;       G\[RDKit<br/>Library]

&nbsp;   end

&nbsp;

&nbsp;   A -->|HTTP + JWT| B

&nbsp;   B -->|Mongoose| D

&nbsp;   B -->|REST API| C

&nbsp;   C -->|API Call| E

&nbsp;   C -->|Search| F

&nbsp;   C -->|Calculate| G

&nbsp;

&nbsp;   style A fill:#61dafb

&nbsp;   style B fill:#68a063

&nbsp;   style C fill:#3776ab

&nbsp;   style D fill:#47a248

&nbsp;   style E fill:#4285f4

&nbsp;   style F fill:#1e88e5

&nbsp;   style G fill:#ff6f00

```

\## Discovery Flow

```mermaid

sequenceDiagram

&nbsp;   participant U as User

&nbsp;   participant F as Frontend

&nbsp;   participant B as Backend

&nbsp;   participant ML as ML Service

&nbsp;   participant G as Gemini AI

&nbsp;   participant P as PubChem

&nbsp;   participant R as RDKit

&nbsp;   participant DB as MongoDB

&nbsp;

&nbsp;   U->>F: Submit criteria

&nbsp;   F->>B: POST /api/discover + JWT

&nbsp;   B->>B: Verify JWT

&nbsp;   B->>ML: POST /api/discover

&nbsp;

&nbsp;   ML->>ML: Preprocess input

&nbsp;   ML->>P: Search base compounds

&nbsp;   P-->>ML: Compound data

&nbsp;

&nbsp;   ML->>G: Generate novel compounds

&nbsp;   G-->>ML: 3 compounds (JSON)

&nbsp;

&nbsp;   ML->>R: Calculate properties

&nbsp;   R-->>ML: MW, LogP, etc.

&nbsp;

&nbsp;   ML->>R: Generate images

&nbsp;   R-->>ML: Base64 images

&nbsp;

&nbsp;   ML-->>B: Discovery result

&nbsp;

&nbsp;   B->>B: Convert base64 to PNG

&nbsp;   B->>B: Save images to disk

&nbsp;   B->>DB: Save discovery

&nbsp;   DB-->>B: Saved document

&nbsp;

&nbsp;   B-->>F: Discovery + image paths

&nbsp;   F-->>U: Display results

```

\## Data Model

```mermaid

erDiagram

&nbsp;   USER ||--o{ DISCOVERY : creates

&nbsp;   USER ||--o{ FAVORITE : saves

&nbsp;

&nbsp;   USER {

&nbsp;       ObjectId \_id

&nbsp;       string email

&nbsp;       string password

&nbsp;       string name

&nbsp;       date lastLogin

&nbsp;       date createdAt

&nbsp;   }

&nbsp;

&nbsp;   DISCOVERY {

&nbsp;       ObjectId \_id

&nbsp;       ObjectId userId

&nbsp;       string criteria

&nbsp;       object preprocessingAnalysis

&nbsp;       string analysis

&nbsp;       array compounds

&nbsp;       object validation

&nbsp;       string justification

&nbsp;       date createdAt

&nbsp;   }

&nbsp;

&nbsp;   FAVORITE {

&nbsp;       ObjectId \_id

&nbsp;       ObjectId userId

&nbsp;       object compoundData

&nbsp;       array tags

&nbsp;       string notes

&nbsp;       date createdAt

&nbsp;   }

```

\## Deployment Architecture (Future)

```mermaid

graph LR

&nbsp;   subgraph "User Devices"

&nbsp;       A\[Web Browser]

&nbsp;       B\[Mobile Browser]

&nbsp;   end

&nbsp;

&nbsp;   subgraph "CDN"

&nbsp;       C\[Cloudflare/Vercel]

&nbsp;   end

&nbsp;

&nbsp;   subgraph "Frontend"

&nbsp;       D\[React App<br/>Vercel/Netlify]

&nbsp;   end

&nbsp;

&nbsp;   subgraph "Backend Services"

&nbsp;       E\[Express API<br/>Railway/Render]

&nbsp;       F\[Flask ML<br/>Railway/Render]

&nbsp;   end

&nbsp;

&nbsp;   subgraph "Database"

&nbsp;       G\[(MongoDB Atlas)]

&nbsp;   end

&nbsp;

&nbsp;   subgraph "Storage"

&nbsp;       H\[AWS S3<br/>Images]

&nbsp;   end

&nbsp;

&nbsp;   A --> C

&nbsp;   B --> C

&nbsp;   C --> D

&nbsp;   D --> E

&nbsp;   E --> F

&nbsp;   E --> G

&nbsp;   E --> H

&nbsp;

&nbsp;   style C fill:#f38020

&nbsp;   style D fill:#61dafb

&nbsp;   style E fill:#68a063

&nbsp;   style F fill:#3776ab

&nbsp;   style G fill:#47a248

&nbsp;   style H fill:#ff9900

```
