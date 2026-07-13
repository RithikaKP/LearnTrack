const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6,
        },
        currentStreak: {
            type: Number,
            default: 0,
        },
        longestStreak: {
            type: Number,
            default: 0,
        },
        lastStudyDate: {
            type: Date,
        },
        learnTrackJourneyStartedAt: {
            type: Date,
            default: null,
        },
        journeyStartedAt: {
            type: Date,
            default: null,
        },
        preferences: {
            darkMode: {
                type: Boolean,
                default: false,
            },
            pomodoroLength: {
                type: Number,
                default: 25,
            },
            shortBreak: {
                type: Number,
                default: 5,
            },
            longBreak: {
                type: Number,
                default: 15,
            },
        },
        connectedPlatforms: [
            {
                platform: {
                    type: String,
                    required: true,
                    enum: ['LeetCode', 'Codeforces', 'HackerRank', 'GeeksforGeeks', 'CodeChef', 'AtCoder']
                },
                username: {
                    type: String,
                    required: true
                },
                connectedAt: {
                    type: Date,
                    default: Date.now
                },
                lastSynced: {
                    type: Date
                }
            }
        ]
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
