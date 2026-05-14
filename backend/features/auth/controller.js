const { login, registration, signout, getUser } = require('./service.js')
const { createClient } = require("../../core/supabase.js");

async function loginController (req, res, next) {
    const {email, password} = req.body;    
    const supabase = createClient({ req, res });
    try {
      const userName = await login(supabase, email, password);
      res.json({ user: userName });
    } catch (error) {
      return next(error);
    }
};

async function registrationController (req, res, next) {
    const {email, password, name} = req.body;    
    const supabase = createClient({ req, res });
    try {
      await registration(supabase, email, password, name);
      res.sendStatus(200);
    } catch (error) {
      return next(error);
    }
};

async function signoutController (req, res, next) { 
    const supabase = createClient({ req, res });
    try {
      await signout(supabase);
      res.sendStatus(200);
    } catch (error) {
      return next(error);
    } 
};

async function userController (req, res, next) { 
    const supabase = createClient({ req, res });
    try {
      const user = await getUser(supabase);
      res.json({ user: user });
    } catch (error) {
      return next(error);
     }
};

module.exports = {
    loginController,
    registrationController,
    signoutController,
    userController
};