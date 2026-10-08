const User = require('../models/studentSchema'); // Our Student Schema
const Faculty = require('../models/facultySchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { usn, username, email, identifier, password, role } = req.body;

    try {
        const supportedRoles = ['Student', 'Placement Officer', 'Faculty', 'Event Coordinator', 'Admin', 'Department Placement Coordinator'];
        if (!supportedRoles.includes(role)) {
            return res.status(400).json({ message: 'Choose a supported account role.' });
        }
        const loginIdentifier = (identifier || usn || username || email || '').trim();
        if (!loginIdentifier || !password) {
            return res.status(400).json({ message: 'Username/USN and password are required.' });
        }
        const user = ['Faculty', 'Department Placement Coordinator'].includes(role)
            ? await Faculty.findOne({ role, $or: [{ username: loginIdentifier }, { email: loginIdentifier.toLowerCase() }] })
            : await User.findOne({ role, $or: [{ usn: loginIdentifier.toUpperCase() }, { username: loginIdentifier }, { email: loginIdentifier.toLowerCase() }] });

        if (!user) {
            return res.status(404).json({ message: "User not found with this role." });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        // 3. Generate JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role, department: user.department },
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // 4. Send response (Exclude password)
        const { password: _, ...userData } = user._doc;
        res.status(200).json({ message: "Login successful.", result: userData, token });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
    }
};


exports.signup=async(req,res)=>{
    try{
    const { username, email, password, usn, skills,
      interests,} = req.body;
    if(!username || !email || !password || !usn){
        return res.status(400).json({ message: "All fields are required." });
    }
    const existingEmail=await User.findOne({ email });
    if(existingEmail){
        return res.status(400).json({ message: "Email already in use." });
    }
    const existingUSN=await User.findOne({ usn });
    if(existingUSN){
        return res.status(400).json({ message: "USN already in use." });
    }
    const hashedPassword= await bcrypt.hash(password,12);
    const newUser=await User.create({
        username,
        email,
        password:hashedPassword,
        usn,
        role: 'Student',
        skills:skills || [],
        interests:interests || []
    });
    const token=jwt.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    const {password:_,...userData}=newUser._doc;
    res.status(201).json({message: 'Account created successfully',result: userData, token });

    }catch(err){
        res.status(500).json({ message: "Registration failed." });
    }
}
