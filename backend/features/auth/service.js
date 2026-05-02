async function login (supabase, email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        throw new Error('Error logging in: ', error);
      }

      return data.session.user.user_metadata.name;
      
    } catch (err) {
        throw new Error('Error logging in: ', err);
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
        throw new Error('Error registering: ', error);
      }
      return data;
    } catch (error) {
      throw new Error('Error registering: ', error);
    }
};

async function signout (supabase) {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw new Error('Error signing out: ', error);
      }

      return;
    } catch (error) {
        throw new Error('Error signing out: ', error);
    } 
};

async function getUser (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      return user? user.user_metadata.name : null;
    } catch (error) {
      throw new Error('Error getting user: ', error);
    }
}

module.exports = {
    login,
    registration,
    signout,
    getUser
}