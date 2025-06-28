import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(undefined);

  // Sign up
  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
    });

    if (error) {
      console.error("Error signing up: ", error);
      return { success: false, error };
    }

    return { success: true, data };
  };

  // Sign in
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      // Handle Supabase error explicitly
      if (error) {
        console.error("Sign-in error:", error.message);
        return { success: false, error: error.message };
      }

      console.log("Sign-in success:", data);
      return { success: true, data }; 
    } catch (error) {
      console.error("Unexpected error during sign-in:", error.message);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      };
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);
  
  //Forgot Password
  const forgotPass = async (email) => {
    try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.error("Error sending password reset email:", error.message);
      return { success: false, error: error.message };
    }

    console.log("Password reset email sent:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error during password reset:", error.message);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
  };
  
  // Sign out
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  }

  //insert user data
  const insertUser = async (userData) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (error) {
        console.error("Insert user error:", error);
        return { success: false, error };
      }
      return { success: true, data };
    } catch (err) {
      console.error("Unexpected error in insertUser:", err);
      return { success: false, error: err };
    }
  };

  const doesEmailExist = async (email) => {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return false
        }
        console.error('Error querying Supabase:', error)
        return false
    }

    return !!data  
}


    return (
        <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signOut, insertUser, forgotPass, doesEmailExist }}>
            {children}
        </AuthContext.Provider>
    );
};



export const UserAuth = () => {
    return useContext(AuthContext);
};