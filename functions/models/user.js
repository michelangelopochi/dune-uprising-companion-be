import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const usersDB = mongoose.createConnection(process.env.MONGODB_URI.split("?")[0] + "users");

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        avatar: { type: String, default: '' },
        tables_requests_pending: { type: Array, default: [] },
        presets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Preset' }],
        role: { type: String, enum: ['user', 'admin', 'test'], default: 'user' },
        confirmed: { type: Boolean, default: false },
        confirmationToken: { type: String, default: "" },
        resetPasswordToken: { type: String, default: "" },
        resetPasswordExpires: { type: String, default: "" },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Hash the password before saving it to the database
userSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password')) return next();

    try {
        await bcrypt.genSalt(10, async function (err, salt) {
            await bcrypt.hash(user.password, salt, function (err, hash) {
                user.password = hash;
            });
        });
        next();
    } catch (error) {
        return next(error);
    }
});

// Compare the given password with the hashed password in the database
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compareSync(password, this.password);
};

const User = usersDB.model('User', userSchema);

export default User;