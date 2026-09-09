# CivicSolve AI

**"From Citizen Problems to Collaborative Solutions"**

An AI-powered civic innovation platform connecting citizens, universities, and industries to transform real-world societal problems into measurable solutions.

## 🎯 Project Overview

CivicSolve AI is a full-stack web application designed for the Smart India Hackathon (SIH26043): **Digital Platform to Crowdsource Societal Problems and Connect Them With Universities & Industry**.

### Six Major Differentiators

1. **Regional Languages + Voice + IVR** - Citizens with limited English proficiency can report problems via voice or regional languages
2. **AI Problem Intelligence** - Automatically understands and categorizes submitted problems
3. **Semantic Duplicate Detection** - Identifies similar problems even with different wording
4. **AI University Matching** - Connects problems with universities, departments, experts, and student teams
5. **University–Industry Collaboration** - Links university solutions with industry technology and resources
6. **Closed-Loop Civic Innovation** - Complete workflow from report to validation to improvement

## 🏗️ Architecture Overview

```
Citizen → Report Problem → AI Analysis → Priority → Duplicate Detection
                                                          ↓
                                            University Matching → Accept
                                                          ↓
                                            Industry Matching → Support
                                                          ↓
                                            Project Creation → Milestones
                                                          ↓
                                            Progress Tracking → Completion
                                                          ↓
                                            Citizen Validation → Feedback
                                                          ↓
                                            Impact Report → Analytics
```

## 🛠️ Technology Stack

### Frontend
- **React.js** (Vite)
- **TypeScript/JavaScript**
- **Tailwind CSS**
- **React Router**
- **Axios**
- **Recharts**
- **Lucide React**
- **Web Speech API** (Voice input)

### Backend
- **Java 17+**
- **Spring Boot 3.x**
- **Spring Web**
- **Spring Data JPA**
- **Spring Security**
- **JWT Authentication**
- **Hibernate/JPA**
- **Jakarta Bean Validation**

### Database
- **PostgreSQL 14+**

### AI/Integration
- **Configurable AI Service** (OpenAI, Anthropic, etc.)
- **Fallback Deterministic Analysis Engine**

## 📁 Project Structure

```
civicsolve-ai/
├── backend/
│   ├── src/main/java/com/civicsolve/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── security/
│   │   ├── exception/
│   │   ├── config/
│   │   ├── ai/
│   │   └── matching/
│   ├── src/main/resources/
│   │   ├── db/migration/
│   │   └── application.yml
│   ├── pom.xml
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── types/
│   │   └── assets/
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Backend Setup

1. **Install dependencies and build:**
```bash
cd backend
mvn clean install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Create PostgreSQL database:**
```bash
createdb civicsolve_ai
```

4. **Run database migrations:**
```bash
# Migrations run automatically on Spring Boot startup
```

5. **Start backend server:**
```bash
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your API base URL
```

3. **Start development server:**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## 🔐 Environment Variables

### Backend (.env)
```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/civicsolve_ai
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_min_32_characters
AI_API_KEY=your_ai_api_key
AI_PROVIDER=openai
AI_MODEL=gpt-4-turbo
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8080
```

## 📊 Database Schema

Key entities:
- **users** - Citizens, Universities, Industries, Admins
- **challenges** - Reported civic problems
- **challenge_ai_analysis** - AI analysis results
- **challenge_matches** - University/Industry matches
- **projects** - Solutions created from challenges
- **project_milestones** - Project phases
- **project_progress_updates** - Progress tracking
- **notifications** - User notifications
- **citizen_satisfaction** - Citizen feedback
- **impact_reports** - Completed project impact

## 🔑 Key Features

### For Citizens
- ✅ Register with regional language preference
- ✅ Report problems via text or voice
- ✅ View AI analysis and priority scores
- ✅ See matched universities
- ✅ Track project progress
- ✅ Provide feedback and satisfaction rating
- ✅ View impact reports
- ✅ Community voting support

### For Universities
- ✅ View recommended challenges
- ✅ Accept challenges and create projects
- ✅ Add and track milestones
- ✅ Request industry support
- ✅ Update project progress
- ✅ Manage team members

### For Industries
- ✅ View recommended projects
- ✅ Support projects with technology/mentorship
- ✅ Track supported projects
- ✅ Provide expertise and resources

### For Admins
- ✅ Manage all users, challenges, and projects
- ✅ View analytics and impact reports
- ✅ Monitor system health

## 🤖 AI Workflow

1. **Problem Submission** - Citizen reports problem
2. **AI Analysis** - Automatically analyze and categorize
3. **Priority Calculation** - Calculate priority score (0-100)
4. **Duplicate Detection** - Find semantically similar problems
5. **Expertise Extraction** - Identify required skills
6. **University Matching** - Find best-fit universities
7. **Industry Matching** - Identify supporting industries

## 🎙️ Voice & Regional Languages

- **Languages Supported**: English, Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali
- **Voice Input**: Browser Web Speech API
- **IVR Prototype**: Simulated telephony workflow (*#437)
- **Fallback**: Text input always available

## 🧪 Testing the Application

### Quick Demo Flow

1. **Login as Citizen**
   - Credentials: citizen@example.com / password123

2. **Report a Problem**
   - Use "Report Using Voice" or text
   - AI analyzes automatically
   - View priority and duplicates

3. **Switch to University**
   - Credentials: university@example.com / password123
   - See recommended challenges
   - Accept a challenge

4. **Switch to Industry**
   - Credentials: industry@example.com / password123
   - Support the project

5. **Return to Citizen**
   - View accepted status and progress
   - Submit feedback when complete

## 📈 Analytics & Reporting

- Problems by category and priority
- Resolution time metrics
- University and industry participation
- Citizen satisfaction scores
- Impact analytics dashboard

## 🔒 Security

- JWT-based authentication
- Spring Security role-based authorization
- BCrypt password hashing
- Environment variable protection
- SQL injection prevention (JPA parameterized queries)
- CORS configuration
- Ownership verification for all resources

## 📝 API Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT

### Challenges
- `POST /api/challenges` - Create new challenge
- `GET /api/challenges/my` - Get citizen's challenges
- `GET /api/challenges/{id}` - Get challenge details
- `GET /api/challenges/{id}/analysis` - Get AI analysis
- `GET /api/challenges/{id}/duplicates` - Find duplicates
- `GET /api/challenges/{id}/matches` - University/Industry matches
- `POST /api/challenges/{id}/accept` - University accepts challenge

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects/{id}/milestones` - Add milestone
- `PUT /api/projects/{id}/progress` - Update progress
- `POST /api/projects/{id}/industry-support` - Request industry support

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark as read

### Feedback
- `POST /api/challenges/{id}/feedback` - Submit citizen feedback
- `GET /api/analytics` - View analytics

## 🚀 Deployment

### Backend
```bash
mvn clean package
# Deploy target/civicsolve-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
npm run build
# Deploy dist/ directory to web server
```

## 📞 Support & Contact

For issues, feature requests, or questions about CivicSolve AI, please open an issue on GitHub.

## 📄 License

This project is open-source and available under the MIT License.

## 🏆 Hackathon Info

**Smart India Hackathon (SIH) 26043**
Problem Statement: Digital Platform to Crowdsource Societal Problems and Connect Them With Universities & Industry

---

**Built with ❤️ for civic innovation**
