const { InternalServerError, AppError, UnauthorizedError, ExternalAPIError, ConflictError, ValidationError } = require('../../core/errorTypes.js');

async function login (supabase, email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        throw new ValidationError('Error Logging In', { cause: error });
      }

      return data.session.user.user_metadata.name;
      
    } catch (err) {
        if (err instanceof AppError) {
          throw err
        }
        else {          
          throw new InternalServerError('Error Logging In', { cause: err }); 
        }
    }
  };

async function registration (supabase, email, password, name) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name
          }
        }
      })
      if (error) {
        throw new ValidationError('Error Registering', { cause: error });
      }
      console.log("Registration successful");
      return data;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      else {
        throw new InternalServerError('Error Registering', { cause: err });
      }
    }
};

async function signout (supabase) {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw new ExternalAPIError('Error Signing Out', { cause: error });
      }

      return;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      else {
        throw new InternalServerError('Error Signing Out', { cause: err });
      }
    }
};

async function getUser (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error && error.status !== 400) {
        throw new ExternalAPIError('Error Getting User', { cause: error });
      }

      return user? user.user_metadata.name : null;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      else {
        throw new InternalServerError('Error Getting User', { cause: err });
      }
    }
}

module.exports = {
    login,
    registration,
    signout,
    getUser
}