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


exports.signup = async (req, res) => {
  try {
    const { username, email, password, usn, skills, interests } = req.body;
    if (![username, email, password, usn].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'Full name, USN, email, and password are required.' });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsn = usn.trim().toUpperCase();
    const existingAccount = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { usn: normalizedUsn },
        { username: normalizedUsername },
      ],
    }).select('email usn username');

    if (existingAccount) {
      if (existingAccount.email === normalizedEmail) {
        return res.status(409).json({ message: 'An account with this email already exists. Please log in instead.' });
      }
      if (existingAccount.usn === normalizedUsn) {
        return res.status(409).json({ message: 'An account with this USN already exists. Please log in instead.' });
      }
      return res.status(409).json({ message: 'This name is already associated with an account. Please use your full name.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      usn: normalizedUsn,
      role: 'Student',
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
    });
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const { password: _, ...userData } = newUser._doc;
    return res.status(201).json({ message: 'Account created successfully', result: userData, token });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const fieldMessages = {
        email: 'An account with this email already exists. Please log in instead.',
        usn: 'An account with this USN already exists. Please log in instead.',
        username: 'This name is already associated with an account. Please use your full name.',
      };
      return res.status(409).json({
        message: fieldMessages[duplicateField] || 'An account with these details already exists.',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Please check your signup details and try again.' });
    }

    console.error('Student signup failed:', error.message);
    return res.status(500).json({ message: 'Account creation is temporarily unavailable. Please try again later.' });
  }
};
