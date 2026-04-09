const User = require('../models/studentSchema'); // Our Student Schema
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const user = await User.findOne({ 
            $or: [{ email: email }, { usn: email }], 
            role: role 
        });

        if (!user) {
            return res.status(404).json({ message: "User not found with this role." });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        // 3. Generate JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // 4. Send response (Exclude password)
        const { password: _, ...userData } = user._doc;
        res.status(200).json({ result: userData, token });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
    }
};