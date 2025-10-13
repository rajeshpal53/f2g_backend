const { User } = require('../models');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const utility = require('../utility/utility');
const bcrypt = require('bcryptjs');
const admin = require('../config/firebase');
const { Op } = require('sequelize');
const sequelize = require("../config/database");

exports.getAllUsers = async (req, res) => {
  try {
    let { page, limit } = req.query;
    
    // Convert query params to integers and set defaults
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10; // Default limit is 10

    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      limit,
      offset
    });

    res.status(200).json({
      totalUsers: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      users
    });
  } catch (error) {
    console.log("error is :-", error);
    res.status(500).json({ error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user by mobile
exports.getUserByMobile = async (req, res) => {
  try {
    const { mobile } = req.params; // Extract mobile from params
    const user = await User.findOne({ where: { mobile } }); // Correct usage of findOne

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error is :-", error);
    res.status(500).json({ error: error.message });
  }
};

exports.searchUser = async (req, res) => {
  try {
    // Extract query parameter
    const { searchTerm } = req.query;

    if(!searchTerm){
      return res.status(400).json({ message: `Query parameter is required`});
    }

    // Search users by name or mobile
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${searchTerm}%` } }, 
          { mobile: { [Op.like]: `%${searchTerm}%` } }, 
          { whatsappnumber: { [Op.like]: `%${searchTerm}%` } }, 
          { email: { [Op.like]: `%${searchTerm}%` } }, 
          { address: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.log('error in searching: ', error);
    return res.status(500).json({message: 'Error searching for users', error });
  }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.signUp = async(req, res) => {
  console.log("going to signup")
  try {
    const {mobile, device, password, fcmtokens, idToken} = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required.' });
    }

    if (!mobile || !password) {
      return res.status(400).json({ message: 'Mobile and password are required.' });
    }

  // Verify the Firebase credential
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  console.log(decodedToken.phone_number)
  //Check if the phone number matches
  if (!decodedToken.phone_number || decodedToken.phone_number !== "+91"+mobile) {
    return res.status(401).json({ error: 'Mobile number does not match with verified token.' });
  }

  let newToken = null;
    if(fcmtokens && Array.isArray(fcmtokens)){
	  	console.log("getted", fcmtokens)
	    newToken = fcmtokens;
	  	console.log("new Token Test", newToken )
	  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user already exists
  let user = await User.findOne({ where: { mobile } });
  if (user) {
    // user.password = hashedPassword;
    user = await user.update({
      mobile: mobile,
      password: hashedPassword,
    });
  } else {
  // Create the user
   user = await User.create({
    mobile: mobile,
    password: hashedPassword,
  });
  }

  const resultUser = await getUserAndToken(user, newToken, req, res);
    user = resultUser.user;
    const token = resultUser.token;
    console.log('updated code :', user, token);

    return res.status(200).json({
      message: 'Signup successful',
      user,
      token
    });

  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.idTokenValidate = async (req, res) => {
  try {
    const {mobile, idToken} = req.body;

     // Validate required fields
     if (!idToken || !mobile) {
      return res.status(400).json({ error: `${!idToken ? 'ID token' : 'Mobile number'} is required.` });
    }

     // Verify the Firebase credential
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if the phone number matches
    if (!decodedToken.phone_number || decodedToken.phone_number !== "+91"+mobile) {
      return res.status(401).json({ error: 'Mobile number does not match the token.' });
    }

    // Success Response
    return res.status(200).json({ message: 'ID token and mobile number validated successfully.' });

  } catch (error) {
    console.error('Error during ID token validation:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

exports.loginUser = async (req, res) => {
  const { mobile, device, password, fcmtokens } = req.body;

  try {
    // Step 1: Check if the user exists
    let user = await User.findOne({ where: { mobile } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Compare the password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let newToken = null;

    if(fcmtokens && Array.isArray(fcmtokens)){
	  	console.log("getted", fcmtokens)
	    newToken = JSON.parse(fcmtokens);//fcmtokens[0];
	  	console.log("new Token Test", newToken )
	  }

    const resultUser = await getUserAndToken(user, newToken, req, res)
    user = resultUser.user;
    token = resultUser.token;
    console.log('updated code :', user, token);
    // Step 4: Send success response
   return res.status(200).json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

async function getUserAndToken(user, newToken, req, res) {
  if (user) {
    let existingTokens = user.fcmtokens || [];

    const updatedTokens = [...new Set([...existingTokens, ...(newToken || []) ])];
    console.log("Updated Tokens to Save:", updatedTokens);
      // Mobile number exists, update the user details
      user = await user.update({
        ...req.body,
        fcmtokens: updatedTokens,
        password : user.password
      });
  }

  const token = jwt.sign({ id: user.id, mobile: user.mobile }, process.env.JWT_SECRET, { expiresIn: req.body.device == "app" ? '180d' : '180d' });
  if(res && token) {
    storeToken(res, token);
  }
  return {user: user, token: token}
}

exports.logout = async (req, res) => {
  const mobile = req.body.mobile;

  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required." });
  }

  try {
    let user = await User.findOne({ where: { mobile } });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    await user.update({ token_validity: new Date() });

    return res.status(200).json({ message: "Successfully logged out." });
  } catch (err) {
    console.log("error :", err);
    return res.status(500).json({ error: err.message });
  }
};

// Upsert user by mobile number
exports.upsertOnlyUser = async (mobile, name, address, password, transaction) => {

  try {
      const hashedPassword = await bcrypt.hash(password, 10);
      // Mobile number does not exist, create a new user
      let user = await User.create({
        mobile,
        name,
        address,
        password: hashedPassword
      },
      { transaction });
    
    return user;
  } catch (err) {
    console.log("error is:-", err);
    return ({ error: err.message });
  }
};

// Upsert user by mobile number with file upload support
exports.upsertOnlyUserProfileImg = async (req, res) => {
  const { mobile, ...body } = req.body;

  try {
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    // Check if the user exists by mobile number
    let user = await User.findOne({ where: { mobile } });

    // Handle file paths for uploaded files
    const profilePicurl = req.savedFiles?.profilePicurl ?? user?.profilePicurl ?? null;
    const aadharCardFronturl = req.savedFiles?.aadharCardFronturl ?? user?.aadharCardFronturl ?? null;
    const aadharCardBackurl = req.savedFiles?.aadharCardBackurl ?? user?.aadharCardBackurl ?? null;

    // Prepare updated/inserted data
    const upsertData = {
      mobile,
      ...body, // Include other fields from req.body
      profilePicurl,
      aadharCardFronturl,
      aadharCardBackurl,
    };

    if (user) {
      // Update the existing user
      await user.update(upsertData);
      return res.status(200).json(user);
    } else {
      // Create a new user
      upsertData.password = "user@123";
      user = await User.create(upsertData);
      return res.status(201).json(user);
    }
  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({ message: 'Error upserting user', error: error.message || error });
  }
};

function storeToken(res, token) {
  //production
  res.cookie('token', token, {
    httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not accessible via JavaScript
    secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent only over HTTPS
    maxAge: 6 * 30 * 24 * 60 * 60 * 1000, //  6 months
    sameSite: 'strict' // CSRF protection
  });

  //local
  // res.cookie('token', token, {
  //   httpOnly: true, 
  //   secure: false,               // Disable secure for local testing
  //   maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days,   
  //   sameSite: 'lax'               // Less strict for local development
  // });
};
