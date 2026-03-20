# LearnTrack-Smart Learning Platform 📚

A comprehensive learning management system built with the MERN stack and Vite to help students organize, track, and optimize their study workflow.

## Features

* 📖 **Subject Management** – Organize multiple subjects with start/end dates and daily targets
* 📝 **Day-wise Topics** – Break down learning into manageable daily topics with resources
* ⏱️ **Pomodoro Timer** – Built-in 25-minute focus sessions with automatic time tracking
* 💻 **Problem Tracker** – Track coding problems from LeetCode, Codeforces, and HackerRank
* 📓 **Smart Notes** – Organized note-taking for quick revision
* 📊 **Analytics Dashboard** – Visualize study time, progress, and streaks
* 🔥 **Streak Tracking** – Gamified daily study habits using a calendar view
* ✅ **Progress Monitoring** – Real-time completion percentages for all subjects
* 🔐 **Secure Authentication** – JWT-based user authentication and protected routes

## What Problem Does It Solve?

As students, we often struggle with:
* Scattered learning resources across multiple platformsan
* No clear visibility on learning progress
* Inability to track actual study time
* Difficulty maintaining consistent study habits
* Lack of insights into which subjects need more attention

This platform centralizes everything into one organized and intelligent system.

## Technologies Used

### Frontend
* React 18
* Vite ⚡
* React Router v6
* Context API
* Axios
* Chart.js
* Tailwind CSS

### Backend
* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Bcrypt

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/RithikaKP/LearnTrack.git
```

2. **Navigate to project directory**
```bash
cd LearnTrack-Smart-Learning-Platform
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

5. **Configure environment variables**

Create `.env` in the `backend` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

Create `.env` in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

6. **Start the application**

Backend:
```bash
cd backend
npm run dev
```

Frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

Visit:
```
http://localhost:5173
```

## Usage

1. Register an account and log in
2. Create subjects (e.g., Data Structures, Operating Systems) with target dates
3. Add topics day-wise with learning resources
4. Start Pomodoro sessions to track focused study time
5. Mark topics complete and view progress updates in real-time
6. Track coding problems across multiple platforms
7. View analytics to understand study patterns and maintain streaks

## Key Technical Highlights

* **Cascade Updates** – Automatic progress calculation when topics are completed
* **Optimized Queries** – Fast dashboard loading using aggregated MongoDB queries
* **Well-structured MVC Architecture** – Clean separation of concerns
* **Streak Algorithm** – Intelligent tracking of consecutive study days
* **Real-time UI Updates** – Smooth and responsive user experience

## Performance Metrics

* ⚡ Fast dashboard rendering
* 📱 Fully responsive design
* 🧪 Scalable and modular backend
* 👥 Designed for multiple concurrent users

## Future Enhancements

* Study groups and collaboration features
* Mobile app (React Native)
* Spaced repetition flashcards
* AI-powered study recommendations
* Google Calendar integration
* PDF progress report exports
* Dark mode
* Multi-language support

## Contributing

Pull requests are welcome! Feel free to open an issue for bugs or feature suggestions.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License – free to use for learning and personal projects.

## Author

**Rithika Palanisamy**
* GitHub: [@RithikaKP](https://github.com/RithikaKP)


---

⭐ **Star this repository if you found it helpful!**

Made with ❤️ for students everywhere