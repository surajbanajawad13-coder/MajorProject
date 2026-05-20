const User = require('../models/studentSchema'); // Our Student Schema
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { usn, password, role } = req.body;

    try {
        const user = await User.findOne({  
            usn: usn , 
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
        res.status(200).json({ message: "Login successful.", result: userData, token });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
    }
};


exports.signup=async(req,res)=>{
    try{
        const { username, email, password, usn, role, skills,
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
        role:role || 'Student',   
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